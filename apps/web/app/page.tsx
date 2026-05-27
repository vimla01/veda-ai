"use client";

import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { AssignmentList } from "@/components/AssignmentList";
import { CreateAssignmentForm } from "@/components/CreateAssignmentForm";
import { PaperPreview } from "@/components/PaperPreview";
import { useAssignmentStore } from "@/store/assignmentStore";

export default function Home() {
  const {
    assignments,
    view,
    isLoading,
    paper,
    progress,
    loadAssignments,
    createAssignment,
    deleteAssignment,
    openPaper,
    setView,
    resetProgress
  } = useAssignmentStore();

  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  const title = view === "create" ? "Create New" : view === "paper" ? "Create New" : "Assignment";

  return (
    <AppShell
      title={title}
      active={view === "paper" ? "toolkit" : "assignments"}
      assignmentCount={assignments.length}
      onCreate={() => {
        resetProgress();
        setView("create");
      }}
      onAssignments={() => setView("list")}
    >
      {view === "list" && (
        <AssignmentList
          assignments={assignments}
          isLoading={isLoading}
          onCreate={() => setView("create")}
          onOpen={openPaper}
          onDelete={deleteAssignment}
        />
      )}
      {view === "create" && <CreateAssignmentForm onSubmit={createAssignment} isLoading={isLoading} />}
      {view === "paper" && <PaperPreview paper={paper} progress={progress} onBack={() => setView("create")} />}
    </AppShell>
  );
}
