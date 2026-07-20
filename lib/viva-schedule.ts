// lib/viva-schedule.ts
// Reusable scheduling logic — the "Calendly" engine. Pure functions, no UI,
// no hardcoded times. The wizard feeds availability windows + a config in;
// this produces slots out. Everything else (dashboard, booking) reads the
// existing VivaSlot shape from mock-data, so generated slots slot right in.

import { type VivaSlot } from "@/lib/mock-data";

// Teacher picks these in the wizard (phase 2):
export type AvailabilityWindow = {
  id: string;
  date: string; // "2026-07-20"
  start: string; // "09:00"
  end: string; // "12:00"
};

export type SlotGenConfig = {
  durationMin: number; // demo duration per group/student
  bufferMin: number; // gap between demos
};

// A generated (not-yet-persisted) slot. Same field shape as VivaSlot minus
// the DB-assigned bits; when published it becomes a real VivaSlot (status "open").
export type GeneratedSlot = {
  id: string;
  date: string;
  startTime: string; // local ISO, e.g. "2026-07-20T09:00:00"
  endTime: string;
};

function toLocalIso(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:00`;
}

// Core generator: walk each availability window in (duration + buffer) steps.
export function generateSlots(
  windows: AvailabilityWindow[],
  config: SlotGenConfig,
): GeneratedSlot[] {
  const out: GeneratedSlot[] = [];
  const stepMs = (config.durationMin + config.bufferMin) * 60_000;
  const durMs = config.durationMin * 60_000;

  for (const w of windows) {
    if (!w.date || !w.start || !w.end) continue;
    let cursor = new Date(`${w.date}T${w.start}:00`);
    const windowEnd = new Date(`${w.date}T${w.end}:00`);
    let i = 0;
    while (true) {
      const slotEnd = new Date(cursor.getTime() + durMs);
      if (slotEnd.getTime() > windowEnd.getTime()) break;
      out.push({
        id: `gen-${w.date}-${i}`,
        date: w.date,
        startTime: toLocalIso(cursor),
        endTime: toLocalIso(slotEnd),
      });
      cursor = new Date(cursor.getTime() + stepMs);
      i++;
    }
  }
  return out.sort((a, b) => a.startTime.localeCompare(b.startTime));
}

// Turn generated slots into real VivaSlots at publish time.
export function toVivaSlots(
  generated: GeneratedSlot[],
  meta: { sectionId: string; assignmentId: string },
): VivaSlot[] {
  return generated.map((g) => ({
    id: g.id,
    sectionId: meta.sectionId,
    assignmentId: meta.assignmentId,
    startTime: g.startTime,
    endTime: g.endTime,
    status: "open",
  })) as VivaSlot[];
}

// Dashboard numbers, computed from real slots.
export function computeStats(slots: VivaSlot[]) {
  const total = slots.length;
  const available = slots.filter((s) => s.status === "open").length;
  const booked = slots.filter((s) => s.status === "pending").length;
  const closed = slots.filter((s) => s.status === "closed").length;
  const active = available + booked;
  const occupancy = active === 0 ? 0 : Math.round((booked / active) * 100);
  return { total, available, booked, closed, occupancy };
}

// Group slots by calendar date for the agenda view.
export function groupByDate(slots: VivaSlot[]): Record<string, VivaSlot[]> {
  const map: Record<string, VivaSlot[]> = {};
  for (const s of slots) {
    const date = s.startTime.slice(0, 10);
    (map[date] ??= []).push(s);
  }
  for (const date of Object.keys(map)) {
    map[date].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }
  return map;
}