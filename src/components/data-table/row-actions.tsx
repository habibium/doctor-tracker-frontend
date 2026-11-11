"use client";

import { Fragment } from "react";
import Link from "next/link";
import { EllipsisIcon, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type RowAction = {
  label: string;
  icon: LucideIcon;
  destructive?: boolean;
} & ({ href: string; onSelect?: never } | { onSelect: () => void; href?: never });

/** Groups are drawn with a rule between them. No groups means the row has no actions. */
export type RowActionGroups = RowAction[][];

const MENU_PARTS = {
  dropdown: { Group: DropdownMenuGroup, Item: DropdownMenuItem, Separator: DropdownMenuSeparator },
  context: { Group: ContextMenuGroup, Item: ContextMenuItem, Separator: ContextMenuSeparator },
};

/** Renders one action list into either menu, so the two can never drift apart. */
export function RowActionItems({
  groups,
  menu,
}: {
  groups: RowActionGroups;
  menu: keyof typeof MENU_PARTS;
}) {
  const { Group, Item, Separator } = MENU_PARTS[menu];

  return groups.map((group, index) => (
    <Fragment key={index}>
      {index > 0 && <Separator />}
      <Group>
        {group.map(({ label, icon: Icon, href, onSelect, destructive }) => (
          <Item
            key={label}
            variant={destructive ? "destructive" : "default"}
            render={href ? <Link href={href} /> : undefined}
            onClick={onSelect}
          >
            <Icon />
            {label}
          </Item>
        ))}
      </Group>
    </Fragment>
  ));
}

/** The three-dot button at the end of a row or card. */
export function RowActionsMenu({ groups, label }: { groups: RowActionGroups; label: string }) {
  if (groups.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={label} />}>
        <EllipsisIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <RowActionItems groups={groups} menu="dropdown" />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
