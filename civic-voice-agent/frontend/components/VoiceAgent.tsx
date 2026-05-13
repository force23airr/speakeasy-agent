"use client";

import { useRef, useState } from "react";
import { askAgent } from "@/lib/api";
import { getRecognition, speak } from "@/lib/speech";
import { Sector } from "@/lib/sectors";

interface Props {
  sector: Sector;
  onTurn: (q: string, a: string) => void;
}

export default function VoiceAgent({ sector, onTurn }: Props) {
  const [listening, setListening] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<any>(null);

  async function handleAnswer(q: string) {
    try {
      const { answer: reply } = await askAgent(q, sector.label);
      setAnswer(reply);
      speak(reply);
      onTurn(q, reply);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function start() {
    setError(null);
    setAnswer("");
    const rec = getRecognition();
    if (!rec) {
      setError("SpeechRecognition not supported in this browser. Try Chrome.");
      return;
    }
    recRef.current = rec;
    rec.onresult = async (event: any) => {
      const text = event.results[0][0].transcript as string;
      setQuestion(text);
      await handleAnswer(text);
    };
    rec.onerror = (e: any) => setError(`Mic error: ${e.error ?? "unknown"}`);
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  }

  function stop() {
    recRef.current?.stop?.();
    setListening(false);
  }

  async function quick(prompt: string) {
    setError(null);
    setQuestion(prompt);
    setAnswer("");
    await handleAnswer(prompt);
  }

  return (
    <div>
      <button
        className={`mic-large ${listening ? "listening" : ""}`}
        onClick={listening ? stop : start}
      >
        <span className="mic-icon">{listening ? "●" : "🎤"}</span>
        <span>{listening ? "Listening · tap to stop" : "Speak"}</span>
      </button>

      <div className="prompt-section">
        <div className="prompt-section-label">
          Quick prompts · <span className="prompt-sector">{sector.label}</span>
        </div>
        <div className="prompt-grid">
          {sector.prompts.map((p) => (
            <button
              key={p}
              className="prompt-button"
              onClick={() => quick(p)}
              title={`Send: ${p}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {question && (
        <p className="transcript">
          You: <em>{question}</em>
        </p>
      )}
      {answer && <div className="answer">{answer}</div>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
