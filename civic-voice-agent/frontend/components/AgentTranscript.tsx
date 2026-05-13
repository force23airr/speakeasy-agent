"use client";

import { useEffect, useRef, useState } from "react";
import {
  AGENTS,
  DEFAULT_AGENT_ID,
  parseAgentMention,
} from "@/lib/agents";

export interface AgentTurn {
  kind: "ask" | "alert";
  q?: string;
  a: string;
  agent?: string;
  at: string;
}

interface Props {
  turns: AgentTurn[];
  busy?: boolean;
  defaultAgentId?: string;
  onSubmit: (text: string, agentId: string) => Promise<void>;
}

export default function AgentTranscript({
  turns,
  busy = false,
  defaultAgentId = DEFAULT_AGENT_ID,
  onSubmit,
}: Props) {
  const [input, setInput] = useState("");
  const [agentId, setAgentId] = useState(defaultAgentId);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns]);

  async function submit() {
    const text = input.trim();
    if (!text || busy) return;
    const { agentId: tagAgent, clean } = parseAgentMention(text);
    const targetAgent = tagAgent ?? agentId;
    setInput("");
    await onSubmit(clean, targetAgent);
  }

  return (
    <div className="chat-pane">
      <div className="chat-list" ref={listRef}>
        {turns.length === 0 ? (
          <p className="muted" style={{ padding: "0.6rem 0" }}>
            Type a message below. Use{" "}
            <code className="kbd">@watcher</code>,{" "}
            <code className="kbd">@analyst</code>, or{" "}
            <code className="kbd">@dispatcher</code> to talk to a specific agent.
          </p>
        ) : (
          <ul className="transcript-list chat">
            {turns.map((t) => (
              <li key={t.at} className={t.kind === "alert" ? "turn-alert" : ""}>
                <div className="turn-meta">
                  <span>
                    {t.kind === "alert"
                      ? "● Agent alert"
                      : t.agent
                        ? `You · @${t.agent}`
                        : "You"}
                  </span>
                  <span>{new Date(t.at).toLocaleTimeString()}</span>
                </div>
                {t.kind === "ask" && t.q && <div className="turn-q">{t.q}</div>}
                <div className="turn-a">{t.a}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="chat-input">
        <select
          className="select"
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
          disabled={busy}
          title="Target agent"
        >
          {AGENTS.map((a) => (
            <option key={a.id} value={a.id}>
              @{a.id}
            </option>
          ))}
        </select>
        <input
          type="text"
          className="text-input"
          placeholder="Type a message or @agent..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          disabled={busy}
        />
        <button onClick={submit} disabled={!input.trim() || busy}>
          {busy ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}
