"use client";

import type { Assignment } from "@veda/shared";
import { Download, Eye, Filter, MoreVertical, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

type Props = {
  assignments: Assignment[];
  isLoading: boolean;
  onCreate: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
};

export function AssignmentList({ assignments, isLoading, onCreate, onOpen, onDelete }: Props) {
  const [query, setQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string>();
  const normalizedQuery = query.trim().toLowerCase();
  const visibleAssignments = useMemo(() => {
    if (!normalizedQuery) return assignments;

    return assignments.filter((assignment) => {
      const searchable = [
        assignment.title,
        assignment.subject,
        assignment.className,
        assignment.status,
        assignment.dueDate
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }, [assignments, normalizedQuery]);

  useEffect(() => {
    if (!openMenuId) return;

    // close menus the way users expect: outside click or escape.
    function closeMenu() {
      setOpenMenuId(undefined);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") closeMenu();
    }

    document.addEventListener("click", closeMenu);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("click", closeMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [openMenuId]);

  async function downloadPaper(assignment: Assignment) {
    setOpenMenuId(undefined);
    try {
      await api.getPaper(assignment.id);
    } catch {
      // if the paper is not ready, take the teacher to the progress screen.
      onOpen(assignment.id);
      return;
    }
    window.location.href = api.paperPdfUrl(assignment.id);
  }

  if (assignments.length === 0 && !normalizedQuery) {
    return (
      <section className="emptyState">
        <div className="emptyIllustration">
          <span className="sparkLine" />
          <span className="miniChip" />
          <span className="blueDot" />
          <span className="starOne" />
          <span className="starTwo" />
          <div className="paperShape" />
          <Search size={92} />
          <b>x</b>
        </div>
        <h1>No assignments yet</h1>
        <p>Create your first assignment to start collecting and grading student submissions.</p>
        <button className="blackButton" onClick={onCreate}>
          <Plus size={20} />
          Create Your First Assignment
        </button>
      </section>
    );
  }

  return (
    <section className="pageStack">
      <div className="sectionTitle">
        <span className="statusDot" />
        <div>
          <h1>Assignments</h1>
          <p>Manage and create assignments for your classes.</p>
        </div>
      </div>

      <div className="filterBar">
        <button>
          <Filter size={18} />
          Filter By
        </button>
        <label>
          <Search size={19} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Assignment"
          />
        </label>
      </div>

      {visibleAssignments.length === 0 ? (
        <div className="noSearchResults">
          <Search size={28} />
          <b>No matching assignments</b>
          <span>Try searching by title, subject, class, or due date.</span>
        </div>
      ) : (
        <div className="assignmentGrid">
          {visibleAssignments.map((assignment) => (
            <article className="assignmentCard" key={assignment.id}>
              <div className="cardActions">
                <button
                  className="cardMenu"
                  aria-label="Assignment options"
                  aria-expanded={openMenuId === assignment.id}
                  onClick={(event) => {
                    event.stopPropagation();
                    setOpenMenuId((id) => (id === assignment.id ? undefined : assignment.id));
                  }}
                >
                  <MoreVertical size={20} />
                </button>
                {openMenuId === assignment.id && (
                  <div className="cardActionMenu" onClick={(event) => event.stopPropagation()}>
                    <button
                      onClick={() => {
                        setOpenMenuId(undefined);
                        onOpen(assignment.id);
                      }}
                    >
                      <Eye size={16} />
                      View Assignment
                    </button>
                    <button onClick={() => void downloadPaper(assignment)}>
                      <Download size={16} />
                      Download PDF
                    </button>
                    <button
                      className="danger"
                      onClick={async () => {
                        setOpenMenuId(undefined);
                        await onDelete(assignment.id);
                      }}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
              <button className="assignmentTitleLink" onClick={() => onOpen(assignment.id)}>
                {assignment.title}
              </button>
              <div className="assignmentMeta">
                <span>
                  <b>Assigned on :</b> {format(new Date(assignment.assignedOn), "dd-MM-yyyy")}
                </span>
                <span>
                  <b>Due :</b> {format(new Date(assignment.dueDate), "dd-MM-yyyy")}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      <button className="stickyCreate" onClick={onCreate}>
        <Sparkles size={18} />
        Create Assignment
      </button>
    </section>
  );
}
