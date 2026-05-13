"use client";

// Minimal cross-browser SpeechRecognition helper.
type AnyWindow = typeof window & {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
};

export function getRecognition(): any | null {
  if (typeof window === "undefined") return null;
  const w = window as AnyWindow;
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = "en-US";
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  return rec;
}

export function speak(text: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}
