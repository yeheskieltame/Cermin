import { Logo } from "@/components/ui/Logo";

export function Footer() {
  return (
    <footer className="border-t border-line/60 bg-surface/50 py-10">
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
