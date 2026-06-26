import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "bera_adult_pin_hash";

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function useAdultAuth() {
  const [hasPin, setHasPin] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setHasPin(!!localStorage.getItem(STORAGE_KEY));
  }, []);

  const createPin = useCallback(async (pin: string): Promise<boolean> => {
    if (pin.length < 4) {
      setError("PIN must be at least 4 characters");
      return false;
    }
    const hash = await sha256(pin);
    localStorage.setItem(STORAGE_KEY, hash);
    setHasPin(true);
    setUnlocked(true);
    setError(null);
    return true;
  }, []);

  const verifyPin = useCallback(async (pin: string): Promise<boolean> => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setError("No PIN set");
      return false;
    }
    const hash = await sha256(pin);
    if (hash === stored) {
      setUnlocked(true);
      setError(null);
      return true;
    }
    setError("Incorrect PIN. Try again.");
    return false;
  }, []);

  const resetPin = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHasPin(false);
    setUnlocked(false);
    setError(null);
  }, []);

  const lock = useCallback(() => setUnlocked(false), []);

  const clearError = useCallback(() => setError(null), []);

  return { hasPin, unlocked, error, createPin, verifyPin, resetPin, lock, clearError };
}
