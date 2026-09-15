# CIIS Network — Stabilization Plan

Status: Audit baseline for the existing product. This branch is documentation-first and must not change production behavior until each work item is reviewed and tested.

## Product goal

Turn the existing CIIS Network codebase into a secure, smooth, easy-to-setup multi-company business operating system with:

- guided company self-onboarding
- Company 360 for CIIS SuperAdmin
- Employee 360 with explainable performance metrics
- reliable notifications across web/desktop/mobile
- event-driven chat/activity updates
- premium, low-friction UX
- safe staged releases

## P0 — Security and production blockers

1. Remove any fixed/bypass OTP path from production authentication.
2. Remove URL/query-token login handoff. Use a one-time exchange code or equivalent secure handoff.
3. Keep Electron `webSecurity: true` in production and prevent untrusted external origins from loading inside the privileged app window.
4. Standardize production API configuration. Production builds must never silently fall back to localhost.
5. Scope all client-side request caches by authenticated user + company/tenant, and hard-clear on login/logout/company switch/impersonation.
6. Move sensitive employee/client documents out of any public static upload route. Access must be authenticated and authorized.
7. Rotate any secrets that have ever been committed to Git history and invalidate dependent sessions where needed.
8. Add mandatory CI checks before merge: build, lint, tests, secret scan, dependency audit.

## P1 — Core architecture stabilization

- Centralize tenant/company/branch/department/role authorization rules.
- Introduce a single product event contract instead of each module independently wiring notifications.
- Replace mock/random analytics with server-derived, auditable metrics.
- Establish consistent API errors, loading states, retry policies and empty states.
- Add audit logs for privileged operations and SuperAdmin actions.
- Add feature flags so new modules can be released by plan/company/role without redeploying all users.

## P2 — Automated company setup

Create a guided setup wizard with persisted progress:

1. Owner identity and verification
2. Company details
3. Industry/template selection
4. Branches
5. Departments
6. Job roles
7. Working days and shifts
8. Attendance policy
9. Leave policy
10. Task/project workflow
11. Payroll requirements
12. Client/project requirements
13. Notification preferences
14. Employee invitations
15. Setup validation
16. Launch workspace

Every step must write a setup event and a durable completion state. SuperAdmin should see completion percentage, last completed step, last activity, blockers and next recommended action.

## P3 — SuperAdmin Company 360

Each company profile should expose:

- setup completion
- subscription and renewal state
- employee counts and active-user trend
- feature adoption
- attendance health
- task/project delivery health
- client and project activity
- support issues
- notification delivery health
- company risk signals
- upsell/service opportunities

Do not expose raw sensitive employee fields by default. Privileged access must be explicit and audited.

## P4 — Employee 360 / performance engine

Performance must be explainable and role-aware. Never use random/mock values in production.

Recommended dimensions:

- task reliability
- delivery timeliness
- quality/reopen rate
- attendance and punctuality
- consistency
- collaboration/manager feedback
- client feedback where applicable

The score must show the underlying facts, e.g. tasks due, completed on time, reopened tasks, late arrivals and blocked dependencies. Suspicious/fake-task patterns should only create a review flag, never an automatic disciplinary outcome.

## P5 — Event-driven notification and chat automation

Create a normalized event layer such as:

- `task.assigned`
- `task.completed`
- `task.reopened`
- `project.updated`
- `leave.approved`
- `meeting.created`
- `client.feedback_received`
- `payment.received`

Each event can drive selected outputs:

- in-app notification
- push notification
- email
- project/activity timeline
- system chat message in a linked group/channel
- SuperAdmin metrics
- performance metrics

Notifications must have a clear title, actor, entity, status, target deep-link, timestamp and read state.

## P6 — Apple-like UX pass

- Keep previous content visible during background refresh instead of full-page loaders.
- Use optimistic updates where safe.
- Autosave drafts.
- Preserve route/tab state and scroll position.
- Use one obvious primary action per screen.
- Reduce menu complexity by role.
- Add global search/command access.
- Standardize spacing, typography, empty states, confirmation states and error language.
- Make web, Electron and mobile interactions visually and behaviorally consistent.

## P7 — Retention and release center

Add a `What's New` / Release Center controlled by SuperAdmin:

- target by plan, company, role and beta cohort
- show guided introduction
- track seen/opened/activated/retained metrics
- allow staged feature rollout and rollback

## P8 — Staging / offline QA gate

Before production release, test on isolated staging data:

- SuperAdmin
- company owner
- HR/admin
- manager
- employee
- client
- browser
- Electron/Windows/macOS
- mobile Android/iOS

Mandatory scenarios include tenant isolation, permissions, notifications, offline/reconnect behavior, auth/session handling, file access, task lifecycle, attendance, payroll, chat and client portal.

## Immediate audit findings to resolve first

- Production analytics currently include mock/random generated performance data in at least one SuperAdmin analytics screen; this cannot be treated as a real employee score.
- API environment naming/fallback behavior is inconsistent and includes a localhost primary config in frontend source.
- Electron production security configuration requires tightening.
- Existing notification backend is a strong foundation (database + realtime socket + push + preferences); extend it into an event engine rather than replacing it.

## Acceptance rule

No P0/P1 item is considered complete until:

1. code review is complete
2. automated tests pass
3. staging test passes
4. regression checklist passes
5. production rollout has a rollback path
