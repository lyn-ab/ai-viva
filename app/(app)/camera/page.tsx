"use client";

import { useRouter } from "next/navigation";
import {
  Camera,
  Mic,
  Volume2,
  Video,
  AlertCircle,
  CheckCircle2,
  CircleAlert,
  Rocket,
} from "lucide-react";
import { useDeviceSettings, type Device } from "@/lib/hooks/use-device-settings";
import { CaptioningTest } from "@/components/camera/captioning-test";
import { useState } from "react";

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

function StatusTile({
  ready,
  label,
  detail,
}: {
  ready: boolean;
  label: string;
  detail: string;
}) {
  return (
    <div
      className="flex flex-col items-center gap-1 rounded-lg border px-4 py-4 text-center"
      style={{
        backgroundColor: ready
          ? "hsl(var(--success) / 0.10)"
          : "hsl(var(--muted))",
      }}
    >
      {ready ? (
        <CheckCircle2 className="h-5 w-5" style={{ color: "hsl(var(--success))" }} />
      ) : (
        <CircleAlert className="h-5 w-5 text-muted-foreground" />
      )}
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p
        className="text-xs"
        style={{ color: ready ? "hsl(var(--success))" : undefined }}
      >
        <span className={ready ? "" : "text-muted-foreground"}>{detail}</span>
      </p>
    </div>
  );
}

export default function CameraTestPage() {
  const router = useRouter();
  const {
    videoRef,
    enabled,
    error,
    cameras,
    mics,
    speakers,
    camId,
    micId,
    spkId,
    level,
    start,
    onCamChange,
    onMicChange,
    onSpkChange,
  } = useDeviceSettings();

  const [captioningReady, setCaptioningReady] = useState(false);

  // Camera and mic are granted together via a single getUserMedia call in
  // the shared hook, so both statuses reflect the same `enabled` signal.
  const cameraReady = enabled;
  const audioReady = enabled;
  const allReady = cameraReady && audioReady && captioningReady;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-base font-semibold">Camera &amp; microphone test</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ensure your equipment is working before starting the viva.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Camera panel */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-base font-semibold">Camera test</h2>
          </div>

          <div className="relative mx-auto mt-3 aspect-video w-full max-w-md overflow-hidden rounded-lg border bg-black">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover"
            />
            {!enabled && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
                <Camera className="h-7 w-7 text-white/60" />
                <p className="text-xs text-white/70">Camera preview appears here</p>
                <button
                  onClick={() => start()}
                  className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                >
                  <Video className="h-3.5 w-3.5" /> Enable camera &amp; mic
                </button>
              </div>
            )}
            {enabled && (
              <span className="absolute right-2 top-2 flex items-center gap-1.5 rounded-full bg-black/50 px-2 py-1 text-xs text-white">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: "hsl(var(--destructive))" }}
                />
                Live
              </span>
            )}
          </div>

          {error && (
            <div
              className="mt-3 flex items-start gap-2 rounded-lg p-3 text-sm"
              style={{
                backgroundColor: "hsl(var(--destructive) / 0.12)",
                color: "hsl(var(--destructive))",
              }}
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {enabled && (
            <div className="mt-3 flex items-center justify-between rounded-lg border bg-muted px-3 py-2 text-sm">
              <span className="text-foreground">Camera connected</span>
              <span className="text-xs text-muted-foreground">
                {cameras.find((c) => c.deviceId === camId)?.label ?? "Default camera"}
              </span>
            </div>
          )}

          {enabled && cameras.length > 0 && (
            <div className="mt-3">
              <Picker icon={Camera} label="Camera" value={camId} options={cameras} onChange={onCamChange} />
            </div>
          )}
        </div>

        {/* Microphone panel */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-base font-semibold">Microphone test</h2>
          </div>

          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between text-sm text-muted-foreground">
              <span>Audio level</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-[width] duration-75"
                style={{
                  width: `${Math.round(level * 100)}%`,
                  backgroundColor:
                    level > 0.85 ? "hsl(var(--destructive))" : "hsl(var(--success))",
                }}
              />
            </div>
            {enabled && (
              <p className="mt-1 text-xs text-muted-foreground">Speak — the bar should move.</p>
            )}
          </div>

          {enabled && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between rounded-lg border bg-muted px-3 py-2 text-sm">
                <span className="text-foreground">Microphone connected</span>
                <span className="text-xs text-muted-foreground">
                  {mics.find((m) => m.deviceId === micId)?.label ?? "Default microphone"}
                </span>
              </div>
            </div>
          )}

          {!enabled && (
            <p className="mt-3 text-xs text-muted-foreground">
              Enable your camera and microphone on the left to test audio.
            </p>
          )}

          {enabled && (mics.length > 0 || speakers.length > 0) && (
            <div className="mt-3 grid gap-3">
              {mics.length > 0 && (
                <Picker icon={Mic} label="Microphone" value={micId} options={mics} onChange={onMicChange} />
              )}
              {speakers.length > 0 && (
                <Picker icon={Volume2} label="Speaker" value={spkId} options={speakers} onChange={onSpkChange} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Captioning test */}
      <CaptioningTest onDetected={setCaptioningReady} />

      {/* System status */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold">System status</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <StatusTile
            ready={cameraReady}
            label="Camera ready"
            detail={cameraReady ? "No issues detected" : "Not connected"}
          />
          <StatusTile
            ready={audioReady}
            label="Audio ready"
            detail={audioReady ? "Clear signal" : "Not connected"}
          />
          <StatusTile
            ready={captioningReady}
            label="Captioning ready"
            detail={captioningReady ? "Detecting speech" : "Not tested yet"}
          />
        </div>

        <button
          onClick={() => router.push("/examination")}
          disabled={!allReady}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Rocket className="h-4 w-4" />
          Start viva examination
        </button>
      </div>
    </div>
  );
}