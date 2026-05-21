import { Bitcoin, ArrowUpRight, Sparkles, Wallet, Zap } from "lucide-react";

export function LandingPhone() {
  return (
    <div className="relative w-[300px] sm:w-[340px] aspect-[9/19] mx-auto">
      <div className="absolute -inset-12 bg-shadow-900 opacity-30 blur-3xl rounded-full pointer-events-none" />

      <div className="relative w-full h-full rounded-[44px] bg-ink p-2.5 shadow-pop">
        <div className="relative w-full h-full rounded-[36px] bg-app overflow-hidden">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-ink rounded-full z-10" />

          <div className="flex justify-between items-center px-6 pt-3 pb-1 text-[10px] text-ink font-medium">
            <span>9:41</span>
            <span className="opacity-0">·</span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-2 rounded-sm border border-ink/60" />
            </span>
          </div>

          <div className="px-5 pt-5">
            <p className="text-[10px] uppercase tracking-wider text-amber-600 font-semibold">
              Cermin · vault
            </p>
            <h3 className="text-xl font-semibold text-ink mt-0.5">Hi, Kiel</h3>
          </div>

          <div className="mx-4 mt-4 rounded-3xl bg-shadow-900 p-5 text-white shadow-pop relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/15 blur-2xl" />
            <div className="text-[10px] uppercase tracking-wider text-white/80">
              Shadow balance
            </div>
            <div className="text-3xl font-semibold tabular-nums tracking-tight mt-1">
              $2,847.32
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              {[
                { icon: <ArrowUpRight className="w-3.5 h-3.5" />, l: "Send" },
                { icon: <Wallet className="w-3.5 h-3.5" />, l: "Save" },
                { icon: <Zap className="w-3.5 h-3.5" />, l: "Skim" },
              ].map((b) => (
                <div
                  key={b.l}
                  className="flex flex-col items-center gap-1 bg-white/15 backdrop-blur-sm rounded-2xl py-2.5"
                >
                  <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                    {b.icon}
                  </span>
                  <span className="text-[10px] font-medium">{b.l}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-4 mt-3 rounded-2xl bg-white p-4 shadow-soft border border-line">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Bitcoin className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted">
                    Locked
                  </div>
                  <div className="text-sm font-semibold tabular-nums">
                    0.847 BTC
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-success/15 text-success">
                Protected
              </span>
            </div>
          </div>

          <div className="mx-4 mt-3 rounded-2xl bg-white p-4 shadow-soft border border-line">
            <div className="text-[10px] uppercase tracking-wider text-muted mb-2.5">
              Today
            </div>
            <div className="space-y-2.5">
              {[
                { icon: <Sparkles className="w-3 h-3" />, t: "Skim · BTC peak", v: "+$214.10", c: "text-success bg-success/15" },
                { icon: <Zap className="w-3 h-3" />, t: "sMUSD interest", v: "+$3.84", c: "text-amber-700 bg-amber-50" },
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center ${r.c}`}>
                      {r.icon}
                    </span>
                    <span className="text-xs text-ink">{r.t}</span>
                  </div>
                  <span className="text-xs font-semibold tabular-nums text-success">
                    {r.v}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
