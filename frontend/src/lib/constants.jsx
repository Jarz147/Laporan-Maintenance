import { Badge } from "../components/ui/badge";

export const STATUS_MAP = {
  selesai: { label: "Selesai", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  pending: { label: "Pending", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  progress: { label: "Proses", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  issue: { label: "Kendala", cls: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
};

export const SHIFT_MAP = {
  shift1: { label: "Shift 1 (Pagi)", cls: "bg-amber-400/10 text-amber-400 border-amber-400/30" },
  shift2: { label: "Shift 2 (Malam)", cls: "bg-indigo-400/10 text-indigo-400 border-indigo-400/30" },
};

export function StatusBadge({ value, testid }) {
  const s = STATUS_MAP[value] || STATUS_MAP.pending;
  return (
    <Badge data-testid={testid} variant="outline" className={`${s.cls} font-medium uppercase tracking-wider text-[10px] px-2 py-0.5`}>
      {s.label}
    </Badge>
  );
}

export function ShiftBadge({ value, testid }) {
  const s = SHIFT_MAP[value] || SHIFT_MAP.shift1;
  return (
    <Badge data-testid={testid} variant="outline" className={`${s.cls} font-medium uppercase tracking-wider text-[10px] px-2 py-0.5`}>
      {s.label}
    </Badge>
  );
}
