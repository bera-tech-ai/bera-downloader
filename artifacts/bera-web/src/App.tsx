import { useState } from "react";
import { Search, Download, Bot, ShieldAlert } from "lucide-react";
import { HomePage } from "@/pages/HomePage";
import { DownloadsPage } from "@/pages/DownloadsPage";
import { AIChatPage } from "@/pages/AIChatPage";
import { AdultPage } from "@/pages/AdultPage";
import { useDownloads } from "@/hooks/useDownloads";

const TABS = [
  { id: "home",      label: "Search",    icon: Search },
  { id: "downloads", label: "Downloads", icon: Download },
  { id: "ai",        label: "AI Chat",   icon: Bot },
  { id: "adult",     label: "18+",       icon: ShieldAlert },
] as const;

type Tab = (typeof TABS)[number]["id"];

function NavBar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const { downloads } = useDownloads();
  const dlCount = downloads.filter(d => d.status === "completed").length;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-[#0d0d0d]/98 backdrop-blur safe-area-bottom">
      <div className="flex items-stretch max-w-lg mx-auto">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          const isAdult = id === "adult";
          const activeColor = isAdult ? "#c2185b" : "#FF4500";
          const color = active ? activeColor : "#6b7280";

          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 relative transition-colors active:opacity-70"
              style={{ color }}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : "stroke-2"}`} />
                {id === "downloads" && dlCount > 0 && (
                  <span
                    className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full text-white text-[9px] font-black flex items-center justify-center"
                    style={{ backgroundColor: "#FF4500" }}
                  >
                    {dlCount > 9 ? "9+" : dlCount}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] font-semibold tracking-wide`}
                style={{ color }}
              >
                {label}
              </span>
              {active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-b-full"
                  style={{ backgroundColor: activeColor }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>("home");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0d0d0d" }}>
      <div className="pb-16">
        {tab === "home" && <HomePage />}
        {tab === "downloads" && <DownloadsPage />}
        {tab === "ai" && <AIChatPage />}
        {tab === "adult" && <AdultPage />}
      </div>
      <NavBar tab={tab} setTab={setTab} />
    </div>
  );
}
