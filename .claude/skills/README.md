# Design skills

Project skills for designing and testing the sprint's apps. Click a name to read the skill. Chosen in
[decision 0008](../../docs/decisions/0008-design-skills.md); the playbook names which step uses
each one.

| Skill | Playbook step | Runs |
| --- | --- | --- |
| [`design-session`](design-session/SKILL.md) | 1. Design: Discover → Define (critic loop) → Deliver, with owner checkpoints ([decision 0013](../../docs/decisions/0013-design-session-skill.md)) | Only when called: `/design-session <screen>` |
| [`prototype`](prototype/SKILL.md) | 1. Design, inside `design-session`: 3 working variants behind a picker | Only when called: `/prototype <screen>` |
| [`mobile-native`](mobile-native/SKILL.md) | 1b. Setup: phone fixes (already in `templates/next-starter`) | Automatically, on mobile work |
| [`emil-design-eng`](emil-design-eng/SKILL.md) | 2. Build: polish, press feedback, when not to animate | Named in AGENTS.md (vague description) |
| [`animate`](animate/SKILL.md) | 2. Build: only when a screen needs motion | Automatically |
| [`break-ui`](break-ui/SKILL.md) | 3b. Test: worst-case data behind a toggle | Automatically, or `/break-ui <screen>` |
| [`web-design-guidelines`](web-design-guidelines/SKILL.md) | 3b. Test: accessibility and interface audit | Automatically, or `/web-design-guidelines <files>` |

`design-session` is our own, adapted from Anshu Chimala's "How to turn your AI into a world-class
designer" (Lenny's Newsletter, Sep 2026); its critic is the `design-critic` subagent in
`.claude/agents/`.

## Sources

Vendored copies, reviewed before adding. Licences in [LICENSES.md](LICENSES.md).

- [emilkowalski/skills](https://github.com/emilkowalski/skills) at `e8a175d` (7 Oct 2026),
  unchanged.
- [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) `web-design-guidelines`
  with the rules from
  [vercel-labs/web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines)
  `command.md` saved as `GUIDELINES.md` (7 Oct 2026). `SKILL.md` changed to read that file
  instead of fetching the URL on every run.

To update: copy the new upstream files over these, read the diff before committing, and note the
new commit or date above.
