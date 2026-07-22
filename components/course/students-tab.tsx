"use client";

import { useMemo, useState } from "react";

import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";

import type {
  JoinRequest,
  Profile,
  Section,
} from "@/lib/mock-data";

type StudentsTabProps = {
  section: Section;
  enrolled: Profile[];
  requests: JoinRequest[];
  onApprove: (requestIds: string[]) => void;
  onDecline: (requestIds: string[]) => void;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/);

  return `${parts[0]?.[0] ?? ""}${
    parts.at(-1)?.[0] ?? ""
  }`.toUpperCase();
}

function relativeTime(iso: string) {
  const elapsed =
    Date.now() - new Date(iso).getTime();

  const hours = Math.max(
    1,
    Math.round(elapsed / 3_600_000),
  );

  if (hours < 24) {
    return `${hours}h ago`;
  }

  return `${Math.round(hours / 24)}d ago`;
}

export default function StudentsTab({
  section,
  enrolled,
  requests,
  onApprove,
  onDecline,
}: StudentsTabProps) {
  const [selectedIds, setSelectedIds] =
    useState<string[]>([]);

  const [search, setSearch] = useState("");
  const [showAll, setShowAll] =
    useState(false);

  const [copied, setCopied] =
    useState(false);

  const filteredStudents = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return enrolled;
    }

    return enrolled.filter(
      (student) =>
        student.fullName
          .toLowerCase()
          .includes(query) ||
        student.institutionId
          .toLowerCase()
          .includes(query) ||
        student.email
          .toLowerCase()
          .includes(query),
    );
  }, [enrolled, search]);

  const visibleStudents = showAll
    ? filteredStudents
    : filteredStudents.slice(0, 5);

  const allSelected =
    requests.length > 0 &&
    requests.every((request) =>
      selectedIds.includes(request.id),
    );

  async function copyJoinLink() {
    const joinLink = `${window.location.origin}/join/${section.id}`;

    await navigator.clipboard.writeText(
      joinLink,
    );

    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 1600);
  }

  function toggleRequest(
    requestId: string,
  ) {
    setSelectedIds((current) =>
      current.includes(requestId)
        ? current.filter(
            (id) => id !== requestId,
          )
        : [...current, requestId],
    );
  }

  function toggleAllRequests() {
    setSelectedIds(
      allSelected
        ? []
        : requests.map(
            (request) => request.id,
          ),
    );
  }

  function approveSelected() {
    if (selectedIds.length === 0) {
      return;
    }

    onApprove(selectedIds);
    setSelectedIds([]);
  }

  function declineSelected() {
    if (selectedIds.length === 0) {
      return;
    }

    onDecline(selectedIds);
    setSelectedIds([]);
  }

  return (
    <div className="grid gap-4">
      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-muted-foreground">
              Join code · {section.name}
            </p>

            <div className="mt-1 flex flex-wrap items-center gap-5">
              <p className="font-mono text-2xl font-semibold tracking-[0.18em]">
                {section.joinCode}
              </p>

              <p
                className="flex items-center gap-1.5 text-sm"
                style={{
                  color:
                    "hsl(var(--success))",
                }}
              >
                <ShieldCheck className="h-4 w-4" />
                Auto-admits @university.edu
                emails
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={copyJoinLink}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-muted px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}

            {copied
              ? "Copied"
              : "Copy join link"}
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div
          className="flex flex-col justify-between gap-3 border-b px-5 py-4 sm:flex-row sm:items-center"
          style={{
            backgroundColor:
              "hsl(var(--primary) / 0.10)",
          }}
        >
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <UserCheck className="h-5 w-5 text-primary" />

            Pending requests ·{" "}
            {requests.length}
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={toggleAllRequests}
              disabled={requests.length === 0}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {allSelected
                ? "Clear selection"
                : "Select all"}
            </button>

            <button
              type="button"
              onClick={approveSelected}
              disabled={
                selectedIds.length === 0
              }
              className="text-sm font-medium text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Approve
            </button>

            <button
              type="button"
              onClick={declineSelected}
              disabled={
                selectedIds.length === 0
              }
              className="text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                color:
                  "hsl(var(--destructive))",
              }}
            >
              Decline
            </button>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="px-5 py-9 text-center">
            <CheckCircle2
              className="mx-auto h-7 w-7"
              style={{
                color:
                  "hsl(var(--success))",
              }}
            />

            <p className="mt-2 text-sm font-medium">
              No pending requests
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              New enrolment requests will
              appear here.
            </p>
          </div>
        ) : (
          requests.map((request) => (
            <label
              key={request.id}
              className="flex cursor-pointer items-center gap-4 border-b px-5 py-4 last:border-b-0 hover:bg-muted/40"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(
                  request.id,
                )}
                onChange={() =>
                  toggleRequest(request.id)
                }
                className="h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
              />

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {request.fullName}
                </p>

                <p
                  className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground"
                  style={
                    request.isUniversityEmail
                      ? undefined
                      : {
                          color:
                            "hsl(var(--warning))",
                        }
                  }
                >
                  {!request.isUniversityEmail && (
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  )}

                  {request.email}

                  {!request.isUniversityEmail &&
                    " · external email"}
                </p>
              </div>

              <span className="shrink-0 text-xs text-muted-foreground">
                {relativeTime(
                  request.requestedAt,
                )}
              </span>
            </label>
          ))
        )}
      </section>

      <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b px-5 py-4 sm:flex-row sm:items-center">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Users className="h-5 w-5 text-muted-foreground" />

            Enrolled · {enrolled.length}
          </h2>

          <label className="relative block w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by name, email or ID"
              className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
          </label>
        </div>

        {visibleStudents.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            {enrolled.length === 0
              ? "No students are enrolled in this section."
              : "No students match your search."}
          </p>
        ) : (
          <>
            {visibleStudents.map(
              (student) => (
                <div
                  key={student.id}
                  className="flex items-center gap-3 border-b px-5 py-4 last:border-b-0"
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-medium text-primary"
                    style={{
                      backgroundColor:
                        "hsl(var(--primary) / 0.14)",
                    }}
                  >
                    {initials(
                      student.fullName,
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {student.fullName}
                    </p>

                    <p className="truncate text-xs text-muted-foreground">
                      {student.email}
                    </p>
                  </div>

                  <span className="hidden text-xs text-muted-foreground sm:block">
                    {student.institutionId}
                  </span>

                  <span className="rounded-full border bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                    Enrolled
                  </span>
                </div>
              ),
            )}

            {filteredStudents.length > 5 && (
              <div className="border-t px-5 py-3 text-center">
                <button
                  type="button"
                  onClick={() =>
                    setShowAll(
                      (current) => !current,
                    )
                  }
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {showAll
                    ? "Show fewer students"
                    : `Show all ${filteredStudents.length} students`}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}