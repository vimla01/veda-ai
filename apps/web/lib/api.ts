import type { Assignment, AssignmentInput, GeneratedPaper } from "@veda/shared";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message ?? "Request failed");
  }

  return response.json() as Promise<T>;
}

export const api = {
  listAssignments: () => request<Assignment[]>("/api/assignments"),
  createAssignment: (input: AssignmentInput) =>
    request<Assignment>("/api/assignments", { method: "POST", body: JSON.stringify(input) }),
  deleteAssignment: (assignmentId: string) =>
    request<void>(`/api/assignments/${assignmentId}`, { method: "DELETE" }),
  getPaper: (assignmentId: string) => request<GeneratedPaper>(`/api/assignments/${assignmentId}/paper`),
  paperPdfUrl: (assignmentId: string) => `${API_URL}/api/assignments/${assignmentId}/paper.pdf`
};
