"use client";

import { useRef, useState } from "react";
import {
  BookOpen,
  ClipboardList,
  FileCheck2,
  FolderOpen,
  UploadCloud,
} from "lucide-react";

type MaterialKey = "handbook" | "vivaGuidance" | "resources";
type MaterialState = Record<MaterialKey, string | null>;

const MATERIALS = [
  {
    key: "handbook" as const,
    label: "Course handbook",
    description: "Upload course policies, learning outcomes and general procedures.",
    icon: BookOpen,
  },
  {
    key: "vivaGuidance" as const,
    label: "General viva guidance",
    description: "Upload instructions that apply to every viva in this course.",
    icon: ClipboardList,
  },
  {
    key: "resources" as const,
    label: "Shared course resources",
    description: "Upload templates, references and supporting resources for all students.",
    icon: FolderOpen,
  },
];

export default function CourseMaterialsTab({
  courseId,
  readOnly = false,
}: {
  courseId: string;
  // Student view: no upload control, tiles just show what the instructor
  // has provided. Same data/layout, no fork of the component.
  readOnly?: boolean;
}) {
  const [uploads, setUploads] = useState<MaterialState>({
    handbook: null,
    vivaGuidance: null,
    resources: null,
  });

  function saveFile(key: MaterialKey, file: File) {
    setUploads((current) => ({ ...current, [key]: file.name }));

    // TODO(supabase): upload this file to course storage using courseId + key.
    console.log("Course material selected", {
      courseId,
      materialType: key,
      filename: file.name,
    });
  }

  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <FolderOpen className="h-5 w-5 text-muted-foreground" />
        Course materials
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {readOnly
          ? "Shared resources for the whole course, provided by your instructor."
          : "Shared resources for the whole course. Per-assignment briefs and rubrics live on each assignment."}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {MATERIALS.map((m) => (
          <UploadTile
            key={m.key}
            label={m.label}
            description={m.description}
            filename={uploads[m.key]}
            icon={m.icon}
            readOnly={readOnly}
            onFile={(file) => saveFile(m.key, file)}
          />
        ))}
      </div>
    </section>
  );
}

function UploadTile({
  label,
  description,
  filename,
  icon: Icon,
  readOnly,
  onFile,
}: {
  label: string;
  description: string;
  filename: string | null;
  icon: typeof BookOpen;
  readOnly: boolean;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Read-only (student) tile: no input, no click handler, no upload copy.
  // TODO(supabase): once course materials are actually stored, drive
  // `filename`/availability here from the real record instead of always
  // showing the static description.
  if (readOnly) {
    return (
      <div className="flex min-h-52 w-full flex-col items-center justify-center rounded-lg border bg-muted/30 p-5 text-center">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-full text-primary"
          style={{ backgroundColor: "hsl(var(--primary) / 0.14)" }}
        >
          <Icon className="h-5 w-5" />
        </div>

        <p className="mt-3 text-sm font-medium">{label}</p>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">{description}</p>

        <span className="mt-4 text-xs font-medium text-muted-foreground">
          Provided by instructor
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="flex min-h-52 w-full flex-col items-center justify-center rounded-lg border border-dashed border-input bg-muted/30 p-5 text-center transition-colors hover:bg-accent"
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.currentTarget.value = "";
        }}
      />

      <div
        className="flex h-11 w-11 items-center justify-center rounded-full text-primary"
        style={{ backgroundColor: "hsl(var(--primary) / 0.14)" }}
      >
        {filename ? <FileCheck2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
      </div>

      <p className="mt-3 text-sm font-medium">{label}</p>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">
        {filename ? `Uploaded: ${filename}` : description}
      </p>

      <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary">
        <UploadCloud className="h-3.5 w-3.5" />
        {filename ? "Replace file" : "Choose file"}
      </span>
    </button>
  );
}