"use client";

import { type KeyboardEvent, useState } from "react";

const STEPS: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

/**
 * One tab stop for a row of marks; the arrow keys, Home and End move between them.
 * Put `onKeyDown` on the container and spread `markProps(index)` on each mark.
 */
export function useRovingFocus(count: number) {
  const [active, setActive] = useState(0);
  const current = Math.min(active, Math.max(0, count - 1));

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    let next: number;
    if (event.key === "Home") next = 0;
    else if (event.key === "End") next = count - 1;
    else if (event.key in STEPS) next = Math.min(count - 1, Math.max(0, current + STEPS[event.key]!));
    else return;
    event.preventDefault();
    event.currentTarget.querySelectorAll<HTMLElement>("[data-mark]")[next]?.focus();
    setActive(next);
  };

  const markProps = (index: number) => ({
    "data-mark": "",
    tabIndex: index === current ? 0 : -1,
    onFocus: () => setActive(index),
  });

  return { onKeyDown, markProps };
}
