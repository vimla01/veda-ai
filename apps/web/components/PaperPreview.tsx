"use client";

import type { GeneratedPaper, GenerationProgress } from "@veda/shared";
import { Download, FileText, RefreshCcw } from "lucide-react";
import clsx from "clsx";
import { api } from "@/lib/api";

type Props = {
  paper?: GeneratedPaper;
  progress?: GenerationProgress;
  onBack: () => void;
};

const difficultyClass = {
  Easy: "easy",
  Moderate: "moderate",
  Hard: "hard"
};

export function PaperPreview({ paper, progress, onBack }: Props) {
  if (!paper) {
    const percent = progress?.percent ?? 15;
    return (
      <section className="resultStack">
        <div className="generationBanner loadingBanner">
          <div className="loadingCopy">
            <div className="loadingIcon">
              <FileText size={22} />
            </div>
            <div>
              <span>Generating paper</span>
              <h1>{progress?.message ?? "Preparing your question paper"}</h1>
            </div>
          </div>
          <div className="loadingProgress">
            <b>{percent}%</b>
            <div className="progressLine">
              <span style={{ width: `${percent}%` }} />
            </div>
          </div>
        </div>
        <div className="paperSkeleton">
          <span />
          <span />
          <span />
          <span />
        </div>
      </section>
    );
  }

  return (
    <section className="resultStack">
      <div className="generationBanner">
        <div className="resultHeaderCopy">
          <span>Generated question paper</span>
          <h1>
            CBSE Grade {paper.className} {paper.subject}
          </h1>
          <p>{paper.sections.length} sections · {paper.maximumMarks} marks · {paper.timeAllowed}</p>
        </div>
        <div className="bannerActions">
          <button onClick={() => { window.location.href = api.paperPdfUrl(paper.assignmentId); }}>
            <Download size={19} />
            Download as PDF
          </button>
          <button onClick={onBack}>
            <RefreshCcw size={18} />
            Regenerate
          </button>
        </div>
      </div>

      <article className="paperSheet">
        <header>
          <h2>{paper.schoolName}</h2>
          <div className="paperSubhead">
            <span>Subject: {paper.subject}</span>
            <span>Class: {paper.className}</span>
          </div>
        </header>

        <div className="paperMeta">
          <b>Time Allowed: {paper.timeAllowed}</b>
          <b>Maximum Marks: {paper.maximumMarks}</b>
        </div>

        <p className="paperInstruction">{paper.instructions}</p>

        <div className="studentInfo">
          <span>Name: <i /></span>
          <span>Roll Number: <i /></span>
          <span>Class: {paper.className} Section: <i /></span>
        </div>

        {paper.sections.map((section) => (
          <section className="paperSection" key={section.id}>
            <h3>{section.title}</h3>
            <h4>{section.questionType}</h4>
            <p>{section.instruction}</p>
            <ol>
              {section.questions.map((question) => (
                <li key={question.id}>
                  <span>{question.text}</span>
                  <b className={clsx("difficulty", difficultyClass[question.difficulty])}>{question.difficulty}</b>
                  <em>[{question.marks} Marks]</em>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </article>
    </section>
  );
}
