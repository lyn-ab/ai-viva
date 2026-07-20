"use client";

// lib/hooks/use-device-settings.ts
//
// All camera/mic/speaker WebRTC logic (getUserMedia, device enumeration,
// live mic-level meter) lives here. Extracted out of
// components/settings/device-settings.tsx so more than one layout can
// consume the same underlying state without duplicating permission
// handling — DeviceSettings itself now just calls this hook.
//
// Note: getUserMedia requires HTTPS in production (localhost is fine in dev).

import { useCallback, useEffect, useRef, useState } from "react";

export type Device = { deviceId: string; label: string };

export function useDeviceSettings() {
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
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
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
            .map((d, i) => ({
              deviceId: d.deviceId,
              label: d.label || `${fallback} ${i + 1}`,
            }));
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

  // clean up the stream when the consuming component unmounts (turns the
  // camera light off)
  useEffect(() => () => stopStream(), [stopStream]);

  const onCamChange = (id: string) => {
    setCamId(id);
    start({ camId: id, micId });
  };
  const onMicChange = (id: string) => {
    setMicId(id);
    start({ camId, micId: id });
  };
  const onSpkChange = async (id: string) => {
    setSpkId(id);
    const v = videoRef.current as
      | (HTMLVideoElement & { setSinkId?: (id: string) => Promise<void> })
      | null;
    if (v?.setSinkId) {
      try {
        await v.setSinkId(id);
      } catch {
        /* not supported */
      }
    }
  };

  return {
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
    stopStream,
    onCamChange,
    onMicChange,
    onSpkChange,
  };
}