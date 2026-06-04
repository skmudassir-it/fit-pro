"use client";

import { useMemo } from "react";
import { useFitProStore } from "@/lib/store";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPersonWalking,
  faRoad,
  faFire,
  faClock,
  faHeart,
  faDroplet,
  faMoon,
  faDumbbell,
  faArrowRight,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { WorkoutSummary } from "@/lib/types";
import Image from "next/image";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function clampPct(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(100, Math.round((value / max) * 100));
}

function formatLastWorkout(w: WorkoutSummary | null): string {
  if (!w) return "No workout yet";
  const typeLabel: Record<string, string> = {
    strength: "Strength",
    cardio: "Cardio",
    running: "Running",
    cycling: "Cycling",
    yoga: "Yoga",
    hiit: "HIIT",
    custom: "Custom",
  };
  const label = typeLabel[w.type] ?? w.type;
  return `${label} · ${w.duration} min`;
}

// ---------------------------------------------------------------------------
// Ring Circle – reusable SVG activity ring
// ---------------------------------------------------------------------------

function RingCircle({
  size,
  strokeWidth,
  fillFraction,
  color,
  children,
}: {
  size: number;
  strokeWidth: number;
  fillFraction: number; // 0–1
  color: string;
  children: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(1, Math.max(0, fillFraction)));

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        {/* Animated foreground */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="ring-animate"
          style={
            {
              "--ring-circumference": circumference,
              "--ring-offset": offset,
            } as React.CSSProperties
          }
        />
      </svg>
      {/* Centre content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card for the 2×2 grid
// ---------------------------------------------------------------------------

function StatCard({
  icon,
  label,
  value,
  unit,
  target,
  colorClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  target: number;
  colorClass: string;
}) {
  const pct = clampPct(parseFloat(value.replace(",", "")), target);

  return (
    <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className={`text-xl ${colorClass}`}>{icon}</span>
          <span className="text-sm text-muted-foreground font-medium">
            {label}
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-foreground count-up">
            {value}
          </span>
          <span className="text-sm text-muted-foreground">{unit}</span>
        </div>
        <Progress value={pct} className="w-full" />
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">
            {pct}% of target
          </span>
          <span className="text-muted-foreground">
            {target.toLocaleString()} {unit}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// HomeScreen
// ---------------------------------------------------------------------------

export function HomeScreen() {
  const profile = useFitProStore((s) => s.profile);
  const todayStats = useFitProStore((s) => s.todayStats);
  const dailyTargets = useFitProStore((s) => s.dailyTargets);
  const dailyQuote = useFitProStore((s) => s.dailyQuote);
  const streak = useFitProStore((s) => s.streak);
  const addWater = useFitProStore((s) => s.addWater);
  const setActiveTab = useFitProStore((s) => s.setActiveTab);

  // Derived values
  const name = profile?.name ?? "there";
  const greeting = getGreeting();

  const movePct = useMemo(
    () => clampPct(todayStats.caloriesBurned, dailyTargets.calories),
    [todayStats.caloriesBurned, dailyTargets.calories],
  );
  const exercisePct = useMemo(
    () => clampPct(todayStats.activeMinutes, dailyTargets.activeMinutes),
    [todayStats.activeMinutes, dailyTargets.activeMinutes],
  );
  const stepsPct = useMemo(
    () => clampPct(todayStats.steps, dailyTargets.steps),
    [todayStats.steps, dailyTargets.steps],
  );

  const waterPct = useMemo(
    () => clampPct(todayStats.water, dailyTargets.water),
    [todayStats.water, dailyTargets.water],
  );

  const sleepPct = useMemo(
    () => clampPct(todayStats.sleep, dailyTargets.sleep),
    [todayStats.sleep, dailyTargets.sleep],
  );

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-5 p-4 pb-24">
      {/* ================================================================= */}
      {/* 1. Greeting                                                       */}
      {/* ================================================================= */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">
          {greeting}, {name} <span role="img" aria-label="wave">👋</span>
        </h1>
        <p className="text-base text-muted-foreground">{formatDate()}</p>
      </div>

      {/* Activity rings illustration */}
      <div className="flex justify-center -mb-2">
        <Image src="/images/icons/activity-rings.svg" width={200} height={100} alt="" priority />
      </div>

      {/* ================================================================= */}
      {/* 2. Activity Rings                                                 */}
      {/* ================================================================= */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-5">
          <h2 className="text-base font-semibold text-foreground mb-4">
            Today&apos;s Activity
          </h2>

          <div className="flex items-center justify-around">
            {/* Move ring – Calories */}
            <RingCircle
              size={110}
              strokeWidth={10}
              fillFraction={movePct / 100}
              color="var(--ring-move)"
            >
              <span className="text-lg font-bold text-foreground count-up">
                {movePct}%
              </span>
              <span className="text-xs text-muted-foreground">Move</span>
            </RingCircle>

            {/* Exercise ring – Active Minutes */}
            <RingCircle
              size={110}
              strokeWidth={10}
              fillFraction={exercisePct / 100}
              color="var(--ring-exercise)"
            >
              <span className="text-lg font-bold text-foreground count-up">
                {exercisePct}%
              </span>
              <span className="text-xs text-muted-foreground">Exercise</span>
            </RingCircle>

            {/* Steps ring */}
            <RingCircle
              size={110}
              strokeWidth={10}
              fillFraction={stepsPct / 100}
              color="var(--ring-steps)"
            >
              <span className="text-lg font-bold text-foreground count-up">
                {stepsPct}%
              </span>
              <span className="text-xs text-muted-foreground">Steps</span>
            </RingCircle>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================= */}
      {/* 3. 2×2 Snapshot cards                                             */}
      {/* ================================================================= */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<FontAwesomeIcon icon={faPersonWalking} />}
          label="Steps"
          value={todayStats.steps.toLocaleString()}
          unit="steps"
          target={dailyTargets.steps}
          colorClass="text-chart-3"
        />
        <StatCard
          icon={<FontAwesomeIcon icon={faRoad} />}
          label="Distance"
          value={todayStats.distance.toFixed(1)}
          unit="km"
          target={10}
          colorClass="text-chart-4"
        />
        <StatCard
          icon={<FontAwesomeIcon icon={faFire} />}
          label="Calories"
          value={todayStats.caloriesBurned.toLocaleString()}
          unit="cal"
          target={dailyTargets.calories}
          colorClass="text-chart-1"
        />
        <StatCard
          icon={<FontAwesomeIcon icon={faClock} />}
          label="Active"
          value={todayStats.activeMinutes.toString()}
          unit="min"
          target={dailyTargets.activeMinutes}
          colorClass="text-chart-2"
        />
      </div>

      {/* ================================================================= */}
      {/* 4. Heart Rate card                                                */}
      {/* ================================================================= */}
      <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <FontAwesomeIcon
              icon={faHeart}
              className="text-2xl text-red-500"
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm text-muted-foreground font-medium">
              Resting Heart Rate
            </span>
            <Image src="/images/icons/heart-rate.svg" width={60} height={60} alt="" className="mx-auto" />
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-foreground count-up">
                {todayStats.heartRate}
              </span>
              <span className="text-base text-muted-foreground">bpm</span>
            </div>
          </div>
          <Badge variant="secondary" className="ml-auto text-xs">
            Normal
          </Badge>
        </CardContent>
      </Card>

      {/* ================================================================= */}
      {/* 5. Start a Workout button                                         */}
      {/* ================================================================= */}
      <button
        onClick={() => setActiveTab("workouts")}
        className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-primary text-primary-foreground text-lg font-semibold shadow-md hover:bg-primary/90 active:scale-[0.98] transition-all duration-200 min-h-[56px]"
      >
        <FontAwesomeIcon icon={faDumbbell} className="text-xl" />
        Start a Workout
        <FontAwesomeIcon icon={faArrowRight} className="text-lg" />
      </button>

      {/* ================================================================= */}
      {/* 6. Streak counter                                                 */}
      {/* ================================================================= */}
      <Card className="rounded-2xl shadow-sm bg-accent/30 border-accent/40">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-2xl">
            🔥
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground">
              {streak.current} day streak
            </span>
            <span className="text-sm text-muted-foreground">
              Best streak: {streak.best} days
            </span>
          </div>
          <Badge variant="secondary" className="ml-auto text-xs">
            Keep it up!
          </Badge>
        </CardContent>
      </Card>

      {/* ================================================================= */}
      {/* 7. Motivational quote                                             */}
      {/* ================================================================= */}
      <Card className="rounded-2xl shadow-sm bg-accent/20 border-accent/30">
        <CardContent className="p-5">
          <p className="text-base italic text-accent-foreground leading-relaxed">
            &ldquo;{dailyQuote}&rdquo;
          </p>
        </CardContent>
      </Card>

      {/* ================================================================= */}
      {/* 8. Quick stats row: Water, Sleep, Last Workout                    */}
      {/* ================================================================= */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-4 flex flex-col gap-4">
          <h3 className="text-base font-semibold text-foreground">
            Quick Stats
          </h3>

          {/* Water – tappable */}
          <button
            onClick={addWater}
            className="flex items-center gap-3 w-full text-left hover:bg-muted/50 rounded-xl p-2 -m-2 transition-colors duration-150 min-h-[44px]"
            aria-label={`Add water. ${todayStats.water} of ${dailyTargets.water} glasses`}
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <FontAwesomeIcon
                icon={faDroplet}
                className="text-lg text-blue-500"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  Water
                </span>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {todayStats.water}/{dailyTargets.water} glasses
                </span>
              </div>
              <Progress value={waterPct} className="mt-1.5 w-full" />
            </div>
            <FontAwesomeIcon
              icon={faPlus}
              className="text-sm text-primary ml-1"
            />
          </button>

          {/* Sleep */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <FontAwesomeIcon
                icon={faMoon}
                className="text-lg text-indigo-500"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  Sleep
                </span>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {todayStats.sleep}h / {dailyTargets.sleep}h
                </span>
              </div>
              <Progress value={sleepPct} className="mt-1.5 w-full" />
            </div>
          </div>

          {/* Last Workout */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <FontAwesomeIcon
                icon={faDumbbell}
                className="text-lg text-green-600"
              />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-foreground">
                Last Workout
              </span>
              <p className="text-sm text-muted-foreground">
                {formatLastWorkout(todayStats.lastWorkout)}
              </p>
            </div>
            {todayStats.lastWorkout && (
              <Badge variant="outline" className="text-xs">
                {todayStats.lastWorkout.calories} cal
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
