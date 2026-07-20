import { cn } from "@/lib/utils";

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "blue" | "orange" | "green" | "amber" | "red" }) {
  const tones = {
    neutral: "border-[var(--tbx-border)] text-[var(--tbx-text-muted)]",
    blue: "border-[color:var(--tbx-support)]/30 bg-[color:var(--tbx-support)]/5 text-[var(--tbx-support)]",
    orange: "border-[#FF4222]/30 bg-[#FF4222]/5 text-[#C93421]",
    green: "border-[color:var(--tbx-success)]/30 bg-[color:var(--tbx-success)]/5 text-[var(--tbx-success)]",
    amber: "border-[color:var(--tbx-warning)]/30 bg-[color:var(--tbx-warning)]/5 text-[var(--tbx-warning)]",
    red: "border-[color:var(--tbx-danger)]/30 bg-[color:var(--tbx-danger)]/5 text-[var(--tbx-danger)]",
  };
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap", tones[tone])}>{children}</span>;
}
