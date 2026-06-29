import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";

export function OfflineIndicator() {
  const [online, setOnline]       = useState(navigator.onLine);
  const [showBack, setShowBack]   = useState(false);

  useEffect(() => {
    function onOffline() {
      setOnline(false);
      setShowBack(false);
    }
    function onOnline() {
      setOnline(true);
      setShowBack(true);
      setTimeout(() => setShowBack(false), 3000);
    }
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  if (online && !showBack) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] animate-in slide-in-from-top-2 fade-in duration-300">
      <div
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-white text-xs font-bold shadow-xl ${
          online ? "bg-green-600" : "bg-red-600"
        }`}
      >
        {online ? (
          <>
            <Wifi className="w-3.5 h-3.5" />
            Back online
          </>
        ) : (
          <>
            <WifiOff className="w-3.5 h-3.5" />
            No internet connection
          </>
        )}
      </div>
    </div>
  );
}
