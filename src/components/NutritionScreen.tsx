"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFitProStore } from "@/lib/store";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUtensils,
  faPlus,
  faTrash,
  faSearch,
  faFire,
  faDrumstickBite,
  faWheatAwn,
  faCheese,
  faSun,
  faCloudSun,
  faMoon,
  faCookieBite,
} from "@fortawesome/free-solid-svg-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import type { Meal } from "@/lib/types";
import Image from "next/image";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Typical macro targets derived from a 2,200-calorie active-senior diet */
const MACRO_TARGETS = {
  protein: 140,
  carbs: 200,
  fat: 65,
} as const;

const MEAL_TYPES = [
  { value: "breakfast" as const, label: "Breakfast", icon: faSun },
  { value: "lunch" as const, label: "Lunch", icon: faCloudSun },
  { value: "dinner" as const, label: "Dinner", icon: faMoon },
  { value: "snack" as const, label: "Snack", icon: faCookieBite },
] as const;

const MEAL_SECTION_ORDER: Meal["type"][] = ["breakfast", "lunch", "dinner", "snack"];

const SECTION_ICONS: Record<Meal["type"], typeof faSun> = {
  breakfast: faSun,
  lunch: faCloudSun,
  dinner: faMoon,
  snack: faCookieBite,
};

const SECTION_LABELS: Record<Meal["type"], string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks",
};

