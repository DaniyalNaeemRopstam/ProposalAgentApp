import { C } from "@/styles/theme";
import { cn } from "@/lib/cn";

export interface ScoreRingProps {
  score: number;
  /** MVP default is 48 */
  size?: number;
  /** MVP track / arc stroke is 3 */
  strokeWidth?: number;
  className?: string;
  /** When true (MVP behavior), numeric label uses ring color */
  tieLabelToScore?: boolean;
}

function strokeHex(score: number): string {
  const s = Math.min(100, Math.max(0, score));
  if (s >= 90) return C.success;
  if (s >= 78) return C.accent;
  return C.warn;
}

export function ScoreRing({
  score,
  size = 48,
  strokeWidth = 3,
  className,
  tieLabelToScore = true,
}: ScoreRingProps) {
  const clamped = Math.min(100, Math.max(0, score));
  const r = 18 * (size / 48);
  const c = 2 * Math.PI * r;
  const dash = (clamped / 100) * c;
  const color = strokeHex(clamped);

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Score ${Math.round(clamped)} out of 100`}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.border}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
      </svg>
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-bold"
        style={{ color: tieLabelToScore ? color : C.text }}
      >
        {Math.round(clamped)}
      </div>
    </div>
  );
}
