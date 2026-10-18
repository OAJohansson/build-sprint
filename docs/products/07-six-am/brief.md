# Brief

A one-page PRD, written before any code (playbook step 1). Short answers; the success check is filled in at wrap-up.

## Problem

I love house and techno and want to make my own tracks, but I've never produced. Real DAWs
(Ableton, FL Studio) look like a cockpit and GarageBand isn't built for dance music, so I never
get from "I'd love to" to a track I can play.

## Who

Me: a house and techno lover with no production experience, at a laptop with headphones. Had quick
looks at the big tools and was put off by how much is on screen.

## Moment of use and jobs to be done

An evening at home, a track stuck in my head after a night out, 30–60 minutes and curious, not
trying to learn a tool.

1. When I'm in the mood to make something, I want sounds that already fit together, so I can
   make taste decisions instead of fighting timing and music theory.
2. When something sounds good, I want to keep it as a track, so the jam isn't lost.
3. When I hear a melody in my head, I want to hum it in, so the track is really mine (v2).

## Today's alternatives

| Alternative | Good | Annoying |
| --- | --- | --- |
| Ableton / FL Studio | The real thing; Session View is a jam grid | A cockpit for a beginner; costs money |
| GarageBand (Live Loops) | Free, friendly | Not built for house and techno sounds or moves |
| Koala, Groovepad, Remixlive | Tap loops on a grid, fun | Phone-first, generic packs, little sense of building a track |
| Splice (Create) | Huge library, stacks matching samples | AI picks for you; a subscription; a library, not an instrument |

**Why switch:** made only for house and techno, the club moves as single controls, and a calm,
record-shop feel instead of a cockpit.

## Riskiest assumptions

- **Value (riskiest):** jamming curated loops feels like *making* music, not playing someone
  else's. The MVP must test this.
- **Usability:** a beginner understands lanes and "starts on the next bar" without a tutorial.
- **Feasibility:** tight timing in the browser (scheduling on the audio clock), recording a jam
  and playing it back.
- **Viability:** sounds we're allowed to ship inside an app (CC0 only), at a quality that sounds
  like the music I love.

## Success: what good looks like

Main outcome: in one sitting, I go from nothing to a recorded track I want to play back. *(Draft,
owner to confirm the bars.)*

| Signal | How I'll measure it | Target |
| --- | --- | --- |
| First sound | User test: time from opening to something playing | Under 30 seconds |
| First track | User test: a recorded jam of at least 2 minutes | In one sitting, no help |
| Pride | "Would you play this to a friend?" | Yes |

**Guardrail:** timing never drifts; a clip always starts exactly on the bar.

## MVP and stop line

A laptop web app with one curated crate: about 6 loops in each of 4 lanes (drums, bass, chords,
top/FX), all at 124 BPM in one key. Click a clip and it starts on the next bar; one clip per lane.
Play/stop, one filter control, record the jam and play it back. Saved in localStorage.

Stop line: no humming, no Freesound search, no timeline editing, no export. All to `backlog.md`.

## Requirements

| # | Must | Check |
| --- | --- | --- |
| 1 | Clicking a clip starts it on the next bar, in time | Start 4 clips at random moments; all stay locked |
| 2 | One clip per lane; clicking the playing clip stops it | Click a second clip in a lane; the first stops at the bar |
| 3 | The filter sweeps the whole mix smoothly | Turn it fully; no clicks or jumps |
| 4 | Record captures every clip change; playback repeats it exactly | Record 1 minute, play back, compare by ear |
| 5 | Every sound is CC0 with its source listed | Credits list matches the files |

**No-gos:** AI-generated sounds, a timeline editor, accounts, phone layout.

**Rabbit holes:** sound hunting (timebox the crate to an hour), building a full synth, audio
export formats, iOS audio quirks (laptop only for now).

## Unit tests

- **Next-bar maths:** given the audio clock time, tempo and start time, when does the next bar
  start? Edges: exactly on a bar, a hair before a bar, the very first bar.
- **Recording to playback:** clip changes stored as bar numbers replay at the same bars. Edges:
  an empty recording, two changes in the same bar.

## Success check (at wrap-up)
