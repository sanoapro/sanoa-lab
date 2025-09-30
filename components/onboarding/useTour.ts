"use client";

import * as React from "react";

export type TourStep = {
  id: string;
  title: string;
  description: string;
  selector?: string; // opcional, para posicionarse cerca de un target
};

const STORAGE_KEY = "sanoa.tour.v1.done";

export function useTour(steps: TourStep[]) {
  const [index, setIndex] = React.useState(0);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY) === "1";
    if (!done && steps.length > 0) setOpen(true);
  }, [steps.length]);

  function next() {
    if (index + 1 < steps.length) setIndex((i) => i + 1);
    else finish();
  }
  function prev() {
    if (index > 0) setIndex((i) => i - 1);
  }
  function finish() {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  }

  const current = steps[index] || null;

  return { open, current, index, total: steps.length, next, prev, finish };
}
