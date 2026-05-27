"use client";

import type { Assignment, AssignmentInput, GeneratedPaper, GenerationProgress } from "@veda/shared";
import { create } from "zustand";
import { API_URL, api } from "@/lib/api";
import { io, type Socket } from "socket.io-client";

type View = "list" | "create" | "paper";

type AssignmentState = {
  assignments: Assignment[];
  activeAssignmentId?: string;
  paper?: GeneratedPaper;
  progress?: GenerationProgress;
  view: View;
  isLoading: boolean;
  error?: string;
  socket?: Socket;
  loadAssignments: () => Promise<void>;
  createAssignment: (input: AssignmentInput) => Promise<void>;
  deleteAssignment: (assignmentId: string) => Promise<void>;
  openPaper: (assignmentId: string) => Promise<void>;
  setView: (view: View) => void;
  resetProgress: () => void;
};

export const useAssignmentStore = create<AssignmentState>((set, get) => ({
  assignments: [],
  view: "list",
  isLoading: false,

  setView: (view) => set({ view, error: undefined }),
  resetProgress: () => set({ progress: undefined, paper: undefined }),

  loadAssignments: async () => {
    set({ isLoading: true, error: undefined });
    try {
      set({ assignments: await api.listAssignments(), isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unable to load assignments", isLoading: false });
    }
  },

  createAssignment: async (input) => {
    set({ isLoading: true, error: undefined, paper: undefined });
    try {
      const assignment = await api.createAssignment(input);
      set((state) => ({
        assignments: [assignment, ...state.assignments],
        activeAssignmentId: assignment.id,
        view: "paper",
        progress: {
          assignmentId: assignment.id,
          status: "queued",
          percent: 5,
          message: "Assignment added to generation queue"
        },
        isLoading: false
      }));

      let socket = get().socket;
      if (!socket) {
        socket = io(API_URL);
        set({ socket });
      }
      // join only the active assignment room so progress updates stay scoped.
      socket.emit("assignment:join", assignment.id);
      socket.off("generation:progress");
      socket.on("generation:progress", async (progress: GenerationProgress) => {
        set({ progress });
        if (progress.status === "completed") {
          await get().openPaper(progress.assignmentId);
          await get().loadAssignments();
        }
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unable to create assignment", isLoading: false });
    }
  },

  openPaper: async (assignmentId) => {
    set({ activeAssignmentId: assignmentId, isLoading: true, error: undefined, view: "paper" });
    try {
      set({ paper: await api.getPaper(assignmentId), isLoading: false });
    } catch {
      set({
        paper: undefined,
        isLoading: false,
        progress: {
          assignmentId,
          status: "generating",
          percent: 50,
          message: "Paper is still being generated"
        }
      });
    }
  },

  deleteAssignment: async (assignmentId) => {
    const previous = get();
    set((state) => ({
      error: undefined,
      assignments: state.assignments.filter((assignment) => assignment.id !== assignmentId),
      paper: state.activeAssignmentId === assignmentId ? undefined : state.paper,
      progress: state.activeAssignmentId === assignmentId ? undefined : state.progress,
      activeAssignmentId: state.activeAssignmentId === assignmentId ? undefined : state.activeAssignmentId,
      view: state.activeAssignmentId === assignmentId ? "list" : state.view
    }));

    try {
      await api.deleteAssignment(assignmentId);
    } catch (error) {
      set({
        assignments: previous.assignments,
        paper: previous.paper,
        progress: previous.progress,
        activeAssignmentId: previous.activeAssignmentId,
        view: previous.view,
        error: error instanceof Error ? error.message : "Unable to delete assignment"
      });
    }
  }
}));
