"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faPause,
  faStop,
  faClock,
  faFire,
  faHeart,
  faDumbbell,
  faRunning,
  faPersonBiking,
  faPersonWalking,
  faSpa,
  faSearch,
  faChevronDown,
  faChevronUp,
  faCheck,
  faPlus,
  faMinus,
  faArrowRight,
  faTrophy,
} from "@fortawesome/free-solid-svg-icons";
import { useFitProStore } from "@/lib/store";
import { exerciseLibrary } from "@/lib/sample-data";
import type { WorkoutType, Exercise, WorkoutSession } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

// ─── Category config ──────────────────────────────────────────────────────────

interface CategoryInfo {
  type: WorkoutType;
  label: string;
  icon: typeof faDumbbell;
  color: string;
  bgColor: string;
  description: string;
}

const categories: CategoryInfo[] = [
  {
    type: "strength",
    label: "Strength",
    icon: faDumbbell,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950",
    description: "Build muscle and get stronger",
  },
  {
    type: "cardio",
    label: "Cardio",
    icon: faHeart,
    color: "text-red-500 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950",
    description: "Get your heart pumping",
  },
  {
    type: "running",
    label: "Running",
    icon: faRunning,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950",
    description: "Hit the road or trail",
  },
  {
    type: "cycling",
    label: "Cycling",
    icon: faPersonBiking,
    color: "text-orange-500 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950",
    description: "Pedal your way to fitness",
  },
  {
    type: "yoga",
    label: "Yoga",
    icon: faSpa,
    color: "text-purple-500 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950",
    description: "Stretch, breathe, and relax",
  },
  {
    type: "hiit",
    label: "HIIT",
    icon: faFire,
    color: "text-amber-500 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950",
    description: "High intensity interval training",
  },
  {
    type: "custom",
    label: "Custom",
    icon: faPersonWalking,
    color: "text-slate-500 dark:text-slate-400",
    bgColor: "bg-slate-50 dark:bg-slate-950",
    description: "Build your own workout",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getExercisesForCategory(type: WorkoutType): Exercise[] {
  if (type === "running") {
    return [
      {
        id: "run_warmup",
        name: "Warm-up Jog",
        category: "running",
        targetMuscles: ["Legs", "Cardio"],
        instructions: [
          "Start with a light jog for 5 minutes",
          "Gradually increase pace",
          "Focus on breathing rhythm",
        ],
        duration: 300,
        restTime: 30,
      },
      {
        id: "run_intervals",
        name: "Interval Sprints",
        category: "running",
        targetMuscles: ["Legs", "Core", "Cardio"],
        instructions: [
          "Sprint at 80% effort for 30 seconds",
          "Recover with light jog for 60 seconds",
          "Repeat for prescribed sets",
        ],
        sets: 5,
        duration: 30,
        restTime: 60,
      },
      {
        id: "run_steady",
        name: "Steady State Run",
        category: "running",
        targetMuscles: ["Legs", "Cardio"],
        instructions: [
          "Maintain a comfortable pace",
          "Keep steady breathing",
          "Stay relaxed in shoulders and arms",
        ],
        duration: 900,
        restTime: 60,
      },
      {
        id: "run_cooldown",
        name: "Cool-down Walk",
        category: "running",
        targetMuscles: ["Legs"],
        instructions: [
          "Walk at a slow pace",
          "Focus on deep breathing",
          "Stretch calves and hamstrings after",
        ],
        duration: 300,
        restTime: 0,
      },
    ] as Exercise[];
  }
  if (type === "cycling") {
    return [
      {
        id: "bike_warmup",
        name: "Easy Spin Warm-up",
        category: "cycling",
        targetMuscles: ["Legs", "Cardio"],
        instructions: [
          "Start with low resistance",
          "Spin at 80-90 RPM for 5 minutes",
          "Gradually increase resistance",
        ],
        duration: 300,
        restTime: 30,
      },
      {
        id: "bike_hill",
        name: "Hill Climb Intervals",
        category: "cycling",
        targetMuscles: ["Quads", "Glutes", "Calves"],
        instructions: [
          "Increase resistance to simulate a climb",
          "Pedal standing for 60 seconds",
          "Recover seated for 90 seconds",
        ],
        sets: 4,
        duration: 60,
        restTime: 90,
      },
      {
        id: "bike_sprint",
        name: "Speed Sprints",
        category: "cycling",
        targetMuscles: ["Legs", "Core", "Cardio"],
        instructions: [
          "Sprint at max effort for 20 seconds",
          "Easy spin recovery for 40 seconds",
          "Keep upper body stable",
        ],
        sets: 6,
        duration: 20,
        restTime: 40,
      },
      {
        id: "bike_cooldown",
        name: "Cool-down Spin",
        category: "cycling",
        targetMuscles: ["Legs"],
        instructions: [
          "Low resistance, easy spin",
          "Gradually slow down over 5 minutes",
          "Stretch after dismounting",
        ],
        duration: 300,
        restTime: 0,
      },
    ] as Exercise[];
  }
  return exerciseLibrary.filter((e) => e.category === type);
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const CALORIES_PER_MINUTE: Record<WorkoutType, number> = {
  strength: 7,
  cardio: 10,
  running: 11,
  cycling: 9,
  yoga: 4,
  hiit: 12,
  custom: 7,
};

// ─── Heart rate zone helpers ──────────────────────────────────────────────────

interface HeartRateZone {
  name: string;
  min: number;
  max: number;
  color: string;
  bgClass: string;
  textClass: string;
}

const heartRateZones: HeartRateZone[] = [
  { name: "Rest", min: 0, max: 99, color: "#6b7280", bgClass: "bg-gray-400", textClass: "text-gray-600" },
  { name: "Fat Burn", min: 100, max: 119, color: "#22c55e", bgClass: "bg-green-500", textClass: "text-green-600" },
  { name: "Cardio", min: 120, max: 139, color: "#eab308", bgClass: "bg-yellow-500", textClass: "text-yellow-600" },
  { name: "Peak", min: 140, max: 159, color: "#f97316", bgClass: "bg-orange-500", textClass: "text-orange-600" },
  { name: "Max", min: 160, max: 200, color: "#ef4444", bgClass: "bg-red-500", textClass: "text-red-600" },
];

function getHeartRateZone(bpm: number): HeartRateZone {
  for (const zone of heartRateZones) {
    if (bpm >= zone.min && bpm <= zone.max) return zone;
  }
  return heartRateZones[heartRateZones.length - 1];
}

function simulateHeartRate(workoutType: WorkoutType, isResting: boolean, elapsedSeconds: number): number {
  const baseByType: Record<WorkoutType, number> = {
    strength: 110,
    cardio: 125,
    running: 130,
    cycling: 120,
    yoga: 85,
    hiit: 135,
    custom: 110,
  };
  const base = baseByType[workoutType] || 110;
  const variation = Math.sin(elapsedSeconds * 0.3) * 10 + Math.sin(elapsedSeconds * 1.7) * 5;
  if (isResting) return Math.round(base - 15 + variation * 0.5);
  return Math.round(base + variation + 5);
}

// ─── Workout Creation ─────────────────────────────────────────────────────────

function createWorkoutSession(type: WorkoutType): WorkoutSession {
  const exercises = getExercisesForCategory(type);
  return {
    id: generateId(),
    type,
    exercises: exercises.map((ex) => ({ ...ex })),
    startTime: new Date().toISOString(),
    caloriesBurned: 0,
    duration: 0,
    completed: false,
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function WorkoutScreen() {
  const currentWorkout = useFitProStore((s) => s.currentWorkout);
  const startWorkout = useFitProStore((s) => s.startWorkout);
  const completeWorkout = useFitProStore((s) => s.completeWorkout);

  if (!currentWorkout) {
    return <WorkoutSelectionView onStartWorkout={startWorkout} />;
  }

  return (
    <LiveWorkoutView
      workout={currentWorkout}
      onComplete={() => completeWorkout()}
    />
  );
}

// ─── View 1: Workout Selection ────────────────────────────────────────────────

function WorkoutSelectionView({
  onStartWorkout,
}: {
  onStartWorkout: (session: WorkoutSession) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);

  const filteredExercises = useMemo(() => {
    if (!searchQuery.trim()) return exerciseLibrary;
    const q = searchQuery.toLowerCase();
    return exerciseLibrary.filter(
      (ex) =>
        ex.name.toLowerCase().includes(q) ||
        ex.targetMuscles.some((m) => m.toLowerCase().includes(q)) ||
        ex.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleQuickStart = useCallback(
    (type: WorkoutType) => {
      const session = createWorkoutSession(type);
      onStartWorkout(session);
    },
    [onStartWorkout]
  );

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6 pb-24">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Start a Workout</h1>
          <p className="text-muted-foreground text-base mt-1">
            Choose your activity and get moving!
          </p>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 gap-3">
          {categories.map((cat) => (
            <motion.button
              key={cat.type}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleQuickStart(cat.type)}
              className={`flex flex-col items-center gap-3 p-4 rounded-2xl border border-border ${cat.bgColor} transition-colors hover:brightness-95 active:brightness-90 cursor-pointer`}
            >
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center bg-white/80 dark:bg-white/10 shadow-sm`}
              >
                <FontAwesomeIcon
                  icon={cat.icon}
                  className={`text-2xl ${cat.color}`}
                />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground text-sm">{cat.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {cat.description}
                </p>
              </div>
              <Badge variant="secondary" className="mt-1">
                <FontAwesomeIcon icon={faPlay} className="text-[10px] mr-1" />
                Quick Start
              </Badge>
            </motion.button>
          ))}
        </div>

        {/* Exercise Library */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Exercise Library
          </h2>

          {/* Search */}
          <div className="relative mb-4">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm"
            />
            <Input
              type="text"
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 text-base"
            />
          </div>

          {/* Exercise list */}
          <div className="space-y-2">
            {filteredExercises.length === 0 && (
              <p className="text-center text-muted-foreground py-6">
                No exercises found
              </p>
            )}
            {filteredExercises.map((exercise) => (
              <Card key={exercise.id} size="sm">
                <CardHeader>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 min-w-0">
                      <CardTitle className="truncate">{exercise.name}</CardTitle>
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        {exercise.category}
                      </Badge>
                    </div>
                    <button
                      onClick={() =>
                        setExpandedExerciseId(
                          expandedExerciseId === exercise.id ? null : exercise.id
                        )
                      }
                      className="ml-2 text-muted-foreground hover:text-foreground p-1"
                      aria-label={
                        expandedExerciseId === exercise.id
                          ? "Collapse"
                          : "Expand"
                      }
                    >
                      <FontAwesomeIcon
                        icon={
                          expandedExerciseId === exercise.id
                            ? faChevronUp
                            : faChevronDown
                        }
                        className="text-sm"
                      />
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Target muscles */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {exercise.targetMuscles.map((muscle) => (
                      <Badge key={muscle} variant="secondary" className="text-[10px]">
                        {muscle}
                      </Badge>
                    ))}
                  </div>

                  {/* Sets/Reps or Duration */}
                  <p className="text-sm text-muted-foreground">
                    {exercise.sets && exercise.reps
                      ? `${exercise.sets} sets × ${exercise.reps} reps`
                      : exercise.duration
                        ? `${Math.round(exercise.duration / 60)} min`
                        : ""}
                    {" · "}Rest: {exercise.restTime}s
                  </p>

                  {/* Expandable instructions */}
                  <AnimatePresence>
                    {expandedExerciseId === exercise.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" as const }}
                        className="overflow-hidden"
                      >
                        <ol className="mt-3 space-y-1 list-decimal list-inside text-sm text-muted-foreground border-t border-border pt-3">
                          {exercise.instructions.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

// ─── View 2: Live Workout ─────────────────────────────────────────────────────

function LiveWorkoutView({
  workout: initialWorkout,
  onComplete,
}: {
  workout: WorkoutSession;
  onComplete: () => void;
}) {
  // Local state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [repsCompleted, setRepsCompleted] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restSecondsLeft, setRestSecondsLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [heartRate, setHeartRate] = useState(72);
  const [showSummary, setShowSummary] = useState(false);
  const [setsCompleted, setSetsCompleted] = useState<Record<number, number>>({});

  const exercises = initialWorkout.exercises;
  const currentExercise = exercises[currentExerciseIndex];
  const totalExercises = exercises.length;

  // ─── Timer effect ────────────────────────────────────────────────────────

  const elapsedRef = useRef(elapsedSeconds);
  elapsedRef.current = elapsedSeconds;

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused]);

  // ─── Rest timer effect ───────────────────────────────────────────────────

  const restRef = useRef(restSecondsLeft);
  restRef.current = restSecondsLeft;

  useEffect(() => {
    if (!isResting || restSecondsLeft <= 0 || isPaused) return;

    const interval = setInterval(() => {
      setRestSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsResting(false);
          setCurrentSet(1);
          setRepsCompleted(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isResting, restSecondsLeft, isPaused]);

  // ─── Heart rate simulation ───────────────────────────────────────────────

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setHeartRate(simulateHeartRate(initialWorkout.type, isResting, elapsedRef.current));
    }, 2000);
    return () => clearInterval(interval);
  }, [isPaused, isResting, initialWorkout.type]);

  // ─── Calories calculation ────────────────────────────────────────────────

  useEffect(() => {
    if (isPaused) return;
    const calPerSec = CALORIES_PER_MINUTE[initialWorkout.type] / 60;
    const interval = setInterval(() => {
      setCaloriesBurned((prev) => prev + calPerSec);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, initialWorkout.type]);

  // ─── Derived values ──────────────────────────────────────────────────────

  const totalSets = currentExercise.sets ?? 1;
  const targetReps = currentExercise.reps ?? 0;
  const hasReps = targetReps > 0;
  const hasDuration = (currentExercise.duration ?? 0) > 0;

  const hrZone = getHeartRateZone(heartRate);
  const isLastExercise = currentExerciseIndex >= totalExercises - 1;
  const allSetsDone = setsCompleted[currentExerciseIndex] >= totalSets;

  const exerciseProgressPct =
    totalExercises > 0
      ? Math.round((currentExerciseIndex / totalExercises) * 100)
      : 0;

  // ─── Handlers ────────────────────────────────────────────────────────────

  const togglePause = useCallback(() => {
    setIsPaused((p) => !p);
  }, []);

  const incrementReps = useCallback(() => {
    setRepsCompleted((prev) => Math.min(prev + 1, targetReps));
  }, [targetReps]);

  const decrementReps = useCallback(() => {
    setRepsCompleted((prev) => Math.max(prev - 1, 0));
  }, []);

  const completeSet = useCallback(() => {
    const newSetsCompleted = { ...setsCompleted };
    newSetsCompleted[currentExerciseIndex] =
      (newSetsCompleted[currentExerciseIndex] || 0) + 1;
    setSetsCompleted(newSetsCompleted);

    // Check if all sets for this exercise are done
    if (newSetsCompleted[currentExerciseIndex] >= totalSets) {
      // Move to next exercise or finish
      if (isLastExercise) {
        setShowSummary(true);
        setIsPaused(true);
      } else {
        // Start rest before next exercise
        const restTime = currentExercise.restTime || 60;
        setIsResting(true);
        setRestSecondsLeft(restTime);
        setCurrentExerciseIndex((prev) => prev + 1);
        setCurrentSet(1);
        setRepsCompleted(0);
      }
    } else {
      // Start rest between sets
      const restTime = currentExercise.restTime || 60;
      setIsResting(true);
      setRestSecondsLeft(restTime);
      setCurrentSet((prev) => prev + 1);
      setRepsCompleted(0);
    }
  }, [
    setsCompleted,
    currentExerciseIndex,
    totalSets,
    isLastExercise,
    currentExercise.restTime,
  ]);

  const finishWorkout = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const handleSummaryClose = useCallback(() => {
    setShowSummary(false);
    finishWorkout();
  }, [finishWorkout]);

  // ─── Intensity rating ────────────────────────────────────────────────────

  const intensityRating = useMemo(() => {
    const calPerMin = elapsedSeconds > 0 ? (caloriesBurned / elapsedSeconds) * 60 : 0;
    if (calPerMin > 12) return { label: "Intense!", stars: 5 };
    if (calPerMin > 9) return { label: "Great Work", stars: 4 };
    if (calPerMin > 6) return { label: "Solid", stars: 3 };
    if (calPerMin > 3) return { label: "Light", stars: 2 };
    return { label: "Easy", stars: 1 };
  }, [caloriesBurned, elapsedSeconds]);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5 pb-24">
          {/* Timer */}
          <motion.div
            className="text-center"
            animate={{ scale: isResting ? 1 : [1, 1.02, 1] }}
            transition={{
              repeat: isResting ? 0 : Infinity,
              duration: 2,
              ease: "easeOut" as const,
            }}
          >
            <motion.p
              className="text-6xl font-bold tabular-nums text-foreground tracking-tight"
              animate={
                isResting
                  ? { opacity: 0.7 }
                  : { opacity: [1, 0.9, 1] }
              }
              transition={{
                repeat: isResting ? 0 : Infinity,
                duration: 1.5,
                ease: "easeOut" as const,
              }}
            >
              {formatTime(elapsedSeconds)}
            </motion.p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <FontAwesomeIcon
                icon={faClock}
                className="text-muted-foreground text-sm"
              />
              <span className="text-muted-foreground text-sm">Elapsed</span>
              {isPaused && (
                <Badge variant="secondary" className="ml-1">
                  PAUSED
                </Badge>
              )}
            </div>
          </motion.div>

          {/* Rest Timer Overlay */}
          <AnimatePresence>
            {isResting && restSecondsLeft > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ ease: "easeOut" as const }}
                className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-center"
              >
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                  Rest Time
                </p>
                <p className="text-4xl font-bold tabular-nums text-amber-600 dark:text-amber-400 mt-1">
                  0:{restSecondsLeft.toString().padStart(2, "0")}
                </p>
                <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">
                  Get ready for{" "}
                  {currentExerciseIndex < totalExercises
                    ? exercises[currentExerciseIndex].name
                    : "next exercise"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Calories */}
            <Card size="sm">
              <CardContent className="py-3">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon
                    icon={faFire}
                    className="text-orange-500 text-lg"
                  />
                  <div>
                    <p className="text-xs text-muted-foreground">Calories</p>
                    <p className="text-xl font-bold tabular-nums text-foreground">
                      {Math.round(caloriesBurned)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Heart Rate */}
            <Card size="sm">
              <CardContent className="py-3">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon
                    icon={faHeart}
                    className="text-red-500 text-lg animate-pulse"
                  />
                  <div>
                    <p className="text-xs text-muted-foreground">Heart Rate</p>
                    <p className="text-xl font-bold tabular-nums text-foreground">
                      {heartRate}{" "}
                      <span className="text-sm font-normal">bpm</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Heart Rate Zone */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Zone</span>
              <span className={`text-sm font-semibold ${hrZone.textClass}`}>
                {hrZone.name}
              </span>
            </div>
            <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-muted">
              {heartRateZones.map((zone) => (
                <div
                  key={zone.name}
                  className={`flex-1 transition-all duration-300 ${
                    zone.name === hrZone.name
                      ? zone.bgClass + " scale-y-125"
                      : "opacity-30 " + zone.bgClass
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">
                Exercise {currentExerciseIndex + 1} of {totalExercises}
              </span>
              <span className="text-xs text-muted-foreground">
                {exerciseProgressPct}%
              </span>
            </div>
            <Progress value={exerciseProgressPct} />
          </div>

          {/* Current Exercise */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentExercise.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3, ease: "easeOut" as const }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{currentExercise.name}</CardTitle>
                    <Badge variant="secondary">
                      <FontAwesomeIcon icon={faDumbbell} className="mr-1 text-[10px]" />
                      {totalSets > 1
                        ? `Set ${currentSet}/${totalSets}`
                        : "Timed"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Target muscles */}
                  <div className="flex flex-wrap gap-1">
                    {currentExercise.targetMuscles.map((muscle) => (
                      <Badge key={muscle} variant="outline" className="text-[10px]">
                        {muscle}
                      </Badge>
                    ))}
                  </div>

                  {/* Instructions */}
                  <ol className="space-y-1 list-decimal list-inside text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                    {currentExercise.instructions.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>

                  {/* Sets/Reps Counter */}
                  {hasReps && (
                    <div className="bg-muted/30 rounded-xl p-4">
                      <p className="text-xs text-muted-foreground text-center mb-2">
                        Reps Completed
                      </p>
                      <div className="flex items-center justify-center gap-6">
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={decrementReps}
                          disabled={repsCompleted <= 0 || isResting}
                          aria-label="Decrease reps"
                        >
                          <FontAwesomeIcon icon={faMinus} className="text-lg" />
                        </Button>
                        <span className="text-4xl font-bold tabular-nums text-foreground min-w-[4rem] text-center">
                          {repsCompleted}
                        </span>
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={incrementReps}
                          disabled={repsCompleted >= targetReps || isResting}
                          aria-label="Increase reps"
                        >
                          <FontAwesomeIcon icon={faPlus} className="text-lg" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        Target: {targetReps} reps
                      </p>
                    </div>
                  )}

                  {/* Duration display for timed exercises */}
                  {hasDuration && !hasReps && (
                    <div className="bg-muted/30 rounded-xl p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">
                        Duration
                      </p>
                      <p className="text-3xl font-bold text-foreground">
                        {Math.round((currentExercise.duration ?? 0) / 60)} min
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Sets completed indicators */}
          {totalSets > 1 && (
            <div className="flex items-center justify-center gap-2">
              {Array.from({ length: totalSets }, (_, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    i < (setsCompleted[currentExerciseIndex] || 0)
                      ? "bg-primary text-primary-foreground"
                      : i === (setsCompleted[currentExerciseIndex] || 0) && !isResting
                        ? "bg-primary/30 text-primary border-2 border-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < (setsCompleted[currentExerciseIndex] || 0) ? (
                    <FontAwesomeIcon icon={faCheck} className="text-xs" />
                  ) : (
                    i + 1
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Bottom Action Bar */}
      <div className="border-t border-border bg-card p-4 space-y-2">
        <div className="flex gap-2">
          {/* Pause / Resume */}
          <Button
            variant="outline"
            size="lg"
            onClick={togglePause}
            className="flex-1 h-14 text-base"
          >
            <FontAwesomeIcon
              icon={isPaused ? faPlay : faPause}
              className="text-lg mr-2"
            />
            {isPaused ? "Resume" : "Pause"}
          </Button>

          {/* Complete Set / Finish */}
          {isResting ? (
            <Button
              size="lg"
              disabled
              className="flex-1 h-14 text-base opacity-60"
            >
              <FontAwesomeIcon icon={faClock} className="text-lg mr-2" />
              Resting...
            </Button>
          ) : isLastExercise && allSetsDone ? (
            <Button
              size="lg"
              onClick={() => {
                setShowSummary(true);
                setIsPaused(true);
              }}
              className="flex-1 h-14 text-base bg-green-600 hover:bg-green-700 text-white"
            >
              <FontAwesomeIcon icon={faTrophy} className="text-lg mr-2" />
              Finish Workout
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={completeSet}
              disabled={isPaused}
              className="flex-1 h-14 text-base"
            >
              <FontAwesomeIcon icon={faCheck} className="text-lg mr-2" />
              {totalSets > 1
                ? `Complete Set ${currentSet}`
                : "Complete Exercise"}
            </Button>
          )}
        </div>

        {/* Quick stop */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSummary(true)}
          className="w-full text-muted-foreground hover:text-destructive"
        >
          <FontAwesomeIcon icon={faStop} className="mr-2" />
          End Workout Early
        </Button>
      </div>

      {/* ─── Post-Workout Summary Dialog ─────────────────────────────────── */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              🎉 Workout Complete!
            </DialogTitle>
            <DialogDescription className="text-center">
              Great job! Here&apos;s how you did.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Duration */}
            <div className="flex items-center justify-between bg-muted/50 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon
                  icon={faClock}
                  className="text-blue-500 text-lg"
                />
                <span className="text-sm text-muted-foreground">Duration</span>
              </div>
              <span className="text-xl font-bold tabular-nums text-foreground">
                {formatTime(elapsedSeconds)}
              </span>
            </div>

            {/* Calories */}
            <div className="flex items-center justify-between bg-muted/50 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon
                  icon={faFire}
                  className="text-orange-500 text-lg"
                />
                <span className="text-sm text-muted-foreground">Calories</span>
              </div>
              <span className="text-xl font-bold tabular-nums text-foreground">
                {Math.round(caloriesBurned)} kcal
              </span>
            </div>

            {/* Exercises completed */}
            <div className="flex items-center justify-between bg-muted/50 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon
                  icon={faDumbbell}
                  className="text-purple-500 text-lg"
                />
                <span className="text-sm text-muted-foreground">Exercises</span>
              </div>
              <span className="text-xl font-bold tabular-nums text-foreground">
                {currentExerciseIndex + 1} / {totalExercises}
              </span>
            </div>

            {/* Intensity */}
            <div className="flex items-center justify-between bg-muted/50 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon
                  icon={faHeart}
                  className="text-red-500 text-lg"
                />
                <span className="text-sm text-muted-foreground">Intensity</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xl font-bold text-foreground">
                  {intensityRating.label}
                </span>
                <span className="text-lg">
                  {"⭐".repeat(intensityRating.stars)}
                </span>
              </div>
            </div>

            {/* Workout type badge */}
            <div className="text-center">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {categories.find((c) => c.type === initialWorkout.type)?.label ??
                  initialWorkout.type}
              </Badge>
            </div>
          </div>

          <DialogFooter>
            <DialogClose
              onClick={handleSummaryClose}
              render={
                <Button size="lg" className="w-full h-14 text-base">
                  <FontAwesomeIcon icon={faCheck} className="mr-2" />
                  Done
                </Button>
              }
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
