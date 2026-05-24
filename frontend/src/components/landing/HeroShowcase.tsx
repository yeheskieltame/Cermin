"use client";

import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import {
  Bitcoin,
  ArrowUpRight,
  Wallet,
  Zap,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

/* The hero's product visual: a live "Shadow" console — layered cards, a
   counting balance, a sparkline, and skim/defend event toasts drifting in. */
export function HeroShowcase() {
  return (
    <div className="relative w-full max-w-[420px] mx-auto select-none">
      {/* ambient warm glow */}
      <div className="absolute -inset-10 bg-amber-500/20 blur-3xl rounded-full pointer-events-none" />

      {/* back chart card, tilted for depth */}
      <div className="absolute -left-7 bottom-3 w-48 rounded-3xl bg-surface border border-cream-300 shadow-soft p-4 -rotate-6 hidden sm:block">
        <div className="text-[9px] uppercase tracking-[0.16em] text-muted-2 font-mono mb-2">
          BTC / USD
        </div>
        <Sparkline />
        <div className="mt-2 text-xs font-semibold text-ink tabular-nums">
          $74,652 <span className="text-success font-medium">▲ 2.1%</span>
        </div>
      </div>

      {/* main Shadow console */}
      <div className="relative rounded-[30px] bg-shadow-900 p-6 overflow-hidden animate-float shadow-[0_34px_70px_-22px_rgba(31,27,23,0.55),inset_0_1px_0_rgba(255,255,255,0.08),inset_0_70px_100px_-60px_rgba(199,122,58,0.28)]">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-amber-500/25 blur-3xl" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/55 font-mono">
              Shadow balance
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] text-white/60 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> live
            </span>
          </div>

          <AnimatedNumber
            value={2847.32}
            durationMs={1500}
            format={(n) =>
              "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            }
            className="block text-4xl font-semibold tabular-nums tracking-tight text-cream-50 mt-3 leading-none"
          />
          <div className="text-sm text-white/55 mt-1.5">
            MUSD spendable <span className="text-success">▲ +6.2% this week</span>
          </div>

          <div className="mt-4 -mx-1">
            <Sparkline wide />
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { icon: <ArrowUpRight className="w-4 h-4" />, l: "Send" },
              { icon: <Wallet className="w-4 h-4" />, l: "Save" },
              { icon: <Zap className="w-4 h-4" />, l: "Skim" },
            ].map((b) => (
              <div
                key={b.l}
                className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/[0.07] border border-white/10 py-2.5 text-cream-100"
              >
                <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                  {b.icon}
                </span>
                <span className="text-[10px] font-medium">{b.l}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs text-white/60">
              <Bitcoin className="w-4 h-4 text-amber-400" /> 0.847 BTC locked
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-success/20 text-success">
              Protected
            </span>
          </div>
        </div>
      </div>

      {/* floating event toasts */}
      <Toast
        className="absolute -left-6 sm:-left-10 top-24 animate-float"
        style={{ animationDelay: "0.6s" }}
        icon={<Sparkles className="w-3.5 h-3.5" />}
        tone="success"
        title="+$214.10"
        sub="Skim · BTC peak"
      />
      <Toast
        className="absolute -right-4 sm:-right-8 bottom-14 animate-float"
        style={{ animationDelay: "1.8s" }}
        icon={<ShieldCheck className="w-3.5 h-3.5" />}
        tone="info"
        title="Defended"
        sub="ICR 132% → 168%"
      />
    </div>
  );
}

function Toast({
  className,
  style,
  icon,
  title,
  sub,
  tone,
}: {
  className?: string;
  style?: React.CSSProperties;
  icon: React.ReactNode;
  title: string;
  sub: string;
  tone: "success" | "info";
}) {
  const toneCls =
    tone === "success" ? "bg-success/15 text-success" : "bg-info/15 text-info";
  return (
    <div
      className={`flex items-center gap-2.5 rounded-2xl bg-surface/95 backdrop-blur border border-cream-300 shadow-pop px-3 py-2 ${className ?? ""}`}
      style={style}
    >
      <span className={`w-7 h-7 rounded-full flex items-center justify-center ${toneCls}`}>
        {icon}
      </span>
      <div className="leading-tight">
        <div className="text-xs font-semibold text-ink tabular-nums">{title}</div>
        <div className="text-[10px] text-muted-2">{sub}</div>
      </div>
    </div>
  );
}

function Sparkline({ wide }: { wide?: boolean }) {
  const w = wide ? 320 : 160;
  return (
    <svg viewBox="0 0 320 70" className="w-full h-auto" preserveAspectRatio="none" style={{ maxWidth: w }}>
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C77A3A" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#C77A3A" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 56 L40 50 L80 54 L120 38 L160 44 L200 26 L240 32 L280 16 L320 10 L320 70 L0 70 Z"
        fill="url(#sparkFill)"
      />
      <path
        d="M0 56 L40 50 L80 54 L120 38 L160 44 L200 26 L240 32 L280 16 L320 10"
        fill="none"
        stroke="#CE8E50"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="320" cy="10" r="3" fill="#C77A3A" />
    </svg>
  );
}
