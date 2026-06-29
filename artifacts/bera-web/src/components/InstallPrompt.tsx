import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "bera_install_dismissed";

export function InstallPrompt() {
  const [prompt, setPrompt]     = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible]   = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setVisible(true), 3000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible || !prompt) return null;

  function dismiss() {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, "1");
  }

  async function install() {
    if (!prompt) return;
    setInstalling(true);
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    } else {
      setInstalling(false);
    }
    setPrompt(null);
  }

  return (
    <div className="fixed bottom-20 left-3 right-3 z-50 max-w-sm mx-auto animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div
        className="rounded-2xl border border-white/10 shadow-2xl p-4 flex items-center gap-3"
        style={{ backgroundColor: "#1a1a1a" }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: "#FF4500" }}
        >
          <span className="text-white font-black text-lg">B</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-bold leading-tight">Add Bera to Home Screen</p>
          <p className="text-white/50 text-xs mt-0.5">Install for the best experience</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={install}
            disabled={installing}
            className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-1.5 rounded-xl transition-opacity active:opacity-80"
            style={{ backgroundColor: "#FF4500" }}
          >
            <Download className="w-3.5 h-3.5" />
            {installing ? "…" : "Install"}
          </button>
          <button
            onClick={dismiss}
            className="w-7 h-7 flex items-center justify-center rounded-full text-white/40 hover:text-white/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
