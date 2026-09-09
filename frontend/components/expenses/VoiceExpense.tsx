"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useExpenseSheet } from "@/components/layout/ExpenseSheetProvider";
import { useExpenseFormStore } from "@/store/expenseFormStore";
import { parseVoiceExpense } from "@/lib/voice-expense";

interface Recognition {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((event: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: {transcript: string} }> }) => void) | null;
  onerror: ((event: {error: string}) => void) | null;
  onend: (() => void) | null;
  start(): void; abort(): void;
}
type SpeechWindow = Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };

export function VoiceExpense() {
  const { open, isOpen } = useExpenseSheet();
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState("");
  const [transcript, setTranscript] = useState("");
  const recognition = useRef<Recognition | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout>>();
  const stop = () => { clearTimeout(timeout.current); recognition.current?.abort(); setListening(false); };

  useEffect(() => {
    const w = window as SpeechWindow;
    setSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
    const hide = () => { if (document.hidden) { recognition.current?.abort(); clearTimeout(timeout.current); setListening(false); } };
    document.addEventListener("visibilitychange", hide);
    return () => { recognition.current?.abort(); clearTimeout(timeout.current); document.removeEventListener("visibilitychange", hide); };
  }, []);

  function review(text: string) {
    try {
      const draft = parseVoiceExpense(text);
      stop();
      const store = useExpenseFormStore.getState();
      store.reset(); store.setDescription(draft.description); store.setTotalAmount(draft.amount); store.setCategory(draft.category);
      setMessage("Check the amount, description and category, then tap Save Expense.");
      open();
    } catch (err) { setMessage(err instanceof Error ? err.message : "Please try again."); }
  }

  function start() {
    const w = window as SpeechWindow;
    const Constructor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Constructor) return;
    recognition.current?.abort();
    const speech = new Constructor(); recognition.current = speech;
    speech.lang = "en-PK"; speech.continuous = true; speech.interimResults = false;
    setMessage("Listening. Say: Hey Pocket, I spent 500 rupees at inDrive.");
    speech.onresult = event => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (!event.results[i].isFinal) continue;
        const text = event.results[i][0].transcript.trim();
        // Some engines deliver the wake phrase as a separate result.
        if (/^hey[,.!]?\s+pocket(?:\s*campus)?[.!?,]?$/i.test(text)) { setMessage("I'm listening. Say your expense."); continue; }
        setTranscript(text); review(text); break;
      }
    };
    speech.onerror = event => {
      if (event.error === "aborted") return;
      clearTimeout(timeout.current); setListening(false);
      setMessage(event.error === "not-allowed" || event.error === "service-not-allowed"
        ? "Microphone access was denied. Allow it in your browser settings, or type your expense below."
        : event.error === "no-speech" ? "No speech detected. Tap Listen and try again."
        : event.error === "aborted" ? "Listening stopped."
        : "Speech recognition couldn't connect. Check your internet connection or type below.");
    };
    speech.onend = () => { setListening(false); clearTimeout(timeout.current); };
    try { speech.start(); setListening(true); timeout.current = setTimeout(() => {stop(); setMessage("Listening ended. Tap Listen to start again.");}, 30000); }
    catch { setMessage("Microphone could not start. Try again or type below."); }
  }

  return <section className="mx-4 my-5 rounded-2xl border border-border-subtle bg-bg-surface p-5" aria-label="Voice expense entry">
    <h2 className="text-lg font-bold text-forest">Hey Pocket</h2>
    <p className="mt-1 text-sm text-ink-soft">Say “Hey Pocket, I spent 500 rupees at inDrive.” Review it before saving.</p>
    <div className="my-3"><Button type="button" size="sm" variant="secondary" disabled={!supported || isOpen} onClick={listening ? stop : start}>{listening ? "Stop listening" : "Listen"}</Button></div>
    <p className="text-xs text-ink-soft">{supported ? "Tap Listen and allow the microphone. Listening works while this page is open, for up to 30 seconds. Your browser may send audio to its speech service." : "Voice isn't available in this browser. Try Chrome on Android or Safari on iPhone, or type below."}</p>
    {message && <p role="status" className="mt-3 text-sm font-medium text-forest">{message}</p>}
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer py-2 font-semibold">Type or correct a voice command</summary>
      <form onSubmit={e => {e.preventDefault(); review(transcript);}} className="space-y-3">
        <label className="block" htmlFor="voice-transcript">Expense command</label>
        <textarea id="voice-transcript" rows={2} maxLength={300} value={transcript} onChange={e => setTranscript(e.target.value)} placeholder="I spent 500 rupees at inDrive" className="w-full rounded-xl border border-border-subtle bg-bg-surface-elevated p-3 text-base" />
        <Button type="submit" size="sm" disabled={!transcript.trim() || isOpen}>Review expense</Button>
      </form>
    </details>
  </section>;
}
