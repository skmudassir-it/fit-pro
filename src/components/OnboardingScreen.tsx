"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useFitProStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import type { FitnessGoal, DailyTargets } from "@/lib/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SLIDES = [
  {
    image: "/images/onboarding/welcome.svg",
    title: "Welcome to FitPro",
    subtitle: "Your personal fitness companion designed for you",
    description:
      "Whether you're staying active, building strength, or training for an event — we've got you covered.",
  },
  {
    image: "/images/onboarding/track.svg",
    title: "Track Everything",
    subtitle: "All your fitness data in one place",
    description:
      "Workouts, steps, nutrition, weight, and progress — tracked simply and clearly.",
  },
  {
    image: "/images/onboarding/motivate.svg",
    title: "Stay Motivated",
    subtitle: "Streaks, achievements, and daily encouragement",
    description:
      "Build healthy habits with gentle reminders and celebrate every milestone along the way.",
  },
];

const GOAL_OPTIONS: {
  id: FitnessGoal;
  label: string;
  emoji: string;
  description: string;
}[] = [
  {
    id: "lose_weight",
    label: "Lose Weight",
    emoji: "🏋️",
    description: "Shed pounds and feel lighter",
  },
  {
    id: "build_muscle",
    label: "Build Muscle",
    emoji: "💪",
    description: "Get stronger and toned",
  },
  {
    id: "improve_endurance",
    label: "Improve Endurance",
    emoji: "🏃",
    description: "Boost stamina and cardio",
  },
  {
    id: "stay_active",
    label: "Stay Active",
    emoji: "🚶",
    description: "Keep moving every day",
  },
  {
    id: "train_event",
    label: "Train for Event",
    emoji: "🏆",
    description: "Prepare for a race or competition",
  },
];

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
] as const;

