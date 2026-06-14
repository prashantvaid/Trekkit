import { useEffect, useRef, useState } from "react";
import { getToken } from "../../api.js";
import BottomSheet from "./BottomSheet.jsx";
import { ACTIVITY_TYPES, createActivity } from "../../planner/plannerModel.js";

function parseSuggestions(text) {
  const suggestions = [];
  const patterns = [
    { re: /\[HOTEL\]\s*([^\n\[]+)/gi, type: "hotel" },
    { re: /\[RESTAURANT\]\s*([^\n\[]+)/gi, type: "restaurant" },
    { re: /\[ACTIVITY\]\s*([^\n\[]+)/gi, type: "activity" },
  ];
  for (const { re, type } of patterns) {
    let m;
    while ((m = re.exec(text))) {
      const title = m[1].trim();
      if (title) suggestions.push({ type, title });
    }
  }
  return suggestions;
}

export default function AIPlannerSheet({ open, onClose, plan, onAddSuggestion }) {
  const [text, setText] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const [prompt, setPrompt] = useState("");
  const bodyRef = useRef(null);

  const suggestions = parseSuggestions(text);

  useEffect(() => {
    if (!open) {
      setText("");
      setError("");
      setPrompt("");
    }
  }, [open]);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [text]);

  async function runAI(customPrompt) {
    setStreaming(true);
    setError("");
    setText("");

    const tripContext = {
      destination: plan?.destination,
      origin: plan?.origin,
      dates: plan?.dates,
      travelers: plan?.travelers,
      tripTypes: plan?.tripTypes,
      days: plan?.days?.map((d) => ({
        label: d.label,
        date: d.date,
        activityCount: Object.values(d.slots || {}).flat().length,
      })),
    };

    try {
      const token = getToken();
      const res = await fetch("/api/planner/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ tripContext, prompt: customPrompt }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `AI request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const chunk = JSON.parse(line);
            if (chunk.response) setText((t) => t + chunk.response);
          } catch {
            /* partial line */
          }
        }
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setStreaming(false);
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="✨ AI Suggestions" tall>
      <div className="ai-planner-sheet">
        <p className="muted small">
          Powered by Ollama — suggestions stream in real time. Tag lines like [RESTAURANT] Name get quick-add buttons.
        </p>

        <form
          className="ai-planner-prompt"
          onSubmit={(e) => {
            e.preventDefault();
            if (prompt.trim()) runAI(prompt.trim());
          }}
        >
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask for a foodie day in Kyoto, or optimize my route…"
            disabled={streaming}
          />
          <button type="submit" className="btn-primary" disabled={streaming || !prompt.trim()}>
            {streaming ? "…" : "Ask"}
          </button>
        </form>

        <button
          type="button"
          className="btn-secondary ai-planner-auto"
          disabled={streaming}
          onClick={() => runAI()}
        >
          Generate full day-by-day plan
        </button>

        {error && <div className="error">{error}</div>}

        <div className="ai-planner-stream" ref={bodyRef}>
          {text ? (
            <pre className="ai-planner-text">{text}</pre>
          ) : (
            !streaming && <p className="muted small">AI output will appear here…</p>
          )}
          {streaming && <span className="ai-planner-cursor" aria-hidden>|</span>}
        </div>

        {suggestions.length > 0 && (
          <div className="ai-planner-suggestions">
            <p className="geo-search-label">Quick add</p>
            <div className="ai-planner-suggest-list">
              {suggestions.map((s, i) => (
                <button
                  key={`${s.type}-${s.title}-${i}`}
                  type="button"
                  className="ai-chip"
                  onClick={() =>
                    onAddSuggestion?.(
                      createActivity(s.type, { title: s.title, subtitle: "From AI suggestion" })
                    )
                  }
                >
                  + {ACTIVITY_TYPES[s.type]?.label || s.type}: {s.title.slice(0, 48)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
