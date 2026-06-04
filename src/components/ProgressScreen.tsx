"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFire,
  faWeightScale,
  faShoePrints,
  faCalendarCheck,
} from "@fortawesome/free-solid-svg-icons";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useFitProStore } from "@/lib/store";
import Image from "next/image";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Custom Tooltip – senior-friendly large text
// ---------------------------------------------------------------------------

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-lg">
      <p className="text-sm font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-base font-bold" style={{ color: entry.color }}>
          {entry.name}: {entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Activity calendar heatmap generator
// ---------------------------------------------------------------------------

function generateActivityDays(
  weeklyProgress: Array<{ steps: number }>,
  todayStats: { steps: number },
): Array<{ day: number; level: number }> {
  const days: Array<{ day: number; level: number }> = [];
  // Use a seeded approach based on weekly data pattern + today
  const avgSteps = weeklyProgress.reduce((s, d) => s + d.steps, 0) / weeklyProgress.length;
  const maxSteps = 10000;

  for (let i = 27; i >= 0; i--) {
    // Deterministic variation based on day index
    const seed = ((i * 7 + 3) % 11) / 10; // 0-1 variation
    const base = i === 0 ? todayStats.steps : avgSteps * (0.5 + seed);
    const level = Math.min(4, Math.floor((base / maxSteps) * 5));
    days.push({ day: 28 - i, level });
  }
  return days;
}

// ---------------------------------------------------------------------------
// ProgressScreen
// ---------------------------------------------------------------------------

export function ProgressScreen() {
  const [range, setRange] = useState<"week" | "month">("week");

  const weeklyProgress = useFitProStore((s) => s.weeklyProgress);
  const weightEntries = useFitProStore((s) => s.weightEntries);
  const achievements = useFitProStore((s) => s.achievements);
  const todayStats = useFitProStore((s) => s.todayStats);
  const streak = useFitProStore((s) => s.streak);

  // ── Derived data ──────────────────────────────────────────────────────

  const weightLoss = useMemo(() => {
    if (weightEntries.length < 2) return "0.0";
    const loss = weightEntries[0].weight - weightEntries[weightEntries.length - 1].weight;
    return loss.toFixed(1);
  }, [weightEntries]);

  const activityDays = useMemo(
    () => generateActivityDays(weeklyProgress, todayStats),
    [weeklyProgress, todayStats],
  );

  const totalActiveDays = useMemo(() => {
    return weeklyProgress.filter((d) => d.activeMinutes >= 30).length + 18;
  }, [weeklyProgress]);

  const heatmapLevels = [
    "bg-muted/40",
    "bg-teal-200 dark:bg-teal-900/50",
    "bg-teal-300 dark:bg-teal-800/60",
    "bg-teal-400 dark:bg-teal-700/70",
    "bg-teal-500 dark:bg-teal-500/80",
  ];

  const achievementImage = (id: string) => {
    const map: Record<string, string> = {
      first_workout: "/images/achievements/first-workout.svg",
      streak_3: "/images/achievements/streak.svg",
      streak_7: "/images/achievements/streak.svg",
      steps_10k: "/images/achievements/steps.svg",
      calories_500: "/images/achievements/first-workout.svg",
      water_8: "/images/achievements/water.svg",
      workout_30min: "/images/achievements/first-workout.svg",
      streak_14: "/images/achievements/streak.svg",
    };
    return map[id] || "/images/achievements/first-workout.svg";
  };

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5 p-4 pb-24">
      {/* ================================================================= */}
      {/* 1. Header with date range selector                                 */}
      {/* ================================================================= */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Your Progress</h1>
          <p className="text-base text-muted-foreground">
            Track your fitness journey
          </p>
        </div>
        <div className="flex rounded-xl bg-muted p-1 gap-1">
          <button
            onClick={() => setRange("week")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              range === "week"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setRange("month")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              range === "month"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            This Month
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 2. Weekly Steps Chart — BarChart, coral                            */}
      {/* ================================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" as const }}
      >
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <FontAwesomeIcon
                icon={faShoePrints}
                className="text-xl text-chart-1"
              />
              <h2 className="text-lg font-semibold text-foreground">
                Daily Steps
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {range === "week" ? "This week's" : "This month's"} step count
            </p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={weeklyProgress}
                  margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 13, fontWeight: 500 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    width={45}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="steps"
                    name="Steps"
                    fill="var(--chart-1)"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ================================================================= */}
      {/* 3. Calories Burned — LineChart with gradient fill, teal             */}
      {/* ================================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" as const }}
      >
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <FontAwesomeIcon icon={faFire} className="text-xl text-chart-2" />
              <h2 className="text-lg font-semibold text-foreground">
                Calories Burned
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Daily calorie burn trend
            </p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={weeklyProgress}
                  margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="caloriesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--chart-2)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--chart-2)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 13, fontWeight: 500 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    width={45}
                    domain={[1400, 2600]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="calories"
                    fill="url(#caloriesGradient)"
                    stroke="none"
                  />
                  <Line
                    type="monotone"
                    dataKey="calories"
                    name="Calories"
                    stroke="var(--chart-2)"
                    strokeWidth={3}
                    dot={{ r: 5, fill: "var(--chart-2)", strokeWidth: 0 }}
                    activeDot={{ r: 7, fill: "var(--chart-2)", strokeWidth: 2, stroke: "var(--background)" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ================================================================= */}
      {/* 4. Weight Progress — LineChart, downward trend                     */}
      {/* ================================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" as const }}
      >
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon
                  icon={faWeightScale}
                  className="text-xl text-chart-3"
                />
                <h2 className="text-lg font-semibold text-foreground">
                  Weight Progress
                </h2>
              </div>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {Number(weightLoss) > 0 ? "-" : "+"}
                {weightLoss}kg total
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              8-week weight trend
            </p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={weightEntries}
                  margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12, fontWeight: 500 }}
                    interval={0}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    width={40}
                    domain={["dataMin - 0.5", "dataMax + 0.5"]}
                    tickFormatter={(v: number) => v.toFixed(1)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    name="Weight (kg)"
                    stroke="var(--chart-3)"
                    strokeWidth={3}
                    dot={{ r: 5, fill: "var(--chart-3)", strokeWidth: 0 }}
                    activeDot={{ r: 7, fill: "var(--chart-3)", strokeWidth: 2, stroke: "var(--background)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ================================================================= */}
      {/* 5. Active Minutes — BarChart                                        */}
      {/* ================================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" as const }}
      >
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <FontAwesomeIcon
                icon={faCalendarCheck}
                className="text-xl text-chart-4"
              />
              <h2 className="text-lg font-semibold text-foreground">
                Active Minutes
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Daily active time
            </p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={weeklyProgress}
                  margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 13, fontWeight: 500 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    width={40}
                    unit="m"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="activeMinutes"
                    name="Active Minutes"
                    fill="var(--chart-4)"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ================================================================= */}
      {/* 6. Achievements Grid — scrollable horizontal cards                  */}
      {/* ================================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25, ease: "easeOut" as const }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Image src="/images/achievements/first-workout.svg" width={28} height={28} alt="Achievements" className="text-xl text-chart-5" />
          <h2 className="text-lg font-semibold text-foreground">
            Achievements
          </h2>
          <Badge variant="secondary" className="ml-auto text-xs">
            {achievements.filter((a) => a.unlockedAt).length}/{achievements.length} unlocked
          </Badge>
        </div>

        <div className="overflow-x-auto -mx-4 px-4 pb-2 scrollbar-none">
          <div className="flex gap-3 min-w-max">
            {achievements.map((achievement) => {
              const unlocked = !!achievement.unlockedAt;
              return (
                <motion.div
                  key={achievement.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    className={`w-44 rounded-2xl shadow-sm transition-all duration-300 ${
                      unlocked
                        ? "bg-card ring-1 ring-chart-1/20"
                        : "bg-muted/40 opacity-60"
                    }`}
                  >
                    <CardContent className="p-4 flex flex-col items-center gap-3">
                      {/* Icon */}
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${
                          unlocked
                            ? "bg-chart-1/10"
                            : "bg-muted"
                        }`}
                      >
                        {unlocked ? (
                          <Image src={achievementImage(achievement.id)} width={48} height={48} alt={achievement.name} className="rounded-lg" />
                        ) : (
                          <Image src={achievementImage(achievement.id)} width={48} height={48} alt={achievement.name} className="rounded-lg opacity-40" />
                        )}
                      </div>

                      {/* Name & Description */}
                      <div className="text-center">
                        <p
                          className={`text-sm font-semibold ${
                            unlocked ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {achievement.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                          {achievement.description}
                        </p>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full">
                        <Progress
                          value={achievement.progress}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground mt-1 text-center tabular-nums">
                          {achievement.progress}%
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* ================================================================= */}
      {/* 7. Streak Stats Card                                                */}
      {/* ================================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" as const }}
      >
        <Card className="rounded-2xl shadow-sm bg-accent/30 border-accent/40">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faFire}
                  className="text-2xl text-amber-500"
                />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Activity Streaks
                </h2>
                <p className="text-sm text-muted-foreground">
                  Keep the momentum going!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Current streak */}
              <div className="flex flex-col items-center gap-1 bg-background/60 rounded-xl py-3 px-2">
                <span className="text-3xl font-bold text-chart-1 tabular-nums">
                  {streak.current}
                </span>
                <span className="text-xs text-muted-foreground text-center leading-tight">
                  Current Streak
                </span>
                <span className="text-xs text-foreground/70">days</span>
              </div>

              {/* Best streak */}
              <div className="flex flex-col items-center gap-1 bg-background/60 rounded-xl py-3 px-2">
                <span className="text-3xl font-bold text-chart-2 tabular-nums">
                  {streak.best}
                </span>
                <span className="text-xs text-muted-foreground text-center leading-tight">
                  Best Streak
                </span>
                <span className="text-xs text-foreground/70">days</span>
              </div>

              {/* Total active days */}
              <div className="flex flex-col items-center gap-1 bg-background/60 rounded-xl py-3 px-2">
                <span className="text-3xl font-bold text-chart-3 tabular-nums">
                  {totalActiveDays}
                </span>
                <span className="text-xs text-muted-foreground text-center leading-tight">
                  Total Active
                </span>
                <span className="text-xs text-foreground/70">days</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ================================================================= */}
      {/* 8. Activity Calendar Heatmap — 4×7 grid                             */}
      {/* ================================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35, ease: "easeOut" as const }}
      >
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <FontAwesomeIcon
                icon={faCalendarCheck}
                className="text-xl text-teal-500"
              />
              <h2 className="text-lg font-semibold text-foreground">
                Activity Calendar
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Last 28 days · darker = more active
            </p>

            {/* Day-of-week labels */}
            <div className="flex gap-1 mb-2">
              {["Mon", "", "Wed", "", "Fri", "", "Sun"].map((label, i) => (
                <div
                  key={i}
                  className="w-9 text-center text-xs text-muted-foreground"
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Heatmap grid — 4 rows × 7 cols */}
            <div className="flex flex-col gap-1">
              {[0, 1, 2, 3].map((row) => (
                <div key={row} className="flex gap-1">
                  {[0, 1, 2, 3, 4, 5, 6].map((col) => {
                    const idx = row * 7 + col;
                    const day = activityDays[idx];
                    const level = day?.level ?? 0;
                    return (
                      <div
                        key={col}
                        className={`w-9 h-9 rounded-lg ${heatmapLevels[level]} transition-colors duration-200 flex items-center justify-center`}
                        title={
                          day
                            ? `Day ${day.day}: Level ${level + 1}/5 activity`
                            : "No data"
                        }
                      >
                        <span
                          className={`text-xs font-medium ${
                            level >= 3
                              ? "text-white"
                              : level >= 1
                                ? "text-foreground/60"
                                : "text-muted-foreground/50"
                          }`}
                        >
                          {day?.day ?? ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 mt-4 justify-end">
              <span className="text-xs text-muted-foreground">Less</span>
              {heatmapLevels.map((cls, i) => (
                <div
                  key={i}
                  className={`w-5 h-5 rounded-md ${cls}`}
                />
              ))}
              <span className="text-xs text-muted-foreground">More</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
