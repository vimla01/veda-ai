"use client";

import {
  ArrowLeft,
  Bell,
  BookOpen,
  Briefcase,
  ChevronDown,
  Grid2X2,
  Library,
  Settings,
  Sparkles
} from "lucide-react";
import clsx from "clsx";
import { Logo } from "./Logo";

type Props = {
  title: string;
  active: "assignments" | "create" | "toolkit";
  assignmentCount: number;
  children: React.ReactNode;
  onCreate: () => void;
  onAssignments: () => void;
};

const nav = [
  { id: "home", label: "Home", icon: Grid2X2 },
  { id: "groups", label: "My Groups", icon: Briefcase },
  { id: "assignments", label: "Assignments", icon: BookOpen },
  { id: "toolkit", label: "AI Toolkit", icon: Sparkles },
  { id: "library", label: "My Library", icon: Library }
];

export function AppShell({ title, active, assignmentCount, children, onCreate, onAssignments }: Props) {
  return (
    <div className="appFrame">
      <aside className="sidebar">
        <Logo />
        <button className="primaryNavButton" onClick={onCreate}>
          <Sparkles size={18} />
          Create Assignment
        </button>
        <nav className="sideNav">
          {nav.map((item) => {
            const Icon = item.icon;
            const isActive =
              (active === "assignments" && item.id === "assignments") ||
              (active === "toolkit" && item.id === "toolkit");
            return (
              <button
                key={item.id}
                className={clsx("navItem", isActive && "active")}
                onClick={item.id === "assignments" ? onAssignments : undefined}
              >
                <Icon size={20} />
                <span>{item.label}</span>
                {item.id === "assignments" && assignmentCount > 0 && <strong>{assignmentCount}</strong>}
              </button>
            );
          })}
        </nav>
        <div className="sideFooter">
          <button className="settingsButton">
            <Settings size={18} />
            Settings
          </button>
          <div className="schoolCard">
            <div className="avatar school">D</div>
            <div>
              <b>Delhi Public School</b>
              <span>Bokaro Steel City</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <button className="iconButton" onClick={onAssignments} aria-label="Back to assignments">
            <ArrowLeft size={22} />
          </button>
          <div className="topbarLogo">
            <Logo />
          </div>
          <Grid2X2 className="desktopCrumbIcon" size={20} />
          <span>{title}</span>
          <div className="topbarActions">
            <button className="bellButton" aria-label="Notifications">
              <Bell size={21} />
              <i />
            </button>
            <div className="avatar teacher">J</div>
            <b>John Doe</b>
            <ChevronDown size={18} />
          </div>
        </header>
        {children}
      </main>

      <nav className="bottomNav">
        {nav
          .filter((item) => ["home", "assignments", "library", "toolkit"].includes(item.id))
          .map((item) => {
            const Icon = item.icon;
            const isActive = active === "assignments" && item.id === "assignments";
            return (
              <button key={item.id} className={clsx(isActive && "active")} onClick={item.id === "assignments" ? onAssignments : undefined}>
                <Icon size={21} />
                <span>{item.label.replace("My ", "").replace("AI ", "")}</span>
              </button>
            );
          })}
      </nav>
      <button className="floatingCreate" onClick={onCreate} aria-label="Create assignment">
        +
      </button>
    </div>
  );
}
