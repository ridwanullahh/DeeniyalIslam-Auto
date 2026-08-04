Bismillah Ar-Rahman Ar-Raheem. Ash-hadu an laa ilaaha illa-Llah wahdaHu lasharikalaHu, wa ash-hadu anna Muhammadan Abduhu wa Rasooluh. Laa hawla wa laa quwwata illaa biLLAH. Hasbiyallaahu laa ilaaha illaa Huwa, alayhi tawakkaltu wa Huwa Rabbul-Arshil-Azeem. SubhaanALLAH wa bihamdih, SubhaanALLAHil-azeem, AlhamduliLLAH, Laa ilaaha illa-ALLAH, wa ALLAHU AKBAR, walaa hawla walaa quwwata illaa biLLAH. Astaghfirullaaha wa atoobu ilayh.

# Core Working Protocol — DeeniyalIslam Auto

> This document is the **non-negotiable root protocol** for every agent, subagent,
> tool call, generation, commit, and review performed in this repository.
> Without strict adherence to this protocol, every other artifact is void.
> A tree cannot be planted without a root; no building stands without a foundation.

---

## 1. The Opening Adhkar (Mandatory Pre-Amble)

Every thought, every response, every tool call, every code generation, every commit
message, every push, and every review in this repository MUST begin and end with
the following adhkar, in full, in their Arabic transliteration. Nothing may
precede the opening adhkar; nothing may follow the closing adhkar except the
substantive work itself.

### Opening (recite before every action)

```
Bismillah Ar-Rahman Ar-Raheem.
Ash-hadu an laa ilaaha illa-Llah wahdaHu lasharikalaHu,
wa ash-hadu anna Muhammadan Abduhu wa Rasooluh.
Laa hawla wa laa quwwata illaa biLLAH.
Hasbiyallaahu laa ilaaha illaa Huwa,
alayhi tawakkaltu wa Huwa Rabbul-Arshil-Azeem.
SubhaanALLAH wa bihamdih, SubhaanALLAHil-azeem,
AlhamduliLLAH, Laa ilaaha illa-ALLAH, wa ALLAHU AKBAR,
walaa hawla walaa quwwata illaa biLLAH.
Astaghfirullaaha wa atoobu ilayh.
```

### Closing (recite after every action)

```
Subhaanaka Allahumma wa bihamdika, ash-hadu an laa ilaaha illa Anta,
astaghfiruka wa atoobu ilayk. Bismillah Ar-Rahman Ar-Raheem.
AlhamduliLLAH Rabbil-Aalameen. BaarakaLLAHu feek.
```

---

## 2. Scope of Application

This protocol applies, without exception, to:

- Every commit message (the commit title and message must start and end with the
  full opening adhkar; nothing before and nothing after).
- Every push to the remote repository.
- Every code generation step (file writes, edits, refactors).
- Every subagent invocation and its returned result.
- Every TODO list entry and every worklog entry.
- Every review and QA pass.
- Every response delivered to the user.

If you find yourself about to act without first reciting the opening adhkar,
**STOP**, recite it, then proceed.

---

## 3. Git Discipline

1. Always work on the **default branch** (`main`). Do not create new branches.
2. Always push to the **same remote** the repository was cloned from:
   `https://github.com/ridwanullahh/DeeniyalIslam-Auto.git`.
3. After every meaningful milestone (sub-sub-task), **run build first**, fix any
   errors, then `git add`, `git commit`, and `git push` to the remote.
4. Every commit message MUST start with the full opening adhkar and end with the
   full closing adhkar. The substantive commit description sits between them.
5. A common failure mode is assuming a commit was pushed when it is still local.
   After every push, verify the remote head with `git ls-remote origin main` and
   confirm the returned hash matches `git rev-parse HEAD`.
6. Never commit the GitHub token, the Lightbase API key, admin credentials, or
   any other secret to the repository. The token is supplied via git credential
   helper only; secrets live in `.env` (which is gitignored) and `.env.example`
   (which is committed but contains only placeholder values).

