import { z } from "zod";

export const questionConfigSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    "Multiple Choice Questions",
    "Short Answer Questions",
    "Diagram/Graph-Based Questions",
    "Long Answer Questions"
  ]),
  count: z.number().int().min(1).max(40),
  marks: z.number().int().min(1).max(20)
});

export const assignmentInputSchema = z.object({
  title: z.string().min(3).max(120),
  subject: z.string().min(2).max(80),
  className: z.string().min(1).max(40),
  dueDate: z.string().min(1),
  sourceText: z.string().max(12000).optional(),
  instructions: z.string().max(1500).optional(),
  questionConfigs: z.array(questionConfigSchema).min(1)
});
