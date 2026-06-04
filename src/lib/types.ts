// FitPro types
export interface UserProfile {
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  height: number; // cm
  weight: number; // kg
  fitnessLevel: "beginner" | "intermediate" | "advanced";
  goals: FitnessGoal[];
  dailyTargets: DailyTargets;
}

export type FitnessGoal =
  | "lose_weight"
  | "build_muscle"
  | "improve_endurance"
  | "stay_active"
  | "train_event";

export interface DailyTargets {
  calories: number;
  steps: number;
  activeMinutes: number;
  water: number; // glasses
  sleep: number; // hours
}

export interface TodayStats {
  steps: number;
  distance: number; // km
  caloriesBurned: number;
  activeMinutes: number;
  heartRate: number;
  water: number;
  sleep: number;
  lastWorkout: WorkoutSummary | null;
}

export interface WorkoutSummary {
  type: WorkoutType;
  duration: number; // minutes
  calories: number;
  date: string;
}

export type WorkoutType =
  | "strength"
  | "cardio"
  | "running"
  | "cycling"
  | "yoga"
  | "hiit"
  | "custom";

export interface Exercise {
  id: string;
  name: string;
  category: WorkoutType;
  targetMuscles: string[];
  instructions: string[];
  sets?: number;
  reps?: number;
  duration?: number;
  restTime: number;
}

export interface WorkoutSession {
  id: string;
  type: WorkoutType;
  exercises: Exercise[];
  startTime: string;
  endTime?: string;
  caloriesBurned: number;
  duration: number;
  completed: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress: number; // 0-100
}

export interface WeeklyProgress {
  day: string;
  steps: number;
  calories: number;
  activeMinutes: number;
}

export interface WeightEntry {
  date: string;
  weight: number;
}

export interface StreakInfo {
  current: number;
  best: number;
  lastActiveDate: string;
}

export interface Meal {
  id: string;
  type: "breakfast" | "lunch" | "dinner" | "snack";
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
}

export type TabId = "home" | "workouts" | "progress" | "nutrition" | "profile";
