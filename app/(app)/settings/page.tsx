"use client";
 
// app/(app)/settings/page.tsx
// Settings: card-wrapped section nav + a card content panel with a profile form.
 
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  Palette,
  Camera,
  Bot,
  Accessibility,
  Bell,
  User,
} from "lucide-react";
import DeviceSettings from "@/components/settings/device-settings";
import { getCurrentUser } from "@/lib/mock-data";
 
const SECTIONS = [
  { id: "account", label: "Profile", icon: User },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "devices", label: "Devices", icon: Camera },
  { id: "viva", label: "Viva & AI", icon: Bot },
  { id: "accessibility", label: "Accessibility", icon: Accessibility },
  { id: "notifications", label: "Notifications", icon: Bell },
] as const;
 
type SectionId = (typeof SECTIONS)[number]["id"];
 
export default function SettingsPage() {
  const [active, setActive] = useState<SectionId>("account");
 
  return (
    <div>
      <h1 className="text-2xl font-semibold">Account settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your profile, devices, and viva preferences.
      </p>
 
      <div className="mt-6 grid gap-4 lg:grid-cols-[240px_1fr] lg:items-start">
        {/* section nav — its own card */}
        <nav className="rounded-xl border bg-card p-2 shadow-sm">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const on = active === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors " +
                  (on ? "font-medium text-primary" : "text-muted-foreground hover:bg-accent")
                }
                style={on ? { backgroundColor: "hsl(var(--primary) / 0.12)" } : undefined}
              >
                <Icon className="h-4 w-4" /> {s.label}
              </button>
            );
          })}
        </nav>
 
        {/* content — its own card */}
        <section className="rounded-xl border bg-card p-6 shadow-sm">
          {active === "account" && <ProfilePanel />}
          {active === "appearance" && <AppearancePanel />}
          {active === "devices" && <DeviceSettings />}
          {active === "viva" && <VivaAiPanel />}
          {active === "accessibility" && <AccessibilityPanel />}
          {active === "notifications" && (
            <Placeholder title="Notifications" note="Notification preferences are coming soon." />
          )}
        </section>
      </div>
    </div>
  );
}
 
// --- Profile (finpay-style form) ----------------------------------------
 
function initials(name: string) {
  const parts = name.replace(/^Dr\.\s*/, "").trim().split(" ");
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}
 
function ProfilePanel() {
  const user = getCurrentUser();
  const clean = user.fullName.replace(/^Dr\.\s*/, "").trim();
  const first = clean.split(" ")[0] ?? "";
  const last = clean.split(" ").slice(1).join(" ");
 
  return (
    <div className="space-y-6">
      <PanelTitle>Profile</PanelTitle>
 
      {/* avatar row */}
      <div className="flex flex-wrap items-center gap-4">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full text-lg font-medium text-primary"
          style={{ backgroundColor: "hsl(var(--primary) / 0.14)" }}
        >
          {initials(user.fullName)}
        </div>
        <div className="flex gap-2">
          {/* TODO(supabase): upload / remove avatar */}
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Upload new
          </button>
          <button className="rounded-md bg-muted px-4 py-2 text-sm font-medium hover:bg-accent">
            Remove
          </button>
        </div>
      </div>
 
      {/* fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" defaultValue={first} />
        <Field label="Last name" defaultValue={last} />
        <Field label="Email" defaultValue={user.email} type="email" />
        <Field label="Institution ID" defaultValue={user.institutionId} disabled />
        <Field label="Role" defaultValue={user.role} disabled />
      </div>
 
      <div className="flex gap-2 border-t pt-4">
        {/* TODO(supabase): persist profile changes */}
        <button className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground">
          Save changes
        </button>
        <button className="rounded-md bg-muted px-4 py-2 text-sm font-medium hover:bg-accent">
          {/* TODO(supabase): sign out */}
          Sign out
        </button>
      </div>
    </div>
  );
}
 
function Field({
  label,
  defaultValue,
  type = "text",
  disabled = false,
}: {
  label: string;
  defaultValue?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input
        type={type}
        defaultValue={defaultValue}
        disabled={disabled}
        className={
          "w-full rounded-md border bg-background px-3 py-2 text-sm capitalize outline-none focus:border-primary " +
          (disabled ? "cursor-not-allowed text-muted-foreground" : "")
        }
      />
    </label>
  );
}
 
