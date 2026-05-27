import {
  type Assignment,
  type Difficulty,
  type GeneratedPaper,
  type PaperQuestion,
  type QuestionType,
  getMaximumMarks
} from "@veda/shared";
import { randomUUID } from "node:crypto";
import OpenAI from "openai";
import { z } from "zod";
import { env } from "../config/env.js";

const difficultyCycle: Difficulty[] = ["Easy", "Moderate", "Hard"];

const generatedQuestionSchema = z.object({
  text: z.string().min(8),
  difficulty: z.enum(["Easy", "Moderate", "Hard"]),
  marks: z.number().int().positive()
});

const generatedSectionSchema = z.object({
  title: z.string().min(3),
  instruction: z.string().min(5),
  questionType: z.enum([
    "Multiple Choice Questions",
    "Short Answer Questions",
    "Diagram/Graph-Based Questions",
    "Long Answer Questions"
  ]),
  questions: z.array(generatedQuestionSchema)
});

const generatedPaperSchema = z.object({
  instructions: z.string().min(5),
  sections: z.array(generatedSectionSchema)
});

export class PaperGenerator {
  private readonly openai = env.openaiApiKey ? new OpenAI({ apiKey: env.openaiApiKey }) : undefined;

  async generate(assignment: Assignment): Promise<GeneratedPaper> {
    if (this.openai) {
      // prefer the real model when configured, but never block the demo flow on it.
      const aiPaper = await this.generateWithOpenAI(assignment);
      if (aiPaper) return aiPaper;
    }

    return this.generateFallback(assignment);
  }

  private async generateWithOpenAI(assignment: Assignment): Promise<GeneratedPaper | null> {
    try {
      const maximumMarks = getMaximumMarks(assignment.questionConfigs);
      const response = await this.openai!.chat.completions.create({
        model: env.openaiModel,
        response_format: { type: "json_object" },
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content:
              "You generate school assessment papers. Return only valid JSON. Do not include markdown. Do not repeat raw chapter labels like 'chapter 1' in questions. Create natural exam questions."
          },
          {
            role: "user",
            content: JSON.stringify({
              task: "Create a structured question paper",
              subject: assignment.subject,
              className: assignment.className,
              sourceMaterial: assignment.sourceText || assignment.title,
              additionalInstructions: assignment.instructions,
              questionConfigs: assignment.questionConfigs,
              expectedJsonShape: {
                instructions: "string",
                sections: [
                  {
                    title: "Section A",
                    instruction: "Attempt all questions...",
                    questionType: "one of provided question types",
                    questions: [{ text: "question text", difficulty: "Easy|Moderate|Hard", marks: 2 }]
                  }
                ]
              }
            })
          }
        ]
      });

      const raw = response.choices[0]?.message.content;
      if (!raw) return null;

      // validate the model output before it reaches the frontend.
      const parsed = generatedPaperSchema.parse(JSON.parse(raw));
      return {
        id: randomUUID(),
        assignmentId: assignment.id,
        schoolName: assignment.schoolName,
        city: assignment.city,
        subject: assignment.subject,
        className: assignment.className,
        timeAllowed: maximumMarks > 30 ? "90 minutes" : "45 minutes",
        maximumMarks,
        instructions: parsed.instructions,
        sections: parsed.sections.map((section, index) => ({
          id: randomUUID(),
          title: section.title || `Section ${String.fromCharCode(65 + index)}`,
          questionType: section.questionType,
          instruction: section.instruction,
          questions: section.questions.map((question) => ({
            id: randomUUID(),
            text: question.text,
            difficulty: question.difficulty,
            marks: question.marks
          }))
        })),
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.warn("openai generation failed, using fallback generator.", error);
      return null;
    }
  }

  private generateFallback(assignment: Assignment): GeneratedPaper {
    // fallback keeps reviews and demos usable without an api key.
    const topics = extractTopics(assignment.sourceText || assignment.title);

    const sections = assignment.questionConfigs.map((config, sectionIndex) => ({
      id: randomUUID(),
      title: `Section ${String.fromCharCode(65 + sectionIndex)}`,
      questionType: config.type,
      instruction: `Attempt all questions. Each question carries ${config.marks} marks`,
      questions: Array.from({ length: config.count }, (_, questionIndex): PaperQuestion => {
        const difficulty = difficultyCycle[(sectionIndex + questionIndex) % difficultyCycle.length];
        const topic = topics[(sectionIndex + questionIndex) % topics.length];
        return {
          id: randomUUID(),
          text: buildQuestion(config.type, topic, assignment.subject, questionIndex),
          difficulty,
          marks: config.marks
        };
      })
    }));

    return {
      id: randomUUID(),
      assignmentId: assignment.id,
      schoolName: assignment.schoolName,
      city: assignment.city,
      subject: assignment.subject,
      className: assignment.className,
      timeAllowed: getMaximumMarks(assignment.questionConfigs) > 30 ? "90 minutes" : "45 minutes",
      maximumMarks: getMaximumMarks(assignment.questionConfigs),
      instructions: assignment.instructions || "All questions are compulsory unless stated otherwise.",
      sections,
      createdAt: new Date().toISOString()
    };
  }
}

function extractTopics(source: string) {
  // teachers often paste chapter lists; clean them into usable topic names.
  const cleaned = source
    .replace(/chapter\s*\d+\s*[:.-]?/gi, "")
    .replace(/\bunit\s*\d+\s*[:.-]?/gi, "")
    .replace(/\bpo\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  const topics = cleaned
    .split(/[,;\n]|(?:\s+and\s+)/i)
    .map((topic) => topic.trim().replace(/[.:-]+$/g, ""))
    .filter((topic) => topic.length > 2)
    .slice(0, 8);

  return topics.length > 0 ? topics : ["the given topic"];
}

function buildQuestion(type: QuestionType, topic: string, subject: string, index: number) {
  const topicText = topic.toLowerCase();
  const templates: Record<QuestionType, string[]> = {
    "Multiple Choice Questions": [
      `Which statement best describes ${topicText}?`,
      `What is the most important feature of ${topicText}?`,
      `Which example is most closely related to ${topicText}?`
    ],
    "Short Answer Questions": [
      `Define ${topicText} and mention one key point about it.`,
      `Explain the importance of ${topicText} in ${subject}.`,
      `Write two characteristics of ${topicText}.`
    ],
    "Diagram/Graph-Based Questions": [
      `Draw a neat labelled diagram to explain ${topicText}.`,
      `Represent ${topicText} using a simple diagram or flowchart.`,
      `Study or draw a diagram related to ${topicText} and explain it briefly.`
    ],
    "Long Answer Questions": [
      `Explain ${topicText} in detail with suitable examples.`,
      `Discuss the causes, effects, and importance of ${topicText}.`,
      `Write a detailed note on ${topicText} and its relevance in ${subject}.`
    ]
  };

  return templates[type][index % templates[type].length];
}
