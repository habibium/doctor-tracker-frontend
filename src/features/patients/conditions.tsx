import { Badge } from "@/components/ui/badge";
import type { Gender, PatientCondition } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ConditionInfo {
  value: PatientCondition;
  label: string;
  /** Background class for dots and chart segments. */
  fill: string;
  /** Text class for a label printed on top of `fill`. */
  onFill: string;
}

/** Ordered from least to most urgent; charts and filters all follow this order. */
export const CONDITIONS: ConditionInfo[] = [
  {
    value: "stable",
    label: "Stable",
    fill: "bg-condition-stable",
    onFill: "text-on-condition-stable",
  },
  {
    value: "recovering",
    label: "Recovering",
    fill: "bg-condition-recovering",
    onFill: "text-on-condition",
  },
  {
    value: "under_observation",
    label: "Under observation",
    fill: "bg-condition-observation",
    onFill: "text-on-condition-observation",
  },
  { value: "critical", label: "Critical", fill: "bg-condition-critical", onFill: "text-on-condition" },
];

export const CONDITION_BY_VALUE = Object.fromEntries(
  CONDITIONS.map((condition) => [condition.value, condition]),
) as Record<PatientCondition, ConditionInfo>;

export const GENDERS: { value: Gender; label: string }[] = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other" },
];

export const GENDER_LABELS = Object.fromEntries(
  GENDERS.map((gender) => [gender.value, gender.label]),
) as Record<Gender, string>;

/** The dot carries the colour and the text carries the meaning, so neither works alone. */
export function ConditionBadge({ condition }: { condition: PatientCondition }) {
  const { label, fill } = CONDITION_BY_VALUE[condition];
  return (
    <Badge variant="outline" className="gap-1.5">
      <span aria-hidden="true" className={cn("size-2 rounded-full", fill)} />
      {label}
    </Badge>
  );
}