// --- Appearance (theme is real) -----------------------------------------
 
function AppearancePanel() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const current = mounted ? theme : undefined;
 
  return (
    <div className="space-y-5">
      <PanelTitle>Appearance</PanelTitle>
      <div>
        <p className="mb-2 text-sm font-medium">Theme</p>
        <div className="flex gap-2">
          {(["light", "dark", "system"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={
                "rounded-md border px-4 py-2 text-sm capitalize transition-colors " +
                (current === t ? "border-primary text-primary" : "text-muted-foreground hover:bg-accent")
              }
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
 
// --- Viva & AI (text-to-speech is real) ---------------------------------
 
function VivaAiPanel() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceName, setVoiceName] = useState("");
  const [rate, setRate] = useState(1);
  const [showTranscript, setShowTranscript] = useState(true);
  const [allowParaphrase, setAllowParaphrase] = useState(true);
 
  useEffect(() => {
    const load = () => {
      const v = window.speechSynthesis?.getVoices() ?? [];
      setVoices(v);
      if (v.length && !voiceName) setVoiceName(v[0].name);
    };
    load();
    if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = load;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
 
  const testVoice = () => {
    const u = new SpeechSynthesisUtterance(
      "Can you explain the main architecture of your project and why you chose it?",
    );
    const v = voices.find((x) => x.name === voiceName);
    if (v) u.voice = v;
    u.rate = rate;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };
 
  return (
    <div className="space-y-5">
      <PanelTitle>Viva &amp; AI examiner</PanelTitle>
 
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">AI examiner voice</span>
        <select
          value={voiceName}
          onChange={(e) => setVoiceName(e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        >
          {voices.length === 0 && <option>Loading voices…</option>}
          {voices.map((v) => (
            <option key={v.name} value={v.name}>
              {v.name} ({v.lang})
            </option>
          ))}
        </select>
      </label>
 
      <div>
        <span className="mb-1.5 block text-sm font-medium">Speaking speed: {rate.toFixed(1)}x</span>
        <input
          type="range" min={0.5} max={1.5} step={0.1}
          value={rate} onChange={(e) => setRate(Number(e.target.value))}
          className="w-full"
        />
      </div>
 
      <button onClick={testVoice} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
        Test voice
      </button>
 
      <div className="space-y-3 border-t pt-4">
        <Toggle label="Show live transcript during viva" checked={showTranscript} onChange={setShowTranscript} />
        <Toggle label="Let the AI rephrase a question if I'm confused" checked={allowParaphrase} onChange={setAllowParaphrase} />
      </div>
    </div>
  );
}
 
// --- Accessibility (local toggles) --------------------------------------
 
function AccessibilityPanel() {
  const [captions, setCaptions] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  return (
    <div className="space-y-4">
      <PanelTitle>Accessibility</PanelTitle>
      <Toggle label="Captions during viva" checked={captions} onChange={setCaptions} />
      <Toggle label="Reduce motion" checked={reducedMotion} onChange={setReducedMotion} />
      <Toggle label="High contrast" checked={highContrast} onChange={setHighContrast} />
      <Toggle label="Larger text" checked={largeText} onChange={setLargeText} />
      <p className="text-xs text-muted-foreground">
        These preferences will apply across the app once wired up.
      </p>
    </div>
  );
}
 
// --- shared bits --------------------------------------------------------
 
function PanelTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold">{children}</h2>;
}
 
function Placeholder({ title, note }: { title: string; note: string }) {
  return (
    <div>
      <PanelTitle>{title}</PanelTitle>
      <p className="mt-2 text-sm text-muted-foreground">{note}</p>
    </div>
  );
}
 
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className="flex w-full items-center justify-between text-left text-sm">
      <span>{label}</span>
      <span
        className="relative h-5 w-9 rounded-full transition-colors"
        style={{ backgroundColor: checked ? "hsl(var(--primary))" : "hsl(var(--muted))" }}
      >
        <span
          className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
          style={{ left: checked ? "1.125rem" : "0.125rem" }}
        />
      </span>
    </button>
  );
}
