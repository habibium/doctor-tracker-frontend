"use client";

import { type ReactElement, type ReactNode, useState } from "react";
import { Tooltip } from "@base-ui/react/tooltip";
import { cn } from "@/lib/utils";

export type ChartTipHandle<P> = Tooltip.Handle<P>;

/** One tooltip shared by every mark in a chart: marks pass their own payload as they're hovered or focused. */
export function useChartTip<P>() {
  const [handle] = useState(() => Tooltip.createHandle<P>());
  return handle;
}

export function ChartTip<P>({
  handle,
  children,
}: {
  handle: ChartTipHandle<P>;
  children: (payload: P) => ReactNode;
}) {
  return (
    <Tooltip.Root handle={handle}>
      {({ payload }) => (
        <Tooltip.Portal>
          <Tooltip.Positioner sideOffset={6} collisionPadding={8} className="isolate z-50">
            <Tooltip.Popup className="flex min-w-32 flex-col gap-1 rounded-xl bg-foreground px-3 py-2 text-xs text-background shadow-md">
              {payload !== undefined && children(payload)}
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      )}
    </Tooltip.Root>
  );
}

/** A mark that opens the chart's tooltip on hover and on keyboard focus. */
export function ChartMark<P>({
  handle,
  payload,
  render,
  children,
}: {
  handle: ChartTipHandle<P>;
  payload: P;
  render: ReactElement<Record<string, unknown>>;
  children?: ReactNode;
}) {
  return (
    <Tooltip.Trigger handle={handle} payload={payload} delay={0} closeDelay={0} render={render}>
      {children}
    </Tooltip.Trigger>
  );
}

export function TipTitle({ children }: { children: ReactNode }) {
  return <p className="text-background/70">{children}</p>;
}

/** Value first, label after: the reader already knows the series and wants the number. */
export function TipRow({
  value,
  label,
  swatch,
}: {
  value: ReactNode;
  label: ReactNode;
  /** Background class of the series, drawn as a short line key. */
  swatch?: string;
}) {
  return (
    <p className="flex items-center gap-2">
      {swatch && <span aria-hidden="true" className={cn("h-0.5 w-2.5 shrink-0 rounded-full", swatch)} />}
      <span className="tabular font-semibold">{value}</span>
      <span className="text-background/70">{label}</span>
    </p>
  );
}
