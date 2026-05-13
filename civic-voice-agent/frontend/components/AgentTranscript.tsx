"use client";

export interface AgentTurn {
  q: string;
  a: string;
  at: string;
}

interface Props {
  turns: AgentTurn[];
}

export default function AgentTranscript({ turns }: Props) {
  if (turns.length === 0) {
    return <p className="muted">No conversation yet. Ask the agent something.</p>;
  }
  return (
    <ul className="transcript-list">
      {turns
        .slice()
        .reverse()
        .map((t) => (
          <li key={t.at}>
            <div className="turn-meta">
              <span>You</span>
              <span>{new Date(t.at).toLocaleTimeString()}</span>
            </div>
            <div className="turn-q">{t.q}</div>
            <div className="turn-a">{t.a}</div>
          </li>
        ))}
    </ul>
  );
}
