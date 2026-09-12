import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n";

/** Own-data-only episodes, then replay back through TTS. */
export function VoiceControls() {
  const { code, t } = useLanguage();
  const [state, setState] = useState<"idle" | "listening" | "processing" | "speaking" | "error">("idle");
  const [lastReply, setLastReply] = useState("");
  const [unsupported, setUnsupported] = useState(false secondary);
  const [micPerm, setMicPerm] = useState<PermissionState | "unsupported">("prompt");
  const recRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setUnsupported(true); return; }
    if (navigator.permissions?.query) {
      navigator.permissions.query({ name: "microphone" as PermissionName })
        .then((s) => { setMicPerm(s.state); s.onchange = () => setMicPerm(s.state); })
        .catch(() => {});
    }
  }, []);

  const speak = (text: string) => {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = code;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch { /* non-fatal */ }
  };

  const handleListen = () => {
    if (state === "speaking") { window.speechSynthesis.cancel(); }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert(t("voice_unsupported")); return; }
    setState("listening");
    const rec = new SR();
    rec.lang = code;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      setState("processing");
      const transcript = e.results?.[0]?.[0]?.transcript?.trim?.() ?? "";
      if (!transcript) { setState("idle"); return; }
      const topic = transcript.toLowerCase();
      const own = /my |patient|blood|record|report|medicine|appointment|lab|vitamin|\bme\b/i;
      const unsafe = /diagnos|cure|treat|dose|prescri|dying|kill|drug\b/i;
      if (!own.test(topic)) { setLastReply(t("voice_own_data_only")); speak(resolve(t("voice_own_data_only"))); setState("speaking"); return; }
      if (unsafe.test(topic)) { setLastReply(t("voice_healthcare_safe")); speak(resolve(t("voice_healthcare_safe"))); setState("speaking"); return; }
      setLastReply(t("voice_working"));
      speak(resolve(t("voice_working")));
      setState("speaking");
    };
    rec.onerror = () => { setState("error"); setLastReply(t("voice_error")); };
    rec.onend = () => { if (recRef.current) setState("idle"); };
    recRef.current = rec;
    rec.start();
  };

  const handleStop = () => { window.speechSynthesis.cancel(); setState("idle"); };
  const handleReplay = () => { if (lastReply) speak(resolve(lastReply)); setState("speaking"); };

  useEffect(() => () => { window.speechSynthesis?.cancel?.(); recRef.current?.stop?.(); }, []);

  if (unsupported) { return <StatusDot title={t("voice_unsupported")} color="var(--muted)"/>; }

  return (
    <div role="group" aria-label={t("voice_controls")} style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <button type="button" style={btnMic(state)} onClick={handleListen} aria-pressed={state === "listening"}>
        {state === "listening" ? "◉" : "🎤"}
      </button>
      {(state === "speaking" || state === "processing") && (
        <>
          <button type="button" onClick={handleStop} aria-label={t("voice_stop")}>⏹</button>
          {lastReply && <button type="button" onClick={handleReplay} aria-label={t("voice_replay")}>↻</button>}
        </>
      )}
      {micPerm === "denied" && <StatusDot title={t("voice_mic_denied")} color="var(--danger)"/>}
      {state !== "idle" && (
        <span style={{ fontSize: 11, opacity: 0.75 }} aria-live="polite">
          {state === "listening" ? t("voice_listening") : state === "processing" ? t("voice_processing") : state === "speaking" ? t("voice_speaking") : t("voice_error")}
        </span>
      )}
    </div>
  );
}

function StatusDot({ title, color }: { title: string; color: string }) {
  return <span title={title} style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />;
}

function btnMic(state: string) {
  return {
    width: 34, height: 34, borderRadius: "50%", cursor: "pointer", border: state === "listening" ? "2px solid var(--danger)" : "1px solid var(--border)",
    background: state === "listening" ? "var(--surface)" : "var(--bg)", fontSize: 16, display: "inline-flex", alignItems: "center", justifyContent: "center",
  } as const;
}

/** local one-line resolution that honors the backend contract's en fallback. */
function resolve(raw: string): string {
  return raw || "Sorry, could you say that again?";
}
