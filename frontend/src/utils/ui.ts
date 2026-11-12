import type { HallColor } from "../types/d.type";

export const dotClass: Record<HallColor, string> = {
  purple: "bg-violet-500",
  orange: "bg-amber-500",
  blue: "bg-blue-500",
  green: "bg-emerald-500",
};

export const chipClass: Record<HallColor, string> = {
  purple: "bg-violet-100/80 text-violet-800",
  orange: "bg-amber-100/80 text-amber-800",
  blue: "bg-blue-100/80 text-blue-800",
  green: "bg-emerald-100/80 text-emerald-800",
};

export const dayTintClass: Record<HallColor, string> = {
  purple: "bg-violet-50/60",
  orange: "bg-amber-50/60",
  blue: "bg-blue-50/60",
  green: "bg-emerald-50/60",
};

export const HALL_COLORS: { value: HallColor; label: string }[] = [
  { value: "purple", label: "Ungu" },
  { value: "orange", label: "Oranye" },
  { value: "blue", label: "Biru" },
  { value: "green", label: "Hijau" },
];

export const inputClass =
  "rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10";

export const primaryButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 font-semibold text-white shadow-[0_10px_22px_-12px_rgba(99,102,241,0.8)] transition hover:brightness-105 hover:shadow-[0_14px_28px_-14px_rgba(99,102,241,0.85)] active:scale-[0.99] disabled:cursor-default disabled:opacity-60 disabled:hover:brightness-100 disabled:hover:shadow-[0_10px_22px_-12px_rgba(99,102,241,0.8)]";
