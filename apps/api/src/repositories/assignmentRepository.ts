import type { Assignment, AssignmentInput, AssignmentStatus, GeneratedPaper } from "@veda/shared";
import mongoose, { Schema } from "mongoose";
import { randomUUID } from "node:crypto";

type AssignmentRecord = Assignment & { result?: GeneratedPaper };

const memoryAssignments = new Map<string, AssignmentRecord>();

const QuestionConfigSchema = new Schema(
  {
    id: String,
    type: String,
    count: Number,
    marks: Number
  },
  { _id: false }
);

const AssignmentSchema = new Schema<AssignmentRecord>(
  {
    id: { type: String, unique: true },
    title: String,
    subject: String,
    className: String,
    dueDate: String,
    sourceText: String,
    instructions: String,
    questionConfigs: [QuestionConfigSchema],
    teacherId: String,
    teacherName: String,
    schoolName: String,
    city: String,
    assignedOn: String,
    status: String,
    resultId: String,
    result: Schema.Types.Mixed
  },
  { timestamps: true }
);

const AssignmentModel =
  mongoose.models.Assignment ?? mongoose.model<AssignmentRecord>("Assignment", AssignmentSchema);

// figma has a teacher/school shell, so keep one demo profile instead of login.
const demoTeacher = {
  id: "teacher-demo",
  name: "John Doe",
  schoolName: "Delhi Public School",
  city: "Bokaro Steel City"
};

export class AssignmentRepository {
  constructor(private readonly useMongo: boolean) {}

  async create(input: AssignmentInput): Promise<Assignment> {
    // the product starts from dashboard, so new assignments attach to the demo teacher.
    const assignment: Assignment = {
      ...input,
      id: randomUUID(),
      teacherId: demoTeacher.id,
      teacherName: demoTeacher.name,
      schoolName: demoTeacher.schoolName,
      city: demoTeacher.city,
      assignedOn: new Date().toISOString(),
      status: "queued"
    };

    if (this.useMongo) {
      await AssignmentModel.create(assignment);
    } else {
      memoryAssignments.set(assignment.id, assignment);
    }

    return assignment;
  }

  async list(): Promise<Assignment[]> {
    if (this.useMongo) {
      const rows = (await AssignmentModel.find().sort({ createdAt: -1 }).lean()) as unknown as AssignmentRecord[];
      return rows.map((row) => this.toAssignment(row));
    }

    return Array.from(memoryAssignments.values())
      .map(({ result, ...assignment }) => assignment)
      .sort((a, b) => b.assignedOn.localeCompare(a.assignedOn));
  }

  async find(id: string): Promise<Assignment | null> {
    if (this.useMongo) {
      const row = (await AssignmentModel.findOne({ id }).lean()) as unknown as AssignmentRecord | null;
      if (!row) return null;
      return this.toAssignment(row);
    }

    const row = memoryAssignments.get(id);
    if (!row) return null;
    const { result, ...assignment } = row;
    return assignment;
  }

  async updateStatus(id: string, status: AssignmentStatus, resultId?: string) {
    if (this.useMongo) {
      await AssignmentModel.updateOne({ id }, { status, resultId });
      return;
    }

    const row = memoryAssignments.get(id);
    if (row) memoryAssignments.set(id, { ...row, status, resultId });
  }

  async savePaper(paper: GeneratedPaper) {
    if (this.useMongo) {
      await AssignmentModel.updateOne(
        { id: paper.assignmentId },
        { result: paper, resultId: paper.id, status: "completed" }
      );
      return;
    }

    const row = memoryAssignments.get(paper.assignmentId);
    if (row) {
      memoryAssignments.set(paper.assignmentId, {
        ...row,
        result: paper,
        resultId: paper.id,
        status: "completed"
      });
    }
  }

  async findPaper(assignmentId: string): Promise<GeneratedPaper | null> {
    if (this.useMongo) {
      const row = (await AssignmentModel.findOne({ id: assignmentId }).lean()) as unknown as AssignmentRecord | null;
      return (row?.result as GeneratedPaper | undefined) ?? null;
    }

    const row = memoryAssignments.get(assignmentId);
    return row?.result ?? null;
  }

  async delete(id: string): Promise<boolean> {
    if (this.useMongo) {
      const result = await AssignmentModel.deleteOne({ id });
      return result.deletedCount > 0;
    }

    return memoryAssignments.delete(id);
  }

  private toAssignment(row: AssignmentRecord): Assignment {
    const { result, ...assignment } = row;
    return assignment;
  }
}
