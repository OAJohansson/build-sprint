"use client";

import { ChevronLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const inputClass =
  "h-12 w-full rounded-xl border border-input bg-card px-3.5 text-base text-foreground outline-none placeholder:text-muted-foreground focus:border-ring";

/** A full-screen layer over the app (detail pages, forms, the log flow). */
export function Screen({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-background">
      <div className={cn("mx-auto flex min-h-full w-full max-w-md flex-col gap-5 px-5 pb-8 pt-6", className)}>{children}</div>
    </div>
  );
}

export function TopBar({
  title,
  sub,
  onBack,
  close,
  right,
}: {
  title: string;
  sub?: string;
  onBack: () => void;
  close?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" aria-label={close ? "Close" : "Back"} onClick={onBack} className="-ml-2 flex size-11 items-center justify-center">
        {close ? <X className="size-6" /> : <ChevronLeft className="size-7" />}
      </button>
      <div className="flex min-w-0 flex-1 flex-col">
        <h1 className="truncate font-display text-[26px] font-bold uppercase leading-tight tracking-wide">{title}</h1>
        {sub && <span className="text-[13px] text-muted-foreground">{sub}</span>}
      </div>
      {right}
    </div>
  );
}

export function Chip({ active, children, onClick }: { active?: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-9 flex-none whitespace-nowrap rounded-full px-3.5 text-sm transition-colors",
        active ? "bg-secondary font-semibold text-secondary-foreground" : "border border-input font-medium",
      )}
    >
      {children}
    </button>
  );
}

export function BigButton({
  children,
  onClick,
  variant = "primary",
  disabled,
  type = "button",
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "light" | "outline";
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-14 items-center justify-center gap-2.5 rounded-2xl px-5 font-display text-[21px] font-bold uppercase tracking-wide transition-opacity disabled:opacity-50 [&_svg]:size-5",
        variant === "primary" && "bg-primary text-primary-foreground",
        variant === "light" && "bg-secondary text-secondary-foreground",
        variant === "outline" && "border border-input font-sans text-base font-semibold normal-case tracking-normal",
        className,
      )}
    >
      {children}
    </button>
  );
}

export const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{children}</span>
);
