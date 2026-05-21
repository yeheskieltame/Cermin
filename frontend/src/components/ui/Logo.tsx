import { cn } from "@/lib/utils";

export function Logo({
  className,
  withWordmark = true,
  size = 28,
}: {
  className?: string;
  withWordmark?: boolean;
  size?: number;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className="rounded-xl bg-ink flex items-center justify-center text-white font-bold tracking-tight"
        style={{ width: size, height: size, fontSize: size * 0.46 }}
      >
        C
      </span>
      {withWordmark && (
        <span className="font-semibold text-ink tracking-tight text-base">
          Cermin
        </span>
      )}
    </span>
  );
}
