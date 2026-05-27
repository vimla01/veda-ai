import type { GenerationProgress } from "@veda/shared";
import { Queue, QueueEvents, Worker } from "bullmq";
import { Redis } from "ioredis";
import type { Server } from "socket.io";
import { env } from "../config/env.js";
import type { AssignmentRepository } from "../repositories/assignmentRepository.js";
import { CacheService } from "../services/cacheService.js";
import { PaperGenerator } from "../services/paperGenerator.js";
import { PdfService } from "../services/pdfService.js";

const steps = [
  "Structuring assignment prompt",
  "Planning sections and mark distribution",
  "Generating questions",
  "Formatting printable paper"
];

export class GenerationQueue {
  private queue?: Queue;
  private worker?: Worker;
  private pdfQueue?: Queue;
  private pdfWorker?: Worker;
  private pdfEvents?: QueueEvents;
  private generator = new PaperGenerator();
  private pdf = new PdfService();
  private cache = new CacheService();

  constructor(
    private readonly repository: AssignmentRepository,
    private readonly io: Server
  ) {}

  start() {
    if (!env.redisUrl) return;

    const connection = new Redis(env.redisUrl, { maxRetriesPerRequest: null });
    this.queue = new Queue("question-generation", { connection });
    this.pdfQueue = new Queue("pdf-generation", { connection });
    this.pdfEvents = new QueueEvents("pdf-generation", { connection });
    this.worker = new Worker(
      "question-generation",
      async (job) => this.process(job.data.assignmentId),
      { connection }
    );
    this.pdfWorker = new Worker(
      "pdf-generation",
      async (job) => this.renderPdf(job.data.assignmentId),
      { connection }
    );
  }

  async enqueue(assignmentId: string) {
    if (this.queue) {
      await this.queue.add("generate", { assignmentId }, { attempts: 2, removeOnComplete: true });
      return;
    }

    void this.process(assignmentId);
  }

  async enqueuePdf(assignmentId: string): Promise<Buffer> {
    if (!this.pdfQueue) return Buffer.from(await this.renderPdf(assignmentId), "base64");

    const job = await this.pdfQueue.add("render-pdf", { assignmentId }, { attempts: 2, removeOnComplete: true });
    const result = await job.waitUntilFinished(this.pdfEvents!, 15000);
    return Buffer.from(result as string, "base64");
  }

  private async process(assignmentId: string) {
    try {
      await this.repository.updateStatus(assignmentId, "generating");
      for (const [index, message] of steps.entries()) {
        this.emit({ assignmentId, status: "generating", percent: (index + 1) * 20, message });
        await new Promise((resolve) => setTimeout(resolve, 450));
      }

      const assignment = await this.repository.find(assignmentId);
      if (!assignment) throw new Error("Assignment not found");

      const paper = await this.generator.generate(assignment);
      await this.repository.savePaper(paper);
      await this.cache.del("assignments:list", `assignments:${assignmentId}:paper`);
      this.emit({
        assignmentId,
        status: "completed",
        percent: 100,
        message: "Question paper is ready",
        resultId: paper.id
      });
    } catch {
      await this.repository.updateStatus(assignmentId, "failed");
      this.emit({ assignmentId, status: "failed", percent: 100, message: "Generation failed" });
    }
  }

  private emit(progress: GenerationProgress) {
    this.io.to(progress.assignmentId).emit("generation:progress", progress);
  }

  private async renderPdf(assignmentId: string) {
    const paper = await this.repository.findPaper(assignmentId);
    if (!paper) throw new Error("Paper not found");

    const buffer = await this.pdf.renderQuestionPaper(paper);
    return buffer.toString("base64");
  }
}
