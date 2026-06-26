import { useState, useRef, useEffect } from "react";
import { Lock, Eye, EyeOff, ShieldCheck, X } from "lucide-react";

interface Props {
  mode: "create" | "verify";
  error: string | null;
  onSubmit: (pin: string) => void;
  onForgot?: () => void;
}

export function PinModal({ mode, error, onSubmit, onForgot }: Props) {
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  function handleSubmit() {
    setLocalError(null);
    if (mode === "create") {
      if (pin.length < 4) {
        setLocalError("PIN must be at least 4 characters");
        return;
      }
      if (pin !== confirm) {
        setLocalError("PINs do not match");
        return;
      }
    }
    if (!pin) {
      setLocalError("Please enter your PIN");
      return;
    }
    onSubmit(pin);
  }

  const displayError = localError || error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-[#111] shadow-2xl overflow-hidden">
        <div className="flex flex-col items-center pt-8 pb-2 px-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: "#FF450022" }}
          >
            {mode === "create" ? (
              <ShieldCheck className="w-8 h-8" style={{ color: "#FF4500" }} />
            ) : (
              <Lock className="w-8 h-8" style={{ color: "#FF4500" }} />
            )}
          </div>
          <h2 className="text-lg font-black text-foreground">
            {mode === "create" ? "Create Adult PIN" : "Adult Section"}
          </h2>
          <p className="text-xs text-muted-foreground text-center mt-1.5 max-w-xs leading-relaxed">
            {mode === "create"
              ? "Set a PIN to protect the adult content section. You must be 18 or older to proceed."
              : "Enter your PIN to access the adult content section."}
          </p>

          <div
            className="mt-4 mb-2 px-3 py-1.5 rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: "#FF4500" }}
          >
            🔞 18+ Content — Adults Only
          </div>
        </div>

        <div className="px-6 pb-6 space-y-3 mt-2">
          <div className="relative">
            <input
              ref={inputRef}
              type={show ? "text" : "password"}
              value={pin}
              onChange={(e) => { setPin(e.target.value); setLocalError(null); }}
              onKeyDown={(e) => e.key === "Enter" && (mode === "verify" ? handleSubmit() : undefined)}
              placeholder={mode === "create" ? "Create PIN (min. 4 chars)" : "Enter PIN"}
              className="w-full bg-input border border-border rounded-xl px-4 py-3 pr-11 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors tracking-[0.2em] font-mono"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {mode === "create" && (
            <input
              type={show ? "text" : "password"}
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setLocalError(null); }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Confirm PIN"
              className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors tracking-[0.2em] font-mono"
              autoComplete="new-password"
            />
          )}

          {displayError && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-destructive/10 border border-destructive/30">
              <X className="w-3.5 h-3.5 text-destructive shrink-0" />
              <p className="text-xs text-destructive font-semibold">{displayError}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            className="w-full py-3.5 rounded-xl text-sm font-black text-white transition-opacity active:opacity-80"
            style={{ backgroundColor: "#FF4500" }}
          >
            {mode === "create" ? "Set PIN & Enter" : "Unlock"}
          </button>

          {mode === "verify" && onForgot && (
            <button
              onClick={onForgot}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              Forgot PIN? (Reset — you'll need to set a new one)
            </button>
          )}

          <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
            By accessing this section you confirm you are 18+ and consent to viewing adult content.
          </p>
        </div>
      </div>
    </div>
  );
}
