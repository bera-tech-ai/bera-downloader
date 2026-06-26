import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { aiChat } from "@/lib/api";

interface Message {
  role: "user" | "ai";
  text: string;
  ts: number;
}

const SUGGESTIONS = [
  "What's the best quality for downloading music?",
  "Recommend trending Afrobeats songs",
  "How do I convert YouTube to MP3?",
  "Top 5 songs by Burna Boy",
];

export function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: msg, ts: Date.now() }]);
    setLoading(true);
    try {
      const reply = await aiChat(msg);
      setMessages(prev => [...prev, { role: "ai", text: reply, ts: Date.now() }]);
    } catch {
      setMessages(prev => [...prev, { role: "ai", text: "Sorry, I couldn't process that. Try again.", ts: Date.now() }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: "#0d0d0d" }}>
      <div className="border-b border-border px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "#FF450022" }}>
            <Bot className="w-5 h-5" style={{ color: "#FF4500" }} />
          </div>
          <div>
            <p className="font-bold text-foreground">Bera AI</p>
            <p className="text-xs text-muted-foreground">Music assistant · Powered by DeepSeek</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-10 space-y-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: "#FF450022" }}>
                <Bot className="w-8 h-8" style={{ color: "#FF4500" }} />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">Bera AI Assistant</p>
                <p className="text-sm text-muted-foreground mt-1">Ask me about music, downloads, or anything!</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-left text-xs px-3 py-2.5 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(m => (
            <div key={m.ts} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: m.role === "ai" ? "#FF450022" : "#1565c033" }}
              >
                {m.role === "ai"
                  ? <Bot className="w-4 h-4" style={{ color: "#FF4500" }} />
                  : <User className="w-4 h-4 text-blue-400" />
                }
              </div>
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  m.role === "user"
                    ? "text-white rounded-tr-sm"
                    : "bg-card border border-border text-foreground rounded-tl-sm"
                }`}
                style={m.role === "user" ? { backgroundColor: "#FF4500" } : {}}
              >
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#FF450022" }}>
                <Bot className="w-4 h-4" style={{ color: "#FF4500" }} />
              </div>
              <div className="px-4 py-2.5 rounded-2xl rounded-tl-sm bg-card border border-border">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-border px-4 py-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Ask about music, recommendations..."
            className="flex-1 bg-input border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white transition-opacity disabled:opacity-40"
            style={{ backgroundColor: "#FF4500" }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
