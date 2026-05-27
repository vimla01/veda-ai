"use client";

import { defaultQuestionConfigs, type AssignmentInput, type QuestionConfig } from "@veda/shared";
import { CalendarDays, ChevronDown, Minus, Plus, UploadCloud } from "lucide-react";
import { FormEvent, useMemo, useRef, useState } from "react";

type Props = {
  onSubmit: (input: AssignmentInput) => Promise<void>;
  isLoading: boolean;
};

type RequiredField = "title" | "dueDate" | "subject" | "className" | "sourceText";

export function CreateAssignmentForm({ onSubmit, isLoading }: Props) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [className, setClassName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [instructions, setInstructions] = useState("");
  const [questionConfigs, setQuestionConfigs] = useState<QuestionConfig[]>(defaultQuestionConfigs);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [error, setError] = useState("");
  const [touchedFields, setTouchedFields] = useState<RequiredField[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLock = useRef(false);

  const totalMarks = useMemo(
    () => questionConfigs.reduce((total, config) => total + config.count * config.marks, 0),
    [questionConfigs]
  );

  function updateConfig(id: string, patch: Partial<QuestionConfig>) {
    setQuestionConfigs((configs) => configs.map((config) => (config.id === id ? { ...config, ...patch } : config)));
  }

  function hasError(field: RequiredField) {
    if (!touchedFields.includes(field)) return false;
    const values = { title, dueDate, subject, className, sourceText };
    return !values[field].trim();
  }

  function markTouched(field: RequiredField) {
    setTouchedFields((fields) => (fields.includes(field) ? fields : [...fields, field]));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitLock.current || isLoading) return;

    const requiredFields: RequiredField[] = ["title", "dueDate", "subject", "className", "sourceText"];
    setTouchedFields(requiredFields);

    if (!title.trim() || !subject.trim() || !className.trim() || !dueDate || !sourceText.trim()) {
      setError("Please complete the required fields.");
      return;
    }

    if (questionConfigs.some((config) => config.count < 1 || config.marks < 1)) {
      setError("Questions and marks must be positive values.");
      return;
    }

    setError("");
    submitLock.current = true;
    setIsSubmitting(true);
    try {
      await onSubmit({ title, subject, className, dueDate, sourceText, instructions, questionConfigs });
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <section className="pageStack">
      <div className="sectionTitle">
        <span className="statusDot" />
        <div>
          <h1>Create Assignment</h1>
          <p>Set up a new assignment for your students</p>
        </div>
      </div>
      <div className="progressRail">
        <span />
        <span />
      </div>

      <form className="createPanel" onSubmit={submit}>
        <div className="formHeader">
          <h2>Assignment Details</h2>
          <p>Basic information about your assignment</p>
        </div>

        <label className="dropZone">
          {/* show the file name so the upload control does not feel fake. */}
          <UploadCloud size={34} />
          <b>{selectedFileName || "Choose a file or drag & drop it here"}</b>
          <span>{selectedFileName ? "File selected" : "PDF, JPEG, PNG, up to 10MB"}</span>
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.txt"
            onChange={(event) => setSelectedFileName(event.target.files?.[0]?.name ?? "")}
          />
          <em>{selectedFileName ? "Change File" : "Browse Files"}</em>
        </label>
        <p className="uploadHint">Upload images of your preferred document/image</p>

        <div className="twoColumn">
          <label className={hasError("title") ? "fieldInvalid" : undefined}>
            <span className="labelText">Assignment Title <i>*</i></span>
            <input
              value={title}
              onBlur={() => markTouched("title")}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Enter assignment title"
            />
            {hasError("title") && <small>Assignment title is required</small>}
          </label>
          <label className={hasError("dueDate") ? "fieldInvalid" : undefined}>
            <span className="labelText">Due Date <i>*</i></span>
            <span className="inputIcon">
              <input
                type="date"
                value={dueDate}
                onBlur={() => markTouched("dueDate")}
                onChange={(event) => setDueDate(event.target.value)}
              />
              <CalendarDays size={18} />
            </span>
            {hasError("dueDate") && <small>Due date is required</small>}
          </label>
          <label className={hasError("subject") ? "fieldInvalid" : undefined}>
            <span className="labelText">Subject <i>*</i></span>
            <input
              value={subject}
              onBlur={() => markTouched("subject")}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Subject"
            />
            {hasError("subject") && <small>Subject is required</small>}
          </label>
          <label className={hasError("className") ? "fieldInvalid" : undefined}>
            <span className="labelText">Class <i>*</i></span>
            <input
              value={className}
              onBlur={() => markTouched("className")}
              onChange={(event) => setClassName(event.target.value)}
              placeholder="Class or grade"
            />
            {hasError("className") && <small>Class is required</small>}
          </label>
        </div>

        <label className={hasError("sourceText") ? "fieldInvalid" : undefined}>
          <span className="labelText">Source Material <i>*</i></span>
          <textarea
            value={sourceText}
            onBlur={() => markTouched("sourceText")}
            onChange={(event) => setSourceText(event.target.value)}
            rows={3}
            placeholder="Paste chapter names, topic notes, or learning objectives"
          />
          {hasError("sourceText") && <small>Source material is required</small>}
        </label>

        <div className="questionRows">
          <div className="questionHead">
            <b>Question Type</b>
            <b>No. of Questions</b>
            <b>Marks</b>
          </div>
          {questionConfigs.map((config) => (
            <div className="questionRow" key={config.id}>
              <button type="button" className="selectLike">
                {config.type}
                <ChevronDown size={18} />
              </button>
              <Stepper value={config.count} onChange={(count) => updateConfig(config.id, { count })} />
              <Stepper value={config.marks} onChange={(marks) => updateConfig(config.id, { marks })} />
            </div>
          ))}
        </div>

        <label>
          Additional Instructions
          <textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} rows={3} placeholder="Optional instructions for the paper" />
        </label>

        <div className="formActions">
          <span>{totalMarks} marks total</span>
          {error && <strong>{error}</strong>}
          <button className="blackButton" disabled={isLoading || isSubmitting}>
            {isLoading || isSubmitting ? "Generating..." : "Generate Assignment"}
          </button>
        </div>
      </form>
    </section>
  );
}

function Stepper({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="stepper">
      <button type="button" onClick={() => onChange(Math.max(1, value - 1))}>
        <Minus size={15} />
      </button>
      <b>{value}</b>
      <button type="button" onClick={() => onChange(value + 1)}>
        <Plus size={15} />
      </button>
    </div>
  );
}
