"use client";

// components/camera/captioning-test.tsx
//
// TODO(whisper): this is a browser-only capability check (Web Speech API,
// Chrome/Edge only). The production viva pipeline will use Whisper via the
// Python backend, not this API — this component only proves the mic +
// captioning path works before a session starts. It is NOT reused by the
// examination page's transcript panel.

import { useCallback, useEffect, useRef, useState } from "react";
import { Captions, Mic, CircleAlert } from "lucide-react";

// Minimal shape of the Web Speech API — not in TS's default DOM lib.
interface SpeechRecognitionResultLike {
  0: { transcript: string };
  isFinal: boolean;
}
interface SpeechRecognitionEventLike extends Event {
  results: ArrayLike<SpeechRecognitionResultLike>;
  resultIndex: number;
}
interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: Event) => void) | null;
  onend: (() => void) | null;
}

export function CaptioningTest({
  onDetected,
}: {
  // Fires once real speech has been detected, so a parent can mark
  // "captioning ready" in a system-status summary.
  onDetected?: (detected: boolean) => void;
}) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [detected, setDetected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const SpeechRecognitionCtor =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike })
        .webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (e: SpeechRecognitionEventLike) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      setTranscript(text);
      if (text.trim().length > 0) {
        setDetected(true);
        onDetected?.(true);
      }
    };
    recognition.onerror = () => {
      setError("Couldn't access the microphone for captioning.");
      setListening(false);
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setError(null);
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  }, [listening]);

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Captions className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-base font-semibold">Captioning test</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Say something to confirm live captioning can detect your speech.
      </p>

      {!supported ? (
        <div
          className="mt-3 flex items-start gap-2 rounded-lg p-3 text-sm"
          style={{ backgroundColor: "hsl(var(--warning) / 0.12)", color: "hsl(var(--warning))" }}
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Live captioning isn&apos;t supported in this browser. Try Chrome or Edge.</span>
        </div>
      ) : (
        <>
          <div className="mt-3 min-h-16 rounded-lg border bg-muted p-3 text-sm text-foreground">
            {transcript || (
              <span className="text-muted-foreground">
                Your captions will appear here as you speak…
              </span>
            )}
          </div>

          {error && (
            <p className="mt-2 text-xs" style={{ color: "hsl(var(--destructive))" }}>
              {error}
            </p>
          )}

          <div className="mt-3 flex items-center justify-between">
            <button
              onClick={toggleListening}
              className={
                listening
                  ? "flex items-center gap-2 rounded-md bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
                  : "flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              }
            >
              <Mic className="h-4 w-4" />
              {listening ? "Stop test" : "Test captioning"}
            </button>

            {detected && (
              <span
                className="text-xs font-medium"
                style={{ color: "hsl(var(--success))" }}
              >
                Detecting speech correctly
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}