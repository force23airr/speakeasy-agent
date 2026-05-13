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
      const reply = await askAgent(q);
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
      <div className="voice-row">
        <button
          className={`mic ${listening ? "listening" : ""}`}
          onClick={listening ? stop : start}
        >
          {listening ? "● Listening… tap to stop" : "🎤 Ask"}
        </button>
        {sector.prompts.map((p) => (
          <button key={p} className="btn-ghost" onClick={() => quick(p)}>
            {p}
          </button>
        ))}
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
