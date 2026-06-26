import { useCallback, useEffect, useState } from "react";

const KEY = "bera_quality_pref";

interface QualityPref {
  mp3: string;
  mp4: string;
}

const DEFAULTS: QualityPref = { mp3: "128kbps", mp4: "720" };

export function useQualityPreference() {
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

  return { pref, setQuality };
}
