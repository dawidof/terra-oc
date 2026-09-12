"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const STORAGE_KEY = "trim-scroll";
const MAX_AGE_MS = 15000;

export function saveTrimScroll() {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ y: window.scrollY, t: Date.now() })
    );
  } catch {}
}

export function useRestoreTrimScroll() {
  const pathname = usePathname();

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      sessionStorage.removeItem(STORAGE_KEY);
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        typeof parsed.y === "number" &&
        Date.now() - parsed.t < MAX_AGE_MS
      ) {
        window.scrollTo(0, parsed.y);
      }
    } catch {}
  }, [pathname]);
}

export function PreserveScrollLink({
  onClick,
  ...props
}: React.ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      scroll={props.scroll ?? false}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) saveTrimScroll();
      }}
    />
  );
}
