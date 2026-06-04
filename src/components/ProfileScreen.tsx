"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useFitProStore } from "@/lib/store";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faGear,
  faBell,
  faWeightScale,
  faRuler,
  faBullseye,
  faTrophy,
  faChevronRight,
  faMoon,
  faSignOut,
  faRotate,
  faCalendarAlt,
  faFire,
  faDroplet,
  faBed,
} from "@fortawesome/free-solid-svg-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DailyTargets, FitnessGoal, Achievement } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function fitnessLevelLabel(level: string): string {
  const map: Record<string, string> = {
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
  };
  return map[level] ?? level;
}

function fitnessLevelColor(level: string): string {
  const map: Record<string, string> = {
    beginner: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    intermediate: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    advanced: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  };
  return map[level] ?? "bg-muted text-muted-foreground";
}

const GOAL_META: Record<FitnessGoal, { label: string; emoji: string; color: string }> = {
  lose_weight: {
    label: "Lose Weight",
    emoji: "🏋️",
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  },
  build_muscle: {
    label: "Build Muscle",
    emoji: "💪",
    color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  },
  improve_endurance: {
    label: "Endurance",
    emoji: "🏃",
    color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  },
  stay_active: {
    label: "Stay Active",
    emoji: "🚶",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  train_event: {
    label: "Train for Event",
    emoji: "🏆",
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  },
};

function formatMemberSince(): string {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
}

// ---------------------------------------------------------------------------
// Target Stepper
// ---------------------------------------------------------------------------

function TargetStepper({
  icon,
  label,
  value,
  unit,
  stepSize,
  onMinus,
  onPlus,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
  stepSize: number;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 min-h-[56px]">
      <div className="flex items-center gap-3">
        <span className="text-xl text-muted-foreground">{icon}</span>
        <span className="text-base font-medium text-foreground">{label}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onMinus}
          disabled={value <= 0}
          className="w-10 h-10 rounded-full bg-muted hover:bg-muted-foreground/20 disabled:opacity-30 flex items-center justify-center text-xl font-bold text-foreground transition-colors active:scale-90"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>

        <div className="min-w-[80px] text-center tabular-nums">
          <span className="text-lg font-bold text-foreground">
            {value.toLocaleString()}
          </span>
          <span className="text-sm text-muted-foreground ml-1">{unit}</span>
        </div>

        <button
          type="button"
          onClick={onPlus}
          className="w-10 h-10 rounded-full bg-muted hover:bg-muted-foreground/20 flex items-center justify-center text-xl font-bold text-foreground transition-colors active:scale-90"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Achievement Badge
// ---------------------------------------------------------------------------

function AchievementBadge({ a }: { a: Achievement }) {
  const unlocked = a.unlockedAt != null;

  const achievementImgMap: Record<string, string> = {
    first_workout: "/images/achievements/first-workout.svg",
    streak_3: "/images/achievements/streak.svg",
    streak_7: "/images/achievements/streak.svg",
    steps_10k: "/images/achievements/steps.svg",
    calories_500: "/images/achievements/first-workout.svg",
    water_8: "/images/achievements/water.svg",
    workout_30min: "/images/achievements/first-workout.svg",
    streak_14: "/images/achievements/streak.svg",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`flex-shrink-0 w-[100px] flex flex-col items-center gap-2 p-3 rounded-2xl transition-opacity ${
        unlocked
          ? "bg-card border border-border shadow-sm"
          : "bg-muted/50 border border-muted-foreground/15 opacity-50"
      }`}
    >
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-2xl overflow-hidden">
        <Image
          src={achievementImgMap[a.id] || "/images/achievements/first-workout.svg"}
          width={40}
          height={40}
          alt={a.name}
          className="rounded-lg"
        />
      </div>
      <span className="text-xs font-semibold text-foreground text-center leading-tight">
        {a.name}
      </span>
      {!unlocked && a.progress < 100 && (
        <div className="w-full">
          <Progress value={a.progress} className="h-1" />
        </div>
      )}
      {unlocked && (
        <span className="text-[10px] text-muted-foreground">Unlocked</span>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Settings Row
// ---------------------------------------------------------------------------

function SettingsRow({
  icon,
  label,
  right,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  right?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 py-4 px-1 min-h-[56px] text-left hover:bg-muted/50 rounded-xl transition-colors duration-150"
    >
      <span className="text-lg text-muted-foreground w-7 flex justify-center">
        {icon}
      </span>
      <span className="flex-1 text-base font-medium text-foreground">
        {label}
      </span>
      {right}
      <FontAwesomeIcon
        icon={faChevronRight}
        className="text-sm text-muted-foreground ml-1"
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// ProfileScreen
// ---------------------------------------------------------------------------

export function ProfileScreen() {
  // ---- Store ----
  const profile = useFitProStore((s) => s.profile);
  const dailyTargets = useFitProStore((s) => s.dailyTargets);
  const updateDailyTargets = useFitProStore((s) => s.updateDailyTargets);
  const achievements = useFitProStore((s) => s.achievements);
  const streak = useFitProStore((s) => s.streak);
  const setOnboardingComplete = useFitProStore((s) => s.setOnboardingComplete);

  // ---- Local UI state ----
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [units, setUnits] = useState<"metric" | "imperial">("metric");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // ---- Target adjustment ----
  const adjustTarget = useCallback(
    (key: keyof DailyTargets, delta: number) => {
      const stepSize =
        key === "calories"
          ? 50
          : key === "steps"
            ? 500
            : key === "activeMinutes"
              ? 5
              : 1;
      const current = dailyTargets[key];
      const next = Math.max(0, current + delta * stepSize);
      updateDailyTargets({ [key]: next });
    },
    [dailyTargets, updateDailyTargets],
  );

  const handleResetOnboarding = useCallback(() => {
    setOnboardingComplete(false);
    setShowResetConfirm(false);
  }, [setOnboardingComplete]);

  // ---- Derived ----
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
        <FontAwesomeIcon
          icon={faUser}
          className="text-5xl text-muted-foreground"
        />
        <p className="text-base text-muted-foreground text-center">
          Complete onboarding to set up your profile.
        </p>
      </div>
    );
  }

  const initials = getInitials(profile.name);
  const memberSince = formatMemberSince();
  const unlockedCount = achievements.filter((a) => a.unlockedAt != null).length;

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-5 p-4 pb-24">
        {/* ================================================================ */}
        {/* 1. Profile Header                                                */}
        {/* ================================================================ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" as const }}
          className="flex flex-col items-center gap-3 pt-4"
        >
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-primary/15 flex items-center justify-center text-3xl font-bold text-primary shadow-lg ring-4 ring-primary/20">
            {initials}
          </div>

          {/* Name & badge */}
          <div className="flex flex-col items-center gap-1.5">
            <h1 className="text-2xl font-bold text-foreground">
              {profile.name}
            </h1>
            <Badge
              className={`text-xs font-medium px-3 py-0.5 rounded-full ${fitnessLevelColor(profile.fitnessLevel)}`}
            >
              {fitnessLevelLabel(profile.fitnessLevel)}
            </Badge>
          </div>

          {/* Member since + streak */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Member since {memberSince}</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
            <span className="flex items-center gap-1">
              <FontAwesomeIcon icon={faFire} className="text-amber-500" />
              {streak.current} day streak
            </span>
          </div>
        </motion.div>

        <Separator />

        {/* ================================================================ */}
        {/* 2. Stats Row                                                     */}
        {/* ================================================================ */}
        <div className="grid grid-cols-3 gap-3">
          {/* Height */}
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-4 flex flex-col items-center gap-1.5">
              <FontAwesomeIcon
                icon={faRuler}
                className="text-xl text-blue-500"
              />
              <span className="text-2xl font-bold text-foreground tabular-nums">
                {profile.height}
              </span>
              <span className="text-xs text-muted-foreground">cm</span>
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
                Height
              </span>
            </CardContent>
          </Card>

          {/* Weight */}
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-4 flex flex-col items-center gap-1.5">
              <FontAwesomeIcon
                icon={faWeightScale}
                className="text-xl text-purple-500"
              />
              <span className="text-2xl font-bold text-foreground tabular-nums">
                {profile.weight}
              </span>
              <span className="text-xs text-muted-foreground">kg</span>
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
                Weight
              </span>
            </CardContent>
          </Card>

          {/* Age */}
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-4 flex flex-col items-center gap-1.5">
              <FontAwesomeIcon
                icon={faCalendarAlt}
                className="text-xl text-emerald-500"
              />
              <span className="text-2xl font-bold text-foreground tabular-nums">
                {profile.age}
              </span>
              <span className="text-xs text-muted-foreground">years</span>
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
                Age
              </span>
            </CardContent>
          </Card>
        </div>

        {/* ================================================================ */}
        {/* 3. Goals Section                                                 */}
        {/* ================================================================ */}
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon
                icon={faBullseye}
                className="text-lg text-primary"
              />
              <h2 className="text-base font-semibold text-foreground">
                Fitness Goals
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.goals.map((goal) => {
                const meta = GOAL_META[goal];
                return (
                  <Badge
                    key={goal}
                    className={`text-sm font-medium px-3 py-1 rounded-full ${meta.color}`}
                  >
                    {meta.emoji} {meta.label}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ================================================================ */}
        {/* 4. Daily Targets                                                 */}
        {/* ================================================================ */}
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-1">
              <FontAwesomeIcon
                icon={faBullseye}
                className="text-lg text-primary"
              />
              <h2 className="text-base font-semibold text-foreground">
                Daily Targets
              </h2>
            </div>

            <TargetStepper
              icon={<FontAwesomeIcon icon={faFire} className="text-orange-500" />}
              label="Calories"
              value={dailyTargets.calories}
              unit="cal"
              stepSize={50}
              onMinus={() => adjustTarget("calories", -1)}
              onPlus={() => adjustTarget("calories", 1)}
            />
            <Separator />

            <TargetStepper
              icon={<FontAwesomeIcon icon={faBullseye} className="text-blue-500" />}
              label="Steps"
              value={dailyTargets.steps}
              unit="steps"
              stepSize={500}
              onMinus={() => adjustTarget("steps", -1)}
              onPlus={() => adjustTarget("steps", 1)}
            />
            <Separator />

            <TargetStepper
              icon={<FontAwesomeIcon icon={faBullseye} className="text-green-500" />}
              label="Active Minutes"
              value={dailyTargets.activeMinutes}
              unit="min"
              stepSize={5}
              onMinus={() => adjustTarget("activeMinutes", -1)}
              onPlus={() => adjustTarget("activeMinutes", 1)}
            />
            <Separator />

            <TargetStepper
              icon={<FontAwesomeIcon icon={faDroplet} className="text-cyan-500" />}
              label="Water"
              value={dailyTargets.water}
              unit="glasses"
              stepSize={1}
              onMinus={() => adjustTarget("water", -1)}
              onPlus={() => adjustTarget("water", 1)}
            />
            <Separator />

            <TargetStepper
              icon={<FontAwesomeIcon icon={faBed} className="text-indigo-500" />}
              label="Sleep"
              value={dailyTargets.sleep}
              unit="hours"
              stepSize={1}
              onMinus={() => adjustTarget("sleep", -1)}
              onPlus={() => adjustTarget("sleep", 1)}
            />
          </CardContent>
        </Card>

        {/* ================================================================ */}
        {/* 5. Achievements Showcase                                         */}
        {/* ================================================================ */}
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon
                  icon={faTrophy}
                  className="text-lg text-amber-500"
                />
                <h2 className="text-base font-semibold text-foreground">
                  Achievements
                </h2>
              </div>
              <span className="text-sm text-muted-foreground tabular-nums">
                {unlockedCount}/{achievements.length}
              </span>
            </div>

            <div className="overflow-x-auto -mx-1 px-1 pb-2">
              <div className="flex gap-3">
                {achievements.map((a) => (
                  <AchievementBadge key={a.id} a={a} />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ================================================================ */}
        {/* 6. Settings List                                                 */}
        {/* ================================================================ */}
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-1">
              <FontAwesomeIcon
                icon={faGear}
                className="text-lg text-muted-foreground"
              />
              <h2 className="text-base font-semibold text-foreground">
                Settings
              </h2>
            </div>

            {/* Units toggle */}
            <SettingsRow
              icon={<FontAwesomeIcon icon={faRuler} />}
              label="Units"
              right={
                <div className="flex items-center gap-2 mr-1">
                  <span className="text-sm text-muted-foreground">
                    {units === "metric" ? "Metric" : "Imperial"}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setUnits((u) => (u === "metric" ? "imperial" : "metric"));
                    }}
                    className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
                      units === "imperial"
                        ? "bg-primary"
                        : "bg-muted-foreground/30"
                    }`}
                    aria-label={`Switch to ${units === "metric" ? "imperial" : "metric"} units`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${
                        units === "imperial" ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              }
            />

            {/* Dark Mode toggle */}
            <SettingsRow
              icon={<FontAwesomeIcon icon={faMoon} />}
              label="Dark Mode"
              right={
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDarkMode((d) => !d);
                  }}
                  className={`relative w-12 h-7 rounded-full transition-colors duration-200 mr-1 ${
                    darkMode ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                  aria-label={`Toggle dark mode ${darkMode ? "off" : "on"}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${
                      darkMode ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              }
            />

            {/* Notifications toggle */}
            <SettingsRow
              icon={<FontAwesomeIcon icon={faBell} />}
              label="Notifications"
              right={
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setNotifications((n) => !n);
                  }}
                  className={`relative w-12 h-7 rounded-full transition-colors duration-200 mr-1 ${
                    notifications ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                  aria-label={`Toggle notifications ${notifications ? "off" : "on"}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${
                      notifications ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              }
            />

            {/* Connected Devices (placeholder) */}
            <SettingsRow
              icon={<FontAwesomeIcon icon={faRotate} />}
              label="Connected Devices"
              right={
                <span className="text-sm text-muted-foreground mr-1">
                  None
                </span>
              }
            />

            {/* Privacy (placeholder) */}
            <SettingsRow
              icon={<FontAwesomeIcon icon={faUser} />}
              label="Privacy"
            />
          </CardContent>
        </Card>

        {/* ================================================================ */}
        {/* 7. Danger Zone                                                   */}
        {/* ================================================================ */}
        <Card className="rounded-2xl shadow-sm border-destructive/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <FontAwesomeIcon
                icon={faSignOut}
                className="text-lg text-destructive"
              />
              <h2 className="text-base font-semibold text-destructive">
                Danger Zone
              </h2>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Reset your onboarding to start fresh. This will not delete your
              data, but you&apos;ll need to go through setup again.
            </p>

            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-destructive/10 text-destructive font-semibold text-base border border-destructive/30 hover:bg-destructive/20 active:scale-[0.98] transition-all duration-200 min-h-[56px]"
            >
              <FontAwesomeIcon icon={faRotate} className="text-sm" />
              Reset Onboarding
            </button>
          </CardContent>
        </Card>

        {/* ================================================================ */}
        {/* Reset Confirmation Dialog                                        */}
        {/* ================================================================ */}
        <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
          <DialogContent className="rounded-2xl max-w-[90vw]">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                Reset Onboarding?
              </DialogTitle>
              <DialogDescription className="text-base text-muted-foreground">
                This will take you back to the welcome screens. Your profile
                data will be preserved in the form fields, but you&apos;ll need
                to step through onboarding again.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="py-3 px-5 rounded-xl border border-border text-foreground font-medium text-base hover:bg-muted transition-colors min-h-[48px]"
              >
                Cancel
              </button>
              <button
                onClick={handleResetOnboarding}
                className="py-3 px-5 rounded-xl bg-destructive text-destructive-foreground font-semibold text-base hover:bg-destructive/90 active:scale-[0.98] transition-all min-h-[48px]"
              >
                Yes, Reset
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ScrollArea>
  );
}