const FITNESS_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function calculateTargets(
  profile: {
    gender?: string;
    age?: number;
    weight?: number;
    height?: number;
    fitnessLevel?: string;
  },
  goals: FitnessGoal[]
): DailyTargets {
  const isMale = profile.gender === "male";
  const age = profile.age || 40;
  const weight = profile.weight || 70;
  const height = profile.height || 170;
  const level = profile.fitnessLevel || "beginner";

  // Mifflin-St Jeor BMR
  const bmr = isMale
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;

  const activityMultiplier =
    level === "beginner" ? 1.375 : level === "intermediate" ? 1.55 : 1.725;

  let calories = Math.round(bmr * activityMultiplier);
  if (goals.includes("lose_weight")) calories = Math.round(calories * 0.8);
  if (goals.includes("build_muscle")) calories = Math.round(calories * 1.15);
  if (goals.includes("train_event")) calories = Math.round(calories * 1.1);

  let steps = 8000;
  if (goals.includes("lose_weight")) steps = 10000;
  if (goals.includes("improve_endurance")) steps = 12000;
  if (goals.includes("train_event")) steps = 10000;
  if (goals.includes("stay_active")) steps = 9000;

  let activeMinutes =
    level === "beginner" ? 25 : level === "intermediate" ? 45 : 60;
  if (goals.includes("lose_weight")) activeMinutes += 10;
  if (goals.includes("improve_endurance")) activeMinutes += 15;
  if (goals.includes("train_event")) activeMinutes += 10;
  if (goals.includes("build_muscle")) activeMinutes += 5;

  return {
    calories: Math.max(1200, calories),
    steps: Math.max(3000, steps),
    activeMinutes: Math.max(15, activeMinutes),
    water: 8,
    sleep: 8,
  };
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
  }),
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TargetRow({
  emoji,
  label,
  value,
  unit,
  onMinus,
  onPlus,
}: {
  emoji: string;
  label: string;
  value: number;
  unit: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{emoji}</span>
        <div>
          <div className="text-base font-semibold text-foreground">
            {label}
          </div>
          <div className="text-xs text-muted-foreground">per day</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMinus}
          disabled={value <= 0}
          className="w-11 h-11 rounded-full bg-muted hover:bg-muted-foreground/20 disabled:opacity-30 flex items-center justify-center text-2xl font-bold text-foreground transition-colors active:scale-90"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>

        <div className="min-w-[88px] text-center">
          <span className="text-xl font-bold text-foreground tabular-nums">
            {value.toLocaleString()}
          </span>
          <span className="text-sm text-muted-foreground ml-1">{unit}</span>
        </div>

        <button
          type="button"
          onClick={onPlus}
          className="w-11 h-11 rounded-full bg-muted hover:bg-muted-foreground/20 flex items-center justify-center text-2xl font-bold text-foreground transition-colors active:scale-90"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function OnboardingScreen() {
  // Step & direction tracking
  const [step, setStep] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  // --- Step 2: Profile form state ---
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<string>("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [fitnessLevel, setFitnessLevel] = useState<string>("");

  // --- Step 3: Goals & targets state ---
  const [selectedGoals, setSelectedGoals] = useState<FitnessGoal[]>([]);
  const [targets, setTargets] = useState<DailyTargets>({
    calories: 2200,
    steps: 8000,
    activeMinutes: 45,
    water: 8,
    sleep: 8,
  });

  // --- Store ---
  const updateProfile = useFitProStore((s) => s.updateProfile);
  const updateDailyTargets = useFitProStore((s) => s.updateDailyTargets);
  const setOnboardingComplete = useFitProStore((s) => s.setOnboardingComplete);

  // -----------------------------------------------------------------------
  // Step 0: Carousel handlers
  // -----------------------------------------------------------------------

  const goToSlide = useCallback(
    (newIndex: number) => {
      setDirection(newIndex > slideIndex ? 1 : -1);
      setSlideIndex(newIndex);
    },
    [slideIndex]
  );

  const handleNextSlide = useCallback(() => {
    if (slideIndex < SLIDES.length - 1) {
      goToSlide(slideIndex + 1);
    }
  }, [slideIndex, goToSlide]);

  const handlePrevSlide = useCallback(() => {
    if (slideIndex > 0) {
      goToSlide(slideIndex - 1);
    }
  }, [slideIndex, goToSlide]);

  const handleGetStarted = useCallback(() => {
    setDirection(1);
    setStep(1);
  }, []);

  // -----------------------------------------------------------------------
  // Step 1 → Step 2: build profile snapshot, calc targets
  // -----------------------------------------------------------------------

  const makeProfileSnapshot = useCallback(() => {
    return {
      gender,
      age: parseInt(age) || 0,
      weight: parseFloat(weight) || 0,
      height: parseFloat(height) || 0,
      fitnessLevel,
    };
  }, [gender, age, weight, height, fitnessLevel]);

  const handleContinueToGoals = useCallback(() => {
    const snap = makeProfileSnapshot();
    const newTargets = calculateTargets(snap, selectedGoals);
    setTargets(newTargets);
    setDirection(1);
    setStep(2);
  }, [makeProfileSnapshot, selectedGoals]);

  // -----------------------------------------------------------------------
  // Step 2: Goal toggling & target adjustment
  // -----------------------------------------------------------------------

  const toggleGoal = useCallback(
    (goal: FitnessGoal) => {
      setSelectedGoals((prev) => {
        const next = prev.includes(goal)
          ? prev.filter((g) => g !== goal)
          : [...prev, goal];
        // Recalculate targets whenever goals change
        const snap = makeProfileSnapshot();
        const newTargets = calculateTargets(snap, next);
        setTargets(newTargets);
        return next;
      });
    },
    [makeProfileSnapshot]
  );

  const adjustTarget = useCallback(
    (key: keyof DailyTargets, delta: number) => {
      setTargets((prev) => {
        const stepSize =
          key === "calories"
            ? 50
            : key === "steps"
              ? 500
              : key === "activeMinutes"
                ? 5
                : 1;
        const next = Math.max(0, prev[key] + delta * stepSize);
        return { ...prev, [key]: next };
      });
    },
    []
  );

  // -----------------------------------------------------------------------
  // Step 2: Finalize onboarding
  // -----------------------------------------------------------------------

  const handleStartJourney = useCallback(() => {
    const profile = {
      name: name.trim() || "Friend",
      age: parseInt(age) || 40,
      gender: (gender as "male" | "female" | "other") || "other",
      height: parseFloat(height) || 170,
      weight: parseFloat(weight) || 70,
      fitnessLevel:
        (fitnessLevel as "beginner" | "intermediate" | "advanced") ||
        "beginner",
      goals:
        selectedGoals.length > 0 ? [...selectedGoals] : (["stay_active"] as FitnessGoal[]),
      dailyTargets: { ...targets },
    };
    updateProfile(profile);
    updateDailyTargets(targets);
    setOnboardingComplete(true);
  }, [
    name,
    age,
    gender,
    height,
    weight,
    fitnessLevel,
    selectedGoals,
    targets,
    updateProfile,
    updateDailyTargets,
    setOnboardingComplete,
  ]);

  // -----------------------------------------------------------------------
  // Derived booleans
  // -----------------------------------------------------------------------

  const canContinueToGoals = Boolean(
    name.trim() && age && gender && height && weight && fitnessLevel
  );
  const canStartJourney = selectedGoals.length > 0;

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-background overflow-hidden">
      {/* ---- Progress bar ---- */}
      <div className="flex-shrink-0 px-6 pt-6 pb-2">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                i <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      {/* ---- Step container ---- */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait" custom={direction}>
          {/* ============================================================ */}
          {/* STEP 0 — Welcome Carousel                                    */}
          {/* ============================================================ */}
          {step === 0 && (
            <motion.div
              key="step-0"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: "easeOut" as const }}
              className="absolute inset-0 flex flex-col"
            >
              <div className="flex-1 flex flex-col items-center justify-center px-8 relative overflow-hidden">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={slideIndex}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: "easeOut" as const }}
                    className="flex flex-col items-center text-center gap-6 w-full"
                  >
                    <Image
                      src={SLIDES[slideIndex].image}
                      alt={SLIDES[slideIndex].title}
                      width={192}
                      height={192}
                      className="w-48 h-48 mx-auto mb-4"
                      priority
                    />
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">
                      {SLIDES[slideIndex].title}
                    </h1>
                    <p className="text-xl text-primary font-semibold">
                      {SLIDES[slideIndex].subtitle}
                    </p>
                    <p className="text-base text-muted-foreground max-w-xs leading-relaxed">
                      {SLIDES[slideIndex].description}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Carousel footer */}
              <div className="flex-shrink-0 px-6 pb-8">
                {/* Dot indicators */}
                <div className="flex justify-center gap-3 mb-8">
                  {SLIDES.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => goToSlide(i)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        i === slideIndex
                          ? "bg-primary scale-125"
                          : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                      }`}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex gap-4">
                  {slideIndex > 0 ? (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handlePrevSlide}
                      className="flex-1 h-14 text-lg"
                    >
                      ← Back
                    </Button>
                  ) : (
                    <div className="flex-1" />
                  )}

                  {slideIndex < SLIDES.length - 1 ? (
                    <Button
                      variant="default"
                      size="lg"
                      onClick={handleNextSlide}
                      className="flex-1 h-14 text-lg"
                    >
                      Next →
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="lg"
                      onClick={handleGetStarted}
                      className="flex-1 h-14 text-lg font-bold"
                    >
                      Get Started 🎉
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* STEP 1 — Profile Setup                                       */}
          {/* ============================================================ */}
          {step === 1 && (
            <motion.div
              key="step-1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: "easeOut" as const }}
              className="absolute inset-0 flex flex-col"
            >
              <div className="flex-1 overflow-y-auto px-6 pt-4 pb-4">
                <div className="text-center mb-8">
                  <div className="text-5xl mb-3">👋</div>
                  <h2 className="text-2xl font-bold text-foreground">
                    Tell us about yourself
                  </h2>
                  <p className="text-base text-muted-foreground mt-2">
                    This helps us personalize your experience
                  </p>
                </div>

                <div className="space-y-5">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">
                      Your Name
                    </Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="h-14 text-lg px-4 rounded-xl"
                    />
                  </div>

                  {/* Age + Gender row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Age</Label>
                      <Input
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="Years"
                        min={13}
                        max={120}
                        className="h-14 text-lg px-4 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">
                        Gender
                      </Label>
                      <Select
                        value={gender}
                        onValueChange={(v) => setGender(v ?? "")}
                      >
                        <SelectTrigger className="h-14 text-lg rounded-xl w-full">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {GENDER_OPTIONS.map((opt) => (
                            <SelectItem
                              key={opt.value}
                              value={opt.value}
                              className="text-lg py-3"
                            >
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Height + Weight row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">
                        Height (cm)
                      </Label>
                      <Input
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        placeholder="cm"
                        min={100}
                        max={250}
                        className="h-14 text-lg px-4 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">
                        Weight (kg)
                      </Label>
                      <Input
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="kg"
                        min={30}
                        max={300}
                        className="h-14 text-lg px-4 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Fitness Level */}
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">
                      Fitness Level
                    </Label>
                    <Select
                      value={fitnessLevel}
                      onValueChange={(v) => setFitnessLevel(v ?? "")}
                    >
                      <SelectTrigger className="h-14 text-lg rounded-xl w-full">
                        <SelectValue placeholder="Select your level" />
                      </SelectTrigger>
                      <SelectContent>
                        {FITNESS_LEVELS.map((opt) => (
                          <SelectItem
                            key={opt.value}
                            value={opt.value}
                            className="text-lg py-3"
                          >
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 px-6 pb-8 pt-2 flex gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setDirection(-1);
                    setStep(0);
                  }}
                  className="flex-1 h-14 text-lg"
                >
                  ← Back
                </Button>
                <Button
                  variant="default"
                  size="lg"
                  onClick={handleContinueToGoals}
                  disabled={!canContinueToGoals}
                  className="flex-1 h-14 text-lg font-bold"
                >
                  Continue →
                </Button>
              </div>
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* STEP 2 — Goals & Targets                                     */}
          {/* ============================================================ */}
          {step === 2 && (
            <motion.div
              key="step-2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: "easeOut" as const }}
              className="absolute inset-0 flex flex-col"
            >
              <div className="flex-1 overflow-y-auto px-6 pt-4 pb-4">
                <div className="text-center mb-6">
                  <div className="text-5xl mb-3">🎯</div>
                  <h2 className="text-2xl font-bold text-foreground">
                    Choose Your Goals
                  </h2>
                  <p className="text-base text-muted-foreground mt-2">
                    Select all that apply — we&apos;ll tailor your plan
                  </p>
                </div>

                {/* ---- Goal cards ---- */}
                <div className="space-y-3 mb-8">
                  {GOAL_OPTIONS.map((goal) => {
                    const isSelected = selectedGoals.includes(goal.id);
                    return (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => toggleGoal(goal.id)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 active:scale-[0.98] ${
                          isSelected
                            ? "border-primary bg-primary/10 shadow-md"
                            : "border-border bg-card hover:border-primary/40 hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-3xl">{goal.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-lg font-bold text-foreground">
                              {goal.label}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {goal.description}
                            </div>
                          </div>
                          <div
                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                              isSelected
                                ? "bg-primary border-primary text-primary-foreground"
                                : "border-muted-foreground/30"
                            }`}
                          >
                            {isSelected && <CheckIcon />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* ---- Daily targets ---- */}
                <Card className="mb-4">
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-bold text-foreground mb-1">
                      Your Daily Targets
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Auto-calculated based on your profile. Tap +/− to
                      adjust.
                    </p>

                    <div className="space-y-1">
                      <TargetRow
                        emoji="🔥"
                        label="Calories"
                        value={targets.calories}
                        unit="kcal"
                        onMinus={() => adjustTarget("calories", -1)}
                        onPlus={() => adjustTarget("calories", 1)}
                      />
                      <TargetRow
                        emoji="👣"
                        label="Steps"
                        value={targets.steps}
                        unit="steps"
                        onMinus={() => adjustTarget("steps", -1)}
                        onPlus={() => adjustTarget("steps", 1)}
                      />
                      <TargetRow
                        emoji="⏱️"
                        label="Active Minutes"
                        value={targets.activeMinutes}
                        unit="min"
                        onMinus={() => adjustTarget("activeMinutes", -1)}
                        onPlus={() => adjustTarget("activeMinutes", 1)}
                      />
                      <TargetRow
                        emoji="💧"
                        label="Water"
                        value={targets.water}
                        unit="glasses"
                        onMinus={() => adjustTarget("water", -1)}
                        onPlus={() => adjustTarget("water", 1)}
                      />
                      <TargetRow
                        emoji="😴"
                        label="Sleep"
                        value={targets.sleep}
                        unit="hours"
                        onMinus={() => adjustTarget("sleep", -1)}
                        onPlus={() => adjustTarget("sleep", 1)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 px-6 pb-8 pt-2 flex gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setDirection(-1);
                    setStep(1);
                  }}
                  className="flex-1 h-14 text-lg"
                >
                  ← Back
                </Button>
                <Button
                  variant="default"
                  size="lg"
                  onClick={handleStartJourney}
                  disabled={!canStartJourney}
                  className="flex-1 h-14 text-lg font-bold"
                >
                  Start My Journey 🚀
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
