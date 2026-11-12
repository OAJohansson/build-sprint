# Brief

A one-page PRD, written before any code (playbook step 1). Short answers; the success check is filled in at wrap-up.

## Problem

A hiring manager who has my CV can see where I've worked, but not how I think about product: the
problems, decisions, users and outcomes behind each role. So they can't tell an exceptional
product manager from a good CV, and I lose the call to people who present better.

## Who

A hiring manager for a product role (AI products often, but not only) who got my CV and opens
the link on their phone between meetings. They should come away wanting to talk to me.

## Moment of use and jobs to be done

**Moment:** on the phone, between meetings, a minute or two, deciding whether I'm worth a call.

**What they should leave with:** "this is an exceptional product manager", and an overview of me
as a person and a professional: CV history and the product portfolio. The site itself (UX/UI,
creativity) is part of the evidence.

**Jobs, ranked by the owner:**

1. **Product thinking.** When I've got a PM candidate's CV, I want to see how they think about
   product (problem, decision, users, outcome, in plain words), so I can tell if they're
   exceptional and not just experienced.
2. **Taste.** When I'm hiring for product judgement, I want to see their taste in things they
   designed and built, so I know they can tell good from good enough.
3. **AI judgement.** When the role involves AI, I want proof they know how to judge AI quality
   (evals), so I know they can ship AI features responsibly.
4. **Quick feel.** When I'm skimming between meetings, I want a quick feel for their work, with
   visuals and the metrics they moved, so I can decide in a minute or two whether to book a call.

Why quick feel is last: the metrics are already in the CV summaries, so the site doesn't need to
lead with them; they still appear wherever an outcome is told.

**Design tension to solve:** the top job (product thinking) usually takes reading, but the moment
is a phone and a minute or two. The first screen has to show how I think in seconds.

## Today's alternatives

- **CV and LinkedIn:** show where I worked and for how long; good for a quick history check. They
  don't show how I think, what I decided, or what changed for users, and every candidate's looks
  the same.
- **The screening call:** shows how I think, but costs them 30 minutes before they know if it's
  worth it.
- **Why they'd switch:** the website gives a taste of the call (my product thinking, taste and
  evals) in the two minutes they already spend on the CV.

## Riskiest assumptions

**Riskiest (test first): product thinking comes across in seconds on a phone.** It carries the
top job and the whole site fails without it, and there's no evidence yet: it's the design's open
tension. The MVP and the user test must check it (the 5-second guardrail below).
*(Chosen by Claude at the owner's request.)*

Assumption map:

| | Little evidence | Some evidence |
| --- | --- | --- |
| **Important** | Product thinking in seconds on a phone (**test now**); creative design helps rather than slows | Hiring managers click a portfolio link in a CV |
| **Less important** | | Enough public GambleAware and Vine Health material (cheap to check; the story can carry it if not) |

Notes per assumption:

- *Usability:* creative UI helps rather than slows a hiring manager with a minute on their phone.
- *Viability:* I'm allowed to show visuals of GambleAware and Vine Health work. Plan: public
  material only (their live website and app, their own published posts), credited. Not cleared
  yet: **internal metrics**. Numbers I moved may be confidential unless already public; check the
  contract or ask a former manager, or show them as relative changes.
- *Value:* the sprint products can show evals. Today the evidence is Inkling (evals 8/8, prompt
  and model checks) and Folio (two-level recommender eval, decision 0017); Scribble's eval is
  still in its backlog.

## Success: what good looks like

**Main outcome:** hiring managers come to the first call already curious about my work.

More replies isn't the measure: replies vary too much with the role and the market to credit the
site.

| Signal | How I'll measure it | Target |
| --- | --- | --- |
| Interviewers bring up something from the site unprompted | One line per interview in a log: mentioned or not, and what | At least 3 of my next 10 interviews; 0 of 10 means rethink the site |
| The link gets opened | A tag per application in the link (`?ref=company`), read in analytics | Opened for at least half the applications it's sent with |
| Visitors go past the first screen | Visits that open at least one project | First 20 visits set the baseline; then a real target |

*(Targets set by Claude at the owner's request, as decision lines rather than forecasts.)*

**Guardrail:** not too much information. In the user test, a hiring manager can say who I am and
what I'm good at after 5 seconds on the first screen, and finishes a project story in about 2
minutes.

**Pre-mortem** ("they closed it after 20 seconds and didn't call. Why?"): it wasn't engaging, or
there was too much information.

## MVP and stop line

**Content so far (owner's first take, not yet tested against the jobs):**

1. About me: who I am, CV, career background.
2. Projects: the strongest career work, **GambleAware** and **Vine Health**, with visuals; plus
   the sprint products.

Open: career projects and sprint products in one section or two?

## Requirements

| # | Must | Check |
| --- | --- | --- |

**No-gos:** 

**Rabbit holes:** analytics. Vercel's free plan counts page views but not clicks or time per
section (custom events need Pro); heatmap tools like PostHog set cookies, which in the UK means a
consent banner unless set up cookieless. Pick the simplest tool that answers the three signals.

## Unit tests

The 0–3 pieces of logic that would hurt most if silently wrong, and the edges to check.

## Success check (at wrap-up)
