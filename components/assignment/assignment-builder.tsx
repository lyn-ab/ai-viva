"use client";

import {
  type FormEvent,
  useState,
} from "react";

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  Info,
  ListChecks,
  Paperclip,
  Plus,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import type {
  Assignment,
  RubricCriterion,
} from "@/lib/mock-data";

import {
  ErrorBanner,
  Field,
  ModalHeader,
  ModalShell,
  ReviewCard,
  ReviewRow,
} from "@/components/course/course-ui";

type BuilderTab =
  | "details"
  | "content"
  | "rubric"
  | "review";

type Material =
  | "report"
  | "code"
  | "slides"
  | "other";

type AssignmentBuilderProps = {
  sectionId: string;
  onClose: () => void;
  onCreated: (
    assignment: Assignment,
  ) => void;
};

const TABS: {
  id: BuilderTab;
  label: string;
  icon: LucideIcon;
}[] = [
  {
    id: "details",
    label: "Details",
    icon: Info,
  },
  {
    id: "content",
    label: "Content",
    icon: FileText,
  },
  {
    id: "rubric",
    label: "Rubric & AI focus",
    icon: ListChecks,
  },
  {
    id: "review",
    label: "Review",
    icon: CheckCircle2,
  },
];

export default function AssignmentBuilder({
  sectionId,
  onClose,
  onCreated,
}: AssignmentBuilderProps) {
  const [activeTab, setActiveTab] =
    useState<BuilderTab>("details");

  const [title, setTitle] =
    useState("");

  const [dueDate, setDueDate] =
    useState("");

  const [totalMarks, setTotalMarks] =
    useState(100);

  const [mode, setMode] =
    useState<Assignment["mode"]>(
      "individual",
    );

  const [
    maxGroupSize,
    setMaxGroupSize,
  ] = useState(4);

  const [description, setDescription] =
    useState("");

  const [
    requiredMaterials,
    setRequiredMaterials,
  ] = useState<Material[]>([]);

  const [
    otherMaterialLabel,
    setOtherMaterialLabel,
  ] = useState("");

  const [rubric, setRubric] =
    useState<RubricCriterion[]>([
      {
        criterion:
          "Technical implementation",
        weight: 50,
      },
      {
        criterion:
          "Explanation and understanding",
        weight: 50,
      },
    ]);

  const [focusNotes, setFocusNotes] =
    useState("");

  const [error, setError] =
    useState("");

  const activeIndex = TABS.findIndex(
    (tab) => tab.id === activeTab,
  );

  const rubricTotal = rubric.reduce(
    (total, criterion) =>
      total +
      Number(criterion.weight || 0),
    0,
  );

  function changeTab(tab: BuilderTab) {
    setError("");
    setActiveTab(tab);
  }

  function toggleMaterial(
    material: Material,
  ) {
    setRequiredMaterials((current) =>
      current.includes(material)
        ? current.filter(
            (item) => item !== material,
          )
        : [...current, material],
    );
  }

  function materialLabel(
    material: Material,
  ): string {
    switch (material) {
      case "report":
        return "Project report";
      case "code":
        return "Source code";
      case "slides":
        return "Presentation slides";
      case "other":
        return (
          otherMaterialLabel.trim() ||
          "Other"
        );
    }
  }

  function equalWeights(
    count: number,
  ): number[] {
    if (count === 0) return [];

    const base = Math.floor(
      100 / count,
    );
    const extra = 100 - base * count;

    return Array.from(
      { length: count },
      (_, index) =>
        base + (index < extra ? 1 : 0),
    );
  }

  function updateCriterionName(
    index: number,
    value: string,
  ) {
    setRubric((current) =>
      current.map(
        (criterion, criterionIndex) =>
          criterionIndex === index
            ? {
                ...criterion,
                criterion: value,
              }
            : criterion,
      ),
    );
  }

  function updateWeight(
    index: number,
    value: number,
  ) {
    setRubric((current) =>
      current.map(
        (criterion, criterionIndex) =>
          criterionIndex === index
            ? {
                ...criterion,
                weight: value,
              }
            : criterion,
      ),
    );
  }

  function commitWeight(index: number) {
    setRubric((current) => {
      if (current.length < 2) {
        return current;
      }

      const edited = Math.min(
        100,
        Math.max(
          0,
          Math.round(
            Number(
              current[index].weight,
            ) || 0,
          ),
        ),
      );

      const others =
        current.length - 1;
      const remaining =
        100 - edited;
      const base = Math.floor(
        remaining / others,
      );
      const extra =
        remaining - base * others;

      let extraGiven = 0;

      return current.map(
        (criterion, criterionIndex) => {
          if (
            criterionIndex === index
          ) {
            return {
              ...criterion,
              weight: edited,
            };
          }

          const bonus =
            extraGiven < extra
              ? 1
              : 0;

          extraGiven += bonus;

          return {
            ...criterion,
            weight: base + bonus,
          };
        },
      );
    });
  }

  function submit(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (!title.trim()) {
      setError(
        "Enter an assignment title before saving.",
      );

      setActiveTab("details");
      return;
    }

    if (!dueDate) {
      setError(
        "Choose a due date before saving.",
      );

      setActiveTab("details");
      return;
    }

    if (totalMarks < 1) {
      setError(
        "Total marks must be at least 1.",
      );

      setActiveTab("details");
      return;
    }

    if (
      rubric.some(
        (criterion) =>
          !criterion.criterion.trim(),
      )
    ) {
      setError(
        "Every rubric row needs a criterion name.",
      );

      setActiveTab("rubric");
      return;
    }

    if (rubricTotal !== 100) {
      setError(
        "Rubric weights must add up to 100%.",
      );

      setActiveTab("rubric");
      return;
    }

    const assignment: Assignment = {
      id: `local-assignment-${Date.now()}`,
      sectionId,
      title: title.trim(),
      dueDate,
      totalMarks,
      mode,
      description:
        description.trim(),
      requiredMaterials:
        requiredMaterials.map(
          (material) =>
            material === "other"
              ? materialLabel(
                  material,
                )
              : material,
        ),
      rubric,
      focusNotes:
        focusNotes.trim(),
      ...(mode === "group"
        ? {
            maxGroupSize,
          }
        : {}),
    };

    onCreated(assignment);
  }

  return (
    <ModalShell
      onBackdrop={onClose}
    >
      <form
        onSubmit={submit}
        className="flex max-h-[90vh] w-full max-w-4xl flex-col"
      >
        <div className="-mb-2 -mt-3 overflow-x-auto px-3 pb-2 pt-3">
          <div className="flex items-end gap-1">
            {TABS.map((tab) => {
              const active =
                tab.id === activeTab;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() =>
                    changeTab(tab.id)
                  }
                  className={
                    "relative flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-t-xl border border-b-0 px-4 py-3 text-sm font-medium transition-all duration-200 ease-out hover:-translate-y-[3px] " +
                    (active
                      ? "z-20 bg-card text-card-foreground"
                      : "z-10 translate-y-2 bg-muted text-muted-foreground hover:text-foreground")
                  }
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
          <ModalHeader
            title="Create assignment"
            description="Complete the assignment details, requirements and marking rubric."
            icon={
              <ClipboardList className="h-5 w-5" />
            }
            onClose={onClose}
          />

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {error && (
              <ErrorBanner>
                {error}
              </ErrorBanner>
            )}

            {activeTab ===
              "details" && (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Assignment title"
                  required
                  className="sm:col-span-2"
                >
                  <input
                    value={title}
                    onChange={(event) =>
                      setTitle(
                        event.target.value,
                      )
                    }
                    placeholder="e.g. Final project — E-commerce platform"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                  />
                </Field>

                <Field
                  label="Due date"
                  required
                >
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(event) =>
                      setDueDate(
                        event.target.value,
                      )
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </Field>

                <Field label="Total marks">
                  <input
                    type="number"
                    min={1}
                    value={totalMarks}
                    onChange={(event) =>
                      setTotalMarks(
                        Number(
                          event.target.value,
                        ),
                      )
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </Field>

                <div className="space-y-2 sm:col-span-2">
                  <p className="text-sm font-medium">
                    Assessment mode
                  </p>

                  <div className="inline-flex rounded-lg border bg-muted p-1">
                    {(
                      [
                        "individual",
                        "group",
                      ] as const
                    ).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          setMode(option)
                        }
                        className={
                          "rounded-md px-4 py-2 text-sm font-medium capitalize transition-colors " +
                          (mode === option
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground")
                        }
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {mode === "group" && (
                  <Field label="Maximum group size">
                    <input
                      type="number"
                      min={2}
                      value={maxGroupSize}
                      onChange={(event) =>
                        setMaxGroupSize(
                          Number(
                            event.target
                              .value,
                          ),
                        )
                      }
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </Field>
                )}
              </div>
            )}

            {activeTab ===
              "content" && (
              <div className="space-y-6">
                <Field label="Project overview">
                  <textarea
                    rows={7}
                    value={description}
                    onChange={(event) =>
                      setDescription(
                        event.target.value,
                      )
                    }
                    placeholder="Describe the project, expected outcomes, constraints and submission instructions."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                  />
                </Field>

                <fieldset>
                  <legend className="flex items-center gap-1.5 text-sm font-medium">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    Required submission
                    materials
                  </legend>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Select everything students
                    must submit for this
                    assignment.
                  </p>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {[
                      {
                        id: "report" as const,
                        label:
                          "Project report",
                      },
                      {
                        id: "code" as const,
                        label:
                          "Source code",
                      },
                      {
                        id: "slides" as const,
                        label:
                          "Presentation slides",
                      },
                    ].map((material) => (
                      <label
                        key={material.id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border bg-muted/30 p-4 transition-colors hover:bg-muted/60"
                      >
                        <input
                          type="checkbox"
                          checked={requiredMaterials.includes(
                            material.id,
                          )}
                          onChange={() =>
                            toggleMaterial(
                              material.id,
                            )
                          }
                          className="h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
                        />

                        <span className="text-sm font-medium">
                          {material.label}
                        </span>
                      </label>
                    ))}

                    <div>
                      <label className="flex cursor-pointer items-center gap-3 rounded-lg border bg-muted/30 p-4 transition-colors hover:bg-muted/60">
                        <input
                          type="checkbox"
                          checked={requiredMaterials.includes(
                            "other",
                          )}
                          onChange={() =>
                            toggleMaterial(
                              "other",
                            )
                          }
                          className="h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
                        />

                        <span className="text-sm font-medium">
                          Other
                        </span>
                      </label>

                      {requiredMaterials.includes(
                        "other",
                      ) && (
                        <input
                          value={
                            otherMaterialLabel
                          }
                          onChange={(
                            event,
                          ) =>
                            setOtherMaterialLabel(
                              event.target
                                .value,
                            )
                          }
                          placeholder="Describe the required material"
                          className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                        />
                      )}
                    </div>
                  </div>
                </fieldset>
              </div>
            )}

            {activeTab ===
              "rubric" && (
              <div className="space-y-6">
                <section>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="flex items-center gap-1.5 text-sm font-medium">
                        <ListChecks className="h-4 w-4 text-muted-foreground" />
                        Rubric criteria
                      </h3>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Give each criterion a
                        clear name and percentage
                        weight.
                      </p>
                    </div>

                    <span
                      className="rounded-full border px-2.5 py-1 text-xs font-medium"
                      style={{
                        color:
                          rubricTotal ===
                          100
                            ? "hsl(var(--success))"
                            : "hsl(var(--warning))",
                      }}
                    >
                      Total weight:{" "}
                      {rubricTotal}%
                    </span>
                  </div>

                  <div className="mt-3 space-y-3">
                    {rubric.map(
                      (
                        criterion,
                        index,
                      ) => (
                        <div
                          key={index}
                          className="grid gap-2 rounded-lg border bg-muted/30 p-3 sm:grid-cols-[1fr_130px_40px]"
                        >
                          <input
                            value={
                              criterion.criterion
                            }
                            onChange={(
                              event,
                            ) =>
                              updateCriterionName(
                                index,
                                event.target
                                  .value,
                              )
                            }
                            placeholder="Criterion name"
                            className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                          />

                          <div className="relative">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={
                                criterion.weight
                              }
                              onChange={(
                                event,
                              ) =>
                                updateWeight(
                                  index,
                                  Number(
                                    event
                                      .target
                                      .value,
                                  ),
                                )
                              }
                              onBlur={() =>
                                commitWeight(
                                  index,
                                )
                              }
                              onKeyDown={(
                                event,
                              ) => {
                                if (
                                  event.key ===
                                  "Enter"
                                ) {
                                  event.preventDefault();
                                  commitWeight(
                                    index,
                                  );
                                }
                              }}
                              className="h-10 w-full rounded-md border border-input bg-background px-3 pr-8 text-sm outline-none focus:ring-2 focus:ring-ring"
                            />

                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                              %
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setRubric(
                                (current) => {
                                  const next =
                                    current.filter(
                                      (
                                        _,
                                        criterionIndex,
                                      ) =>
                                        criterionIndex !==
                                        index,
                                    );

                                  const weights =
                                    equalWeights(
                                      next.length,
                                    );

                                  return next.map(
                                    (
                                      item,
                                      itemIndex,
                                    ) => ({
                                      ...item,
                                      weight:
                                        weights[
                                          itemIndex
                                        ],
                                    }),
                                  );
                                },
                              )
                            }
                            disabled={
                              rubric.length ===
                              1
                            }
                            aria-label="Remove rubric criterion"
                            className="flex h-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ),
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setRubric(
                        (current) => {
                          const next = [
                            ...current,
                            {
                              criterion: "",
                              weight: 0,
                            },
                          ];

                          const weights =
                            equalWeights(
                              next.length,
                            );

                          return next.map(
                            (
                              item,
                              itemIndex,
                            ) => ({
                              ...item,
                              weight:
                                weights[
                                  itemIndex
                                ],
                            }),
                          );
                        },
                      )
                    }
                    className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-muted px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                  >
                    <Plus className="h-4 w-4" />

                    Add criterion
                  </button>
                </section>

                <Field label="Additional focus areas for the AI examiner">
                  <p className="mb-2 text-xs text-muted-foreground">
                    Explain what the examiner
                    should probe, such as
                    architecture decisions,
                    debugging, security or
                    individual contribution.
                  </p>

                  <textarea
                    rows={7}
                    value={focusNotes}
                    onChange={(event) =>
                      setFocusNotes(
                        event.target.value,
                      )
                    }
                    placeholder="Probe architecture decisions, individual contribution and evidence of authorship."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                  />
                </Field>
              </div>
            )}

            {activeTab ===
              "review" && (
              <div className="grid gap-4 md:grid-cols-2">
                <ReviewCard title="Assignment details">
                  <ReviewRow
                    label="Title"
                    value={
                      title ||
                      "Not entered"
                    }
                  />

                  <ReviewRow
                    label="Due date"
                    value={
                      dueDate ||
                      "Not selected"
                    }
                  />

                  <ReviewRow
                    label="Total marks"
                    value={String(
                      totalMarks,
                    )}
                  />

                  <ReviewRow
                    label="Mode"
                    value={
                      mode === "group"
                        ? `Group · maximum ${maxGroupSize}`
                        : "Individual"
                    }
                  />
                </ReviewCard>

                <ReviewCard title="Required materials">
                  <p className="text-sm text-muted-foreground">
                    {requiredMaterials.length
                      ? requiredMaterials
                          .map(
                            materialLabel,
                          )
                          .join(", ")
                      : "No materials selected"}
                  </p>
                </ReviewCard>

                <ReviewCard
                  title="Project overview"
                  className="md:col-span-2"
                >
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {description ||
                      "No overview provided."}
                  </p>
                </ReviewCard>

                <ReviewCard title="Rubric">
                  <div className="space-y-2">
                    {rubric.map(
                      (
                        criterion,
                        index,
                      ) => (
                        <div
                          key={index}
                          className="flex justify-between gap-3 text-sm"
                        >
                          <span>
                            {criterion.criterion ||
                              "Unnamed criterion"}
                          </span>

                          <span className="font-medium">
                            {
                              criterion.weight
                            }
                            %
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </ReviewCard>

                <ReviewCard title="AI examiner focus">
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {focusNotes ||
                      "No additional focus provided."}
                  </p>
                </ReviewCard>
              </div>
            )}
          </div>

          <footer className="flex items-center justify-between gap-3 border-t bg-card px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-muted px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              {activeIndex > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    changeTab(
                      TABS[
                        activeIndex - 1
                      ].id,
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-md bg-muted px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
                >
                  <ChevronLeft className="h-4 w-4" />

                  Back
                </button>
              )}

              {activeIndex <
              TABS.length - 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    changeTab(
                      TABS[
                        activeIndex + 1
                      ].id,
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  Next

                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  Save assignment
                </button>
              )}
            </div>
          </footer>
        </div>
      </form>
    </ModalShell>
  );
}