const MACRO_COLORS: Record<string, { bar: string; bg: string; text: string }> = {
  protein: {
    bar: "bg-coral-500 dark:bg-coral-400 bg-[#FF6B6B] dark:bg-[#FF8E8E]",
    bg: "bg-coral-100 dark:bg-coral-900/20 bg-[#FFE8E8] dark:bg-[#FF6B6B]/20",
    text: "text-[#FF6B6B] dark:text-[#FF8E8E]",
  },
  carbs: {
    bar: "bg-teal-500 dark:bg-teal-400 bg-[#4ECDC4] dark:bg-[#6EE7DE]",
    bg: "bg-teal-100 dark:bg-teal-900/20 bg-[#E0F7F5] dark:bg-[#4ECDC4]/20",
    text: "text-[#4ECDC4] dark:text-[#6EE7DE]",
  },
  fat: {
    bar: "bg-amber-500 dark:bg-amber-400 bg-[#FFD166] dark:bg-[#FFE099]",
    bg: "bg-amber-100 dark:bg-amber-900/20 bg-[#FFF8E1] dark:bg-[#FFD166]/20",
    text: "text-[#D4A017] dark:text-[#FFD166]",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NEW_ID = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

function pct(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(100, Math.round((value / max) * 100));
}

// ---------------------------------------------------------------------------
// Calorie Ring
// ---------------------------------------------------------------------------

function CalorieRing({
  consumed,
  budget,
}: {
  consumed: number;
  budget: number;
}) {
  const size = 180;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = Math.min(1, Math.max(0, consumed / budget));
  const percentage = Math.round(fraction * 100);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative inline-flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90 drop-shadow-sm"
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/20"
          />
          {/* Animated fill */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#FF6B6B"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{
              strokeDashoffset: circumference * (1 - fraction),
            }}
            transition={{ duration: 1.2, ease: "easeOut" as const }}
          />
        </svg>
        {/* Centre text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-4xl font-bold text-foreground tabular-nums"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" as const, delay: 0.3 }}
          >
            {consumed.toLocaleString()}
          </motion.span>
          <span className="text-sm text-muted-foreground">
            of {budget.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground mt-0.5">calories</span>
        </div>
      </div>
      {/* Percentage badge */}
      <Badge
        variant={percentage >= 100 ? "destructive" : "secondary"}
        className="text-sm px-3 py-1 mt-1"
      >
        {percentage}%
      </Badge>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Macro Progress Bar
// ---------------------------------------------------------------------------

function MacroBar({
  icon,
  label,
  value,
  target,
  unit,
  macType,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  target: number;
  unit: string;
  macType: "protein" | "carbs" | "fat";
}) {
  const colors = MACRO_COLORS[macType];
  const percent = pct(value, target);
  const remaining = Math.max(0, target - value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" as const }}
      className={`flex flex-col gap-2 p-4 rounded-2xl ${colors.bg}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-xl ${colors.text}`}>{icon}</span>
          <span className="text-base font-semibold text-foreground">
            {label}
          </span>
        </div>
        <span className="text-base font-bold text-foreground tabular-nums">
          {value}
          <span className="text-sm font-normal text-muted-foreground">
            {" "}
            / {target}
            {unit}
          </span>
        </span>
      </div>

      {/* Custom progress bar with color */}
      <div className="relative w-full h-4 rounded-full bg-white/60 dark:bg-black/20 overflow-hidden">
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full ${colors.bar}`}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: "easeOut" as const, delay: 0.2 }}
        />
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{percent}% of target</span>
        {remaining > 0 && (
          <span className="text-muted-foreground">
            {remaining}
            {unit} remaining
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" as const }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      {/* Empty meals illustration */}
      <Image
        src="/images/icons/empty-meals.png"
        width={200}
        height={140}
        alt="No meals yet"
        className="mx-auto mb-6"
      />
      <h2 className="text-xl font-bold text-foreground mb-2">
        No meals logged today
      </h2>
      <p className="text-base text-muted-foreground max-w-xs leading-relaxed">
        Start tracking your meals to see your daily nutrition at a glance.
        Tap the{" "}
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#FF6B6B] text-white text-sm align-middle">
          <FontAwesomeIcon icon={faPlus} />
        </span>{" "}
        button below to add your first meal.
      </p>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Add Meal Dialog
// ---------------------------------------------------------------------------

function AddMealDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (meal: Meal) => void;
}) {
  const [mealType, setMealType] = useState<string>("breakfast");
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const resetForm = useCallback(() => {
    setMealType("breakfast");
    setName("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
  }, []);

  const handleSave = useCallback(() => {
    const cal = parseInt(calories) || 0;
    const pro = parseInt(protein) || 0;
    const car = parseInt(carbs) || 0;
    const fa = parseInt(fat) || 0;
    const trimmedName = name.trim();

    if (!trimmedName || cal <= 0) return;

    const now = new Date();
    const time = now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    onAdd({
      id: NEW_ID(),
      type: mealType as Meal["type"],
      name: trimmedName,
      calories: cal,
      protein: pro,
      carbs: car,
      fat: fa,
      time,
    });

    resetForm();
    onOpenChange(false);
  }, [mealType, name, calories, protein, carbs, fat, onAdd, onOpenChange, resetForm]);

  const isValid = name.trim().length > 0 && (parseInt(calories) || 0) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Add a Meal</DialogTitle>
          <DialogDescription>
            Log what you ate to track your daily nutrition.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Meal Type */}
          <div className="flex flex-col gap-2">
            <Label className="text-base font-medium">Meal Type</Label>
            <Select value={mealType} onValueChange={(v) => setMealType(v ?? "breakfast")}>
              <SelectTrigger className="h-12 text-base rounded-xl w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEAL_TYPES.map((mt) => (
                  <SelectItem key={mt.value} value={mt.value}>
                    <span className="flex items-center gap-2">
                      <FontAwesomeIcon icon={mt.icon} className="text-sm text-muted-foreground" />
                      {mt.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Meal Name */}
          <div className="flex flex-col gap-2">
            <Label className="text-base font-medium">Meal Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Oatmeal with berries"
              className="h-12 text-base rounded-xl"
            />
          </div>

          {/* Calories */}
          <div className="flex flex-col gap-2">
            <Label className="text-base font-medium">
              Calories{" "}
              <span className="text-muted-foreground font-normal">(kcal)</span>
            </Label>
            <Input
              type="number"
              inputMode="numeric"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="e.g., 320"
              className="h-12 text-base rounded-xl"
            />
          </div>

          {/* Macros row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                <FontAwesomeIcon
                  icon={faDrumstickBite}
                  className="text-xs text-[#FF6B6B]"
                />
                Protein
              </Label>
              <Input
                type="number"
                inputMode="numeric"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="g"
                className="h-12 text-base rounded-xl"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                <FontAwesomeIcon
                  icon={faWheatAwn}
                  className="text-xs text-[#4ECDC4]"
                />
                Carbs
              </Label>
              <Input
                type="number"
                inputMode="numeric"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                placeholder="g"
                className="h-12 text-base rounded-xl"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                <FontAwesomeIcon
                  icon={faCheese}
                  className="text-xs text-[#FFD166]"
                />
                Fat
              </Label>
              <Input
                type="number"
                inputMode="numeric"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                placeholder="g"
                className="h-12 text-base rounded-xl"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose
            render={
              <Button variant="outline" size="lg" className="h-12 text-base">
                Cancel
              </Button>
            }
          />
          <Button
            size="lg"
            className="h-12 text-base bg-[#FF6B6B] hover:bg-[#FF6B6B]/90 text-white"
            onClick={handleSave}
            disabled={!isValid}
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Save Meal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Meal Card
// ---------------------------------------------------------------------------

function MealCard({
  meal,
  onRemove,
}: {
  meal: Meal;
  onRemove: (id: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -60, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" as const }}
    >
      <Card size="sm" className="rounded-2xl">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            {/* Left: meal info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-semibold text-foreground truncate">
                  {meal.name}
                </h3>
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {meal.calories} cal
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground mb-2">{meal.time}</p>

              {/* Mini macro pills */}
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#FFE8E8] dark:bg-[#FF6B6B]/20 text-[#FF6B6B] dark:text-[#FF8E8E] font-medium">
                  <FontAwesomeIcon icon={faDrumstickBite} className="text-[10px]" />
                  {meal.protein}g
                </span>
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#E0F7F5] dark:bg-[#4ECDC4]/20 text-[#4ECDC4] dark:text-[#6EE7DE] font-medium">
                  <FontAwesomeIcon icon={faWheatAwn} className="text-[10px]" />
                  {meal.carbs}g
                </span>
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#FFF8E1] dark:bg-[#FFD166]/20 text-[#D4A017] dark:text-[#FFD166] font-medium">
                  <FontAwesomeIcon icon={faCheese} className="text-[10px]" />
                  {meal.fat}g
                </span>
              </div>
            </div>

            {/* Right: trash button */}
            <button
              onClick={() => onRemove(meal.id)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 active:scale-90 transition-all duration-150 shrink-0"
              aria-label={`Remove ${meal.name}`}
            >
              <FontAwesomeIcon icon={faTrash} className="text-lg" />
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// NutritionScreen
// ---------------------------------------------------------------------------

export function NutritionScreen() {
  const meals = useFitProStore((s) => s.meals);
  const dailyTargets = useFitProStore((s) => s.dailyTargets);
  const addMeal = useFitProStore((s) => s.addMeal);
  const removeMeal = useFitProStore((s) => s.removeMeal);

  const [dialogOpen, setDialogOpen] = useState(false);

  // Compute totals from actual meals
  const totals = useMemo(() => {
    return meals.reduce(
      (acc, m) => ({
        calories: acc.calories + m.calories,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fat: acc.fat + m.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [meals]);

  // Group meals by type
  const mealsByType = useMemo(() => {
    const grouped: Record<Meal["type"], Meal[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };
    for (const meal of meals) {
      grouped[meal.type].push(meal);
    }
    return grouped;
  }, [meals]);

  const handleAddMeal = useCallback(
    (meal: Meal) => {
      addMeal(meal);
    },
    [addMeal]
  );

  const hasMeals = meals.length > 0;

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-5 p-4 pb-28">
          {/* ── Header ─────────────────────────────────────────────── */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Nutrition</h1>
              <p className="text-base text-muted-foreground mt-0.5">
                Track your meals &amp; macros
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#FFE8E8] dark:bg-[#FF6B6B]/20 flex items-center justify-center">
              <FontAwesomeIcon
                icon={faUtensils}
                className="text-2xl text-[#FF6B6B] dark:text-[#FF8E8E]"
              />
            </div>
          </div>

          {/* ── Calorie Ring ───────────────────────────────────────── */}
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-5 flex flex-col items-center">
              <h2 className="text-base font-semibold text-foreground mb-4 self-start">
                <FontAwesomeIcon icon={faFire} className="text-[#FF6B6B] mr-2" />
                Calories Consumed
              </h2>
              <CalorieRing
                consumed={totals.calories}
                budget={dailyTargets.calories}
              />
              <p className="text-sm text-muted-foreground mt-3">
                {totals.calories >= dailyTargets.calories
                  ? "You've reached your calorie target!"
                  : `${(dailyTargets.calories - totals.calories).toLocaleString()} calories remaining`}
              </p>
            </CardContent>
          </Card>

          {/* ── Macro Progress Bars ────────────────────────────────── */}
          <div className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-foreground">
              Macronutrient Breakdown
            </h2>
            <MacroBar
              icon={<FontAwesomeIcon icon={faDrumstickBite} />}
              label="Protein"
              value={totals.protein}
              target={MACRO_TARGETS.protein}
              unit="g"
              macType="protein"
            />
            <MacroBar
              icon={<FontAwesomeIcon icon={faWheatAwn} />}
              label="Carbs"
              value={totals.carbs}
              target={MACRO_TARGETS.carbs}
              unit="g"
              macType="carbs"
            />
            <MacroBar
              icon={<FontAwesomeIcon icon={faCheese} />}
              label="Fat"
              value={totals.fat}
              target={MACRO_TARGETS.fat}
              unit="g"
              macType="fat"
            />
          </div>

          {/* ── Meal Sections ──────────────────────────────────────── */}
          {hasMeals ? (
            <div className="flex flex-col gap-5">
              <h2 className="text-base font-semibold text-foreground">
                Today&apos;s Meals
              </h2>
              {MEAL_SECTION_ORDER.map((type) => {
                const sectionMeals = mealsByType[type];
                if (sectionMeals.length === 0) return null;

                const sectionCalories = sectionMeals.reduce(
                  (sum, m) => sum + m.calories,
                  0
                );

                return (
                  <div key={type} className="flex flex-col gap-2">
                    {/* Section header */}
                    <div className="flex items-center gap-2 px-1">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <FontAwesomeIcon
                          icon={SECTION_ICONS[type]}
                          className="text-sm text-muted-foreground"
                        />
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {SECTION_LABELS[type]}
                      </span>
                      <Badge variant="outline" className="text-xs ml-auto">
                        {sectionCalories} cal
                      </Badge>
                    </div>

                    {/* Meal cards */}
                    <AnimatePresence mode="popLayout">
                      {sectionMeals.map((meal) => (
                        <MealCard
                          key={meal.id}
                          meal={meal}
                          onRemove={removeMeal}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </ScrollArea>

      {/* ── Add Meal FAB ──────────────────────────────────────────── */}
      <div className="absolute bottom-24 right-4 z-20">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setDialogOpen(true)}
          className="w-16 h-16 rounded-full bg-[#FF6B6B] text-white shadow-lg flex items-center justify-center hover:bg-[#FF5252] active:bg-[#E04848] transition-colors duration-200"
          aria-label="Add a meal"
        >
          <FontAwesomeIcon icon={faPlus} className="text-2xl" />
        </motion.button>
      </div>

      {/* ── Add Meal Dialog ───────────────────────────────────────── */}
      <AddMealDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={handleAddMeal}
      />
    </div>
  );
}
