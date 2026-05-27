export type Difficulty = "Easy" | "Moderate" | "Hard";

export type QuestionType =
  | "Multiple Choice Questions"
  | "Short Answer Questions"
  | "Diagram/Graph-Based Questions"
  | "Long Answer Questions";

export type QuestionConfig = {
  id: string;
  type: QuestionType;
  count: number;
  marks: number;
};

export type AssignmentStatus = "draft" | "queued" | "generating" | "completed" | "failed";

export type AssignmentInput = {
  title: string;
  subject: string;
  className: string;
  dueDate: string;
  sourceText?: string;
  instructions?: string;
  questionConfigs: QuestionConfig[];
};

export type Assignment = AssignmentInput & {
  id: string;
  teacherId: string;
  teacherName: string;
  schoolName: string;
  city: string;
  assignedOn: string;
  status: AssignmentStatus;
  resultId?: string;
};

export type PaperQuestion = {
  id: string;
  text: string;
  difficulty: Difficulty;
  marks: number;
};

export type PaperSection = {
  id: string;
  title: string;
  instruction: string;
  questionType: QuestionType;
  questions: PaperQuestion[];
};

export type GeneratedPaper = {
  id: string;
  assignmentId: string;
  schoolName: string;
  city: string;
  subject: string;
  className: string;
  timeAllowed: string;
  maximumMarks: number;
  instructions: string;
  sections: PaperSection[];
  createdAt: string;
};

export type GenerationProgress = {
  assignmentId: string;
  status: AssignmentStatus;
  percent: number;
  message: string;
  resultId?: string;
};

export const defaultQuestionConfigs: QuestionConfig[] = [
  { id: "mcq", type: "Multiple Choice Questions", count: 4, marks: 1 },
  { id: "short", type: "Short Answer Questions", count: 3, marks: 2 },
  { id: "diagram", type: "Diagram/Graph-Based Questions", count: 2, marks: 5 }
];

export function getMaximumMarks(configs: QuestionConfig[]) {
  return configs.reduce((total, config) => total + config.count * config.marks, 0);
}
