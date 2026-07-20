"use client";

// components/settings/device-settings.tsx
//
// Functional camera / microphone / speaker settings using the browser's
// WebRTC APIs. Live preview + real mic level meter + device selection.
// Reusable by both the Settings page and the pre-viva Camera Test page.
//
// Note: getUserMedia requires HTTPS in production (localhost is fine in dev).
// Vercel serves HTTPS, so deployment is covered.

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Mic, Volume2, AlertCircle, Video } from "lucide-react";

type Device = { deviceId: string; label: string };

export default function DeviceSettings({
  onReadyChange,
}: {
  // Fired whenever camera+mic access is granted/lost. getUserMedia below is
  // requested as a single { video: true, audio: true } call, so camera and
  // mic permission are granted or denied together — there is no independent
  // camera-only / mic-only signal to expose here.
  onReadyChange?: (ready: boolean) => void;
} = {}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);

  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<Device[]>([]);
  const [mics, setMics] = useState<Device[]>([]);
  const [speakers, setSpeakers] = useState<Device[]>([]);
  const [camId, setCamId] = useState("");
  const [micId, setMicId] = useState("");
  const [spkId, setSpkId] = useState("");
  const [level, setLevel] = useState(0); // mic level 0..1

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    setLevel(0);
  }, []);

  // live mic level meter via Web Audio
  const setupMeter = useCallback((stream: MediaStream) => {
    const AC: typeof AudioContext =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    audioCtxRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    const data = new Uint8Array(analyser.fftSize);
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      setLevel(Math.min(1, rms * 2.5));
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, []);

  const start = useCallback(
    async (opts?: { camId?: string; micId?: string }) => {
      setError(null);
      stopStream();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: opts?.camId ? { deviceId: { exact: opts.camId } } : true,
          audio: opts?.micId ? { deviceId: { exact: opts.micId } } : true,
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setupMeter(stream);
        setEnabled(true);

        // device labels are only available AFTER permission is granted
        const devices = await navigator.mediaDevices.enumerateDevices();
        const map = (kind: string, fallback: string) =>
          devices
            .filter((d) => d.kind === kind)
            .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `${fallback} ${i + 1}` }));
        setCameras(map("videoinput", "Camera"));
        setMics(map("audioinput", "Microphone"));
        setSpeakers(map("audiooutput", "Speaker"));

        const v = stream.getVideoTracks()[0]?.getSettings().deviceId ?? "";
        const a = stream.getAudioTracks()[0]?.getSettings().deviceId ?? "";
        setCamId(v);
        setMicId(a);
      } catch (e) {
        const name = (e as { name?: string })?.name;
        setError(
          name === "NotAllowedError"
            ? "Permission denied. Allow camera and microphone access in your browser, then try again."
            : name === "NotFoundError"
              ? "No camera or microphone found on this device."
              : "Could not access your camera or microphone.",
        );
        setEnabled(false);
      }
    },
    [setupMeter, stopStream],
  );

  // clean up the stream when the component unmounts (turns the camera light off)
  useEffect(() => () => stopStream(), [stopStream]);

  // let a parent (e.g. the examination page) know when devices become
  // ready/not-ready, so it can gate its own UI without duplicating any of
  // the getUserMedia/permission logic above.
  useEffect(() => {
    onReadyChange?.(enabled);
  }, [enabled, onReadyChange]);

  const onCamChange = (id: string) => { setCamId(id); start({ camId: id, micId }); };
  const onMicChange = (id: string) => { setMicId(id); start({ camId, micId: id }); };
  const onSpkChange = async (id: string) => {
    setSpkId(id);
    const v = videoRef.current as (HTMLVideoElement & { setSinkId?: (id: string) => Promise<void> }) | null;
    if (v?.setSinkId) { try { await v.setSinkId(id); } catch { /* not supported */ } }
  };

  return (
    <div className="space-y-4">
      {/* preview */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-black">
        <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
        {!enabled && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
            <Camera className="h-8 w-8 text-white/60" />
            <p className="text-sm text-white/70">Camera preview appears here</p>
            <button
              onClick={() => start()}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              <Video className="h-4 w-4" /> Enable camera &amp; microphone
            </button>
          </div>
        )}
        {enabled && (
          <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2 py-1 text-xs text-white">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "hsl(var(--destructive))" }} /> Live
          </span>
        )}
      </div>

      {error && (
        <div
          className="flex items-start gap-2 rounded-lg p-3 text-sm"
          style={{ backgroundColor: "hsl(var(--destructive) / 0.12)", color: "hsl(var(--destructive))" }}
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* mic level meter */}
      <div>
        <div className="mb-1.5 flex items-center gap-2 text-sm text-muted-foreground">
          <Mic className="h-4 w-4" /> Microphone level
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-[width] duration-75"
            style={{
              width: `${Math.round(level * 100)}%`,
              backgroundColor: level > 0.85 ? "hsl(var(--destructive))" : "hsl(var(--success))",
            }}
          />
        </div>
        {enabled && (
          <p className="mt-1 text-xs text-muted-foreground">Speak — the bar should move.</p>
        )}
      </div>

      {/* device pickers (populated once enabled) */}
      {enabled && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Picker icon={Camera} label="Camera" value={camId} options={cameras} onChange={onCamChange} />
          <Picker icon={Mic} label="Microphone" value={micId} options={mics} onChange={onMicChange} />
          {speakers.length > 0 && (
            <Picker icon={Volume2} label="Speaker" value={spkId} options={speakers} onChange={onSpkChange} />
          )}
          <div className="flex items-end">
            <button
              onClick={stopStream}
              className="rounded-md bg-muted px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Turn off
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Picker({
  icon: Icon,
  label,
  value,
  options,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  options: Device[];
  onChange: (id: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4" /> {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
      >
        {options.map((o) => (
          <option key={o.deviceId} value={o.deviceId}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}