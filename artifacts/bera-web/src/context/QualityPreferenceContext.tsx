import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const KEY = "bera_quality_pref";

interface QualityPref { mp3: string; mp4: string; }
const DEFAULTS: QualityPref = { mp3: "128kbps", mp4: "720" };

interface QualityPreferenceCtx {
  pref: QualityPref;
  setQuality: (type: "mp3" | "mp4", quality: string) => void;
}

const QualityPreferenceContext = createContext<QualityPreferenceCtx>({
  pref: DEFAULTS,
  setQuality: () => {},
});

export function QualityPreferenceProvider({ children }: { children: React.ReactNode }) {
  const [pref, setPref] = useState<QualityPref>(DEFAULTS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setPref({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {}
  }, []);

  const setQuality = useCallback((type: "mp3" | "mp4", quality: string) => {
    setPref((prev) => {
      const next = { ...prev, [type]: quality };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo(() => ({ pref, setQuality }), [pref, setQuality]);

  return (
    <QualityPreferenceContext.Provider value={value}>
      {children}
    </QualityPreferenceContext.Provider>
  );
}

export function useQualityPreference() {
  return useContext(QualityPreferenceContext);
}
