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
2. When I'm building a track, I want to see what plays when (drums and bass for a while, then
   something new comes in), so I can shape it into a song.
3. When I hear a melody in my head, I want to hum it in, so the track is really mine (v2).

## Today's alternatives

| Alternative | Good | Annoying |
| --- | --- | --- |
| Ableton / FL Studio | The real thing | A cockpit for a beginner; costs money |
| GarageBand | Free, friendly, a timeline you can drag loops onto | Not built for house and techno sounds or moves |
| Koala, Groovepad, Remixlive | Tap loops on a grid, fun | Phone-first, generic packs, little sense of building a track |
| Splice (Create) | Huge library, stacks matching samples | AI picks for you; a subscription; a library, not an instrument |

**Why switch:** made only for house and techno (sounds, tempo, the club moves), and a calm,
record-shop feel instead of a cockpit.

## Riskiest assumptions

- **Value (riskiest):** arranging curated loops on a timeline feels like *making* music, not
  playing someone else's. The MVP must test this.
- **Usability:** a beginner can drag a loop onto the timeline, repeat it and hear it in time,
  without a tutorial. (The first idea, a jam grid of lanes, failed this with the owner on 18 Oct:
  they expected a timeline.)
- **Feasibility:** tight timing in the browser (scheduling the timeline on the audio clock),
  smooth dragging and snapping, drawing waveforms.
- **Viability:** sounds we're allowed to ship inside an app (CC0 only), at a quality that sounds
  like the music I love.

## Success: what good looks like

Main outcome: in one sitting, I go from nothing to a track I want to play back.

| Signal | How I'll measure it | Target |
| --- | --- | --- |
| First sound | User test: time from opening to something playing | Under 30 seconds |
| First track | User test: a timeline of at least 2 minutes with 4+ loops | In one sitting, no help |
| Pride | "Would you play this to a friend?" | Yes |

**Guardrail:** timing never drifts; every loop plays exactly on its bar.

## MVP and stop line

A laptop web app with two parts. **The crate** (sound browser): 24 loops in four groups (drums,
bass, chords, top/FX), all at 124 BPM in A minor, each with a preview. Synthesised in the browser
first, CC0 samples from Freesound later (decision 0019, 18 Oct). **The timeline**: four fixed tracks (drums, bass, chords, top/FX) you drag loops onto;
every loop snaps to the bar and repeats when you drag its end; mute per track; play from any bar
with a moving playhead; one filter control; undo. One zoom level showing about 64 bars. Tracks autosave to
Supabase so they open on any device, behind an access code (decision 0020, 19 Oct; the brief
first said localStorage). Layout: GarageBand's (timeline plus loop browser), look and browser from rekordbox
(dark, coloured waveforms, a proper library list). Owner agreed this feature list, 18 Oct.

Stop line: no live jamming (the lanes idea), no humming, no Freesound search, no export, no
volume per track or mixer, no more than four tracks, no zoom, no loop-a-section, no effects
beyond the filter. All to `backlog.md`.

## Requirements

| # | Must | Check |
| --- | --- | --- |
| 1 | Clicking a loop in the crate previews it, in time with the track if it's playing | Preview during playback; it stays on the beat |
| 2 | Dragging a loop onto the timeline drops it on the nearest bar | Drop between bars; it lands on a bar line |
| 3 | Dragging a loop's end repeats it in whole loop lengths | Stretch a 4-bar loop to 16 bars; it plays 4 times |
| 4 | Play starts where the playhead is; the playhead moves in time | Click bar 17, press play; sound and playhead start at 17 |
| 5 | Loops can be moved and deleted | Move a loop to bar 33, delete another; playback matches |
| 6 | The filter sweeps the whole mix smoothly | Turn it fully; no clicks or jumps |
| 7 | The track survives a reload | Reload; every loop is where it was |
| 8 | Muting a track silences it from the next beat, and unmuting brings it back | Mute drums during playback; only drums stop |
| 9 | Undo reverses the last change (add, move, repeat, delete, mute) | Do five changes, undo five times; back to the start |
| 10 | Every sound is CC0 with its source listed | Credits list matches the files |

**No-gos:** AI-generated sounds, accounts, phone layout, a pro-style mixer.

**Rabbit holes:** sound hunting (timebox the crate to an hour), waveform drawing performance,
zoom levels, audio export formats, building a synth.

## Unit tests

- **Snap to bar:** given a drop position in pixels, the zoom and the tempo, which bar does a loop
  land on? Edges: exactly on a bar line, just before one, before bar 1, past the end.
- **Timeline to schedule:** loops at bar positions (with repeats) become the right start times
  in seconds from any playhead position. Edges: starting mid-loop, an empty timeline, a repeat
  that ends exactly where the next loop starts.

## Success check (at wrap-up)
