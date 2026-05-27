import { Router } from "express";
import { assignmentInputSchema } from "../domain/validation.js";
import type { GenerationQueue } from "../jobs/generationQueue.js";
import type { AssignmentRepository } from "../repositories/assignmentRepository.js";
import { CacheService } from "../services/cacheService.js";

export function assignmentRoutes(repository: AssignmentRepository, queue: GenerationQueue) {
  const router = Router();
  const cache = new CacheService();

  router.get("/", async (_req, res) => {
    // the list changes often, so keep this cache short.
    const cached = await cache.get("assignments:list");
    if (cached) return res.json(cached);

    const assignments = await repository.list();
    await cache.set("assignments:list", assignments, 60);
    res.json(assignments);
  });

  router.get("/:id", async (req, res) => {
    const assignment = await repository.find(req.params.id);
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });
    res.json(assignment);
  });

  router.get("/:id/paper", async (req, res) => {
    const cacheKey = `assignments:${req.params.id}:paper`;
    // generated papers are heavier than assignments, so cache the shaped result.
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const paper = await repository.findPaper(req.params.id);
    if (!paper) return res.status(404).json({ message: "Paper not found" });
    await cache.set(cacheKey, paper, 300);
    res.json(paper);
  });

  router.get("/:id/paper.pdf", async (req, res) => {
    const paper = await repository.findPaper(req.params.id);
    if (!paper) return res.status(404).json({ message: "Paper not found" });

    const pdf = await queue.enqueuePdf(req.params.id);
    const filename = `${paper.subject}-${paper.className}-question-paper.pdf`
      .replace(/[^a-z0-9.-]+/gi, "-")
      .toLowerCase();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(pdf);
  });

  router.post("/", async (req, res) => {
    const parsed = assignmentInputSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid assignment", issues: parsed.error.issues });

    const assignment = await repository.create(parsed.data);
    await cache.del("assignments:list");
    await queue.enqueue(assignment.id);
    res.status(201).json(assignment);
  });

  router.delete("/:id", async (req, res) => {
    const deleted = await repository.delete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Assignment not found" });
    await cache.del("assignments:list", `assignments:${req.params.id}:paper`, `assignments:${req.params.id}:pdf`);
    res.status(204).send();
  });

  return router;
}
