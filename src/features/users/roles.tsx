import { BanIcon, EyeIcon, type LucideIcon, ShieldCheckIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { User } from "@/lib/api";
import { cn } from "@/lib/utils";

export const ROLES: { value: User["role"]; label: string; description: string; icon: LucideIcon }[] = [
  {
    value: "viewer",
    label: "Viewer",
    description: "Reads everything, changes nothing",
    icon: EyeIcon,
  },
  {
    value: "admin",
    label: "Admin",
    description: "Changes records and manages users",
    icon: ShieldCheckIcon,
  },
];

export const ROLE_BY_VALUE = Object.fromEntries(ROLES.map((role) => [role.value, role])) as Record<
  User["role"],
  (typeof ROLES)[number]
>;

export const STATUS_LABELS: Record<User["status"], string> = {
  active: "Active",
  deactivated: "Deactivated",
};

/** Roles are tags: admin in the brand's mint, viewer neutral. */
export function RoleBadge({ role }: { role: User["role"] }) {
  const { label, icon: Icon } = ROLE_BY_VALUE[role];
  return (
    <Badge
      variant="secondary"
      className={cn(role === "admin" && "bg-accent text-accent-foreground")}
    >
      <Icon data-icon="inline-start" />
      {label}
    </Badge>
  );
}

/** Green belongs to the "stable" condition, so an active account is a mint dot, not a green badge. */
export function StatusLabel({ status }: { status: User["status"] }) {
  if (status === "deactivated") {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        <BanIcon data-icon="inline-start" />
        Deactivated
      </Badge>
    );
  }
  return (
    <span className="flex items-center gap-2 text-sm">
      <span aria-hidden="true" className="size-2 rounded-full bg-brand-mint-solid" />
      Active
    </span>
  );
}

/** Marks the signed-in admin's own row, where some actions are unavailable. */
export function YouBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("border-brand-mint/30 bg-accent/70 text-accent-foreground", className)}
    >
      You
    </Badge>
  );
}
