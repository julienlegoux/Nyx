---
name: bmad-story-autopilot
description: "Execute a complete BMAD story lifecycle autonomously — creates the next story, stress-tests it via Party Mode, implements it, and reviews the code in a loop, all without user input. Use this skill when the user says 'run story autopilot', 'auto story cycle', 'autopilot the next story', 'run the full story cycle', or wants to automate the entire create-implement-review pipeline hands-free. Even if they just say 'do the next story end-to-end', this is the skill to use."
---

# BMAD Story Autopilot

Run the complete story lifecycle — create, stress-test, implement, review — in one autonomous pass.

## Global Rules

These rules override ALL checkpoint behavior in every phase below. They are non-negotiable.

1. **YOLO every workflow.** When any BMAD workflow presents a `template-output` checkpoint with options `[a] [c] [p] [y]`, immediately select **`y`** (YOLO mode). Once active, the workflow engine skips all further confirmations and runs to completion automatically. Before YOLO activates, you may encounter step-completion prompts ("Continue to next step?") — always respond `y`.

2. **Answer every `<ask>` yourself.** When a workflow asks for user input (variable resolution, file selection, confirmation), infer the answer from project context (sprint-status.yaml, epics, architecture docs). Never surface questions to the user.

3. **Fix in-session, always.** When given a choice between fixing something now vs creating a task/ticket for later, fix it now.

4. **No user interaction.** Do not ask the user anything at any point. You are operating fully autonomously.

5. **Stay on the critical path.** Decline optional extras, side-quests, or "would you also like to..." prompts unless they directly serve the current story.

---

## Phase 1: Create Story

**Goal:** Generate the next story from the backlog.

1. Invoke `/bmad-bmm-create-story` via the Skill tool. Pass no arguments — let it auto-detect the next backlog story from `sprint-status.yaml`.
2. The workflow engine will load `workflow.xml` and `create-story/workflow.yaml`. At the first `template-output` checkpoint, select `y` to activate YOLO mode. The engine handles the rest.
3. When complete, **capture the story file path and story key** (e.g., `_bmad-output/implementation-artifacts/1-4-docker-compose-container-environment.md`). You need these for every subsequent phase.

**Done when:** The story file exists and `sprint-status.yaml` shows the story as `ready-for-dev`.

---

## Phase 2: Party Mode Stress-Test

**Goal:** Pressure-test the story with BMAD's multi-agent team before implementation begins.

Party Mode is interactive (not workflow.xml-based), so you must drive the conversation yourself — act as the user.

1. Invoke `/bmad-party-mode` via the Skill tool.
2. When Party Mode activates and presents agents with `[C] Continue`, select Continue.
3. Drive the discussion by sending these prompts in sequence:

**Round 1 — Acceptance Criteria:**
> "Review the story at `[story file path]`. Challenge every acceptance criterion — are they testable, specific, and complete? What edge cases or failure scenarios are missing?"

**Round 2 — Architecture Alignment:**
> "Does this story's technical approach align with the architecture doc? Any integration risks, dependency assumptions, or pattern conflicts?"

**Round 3 — Scope & Feasibility:**
> "Is this properly scoped for a single implementation pass? Should anything be split or added? Hidden dependencies on unimplemented stories?"

**Round 4 — Final Sweep:**
> "Last call. What's the single biggest risk if we implement this exactly as written?"

4. After Round 4 (or earlier if agents are converging/repeating):
   - If agents raised valid improvements: read the story file, apply the improvements (tighten AC, add edge cases, clarify approach), save it.
   - If no actionable issues surfaced: move on.
5. Exit Party Mode by sending `*exit`.

**Done when:** Party Mode has exited and any story improvements have been saved to the story file.

---

## Phase 3: Implement Story

**Goal:** Implement the finalized story with red-green-refactor.

1. Invoke `/bmad-bmm-dev-story` via the Skill tool. When the workflow asks which story to implement, provide the story file path from Phase 1.
2. At the first `template-output` checkpoint, select `y` to activate YOLO mode.
3. The dev workflow will:
   - Mark the story `in-progress` in sprint-status.yaml
   - Implement all tasks/subtasks with test-first development
   - Run validation gates (tests, linting, regression)
   - Mark the story `review` when complete

**Done when:** `sprint-status.yaml` shows the story as `review` and all tasks in the story file are marked `[x]`.

---

## Phase 4: Code Review Cycle

**Goal:** Review implementation, fix issues, repeat until clean. Maximum 5 cycles.

Execute this loop:

```
review_count = 0

LOOP:
  review_count += 1

  Invoke /bmad-bmm-code-review via the Skill tool, targeting the story file from Phase 1.
  At the first template-output checkpoint, select 'y' for YOLO mode.

  When the review presents findings and asks how to handle them:
    → Select "Fix automatically" (Option 1). Always.
    → Let the reviewer apply all fixes.

  After fixes are applied, assess remaining issue severity:

  IF only LOW severity issues (or no issues):
    → Story PASSES. Break.

  IF CRITICAL, HIGH, or MEDIUM issues remain:
    IF review_count >= 5:
      → STOP. Summarize remaining issues by severity. Break.
    ELSE:
      → Continue to next review cycle. GOTO LOOP.
```

**Done when:** Review passes (LOW/none only) or 5 cycles exhausted.

---

## Completion

When all phases finish, output this summary:

```
## Story Autopilot Complete

**Story:** [key] — [title]
**Final Status:** [DONE | STOPPED after N review cycles]

### Phase Results
1. **Created:** [story file path]
2. **Party Mode:** [key improvements made, or "story validated — no changes needed"]
3. **Implemented:** [brief summary — what was built, tests passing/failing]
4. **Code Review:** [PASSED after N cycles | STOPPED with remaining issues]
   [If stopped: list remaining issues by severity]
```

Update `sprint-status.yaml` to reflect the final status:
- `done` if review passed
- `in-progress` if stopped with unresolved issues

---

## Error Handling

- **No backlog stories found:** If `create-story` finds nothing in the backlog, stop and report: "No stories in backlog. Run sprint planning first."
- **Dev workflow HALT:** If the dev workflow hits a HALT condition (e.g., critical dependency missing), stop and report the blocking issue.
- **Unrecoverable review issues:** If after 5 review cycles CRITICAL issues persist, the summary should flag these prominently.
