"use client";

import { useFitProStore } from "@/lib/store";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faDumbbell,
  faChartLine,
  faUtensils,
  faUser,
  faPlusCircle,
} from "@fortawesome/free-solid-svg-icons";
import type { TabId } from "@/lib/types";

const tabs: { id: TabId; label: string; icon: typeof faHome }[] = [
  { id: "home", label: "Home", icon: faHome },
  { id: "workouts", label: "Workouts", icon: faDumbbell },
  { id: "progress", label: "Progress", icon: faChartLine },
  { id: "nutrition", label: "Nutrition", icon: faUtensils },
  { id: "profile", label: "Profile", icon: faUser },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const activeTab = useFitProStore((s) => s.activeTab);
  const setActiveTab = useFitProStore((s) => s.setActiveTab);
  const onboardingComplete = useFitProStore((s) => s.onboardingComplete);

  if (!onboardingComplete) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-background relative overflow-hidden">
      {/* Main content area */}
      <main className="flex-1 overflow-y-auto pb-2">{children}</main>

      {/* Floating action button */}
      <button
        onClick={() => setActiveTab("workouts")}
        className="absolute bottom-20 right-4 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all z-20"
        aria-label="Quick start workout"
      >
        <FontAwesomeIcon icon={faPlusCircle} className="text-2xl" />
      </button>

      {/* Bottom tab bar */}
      <nav className="flex-shrink-0 border-t border-border bg-card px-2 pb-safe">
        <div className="flex items-center justify-around h-16">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center gap-1 min-w-[64px] py-2 px-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "text-primary scale-105"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label={tab.label}
              >
                <FontAwesomeIcon
                  icon={tab.icon}
                  className={`text-xl ${isActive ? "drop-shadow-sm" : ""}`}
                />
                <span
                  className={`text-xs font-medium ${
                    isActive ? "font-bold" : ""
                  }`}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <div className="absolute -bottom-2 w-6 h-1 bg-primary rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
