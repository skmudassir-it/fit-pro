"use client";

import { Suspense } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useFitProStore } from "@/lib/store";
import { OnboardingScreen } from "@/components/OnboardingScreen";

// Lazy loaded tab screens
import { HomeScreen } from "@/components/HomeScreen";
import { WorkoutScreen } from "@/components/WorkoutScreen";
import { ProgressScreen } from "@/components/ProgressScreen";
import { NutritionScreen } from "@/components/NutritionScreen";
import { ProfileScreen } from "@/components/ProfileScreen";

export default function Home() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AppShell />
    </Suspense>
  );
}

function AppShell() {
  const onboardingComplete = useFitProStore((s) => s.onboardingComplete);
  const activeTab = useFitProStore((s) => s.activeTab);

  if (!onboardingComplete) {
    return <OnboardingScreen />;
  }

  return (
    <AppLayout>
      {activeTab === "home" && <HomeScreen />}
      {activeTab === "workouts" && <WorkoutScreen />}
      {activeTab === "progress" && <ProgressScreen />}
      {activeTab === "nutrition" && <NutritionScreen />}
      {activeTab === "profile" && <ProfileScreen />}
    </AppLayout>
  );
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center animate-pulse">
          <span className="text-3xl">💪</span>
        </div>
        <p className="text-muted-foreground text-lg font-medium">Loading FitPro...</p>
      </div>
    </div>
  );
}
