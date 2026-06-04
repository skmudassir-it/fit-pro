"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  UserProfile,
  DailyTargets,
  TodayStats,
  WorkoutSession,
  Achievement,
  WeeklyProgress,
  WeightEntry,
  StreakInfo,
  Meal,
  TabId,
  FitnessGoal,
} from "@/lib/types";
import {
  motivationalQuotes,
  sampleAchievements,
  sampleWeeklyProgress,
  sampleWeightEntries,
  sampleMeals,
  exerciseLibrary,
} from "@/lib/sample-data";

interface FitProState {
  // Navigation
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;

  // Onboarding
  onboardingComplete: boolean;
  setOnboardingComplete: (v: boolean) => void;

  // Profile
  profile: UserProfile | null;
  updateProfile: (profile: UserProfile) => void;

  // Daily targets
  dailyTargets: DailyTargets;
  updateDailyTargets: (targets: Partial<DailyTargets>) => void;

  // Today stats
  todayStats: TodayStats;
  updateTodayStat: <K extends keyof TodayStats>(key: K, value: TodayStats[K]) => void;

  // Workouts
  currentWorkout: WorkoutSession | null;
  startWorkout: (session: WorkoutSession) => void;
  completeWorkout: () => void;

  // Achievements
  achievements: Achievement[];
  unlockAchievement: (id: string) => void;

  // Weekly progress
  weeklyProgress: WeeklyProgress[];

  // Weight log
  weightEntries: WeightEntry[];
  addWeightEntry: (entry: WeightEntry) => void;

  // Streaks
  streak: StreakInfo;

  // Meals
  meals: Meal[];
  addMeal: (meal: Meal) => void;
  removeMeal: (id: string) => void;

  // Quote
  dailyQuote: string;

  // Water tracking
  addWater: () => void;
}

export const useFitProStore = create<FitProState>()(
  persist(
    (set, get) => ({
      // Navigation
      activeTab: "home",
      setActiveTab: (tab) => set({ activeTab: tab }),

      // Onboarding
      onboardingComplete: false,
      setOnboardingComplete: (v) => set({ onboardingComplete: v }),

      // Profile
      profile: null,
      updateProfile: (profile) => set({ profile }),

      // Daily targets
      dailyTargets: {
        calories: 2200,
        steps: 8000,
        activeMinutes: 45,
        water: 8,
        sleep: 8,
      },
      updateDailyTargets: (targets) =>
        set((s) => ({ dailyTargets: { ...s.dailyTargets, ...targets } })),

      // Today stats
      todayStats: {
        steps: 6420,
        distance: 4.8,
        caloriesBurned: 1850,
        activeMinutes: 32,
        heartRate: 72,
        water: 5,
        sleep: 7.5,
        lastWorkout: {
          type: "strength",
          duration: 45,
          calories: 320,
          date: new Date().toISOString(),
        },
      },
      updateTodayStat: (key, value) =>
        set((s) => ({
          todayStats: { ...s.todayStats, [key]: value },
        })),

      // Workouts
      currentWorkout: null,
      startWorkout: (session) => set({ currentWorkout: session }),
      completeWorkout: () => {
        const w = get().currentWorkout;
        if (!w) return;
        const completed = { ...w, endTime: new Date().toISOString(), completed: true };
        set((s) => ({
          currentWorkout: null,
          todayStats: {
            ...s.todayStats,
            caloriesBurned: s.todayStats.caloriesBurned + w.caloriesBurned,
            activeMinutes: s.todayStats.activeMinutes + w.duration,
            lastWorkout: {
              type: w.type,
              duration: w.duration,
              calories: w.caloriesBurned,
              date: new Date().toISOString(),
            },
          },
        }));
      },

      // Achievements
      achievements: sampleAchievements,
      unlockAchievement: (id) =>
        set((s) => ({
          achievements: s.achievements.map((a) =>
            a.id === id ? { ...a, unlockedAt: new Date().toISOString(), progress: 100 } : a
          ),
        })),

      // Weekly progress
      weeklyProgress: sampleWeeklyProgress,

      // Weight entries
      weightEntries: sampleWeightEntries,
      addWeightEntry: (entry) =>
        set((s) => ({ weightEntries: [...s.weightEntries, entry] })),

      // Streaks
      streak: { current: 5, best: 12, lastActiveDate: new Date().toISOString() },

      // Meals
      meals: sampleMeals,
      addMeal: (meal) => set((s) => ({ meals: [...s.meals, meal] })),
      removeMeal: (id) => set((s) => ({ meals: s.meals.filter((m) => m.id !== id) })),

      // Quote
      dailyQuote:
        motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)],

      // Water
      addWater: () =>
        set((s) => ({
          todayStats: {
            ...s.todayStats,
            water: Math.min(s.todayStats.water + 1, s.dailyTargets.water),
          },
        })),
    }),
    {
      name: "fitpro-storage",
    }
  )
);
