"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Logo } from "@/components/ui/Logo";
import {
  ShieldCheck,
  Zap,
  Bot,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Lock,
  ChevronRight,
} from "lucide-react";
import { LandingPhone } from "@/components/landing/LandingPhone";

function scrollToId(id: string) {
  if (typeof document === "undefined") return;
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function HomePage() {
  const { isConnected } = useAccount();
  const router = useRouter();

  // Connecting always lands on the dashboard. The dashboard is the single
  // authority on vault state: it shows the vault if one exists, or routes a
  // vault-less user into onboarding. The landing never guesses, so a returning
  // owner is never sent to the wizard.
  const launchHref = isConnected ? "/dashboard" : null;
  const onLaunch = launchHref ? () => router.push(launchHref) : undefined;

  return (
    <div className="bg-app min-h-screen text-ink">
      <Topbar launchHref={launchHref} />
      <Hero launchHref={launchHref} onLaunch={onLaunch} />
      <TrustStrip />
      <HowItWorks />
      <FeatureGrid />
      <ShadowSection />
      <FAQ />
      <CTA launchHref={launchHref} onLaunch={onLaunch} />
      <Footer />
    </div>
  );
}

function Topbar({ launchHref }: { launchHref: string | null }) {
  return (
    <header className="sticky top-0 z-40 glass border-b border-line/60">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 h-16 flex items-center justify-between pad-safe-top">
        <Link href="/" aria-label="Cermin home">
          <Logo />
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm text-muted">
          <a href="#how" className="hover:text-ink transition-colors">How it works</a>
          <a href="#features" className="hover:text-ink transition-colors">Features</a>
          <a href="#faq" className="hover:text-ink transition-colors">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          {launchHref ? (
            <Link
              href={launchHref}
              className={buttonClasses({ variant: "primary", size: "sm" })}
            >
              <span className="hidden sm:inline">Open dashboard</span>
              <span className="sm:hidden">Open</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <Button variant="primary" size="sm" onClick={openConnectModal}>
                  <span className="hidden sm:inline">Launch app</span>
                  <span className="sm:hidden">Launch</span>
                </Button>
              )}
            </ConnectButton.Custom>
          )}
        </div>
      </div>
    </header>
  );
}

