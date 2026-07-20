"use client";

// components/course/course-ui.tsx
// Shared presentational primitives extracted from the monolith.
// Used by the course tabs, the assignment detail page, and the modals.

import { type ChangeEvent, type ReactNode, useRef } from "react";
import {
  AlertTriangle,
  FileCheck2,
  FileText,
  UploadCloud,
  X,
} from "lucide-react";

export function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-card p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <span className="text-muted-foreground">{icon}</span>
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

export function CompactUpload({
  label,
  filename,
  onFile,
}: {
  label: string;
  filename: string | null;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="flex w-full items-center gap-3 rounded-lg border border-dashed border-input bg-muted/30 p-3 text-left transition-colors hover:bg-accent"
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
        }}
      />
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-primary"
        style={{ backgroundColor: "hsl(var(--primary) / 0.14)" }}
      >
        {filename ? <FileCheck2 className="h-4 w-4" /> : <UploadCloud className="h-4 w-4" />}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{filename || "Choose a file"}</p>
      </div>
    </button>
  );
}

export function LargeUpload({
  label,
  description,
  filename,
  icon: Icon,
  onFile,
}: {
  label: string;
  description: string;
  filename: string | null;
  icon: typeof FileText;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-input bg-muted/30 p-5 text-center transition-colors hover:bg-accent"
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
        }}
      />
      <div
        className="flex h-11 w-11 items-center justify-center rounded-full text-primary"
        style={{ backgroundColor: "hsl(var(--primary) / 0.14)" }}
      >
        {filename ? <FileCheck2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
      </div>
      <p className="mt-3 text-sm font-medium">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {filename ? `Uploaded: ${filename}` : description}
      </p>
      <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary">
        <UploadCloud className="h-3.5 w-3.5" />
        {filename ? "Replace file" : "Choose file"}
      </span>
    </button>
  );
}

export function ModalShell({
  children,
  onBackdrop,
}: {
  children: ReactNode;
  onBackdrop: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onBackdrop();
      }}
    >
      {children}
    </div>
  );
}

export function ModalHeader({
  title,
  description,
  onClose,
}: {
  title: string;
  description: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between border-b px-6 py-5">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

export function ModalFooter({
  onCancel,
  submitLabel,
}: {
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <footer className="flex items-center justify-end gap-2 border-t px-6 py-4">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-md bg-muted px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
      >
        Cancel
      </button>
      <button
        type="submit"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        {submitLabel}
      </button>
    </footer>
  );
}

export function ErrorBanner({ children }: { children: ReactNode }) {
  return (
    <div
      className="mb-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
      style={{
        borderColor: "hsl(var(--destructive) / 0.35)",
        color: "hsl(var(--destructive))",
        backgroundColor: "hsl(var(--destructive) / 0.08)",
      }}
    >
      <AlertTriangle className="h-4 w-4 shrink-0" />
      {children}
    </div>
  );
}

export function Field({
  label,
  required = false,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`block space-y-2 ${className}`}>
      <span className="text-sm font-medium">
        {label}
        {required && <span style={{ color: "hsl(var(--destructive))" }}> *</span>}
      </span>
      {children}
    </label>
  );
}

export function ReviewCard({
  title,
  className = "",
  children,
}: {
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`rounded-lg border bg-muted/30 p-4 ${className}`}>
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

export function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b py-2 text-sm last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}