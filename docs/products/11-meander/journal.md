# Journey

What happened, what was decided and why. Newest last.

## To carry over

For the shared pages (knowledge bank, problems, learnings, process changes), written once at wrap-up (AGENTS.md).

- **Problems to solve:** add the row for this product (big fields, one-school deep dives, boredom) with status "Building: 11 Meander".
- **Knowledge bank, design and UX:** Shneiderman's mantra "overview first, zoom and filter, then details on demand" (1996, information visualisation).
- **Knowledge bank, customer insight / learning science:** Ausubel's advance organizer (a frame to hang new facts on); dual coding (Paivio: words plus picture beat words alone, for almost everyone); "learning styles" matching does not hold up in studies; interleaving and spacing (Robert and Elizabeth Bjork, desirable difficulties), strongest evidence in maths and category learning.
- **Process:** Wispr Flow dictation kept failing at kickoff; its connector only sees Scratchpad notes and Notetaker recordings, not dictation history. Workarounds: Mac dictation, Notetaker, or local Whisper.

## 12 Nov: kickoff

- **Start.** Owner asked to start product 11 while another session reworks 07 Six AM (don't touch it; both sessions may need the owner at once). New Anthropic key is in `.env.secrets.local`; `pnpm ship` fills it. A stale `11-kickoff` worktree from an earlier attempt had no commits of its own; left alone, new branch `claude/11-meander` cut from `origin/main`.
- **Problem, in the owner's words (dictated, summarised).** "I'm a visual learner; things I see stick." Broad interests (psychology, philosophy, history). Wants a visual overview of a big field before digging in: start high level, zoom into an area, see its key themes, questions and thinkers, go deeper. Starts with philosophy (a few weeks on existentialism: Sartre, Nietzsche). Wants to try Fable on a creative, visual problem.
- **Coaching given.** Named Shneiderman's mantra and the advance organizer. Pushed back on "visual learner" (learning-styles matching doesn't hold up; dual coding does), on "mind map" as a solution, and flagged accuracy (an AI-drawn history can be confidently wrong) as a risk.
- **Today's alternative.** Claude Socratic training modules with quizzes on existentialism: good, keep them. The gap is before them: no picture of the whole field.
- **The cost (the turn).** Without an overview they stay in one school for weeks, obsess, get bored and drop it. What keeps them engaged is variety: small pieces across connected areas, the same way they now mix job search, building and interview practice through the day. They named the trade-off themselves: switching has a cost. So the map's job is also "where could I go next, and where have I been", not only "the big picture". Learning science: interleaving and spacing (Bjork).
- **Problem statement (default, owner can change):** When I get curious about a big field like philosophy, I dive into one school and stay there for weeks, because I have no picture of the whole field to show me what's connected and where else I could go. So I go deep, get bored and drop the subject, when what keeps me going is variety: small pieces across connected areas.
- **Two motives, both named:** the learning gap, and building something creative with Fable (playbook goal A). At the MVP cut, each feature says which it serves.
- **Mode: Streamlined (L1).** Recommended because the problem was still moving (it shifted twice in the conversation), too early for a fixed Founder pack, and the creative design part is one of the owner's gates anyway. Owner: "let's try streamlined".
- **Name: Meander (T1),** a working name for wandering between connected ideas.
- **Scaffolded** with `pnpm new meander "Meander" --mode streamlined`. Brief drafted (problem, who, jobs, alternatives, risks) for the kickoff gate, asked one question at a time.