function Hero({
  launchHref,
  onLaunch,
}: {
  launchHref: string | null;
  onLaunch?: () => void;
}) {
  return (
    <section id="launch" className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.55]"
          style={{ backgroundImage: "url(/hero-horizon-figure.webp)" }}
        />
        {/* Fade left→right so the headline rests on calm cream */}
        <div className="absolute inset-0 bg-gradient-to-r from-canvas via-canvas/75 to-canvas/20" />
        {/* Settle into the page below the fold */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-canvas" />
      </div>
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8 pt-10 pb-16 md:pt-20 md:pb-28">
        <div className="grid md:grid-cols-2 gap-10 md:gap-14 items-center">
          <div className="space-y-7 animate-rise-in">
            <Badge variant="amber" className="text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Live on Mezo Testnet
            </Badge>

            <h1 className="text-[2.4rem] sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] text-balance">
              Your BTC stays whole.
              <br />
              <span className="text-amber-600">The Shadow is what you live on.</span>
            </h1>

            <p className="text-base sm:text-lg text-muted max-w-xl text-pretty">
              Cermin is self-driving Bitcoin banking on Mezo. Deposit BTC once and
              receive a dollar allowance forever — without ever selling a satoshi.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              {launchHref && onLaunch ? (
                <Button variant="primary" size="xl" onClick={onLaunch}>
                  Open dashboard
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <Button variant="primary" size="xl" onClick={openConnectModal}>
                      Launch app
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </ConnectButton.Custom>
              )}
              <Button
                variant="secondary"
                size="xl"
                className="w-full sm:w-auto"
                onClick={() => scrollToId("how")}
              >
                How it works
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Non-custodial
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Audited primitives
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Built on Mezo
              </span>
            </div>
          </div>

          <div className="relative flex justify-center md:justify-end">
            <LandingPhone />
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  const items = [
    "Mezo Trove · BTC collateral",
    "MUSD · 1% APR fixed borrow",
    "sMUSD · ~5% native yield",
    "PriceFeed · on-chain oracle",
    "Self-driving · no custody",
    "Liquidation-defended",
  ];
  return (
    <section className="border-y border-line/70 bg-white/40 overflow-hidden">
      <div className="relative">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...items, ...items].map((it, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-3 px-6 py-4 text-sm text-muted"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />
              {it}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Deposit BTC",
      body: "Lock as much BTC as you want. It sits in a Mezo trove — yours, never sold.",
    },
    {
      n: "02",
      title: "Pick a strategy",
      body: "Conservative · Balanced · Aggressive. Sets your borrow ratio and defense thresholds.",
    },
    {
      n: "03",
      title: "Live on the Shadow",
      body: "Cermin borrows MUSD against your BTC. Withdraw to spend, or let it compound in the savings vault.",
    },
  ];

  return (
    <section id="how" className="relative overflow-hidden py-20 md:py-28">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.35]"
          style={{ backgroundImage: "url(/how-it-works-three-scenes.webp)" }}
        />
        <div className="absolute inset-0 bg-canvas/55" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-canvas to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-canvas to-transparent" />
      </div>
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8">
        <div className="max-w-2xl mb-12">
          <Badge variant="amber" className="mb-4">How it works</Badge>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-balance">
            Three steps. One vault. Zero sales.
          </h2>
          <p className="text-muted mt-3 text-pretty">
            Cermin is a thin app that orchestrates Mezo primitives — so the risk model
            is the chain&apos;s, not ours.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {steps.map((s, i) => (
            <Card key={s.n} className="!p-7 group" interactive>
              <div className="flex items-center justify-between mb-8">
                <span className="text-xs font-mono text-amber-500">{s.n}</span>
                <span className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
              <h3 className="text-xl font-semibold tracking-tight mb-2">{s.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{s.body}</p>
              {i === 0 && (
                <div className="mt-6 flex items-center gap-2 text-xs text-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-mint" />
                  Min ~0.05 BTC
                </div>
              )}
              {i === 1 && (
                <div className="mt-6 flex flex-wrap gap-1.5">
                  <Badge variant="default">Conservative</Badge>
                  <Badge variant="amber">Balanced ⭐</Badge>
                  <Badge variant="default">Aggressive</Badge>
                </div>
              )}
              {i === 2 && (
                <div className="mt-6 flex items-center gap-2 text-xs text-muted">
                  <TrendingUp className="w-3.5 h-3.5 text-success" />
                  Auto-skim on BTC peaks
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureGrid() {
  return (
    <section id="features" className="relative overflow-hidden py-20 md:py-28 border-y border-line/60">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.3]"
          style={{ backgroundImage: "url(/features-tranquil-town.webp)" }}
        />
        <div className="absolute inset-0 bg-surface/60" />
      </div>
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8">
        <div className="max-w-2xl mb-12">
          <Badge variant="amber" className="mb-4">Features</Badge>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-balance">
            A bank account that runs itself.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <FeatureCard
            icon={<ShieldCheck className="w-5 h-5" />}
            title="BTC stays untouched"
            body="Your collateral never leaves the trove. Cermin only moves the borrowed dollars."
            tone="sage"
          />
          <FeatureCard
            icon={<Zap className="w-5 h-5" />}
            title="Skims on every peak"
            body="When BTC pumps past your threshold, your vault draws fresh MUSD and tops up the Shadow."
            tone="amber"
          />
          <FeatureCard
            icon={<Bot className="w-5 h-5" />}
            title="Defends every dip"
            body="A keeper bot — and anyone else — can repay debt the moment your ICR drops, before liquidation."
            tone="info"
          />
          <FeatureCard
            icon={<TrendingUp className="w-5 h-5" />}
            title="Auto-yield on idle"
            body="Borrowed dollars route into Mezo's sMUSD vault to earn while you sleep."
            tone="amber"
          />
          <FeatureCard
            icon={<Lock className="w-5 h-5" />}
            title="Non-custodial by design"
            body="Every vault is owned by you. The Cermin team can never touch your funds."
            tone="peach"
          />
          <FeatureCard
            icon={<Sparkles className="w-5 h-5" />}
            title="One-tap onboarding"
            body="Connect, choose a preset, sign once. Your Shadow is live in under 60 seconds."
            tone="sage"
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  body,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  tone: "sage" | "amber" | "info" | "peach";
}) {
  const tones: Record<string, string> = {
    sage: "bg-success/15 text-success",
    amber: "bg-amber-50 text-amber-700",
    info: "bg-info/12 text-info",
    peach: "bg-peach-200 text-amber-700",
  };
  return (
    <Card className="!p-6">
      <div
        className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-5 ${tones[tone]}`}
      >
        {icon}
      </div>
      <h3 className="font-semibold text-base tracking-tight">{title}</h3>
      <p className="text-sm text-muted mt-1.5 leading-relaxed text-pretty">{body}</p>
    </Card>
  );
}

function ShadowSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Card variant="ink" className="!p-8 md:!p-12 relative">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-60"
              style={{ backgroundImage: "url(/shadow-night-warmth.webp)" }}
            />
            {/* Keep the white copy legible over the night scene */}
            <div className="absolute inset-0 bg-gradient-to-r from-shadow-900 via-shadow-900/85 to-shadow-900/60" />
          </div>
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-amber-500/40 blur-3xl pointer-events-none" />
          <div className="relative grid md:grid-cols-2 gap-8 items-center">
            <div>
              <Badge variant="amber" className="mb-4">The Shadow</Badge>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-balance">
                Spend the dollars. Keep the Bitcoin.
              </h2>
              <p className="text-white/70 mt-4 text-pretty">
                The Shadow is your spendable balance — MUSD borrowed against your
                BTC. Withdraw to a card, save it in sMUSD, or both. Your BTC just
                sits there appreciating.
              </p>
              <div className="grid grid-cols-2 gap-3 mt-7 max-w-md">
                <Stat label="Borrow APR" value="1%" sub="fixed at open" />
                <Stat label="Vault APR" value="~5%" sub="sMUSD savings" />
                <Stat label="Max LTV" value="90%" sub="Mezo cap" />
                <Stat label="On-chain" value="2 contracts" sub="lean by design" />
              </div>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-pop relative">
              <div className="text-xs uppercase tracking-wider text-amber-600 font-medium mb-1">
                Available now
              </div>
              <div className="text-5xl font-semibold tabular-nums tracking-tight text-ink">
                $2,847.32
              </div>
              <div className="text-sm text-muted mt-1">MUSD spendable</div>
              <div className="grid grid-cols-3 gap-2 mt-6">
                {["Withdraw", "Top up", "Save"].map((a, i) => (
                  <div
                    key={a}
                    className={`rounded-2xl py-3 px-2 text-center text-sm font-medium ${
                      i === 0
                        ? "bg-ink text-white"
                        : "bg-surface-soft text-ink"
                    }`}
                  >
                    {a}
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-5 border-t border-line space-y-3">
                <Row label="BTC locked" value="0.847 BTC" />
                <Row label="In sMUSD vault" value="$12,420" />
                <Row label="ICR · health" value="218% · Safe" mono />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <div className="text-xs text-white/50">{label}</div>
      <div className="text-2xl font-semibold tabular-nums mt-1">{value}</div>
      <div className="text-xs text-white/40 mt-0.5">{sub}</div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className={`text-ink ${mono ? "font-mono" : "font-medium"}`}>
        {value}
      </span>
    </div>
  );
}

function FAQ() {
  const qs = [
    {
      q: "Is my BTC ever sold?",
      a: "Never. Your BTC is locked as collateral in a Mezo trove that only you can close. Cermin just orchestrates the borrowed dollars on top.",
    },
    {
      q: "What happens on a BTC crash?",
      a: "When your ICR drops below your defense threshold, anyone (including the keeper bot) can call defend(), which uses your sMUSD savings to repay debt and lift the ICR back up — well before Mezo's 110% liquidation line.",
    },
    {
      q: "Who controls the vault?",
      a: "You. Each user gets their own clone contract with sole authority to open, close, and withdraw. Cermin can't touch your funds.",
    },
    {
      q: "What's the actual yield?",
      a: "MUSD savings (sMUSD) yield is variable — currently ~5% APR. Cermin doesn't add any spread; you get whatever Mezo pays.",
    },
  ];
  return (
    <section id="faq" className="relative overflow-hidden py-20 md:py-28">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.4]"
          style={{ backgroundImage: "url(/faq-open-meadow.webp)" }}
        />
        <div className="absolute inset-0 bg-canvas/55" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-canvas to-transparent" />
      </div>
      <div className="relative z-10 mx-auto max-w-3xl px-5 sm:px-8">
        <div className="text-center mb-10">
          <Badge variant="amber" className="mb-4">FAQ</Badge>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Common questions
          </h2>
        </div>
        <div className="space-y-3">
          {qs.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl bg-white border border-line shadow-soft p-5 cursor-pointer"
            >
              <summary className="flex items-center justify-between font-medium text-ink list-none">
                {item.q}
                <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90 text-muted" />
              </summary>
              <p className="text-sm text-muted mt-3 leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA({
  launchHref,
  onLaunch,
}: {
  launchHref: string | null;
  onLaunch?: () => void;
}) {
  return (
    <section className="pb-20">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <Card variant="accent" className="!p-10 md:!p-14 text-center relative">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-70"
              style={{ backgroundImage: "url(/cta-dawn-path.webp)" }}
            />
            {/* Let the dawn glow through while keeping the white copy legible */}
            <div className="absolute inset-0 bg-gradient-to-t from-shadow-900 via-shadow-900/80 to-shadow-900/65" />
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-white text-balance">
              Open your Shadow in under 60 seconds.
            </h2>
            <p className="text-white/85 mt-4 max-w-xl mx-auto">
              Connect a wallet, pick Balanced, sign once. Your BTC stays whole.
            </p>
            <div className="mt-7 flex justify-center">
            {launchHref && onLaunch ? (
              <Button variant="secondary" size="xl" onClick={onLaunch}>
                Go to dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <Button variant="secondary" size="xl" onClick={openConnectModal}>
                    Launch app
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </ConnectButton.Custom>
            )}
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line/60 bg-white/40 py-10">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="text-xs text-muted">Self-driving Bitcoin banking on Mezo</span>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted">
          <a
            href="https://mezo.org/docs/developers/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ink transition-colors"
          >
            Mezo docs ↗
          </a>
          <a
            href="https://github.com/mezo-org/musd"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ink transition-colors"
          >
            MUSD source ↗
          </a>
          <a
            href="https://faucet.test.mezo.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ink transition-colors"
          >
            Testnet faucet ↗
          </a>
        </div>
      </div>
    </footer>
  );
}