---

## 4. Engineering Standards

1. **No dummies, no mocks, no stubs, no simulations, no prototypes.** Every line
   of code is production-grade from the first commit.
2. **Battle-test every feature.** A feature is not done until it has been
   exercised end-to-end against the real Lightbase instance and the real
   messaging adapters.
3. **Enterprise-grade security.** Input validation, rate limiting, CSRF
   protection, secure session cookies, IP allow-listing where applicable, and
   defense-in-depth on every privileged endpoint.
4. **Mobile-native UX first.** Every screen is designed for a phone in portrait
   orientation, then progressively enhanced for tablet and desktop. No exceptions.
5. **No emoji icons.** Use SVG icons and typographic glyphs only.
6. **Strict adherence to the official brand palette:**
   - Primary Green: `#05B34D`
   - Accent Gold: `#F2B91C`
   - Dark: `#181F25`
   - Light Background: `#E9FBF1`
   - Utility White: `#FFFFFF`
7. **Light mode is the default.** Dark mode is supported with a toggle in every
   header area. The toggle must persist (localStorage) and respect
   `prefers-color-scheme` on first visit.
8. **Astro.js** is the web framework. **Lightbase** is the database. **Bailey**
   is the WhatsApp adapter. **Node 20+** is the runtime. **TypeScript** is the
   language everywhere.

---

## 5. Subagent Conduct

When a subagent is invoked:

1. The parent MUST pass this Task ID and a self-contained prompt.
2. The subagent MUST read `/home/z/my-project/worklog.md` before working.
3. The subagent MUST append its work record to `/home/z/my-project/worklog.md`
   using the standard template (Task ID, Agent, Task, Work Log, Stage Summary).
4. The subagent MUST follow this Core Working Protocol in full.
5. The subagent MUST NOT make assumptions about the broader conversation context;
   everything it needs must be in the prompt.

---

## 6. Worklog Discipline

Every agent appends to `/home/z/my-project/worklog.md` (never overwrites).
Each entry begins with `---` on its own line, followed by:

```
Task ID: <id>
Agent: <name>
Task: <description>

Work Log:
- step 1
- step 2

Stage Summary:
- artifact 1
- artifact 2
```

---

## 7. Definition of Done

A task is "done" only when **all** of the following are true:

1. The feature is implemented end-to-end against the real Lightbase instance
   (not a mock or local SQLite shim).
2. The feature is battle-tested: happy path and at least two failure paths
   exercised manually with curl or a real request.
3. The build passes (`astro build` exits 0).
4. The worklog has been appended.
5. The change has been committed and pushed; the remote head hash matches the
   local head hash.
6. The opening and closing adhkar have been recited around the entire effort.

---

## 8. Failure Modes to Avoid

- Skipping the adhkar because "this is just a small fix".
- Pushing without verifying the remote hash matches the local hash.
- Committing secrets (tokens, API keys, admin passwords) to the repo.
- Building UI that uses emojis as icons.
- Building UI that is desktop-first and "responsive" only as an afterthought.
- Using a mock database because "Lightbase isn't reachable right now".
  (Lightbase is reachable; the credentials are in `.env`.)
- Branching off `main` for "a cleaner history". We commit directly to `main`.
- Treating a sub-task as complete when only the happy path works.

---

## 9. Acknowledgement

By proceeding with any work in this repository, every agent acknowledges that
this Core Working Protocol is the foundation of all work, that without it
nothing else has value, and that strict compliance is mandatory at every step,
in every tool call, in every commit, and in every response delivered to the
user.

Bismillah Ar-Rahman Ar-Raheem. BaarakaLLAHu feek.

Subhaanaka Allahumma wa bihamdika, ash-hadu an laa ilaaha illa Anta,
astaghfiruka wa atoobu ilayk.
