# Six AM: Listen, Learn, Make — Product Brief & MVP Plan

Oct 23, 2026 · @Ante

## Summary and vision

Six AM grows from a loop-based house production tool into a music companion that helps you **listen, understand, learn and make**: you hear a track you love, Six AM shows how it is built, a mentor explains the genre and the craft, and you make something in that style in the studio.

**The vision in one line:** *Shazam tells you what a track is called. Six AM tells you what it is, how it's built, and helps you make your own.*

The product loop:

1. **Listen** to a track you love, straight from your SoundCloud playlists.
2. **Understand** it: genre, BPM, key, energy, and how the arrangement unfolds across its layers (kick, hats, bass, chords, melody, vocals, FX and more).
3. **Learn** from a mentor that explains what you are hearing, teaches the genres and their history, and suggests what to try.
4. **Make** a track in that style, using loops, synthesisers and, later, AI-generated sounds, in the existing Six AM studio.

&#91;embedded content: The Six AM core loop · 4 steps\]

Every capability serves one step of this loop. The MVP starts at Understand, because analysis is what the later steps build on.

The long-term product has five capabilities around the existing studio: **Ears** (analysis), **Mentor** (learning), **Genre recipes** (starting templates per genre), **Lab** (synthesis and AI sound generation) and **Deconstruct / Remake** (seeing and rebuilding how a track is made, including live stem separation).

**The first step is small.** The MVP, *Ears v1*, lets you paste a SoundCloud link, play it inside Six AM and get genre, BPM, key and energy back in about a minute, with a "Copy for Claude" button that stands in for the mentor. It solves a real problem today (sorting a 56-track playlist into genre playlists) and tests the riskiest technical assumption that every later feature depends on.

**Hard requirement:** everything must work with tracks streamed from SoundCloud, including the many that cannot be downloaded.

## Background

Six AM is a working web app today: a simple, GarageBand-style tool for making house tracks by arranging pre-made loops. This initiative came out of a practical problem (organising a SoundCloud playlist by genre) that turned into a learning journey and then a bigger product idea.

### What Six AM does today

- **Four-lane timeline:** Drums, Bass, Chords and Top/FX, each with a mute (M) button, laid out on a bar grid (bars 1–57+ visible).
- **Loop clips on the timeline**, for example *Four to the Floor* (drums), *Rubber Bass* (bass), *Organ Hit* (chords), *Shaker Loop* (top/FX).
- **Transport:** back to start, play/pause, playhead position in bars (e.g. 40.3), tempo display (124 BPM).
- **Undo**, a **Filter** knob and a "Saved" state; a user/project name ("DJ Hanson") and a "My tracks" selector.
- **Loop browser** with tabs per lane. Each loop has a name, two descriptive tags and a length, for example: *Deep Sub* (deep · warm, 4 bars), *Acid Line* (squelchy · Chicago, 4 bars), *Offbeat Pump* (bouncy · classic house, 2 bars), *Rubber Bass* (funky · elastic, 4 bars), *Low Rumble* (dark · techno, 8 bars), *Reese Roll* (gritty · rolling, 4 bars).
- **Preview turntable:** "Click a loop to hear it".

The original goal of Six AM was to learn music production by building a tool that lets you make house tracks from combined sounds.

### How this initiative started

1. **Sorting a playlist.** The starting point was one SoundCloud playlist, *B b baaangers* (56 tracks, about 5 h 53 min), a mixed dump of house and techno. The goal was to split it into genre playlists and learn what the genres really are.
2. **Learning the genres.** Working through the tracks one by one uncovered a rich taxonomy: emotive vocal house, high-tech minimal, melodic house & techno, progressive, tech house and jackin' house, deep and jazzy house, classic house reworks, pop-club remixes, ballroom/vogue, and hard trance / hard bounce (see Appendix A).
3. **Finding a scene.** Research into the underground London and Berlin queer house scene (Adonis, Gideön and Homo-Centric Records, Club Are, Panorama Bar) gave a direction for exploring new music.
4. **Hitting the limit.** Every genre call was made from metadata (uploader tags, artist and label research, track length) and descriptions of how a track sounds, never from the audio itself. Several tracks had no tags or misleading ones. *What's a Girl to Do* by Fatima Yamaha appeared as deep house, melodic house and hard trance depending on the remix. The obvious next question was: *could a tool actually listen to the music?*
5. **The idea.** Combine analysis, learning and production in Six AM: analyse the music I love, understand how it's built, learn the genres, then make similar sounds and tracks.

## Problem and opportunity

**Problem:** a music lover who wants to understand and make house and techno has no single place that connects the music they love to *why it sounds that way* and *how to make it*. Listening, learning and producing live in separate tools, and the gaps between them are where curiosity dies.

### The specific problems

1. **Genres are confusing and labels are unreliable.** Genre tags on SoundCloud are set by uploaders and used loosely. "Deep House" covered both a dreamy 2000s electronica remix and the real Chicago-rooted sound. Many tracks have no tag at all. Sub-genres (jackin', hard bounce, high-tech minimal, ballroom) are mostly learned by word of mouth.
2. **You can't see how a track is built.** Hearing that a track is great doesn't tell you when the bass comes in, how long the build lasts or what makes it feel "deep". Producers learn this by years of listening, remaking tracks or reading DAW tutorials.
3. **Existing tools don't work with streamed music.** Analysis tools (BPM/key detectors, genre classifiers, stem splitters) need an audio file. Most of the music this user loves lives on SoundCloud as edits, bootlegs and remixes that cannot be downloaded or bought.
4. **Learning and making are disconnected.** Tutorials teach theory, DAWs are intimidating, and nothing takes you from "I love this track" to "here's a starting point to make one like it".
5. **Discovery lacks context.** Finding new music in a scene (e.g. Adonis, Gideön, Panorama Bar) means piecing together articles, lineups and labels by hand.

### What we learned while exploring

- **Metadata goes far but not all the way.** Artist, remixer, label and uploader tags allowed confident calls on most tracks, but about 10 out of 56 stayed uncertain without hearing them.
- **The same song can be three genres.** *What's a Girl to Do* exists as dreamy electronica (original), festival melodic house (Dubspinna) and hard trance (KI/KI). Genre lives in the production, not the song, so analysis has to be of the actual audio.
- **Rules beat labels for sorting.** A simple rule ("if you'd sing along to the original vocal, it's an Old banger remix; if the groove is the point, it's tech house") resolved ambiguous tracks better than tags.
- **Learning is most powerful when tied to tracks you love.** Each genre explanation stuck because it was anchored to a specific track in the playlist.

### The opportunity

Open-source technology now makes it possible to analyse music directly in the browser: Essentia.js with the Discogs-EffNet model can predict 400 electronic sub-genres, plus BPM, key and energy. Demucs can separate stems, and large language models can explain music conversationally. No product combines **analysis of streamed music + a learning mentor + a beginner-friendly house production studio**. Six AM already has the studio.

## Target user

The primary user is the builder himself: Six AM is a personal learning tool first, and a product others could use later.

**Persona: the curious club-goer turned bedroom producer**

- Loves house and techno, especially the underground London/Berlin queer scene (Adonis, Gideön, Club Are, Panorama Bar), plus emotive vocal house, melodic techno and hard trance.
- Collects music on **SoundCloud**: playlists full of remixes, edits and bootlegs, most of which can't be downloaded.
- Has no formal music training. Learns by doing and needs concepts explained in plain words, tied to tracks he loves.
- Wants to understand genres well enough to sort and describe his music, find new artists and talk about the scene.
- Wants to learn production: how tracks are structured, what makes a bassline "deep" or "rubbery", how genres differ in tempo, drums and harmony.
- Is technical enough to build a web app with AI coding agents. Values momentum and visible progress over long planning.
- Commits to things with structure, visible progress and measurable milestones, so every phase must deliver something usable on its own.

**Secondary users (future):** beginner producers and DJs who want to learn by deconstructing tracks they love, and music fans who want to understand genres.

## Use cases

The use cases follow the core loop: listen, understand, learn, make. MVP use cases are marked **\[MVP\]**.

### Listen and understand

1. **\[MVP\] What genre is this?** "I love this SoundCloud track but don't know what genre it is." Play it in Six AM, get the top genre matches with confidence, BPM, key and energy.
2. **\[MVP\] Where does this go?** "Which of my playlists does this track belong in?" Use the analysis plus the mentor to file it in the right genre playlist.
3. **\[MVP\] Sort a whole playlist.** "I have one big dump playlist." Load the playlist into Six AM, analyse each track, and build a sorted list.
4. **How is this track built?** "When does the bass come in? How long is the build?" See the arrangement mapped onto Six AM's lanes (layer families such as kick, hats, bass, chords, melody, vocals, FX) and bar grid.
5. **Hear the parts.** "I want to hear just the bassline." Solo or mute drums, bass and chords while the track plays (live stem separation).
6. **Compare two tracks.** "Why does this feel deeper than that?" Side-by-side comparison of tempo, key, energy and brightness.

### Learn

7. **\[MVP, manual\] Explain it to me.** "Why does this count as deep house?" The mentor explains the result in plain words with reference to what was measured. In the MVP this happens by pasting the analysis into a Claude chat.
8. **Teach me a genre.** "What is jackin' house? What are its roots?" Genre lessons with history, defining traits, key artists and reference tracks.
9. **Train my ear.** "Is this soft chords or big stabs? Is the drum swung?" Guided listening prompts and quick tests that build vocabulary.
10. **Discover more like this.** "If I love this, who should I listen to?" Artist, label and track suggestions per genre and scene.

### Make

11. **Start from a genre.** "I want to make a Chicago deep house track." Load a genre recipe: tempo, drum pattern, bass type and chord style.
12. **Make it like this track.** "Start me off with something like the track I just analysed." Set BPM and key from the analysis and suggest matching loops.
13. **Remake mode.** "I want to rebuild this track to learn from it." The original plays alongside, and you rebuild it lane by lane with mentor guidance, flipping between yours and the original.
14. **Shape my own sounds.** "Make this bass darker." Turn loops into playable synths with knobs (cutoff, resonance, envelope) and learn what each does.
15. **Generate new sounds.** "Dusty jazzy Rhodes chords, 122 BPM, F minor." AI-generated loops that drop into the timeline.

## Product pillars

The full product has six capabilities around the existing Studio, each feeding the next: Ears produces the data that Mentor explains, Genre recipes and Remake turn into starting points, and Lab supplies the sounds. Requirements below describe the long-term target. The MVP slice is defined in the MVP section.

### 1. Studio (exists today)

The four-lane, bar-grid production tool. Long-term requirements:

- ST-1: Lanes are the shared mental model across all features: analysis, stems, recipes and remakes all map onto them. Today's four lanes (Drums, Bass, Chords, Top/FX) are the starting point, not the end state. The Studio grows into the full layer model below.
- ST-2: Set project BPM and key from an analysed track in one click.
- ST-3: Accept new sound sources in the loop browser: synth presets (Lab), AI-generated loops (Lab) and, for owned files, separated stems (Deconstruct).
- ST-4: Support a reference track that plays alongside the project (needed for Remake mode).

#### Track layers: from four lanes to a full arrangement

A real house or techno track has around a dozen distinct layers, and Six AM will grow to support them. The four current lanes merge layers that producers treat separately: the kick lives apart from the hats, melody apart from chords, and vocals are central to house. Learning to hear and build each layer separately is a core goal of the product.

| Layer | What it does | Typical sounds | In today's lanes | Can Ears detect it? |
| --- | --- | --- | --- | --- |
| Kick | The four-to-the-floor foundation | 909/808 kick, rumble kick (techno) | Drums | Yes: low-band transients |
| Claps and snares | Backbeat on beats 2 and 4 | 909 clap, rimshot, snare | Drums | Partly |
| Hats and cymbals | Drive and groove; offbeat open hat is the classic house pulse | Closed/open hats, ride, crash | Drums, Top/FX | Yes: high-band activity |
| Percussion | Swing and flavour; jackin' and Afro house live here | Congas, bongos, shakers, toms, cowbell | Top/FX | Partly |
| Sub and bass | Low-end weight and groove | Sine sub, rubbery bass, acid 303, reese, offbeat bounce bass | Bass | Yes: bass stem |
| Chords and pads | Harmony and mood; the "deep" in deep house | Rhodes, organ stabs, M1 piano, pads | Chords | Yes: in the "other" stem |
| Lead and melody | Hooks and riffs | Piano riffs, arps, acid lines, synth leads, horns | Not yet (new lane) | Partly: "other" stem; 6-stem models separate piano |
| Vocals | Hooks, chops, spoken word, gospel, ballroom chants | Acapellas, vocal chops, MC chants | Not yet (new lane) | Yes: vocal stem |
| Samples and loops | Borrowed character | Disco/soul samples, chopped breaks | Not yet (new lane) | Hard |
| FX and transitions | Signal the structure: build, drop, breakdown | Risers, downlifters, impacts, sweeps, reverse crashes, white noise | Top/FX | Partly: around section changes |
| Atmosphere and texture | Space and mood | Drones, field recordings, vinyl crackle, room tone | Top/FX | Hard |

On top of the sound layers sit **non-sound layers** that make a track move: **automation** (filter sweeps, volume rides, the build that raises tension), **mix** (reverb and delay sends, sidechain "pumping" against the kick, groups/buses) and **arrangement markers** (intro, build, drop, breakdown, outro).

**Requirements**

- ST-5: **Layer model.** Lanes become instances of layer types. The user can add, remove, rename and reorder lanes, grouped into collapsible families: Drums (kick, claps, hats, percussion), Bass, Harmony (chords and pads), Melody (leads), Vocals, Samples, FX and Texture.
- ST-6: **Genre templates set the layers.** Each genre recipe defines its default lanes. For example, deep house: kick, clap, hats, percussion, sub, Rhodes chords, vocal. Hard bounce: kick, offbeat bounce bass, lead, risers.
- ST-7: **Automation lanes** for filter cutoff and volume per lane, so builds and breakdowns can be made and learned. Sidechain pump as a per-lane toggle.
- ST-8: **Mixer:** per-lane volume, pan, mute and solo; reverb and delay sends.
- ST-9: **Analysis and stems map to layers at the best resolution available.** The arrangement map estimates families from frequency bands and percussive vs sustained content, splitting kick from hats within drums. 4-stem separation maps to Drums, Bass, Other (harmony + melody) and Vocals. 6-stem models add piano and guitar where useful. The UI is clear about what was measured and what was estimated.
- ST-10: **Loop library and Lab grow per layer:** every layer gets its own loops and synth presets, tagged like today's loops (name, two descriptive tags, length).

**Phasing:** the MVP doesn't change the Studio. Phase 2's arrangement map shows layer families. The full layer model, automation and mixer arrive with Phase 4 (Synth Lab + Remake mode), because remaking a real track needs them.

### 2. Ears: analysis

Listens to a track and describes it.

- EA-1: **Sources:** SoundCloud tracks and playlists via the official embedded player (primary), plus local audio files (secondary).
- EA-2: **Capture:** analyse streamed audio live via tab audio capture, keeping measurements only. Audio is never stored (see Constraints).
- EA-3: **Genre:** top genre matches with confidence from a 400-style model (Discogs-EffNet), filtered and grouped into the genre families in Appendix A.
- EA-4: **Musical facts:** BPM, key and scale (major/minor), and their stability over time.
- EA-5: **Character:** energy, loudness, brightness (soft/warm vs hard/bright), bass weight, and swing (straight vs garage/jackin' shuffle).
- EA-6: **Arrangement map (Phase 2):** section boundaries (intro, build, drop, breakdown, outro) and per-lane activity over time, shown on Six AM's bar grid. Layer families are estimated from frequency-band energy (low = kick/bass, mid = chords/organ/melody, high = hats/shakers), percussive vs sustained content, and voice detection for vocals (see Track layers, ST-9).
- EA-7: **History:** keep a list of analysed tracks with results, so a playlist can be sorted over several sessions.
- EA-8: **Combine with metadata:** show uploader genre tags and description next to the audio-based result, and flag disagreements (e.g. "tagged Deep House, sounds like Progressive").

### 3. Mentor: learning companion

An AI guide (Claude) that explains, teaches and suggests.

- ME-1: Explain an analysis in plain words, referencing what was measured ("it feels deep because of the minor seventh chords and soft kick at 121 BPM").
- ME-2: Recommend which of the user's playlists a track belongs in, using his playlist structure and sorting rules (Appendix B).
- ME-3: Teach genres on request: definition, roots, defining traits (tempo, drums, bass, harmony, structure), key artists, labels and reference tracks (Appendix A is the seed curriculum).
- ME-4: Suggest ear-training prompts ("listen for the piano: soft chords or big stabs?").
- ME-5: Suggest a Six AM starting point: a genre recipe, loops to try, BPM and key.
- ME-6: Suggest discovery paths: artists, labels, parties and mixes (e.g. NTS Adonis show, Homo-Centric, Uzuri, Ostgut Ton).
- ME-7: In Remake mode, guide lane by lane ("the bass enters at bar 17. Is it a deep sub or a rubbery bass?").
- ME-8: Be honest about uncertainty. The genre model gives probabilities, and the mentor says when a call is a judgement.
- **MVP:** the mentor is "Wizard of Oz": a Copy for Claude button exports the analysis for a normal Claude chat. It's built in only once that experience is proven valuable.

### 4. Genre recipes

Starting templates per genre that load into the Studio.

- GR-1: Each recipe defines BPM range, drum pattern (e.g. four-to-the-floor, shuffled hats, offbeat open hat), bass type, chord/harmony style, typical arrangement length and reference tracks.
- GR-2: Initial recipes: Chicago deep house (\~120 BPM, deep sub, Rhodes/organ sevenths), jazzy house, tech house (\~125, rubbery bass, crisp percussion), jackin' house (swung drums), progressive house (long builds), melodic house & techno, high-tech minimal (Brejcha-style), classic/NY house, ballroom/vogue (Ha crash, choppy beats), hard trance / hard bounce (\~145–150, offbeat bounce bass).
- GR-3: Each recipe links to its mentor lesson and to the user's matching playlist.

### 5. Lab: sound creation

New sounds for every layer of the track, in two levels.

- LA-1 **Synthesis (first):** turn static loops into playable synths with real controls, built on Tone.js / Web Audio. For example: *Acid Line* as a 303-style synth (saw/square, resonant filter cutoff and resonance, accent, slide), *Deep Sub* as a sine/triangle sub bass, *Organ Hit* as an M1-style organ stab, *Reese Roll* as detuned saws. These are always in time and in key, free, and educational because the mentor can explain each knob.
- LA-2 **Match a reference:** suggest synth settings that approximate a sound from an analysed track (e.g. bass brightness and envelope).
- LA-3 **AI generation (later):** generate loops from a text prompt with BPM and key, e.g. using Stable Audio Open (drum loops, textures) or MusicGen. Licences must be checked; personal learning use first.
- LA-4 All Lab output lands in the loop browser with name, tags and length, like existing loops.

### 6. Deconstruct and Remake

Seeing and rebuilding how a track is made.

- DR-1 **Arrangement map:** see EA-6. Works for any streamed track.
- DR-2 **Live stem separation ("Six AM Neural Mix"):** separate drums, bass, other (chords/synths) and vocals from the track as it plays, in rolling chunks of about 6–10 s with overlap, played back a few seconds behind the original with per-lane solo/mute. Each chunk is discarded once played, so nothing is stored. Personal-use feature: see Constraints.
- DR-3 **Full stem split for owned files:** for files the user owns (purchased or free downloads), full offline separation with looping, slowing down and saving stems.
- DR-4 **Remake mode:** the reference track plays alongside the user's project, with A/B switching, the arrangement map as a guide and the mentor coaching lane by lane.

## Constraints

Six AM must work with SoundCloud tracks the user cannot download, and it must never record, save or redistribute that audio. Every feature is designed around these two rules.

### C1. SoundCloud first

- Most of the user's library lives on SoundCloud as edits, remixes and bootlegs without downloads. Any feature that only works on files fails the core user.
- Playback uses SoundCloud's official embedded player (Widget API), which needs no developer account and exposes playback controls and events. The full track list of a playlist can be read through the widget (verified: all 56 tracks of *B b baaangers* were listed this way, while the normal page shows only 15 when signed out).
- Geo-blocked tracks can't be played or analysed (e.g. *Why Am I In Love* is "not available in Taiwan"). The app must handle this gracefully.

### C2. Listen, never copy

| Capability | Streamed SoundCloud track | Owned / downloadable file |
| --- | --- | --- |
| Genre, BPM, key, energy, swing | Yes, live while playing; measurements only | Yes |
| Arrangement map (sections, lane activity) | Yes, live; measurements only | Yes |
| Live stem solo/mute (Neural Mix) | Yes, personal use only; transient chunks, discarded after playback | Yes |
| Saved, reusable stems (loop, slow down, export) | **No**: would mean copying the track | Yes |
| Recording or downloading the track | **No** | n/a |

- **Analysis** writes down observations ("124 BPM, bass enters at bar 17") and never keeps the audio, like listening with a notebook.
- **Saving stems** of a streamed track would require recording the whole track and keeping separate, reusable parts of the artist's work. That breaks SoundCloud's terms and the artist's choice not to offer a download, so it's out of scope.
- **Live stem separation** follows the same principle as djay's Neural Mix (process and play, never record), but djay is officially licensed by SoundCloud and Six AM is not. It's acceptable as a private learning tool. **If Six AM is ever released publicly, live separation of streamed tracks needs a licence or must be limited to files the user owns.**
- **Workarounds for full stems:** buy the 5–10 tracks most worth studying (Bandcamp/Beatport, usually £1–2), use free downloads, look for official stems or remix packs, or use djay with a SoundCloud Go+/DJ subscription.

### C3. Runs on the user's machine

- Analysis runs client-side in the browser. Models load directly from their hosts in the user's browser.
- Analysis runs at listening speed: about 60 s for genre/BPM/key, full track length for the arrangement map. The tab must play audibly, since a muted tab yields silent capture.
- No server or running costs for the MVP.

## Technical approach and options considered

The recommended stack is browser-only: SoundCloud Widget API for playback, Chrome tab audio capture for listening, Essentia.js with the Discogs-EffNet model for genre and features, and Claude for the mentor. Everything below came from research during this initiative. The coding agents should treat versions and APIs as to be verified.

### Recommended building blocks

| Need | Choice | Notes |
| --- | --- | --- |
| Play SoundCloud tracks and playlists | [SoundCloud Widget API](https://developers.soundcloud.com/docs/api/html5-widget) (w.soundcloud.com/player + api.js) | Embedded iframe; play/pause/seek, current track, events; no API key |
| Hear the audio | `navigator.mediaDevices.getDisplayMedia({audio:true, video:true, preferCurrentTab:true})` in Chrome, capturing Six AM's own tab | One-time user permission per session; the iframe is cross-origin, so Web Audio cannot tap it directly, but tab capture can. Drop the video track. **Riskiest assumption: spike first.** |
| Process audio | Web Audio API (`MediaStreamAudioSourceNode` → `AudioWorklet`), resample to 16 kHz mono for the models | Keep a rolling buffer in memory only |
| Genre (400 styles) | [Essentia.js](https://mtg.github.io/essentia.js/) + Discogs-EffNet (TF.js) genre/style head | Same model the [SInES Genre Recognizer](https://sinestools.univie.ac.at/genre400detector.htm) uses; real-time tagging has been done ([WLEDAudioSyncRTMGC](https://github.com/zak-45/WLEDAudioSyncRTMGC)). Licence AGPLv3 / non-commercial: fine for personal use, revisit before any public release |
| BPM, key, energy, loudness | Essentia.js algorithms (e.g. RhythmExtractor/PercivalBpm, KeyExtractor, loudness, spectral centroid) | Runs in WASM in the browser |
| Arrangement map (Phase 2) | Novelty/self-similarity section detection + band energy + harmonic/percussive separation (Essentia) | Approximate lanes, no stems |
| Live stems (Phase 4) | Demucs / htdemucs via ONNX Runtime Web + WebGPU ([htdemucs-web-onnx](https://huggingface.co/monteslu/htdemucs-web-onnx)); fallback: local native helper on the Mac | Chunked 6–10 s with overlap-add; must process faster than real time |
| Synths (Lab) | Tone.js / Web Audio | 303-style acid, sub, organ, reese, pads |
| AI sounds (Lab, later) | Stable Audio Open, MusicGen, or a hosted API | Check licences |
| Mentor | Claude API (built-in, later); "Copy for Claude" in the MVP | Needs a small backend proxy for the API key when built in |

### Options considered and why not (for now)

| Option | What it is | Verdict |
| --- | --- | --- |
| Spotify connector / API | Search and playlist management | No audio analysis; Spotify removed audio features for new apps in late 2024 |
| [FreqBlog Music Metadata MCP](https://github.com/stevebirring-star/music-metadata-mcp) | BPM/key/mood/genre lookup by track name; 1,000 free requests/month | Only covers tracks with commercial streaming releases, so it misses most SoundCloud edits and bootlegs |
| [Audio Analyzer MCP (audio-analyzer-rs)](https://github.com/JuzzyDee/audio-analyzer-rs) | Claude Desktop plugin analysing local audio files (tempo, key, spectral, structure) | Useful for owned files; no genre labels; no streams |
| [Cyanite](https://cyanite.ai/getting-started) | Pro music tagging (genre, sub-genre, mood, BPM, key) from MP3 upload or YouTube link | Outside Six AM; 5 analyses/month in the web app |
| TrackCheck for SoundCloud (Chrome extension) | BPM/key on SoundCloud | BPM/key only; [removed from the Chrome store Aug 2026](https://chrome-stats.com/d/jmjdcajkhmddfnfjhghodnijajdmcloe) |
| djay Pro with Neural Mix | Licensed real-time stem separation on SoundCloud streams, no recording | Use today for stem listening; Six AM's live stems copy the idea ([Bonedo](https://www.bonedo.de/artikel/algoriddim-djay-ai-neuralmix-system-trennt-stems-on-the-fly)) |
| rekordbox + SoundCloud | Streaming plus stem separation | Couldn't confirm stems work on streamed tracks ([SoundCloud help](https://help.soundcloud.com/hc/en-us/articles/31405001621659-SoundCloud-and-Rekordbox-Integration)) |
| Server-side analysis | Python Essentia/librosa on a server | Would require uploading audio (copying), plus hosting costs |

### Why live separation is feasible for Six AM (later)

DJ apps need instant separation because a fader move must be heard immediately. Six AM is a learning tool, so the separated audio can run a few seconds behind the original. That turns an extremely hard real-time problem into a chunked one: the model only has to process each 6–10 s chunk faster than it takes to play. The unknown is speed on the user's laptop in the browser (WebGPU). The fallback is a small native helper on the Mac that receives chunks from the browser and returns separated parts, all on-device.

### Data captured per analysis (MVP)

```json
{
  "soundcloudUrl": "https://soundcloud.com/...",
  "title": "Lost in The Loop",
  "uploader": "Cărbune Adrian",
  "uploaderGenreTag": "House",
  "uploaderTags": ["Electronic", "House", "dance", "piano"],
  "analysedSeconds": 60,
  "bpm": 122.0,
  "bpmConfidence": 0.91,
  "key": "F",
  "scale": "minor",
  "keyStrength": 0.74,
  "energy": 0.42,
  "brightness": 0.31,
  "genres": [
    {"style": "Electronic---Deep House", "p": 0.58},
    {"style": "Electronic---House", "p": 0.21},
    {"style": "Jazz---Nu Jazz", "p": 0.07}
  ],
  "analysedAt": "2026-10-23T15:00:00Z"
}
```

Values in the example are illustrative, not measured.

## MVP: Ears v1

The MVP lets the user paste a SoundCloud link, play it inside Six AM, press Analyse and get top-3 genres, BPM, key, energy and brightness within about 60 seconds, plus a Copy for Claude button that stands in for the mentor. It is the smallest slice that delivers real value today and tests the assumption every later phase depends on.

### Hypothesis

*If I can see the genre, BPM, key and energy of the SoundCloud tracks I love, and get them explained, I'll learn the genres faster and finish sorting my playlists.*

**Riskiest assumption to test first:** Chrome tab audio capture can hear the embedded SoundCloud player inside Six AM, and the Discogs-EffNet genre model gives sensible results on this kind of music.

### Why this slice

- Solves a real problem now: sorting the 56-track *B b baaangers* playlist into the genre playlists (Appendix B).
- Tests the riskiest technical assumption before anything is built on it.
- Foundation for everything else: the arrangement map, Remake mode and live stems all reuse the same playback + capture pipeline.
- Small effort: browser only, no server, no running costs.

### Scope

**In scope**

1. A new **Analyse** view in Six AM, alongside the Studio.
2. Paste a **SoundCloud track or playlist URL** → the official embedded player loads in the view. For playlists, show the track list and let the user pick a track.
3. **Enable listening:** a one-time "Allow tab audio" step per session (Chrome tab capture of Six AM's own tab), with clear instructions.
4. **Analyse button:** analyses about 60 s of the playing track (configurable 30–90 s) with a progress indicator.
5. **Result card:** top 3 genre matches with percentages; BPM; key and scale; energy; brightness; uploader's genre tag and tags for comparison (from the page/widget metadata if available; otherwise left out).
6. **Copy for Claude:** copies a structured text summary (track, URL, results, uploader tags) plus a prompt asking which playlist it belongs in and why, to paste into a Claude chat.
7. **Set Six AM to this BPM:** one click sets the Studio tempo to the detected BPM.
8. **Session list:** results of tracks analysed in this session, stored locally (localStorage/IndexedDB), with an "export as CSV/JSON" option.

**Out of scope (later phases)**

- Arrangement map, stem separation (live or offline), built-in mentor, genre recipes, Remake mode, synths, AI generation.
- Automatic batch analysis of whole playlists (queue/autoplay) is a stretch goal only if trivial.
- Accounts, cloud sync, sharing, mobile support, browsers other than Chrome/Chromium.

### User flow

1. Open Six AM → **Analyse** tab.
2. Paste `https://soundcloud.com/andreas-johansson-303905204/sets/b-b-baaangers` → playlist loads with all 56 tracks.
3. Click **Enable listening** → Chrome asks to share a tab → choose *this tab* and tick *Share tab audio*.
4. Pick a track → press **Analyse** → the track plays and a 60 s progress ring fills.
5. Result card appears: *Deep House 58% · House 21% · Nu Jazz 7% · 122 BPM · F minor · energy low · warm*.
6. Click **Copy for Claude** → paste into a Claude chat → get an explanation and playlist recommendation.
7. Optionally click **Set Six AM to 122 BPM** and switch to the Studio to start a track.

### User stories and acceptance criteria

1. **Load SoundCloud.** As a user, I paste a SoundCloud track or playlist URL and it plays inside Six AM.
   - Given a valid public track or playlist URL, the embedded player loads within 5 s.
   - For a playlist, all tracks are listed, including beyond the first 15.
   - An invalid, private or geo-blocked track shows a clear message instead of failing silently.
2. **Enable listening.** As a user, I grant tab-audio permission once and Six AM can hear what its player plays.
   - The UI explains the Chrome dialog (choose this tab, tick Share tab audio).
   - If audio isn't shared or is silent, the UI says so and offers to retry.
   - Stopping sharing (Chrome's Stop sharing bar) is detected and reflected in the UI.
3. **Analyse a track.** As a user, I press Analyse and get results in about 60 s.
   - Progress is visible. Analysis can be cancelled.
   - Results show the top 3 genres with %, BPM (1 decimal), key + scale, energy and brightness as simple labels and bars.
   - Analysis pauses if playback pauses, and resumes or restarts cleanly.
4. **Compare with tags.** As a user, I see the uploader's genre tag next to the audio-based result, so I learn when tags are wrong.
5. **Ask Claude.** As a user, I copy a ready-made summary and prompt to paste into Claude.
   - The copied text includes track title, uploader, URL, all results, uploader tags and the prompt in Appendix B.
6. **Use the BPM.** As a user, I set the Studio tempo from the analysis in one click.
7. **Keep my results.** As a user, I see every track analysed in the session, survive a page reload, and export them.

### Functional requirements

- F1: Parse and validate SoundCloud track and set URLs (including `?si=` and `utm_` parameters, and `?in=` playlist context).
- F2: Use the SoundCloud Widget API (`SC.Widget`) for load, play, pause, seek, current sound info and events (`PLAY`, `PAUSE`, `FINISH`, `READY`).
- F3: Capture tab audio with `getDisplayMedia` (audio required, video track stopped immediately). Route through Web Audio to an `AudioWorklet` that buffers PCM in memory only.
- F4: Resample to the model's input rate (Discogs-EffNet: 16 kHz mono). Compute mel-spectrogram patches as required by the model and run inference with Essentia.js / TF.js, averaging predictions across the analysed window.
- F5: Map the 400 Discogs styles to display names (e.g. `Electronic---Deep House` → *Deep House*). Optionally group them into the genre families in Appendix A and show both.
- F6: Compute BPM, key/scale, energy (RMS/loudness) and brightness (spectral centroid) with Essentia.js algorithms over the same buffer.
- F7: Discard all raw audio as soon as features are computed. Never write audio to storage, never upload it.
- F8: Persist results (not audio) locally. Export CSV/JSON.
- F9: Copy for Claude builds the text payload (Appendix B template) and writes it to the clipboard.
- F10: Set the Studio project BPM from the result.

### Non-functional requirements

- NF1 **Privacy and rights:** no audio is stored, uploaded or downloadable (C2). Code review checks this explicitly.
- NF2 **Performance:** result within 10 s after the capture window ends on a recent laptop; UI stays responsive (inference off the main thread, e.g. in a Web Worker).
- NF3 **Model loading:** models are lazy-loaded on first use and cached by the browser; show a loading state. Total download size noted in the UI the first time.
- NF4 **Platform:** desktop Chrome/Chromium only for the MVP; detect and explain unsupported browsers.
- NF5 **Honesty:** genres are shown as probabilities, never as a single certain label.
- NF6 **Licences:** Essentia.js and its models are AGPLv3 / non-commercial. This is acceptable for personal use. Flag in the README before any public release.
- NF7 **Design:** match the existing Six AM look (dark UI, monospace labels, warm accent colours, lane colours).

### Build plan

Step 0 is a throwaway spike that answers the riskiest question before the real build.

- [ ] **Step 0: Capture spike (riskiest assumption).** A bare page with the SoundCloud widget + `getDisplayMedia` tab capture. Log RMS levels to prove non-silent audio arrives from the embedded player. Decide: proceed / fall back (see Risks).
- [ ] **Step 1: Model spike.** Load Essentia.js + Discogs-EffNet in a Web Worker, run on 60 s of captured audio, print the top 5 styles. Check against 3 tracks with known genres (e.g. a Boris Brejcha track → minimal/techno; *Gag On It* remix → house/club; FOVOS *Work* → hard trance).
- [ ] **Step 2: Analyse view.** URL input, playlist list, widget, Enable listening flow and error states.
- [ ] **Step 3: Analysis pipeline.** Capture window → features → result card. BPM, key, energy, brightness.
- [ ] **Step 4: Copy for Claude + Set BPM + session list + export.**
- [ ] **Step 5: Validation run.** Analyse 10 tracks from the playlist (Appendix B, validation set) and compare with the human/Claude calls. Record agreement.

### Definition of done

- Works end to end on 10 tracks from *B b baaangers* without errors.
- Genre top-1 or top-2 agrees with the reference call (Appendix B) on at least 7 of 10.
- BPM within ±2 of the reference (or double/half-time correctly noted) on at least 8 of 10.
- No audio persisted anywhere (verified by inspecting storage and network).
- The user uses it to finish sorting the playlist.

## Roadmap

After the MVP, Six AM grows in four phases, ordered so each one reuses what came before and delivers something usable on its own. Phases are sequenced, not dated: each starts when the previous gate is passed.

&#91;embedded content: Six AM roadmap · MVP + 4 phases, each with a gate\]

The listening pipeline built in the MVP carries every later phase. The live-stems phase is last because it is the most uncertain technically, and djay covers that need in the meantime.

## Success metrics

Success means the user keeps using Six AM to understand and make music. Personal-use metrics come first and product metrics follow if Six AM opens up.

| Phase | Metric | Target |
| --- | --- | --- |
| MVP | Genre agreement with reference calls (top-1 or top-2) | ≥ 7 of 10 validation tracks |
| MVP | BPM accuracy (±2, or half/double-time flagged) | ≥ 8 of 10 |
| MVP | Playlist sorted into genre playlists using Ears | All 56 tracks placed |
| MVP | Time from paste to result | ≤ 90 s |
| Phase 2 | Arrangement map matches what the user hears (section boundaries within 4 bars) | ≥ 7 of 10 tracks |
| Phase 2–3 | Weekly use: tracks analysed per week | ≥ 10, sustained over 4 weeks |
| Phase 3+ | Tracks started in the Studio from a recipe or an analysis | ≥ 1 per week |
| Learning | Can name the genre of a new track before analysing, then check | Self-score improves month over month |

## Risks, assumptions and open questions

The biggest risk is technical: whether tab capture can hear the embedded player. Step 0 of the build plan tests it first, and each risk has a fallback.

| Risk | Likelihood | Impact | Mitigation / fallback |
| --- | --- | --- | --- |
| Tab capture can't hear the cross-origin SoundCloud iframe, or yields silence | Medium | High | Spike first (Step 0). Fallbacks: play the track in a separate SoundCloud tab and capture that tab; or capture system audio; or a small Chrome extension using `chrome.tabCapture` |
| Discogs-EffNet mislabels underground sub-genres (e.g. jackin', hard bounce, ballroom) | Medium | Medium | Show top 3 with %; combine with uploader tags and artist knowledge via the mentor; keep a correction log to tune the genre-family mapping |
| Model size and load time in the browser | Medium | Low | Lazy load, cache, Web Worker, loading state |
| Essentia AGPL / non-commercial licence | Certain | Low now, high if public | Fine for personal use; revisit before any public release |
| SoundCloud widget or terms change; geo-blocking | Low–medium | Medium | Isolate the player behind an adapter; handle blocked tracks gracefully |
| Live stems (Phase 4) too slow in the browser | High | Medium | Chunked, delayed playback; native Mac helper fallback; djay as interim |
| Scope creep away from shippable steps | Medium | High | Every phase must deliver something usable on its own; keep the MVP strictly to Ears v1 |

**Assumptions**

- Desktop Chrome on the user's laptop is the target environment.
- The user is happy to grant tab-sharing permission each session.
- Personal, non-public use for the foreseeable future.

**Open questions**

- [ ] What is the user's laptop (Mac/Windows, chip)? This decides whether browser-based live stems are viable or a native helper is needed.
- [ ] Does Six AM's current stack (framework, audio engine, e.g. Tone.js) constrain how the Analyse view and audio worklets are added? (For the coding agents to confirm from the repo.)
- [ ] Should the genre display use raw Discogs styles, the user's own genre families (Appendix A), or both?
- [ ] Is batch analysis of a whole playlist (autoplay queue, about 6 h for 56 tracks) worth adding to the MVP, or Phase 2?
- [ ] When the mentor is built in: Claude API via a small backend, and how is the key stored?

## Appendix A: Genre knowledge base

These genre families are the seed curriculum for the Mentor, the basis for Genre recipes, and the target groups for mapping the 400 Discogs styles. BPMs are typical ranges, not rules.

| Genre family | Typical BPM | Defining traits | Reference artists / tracks |
| --- | --- | --- | --- |
| Deep house (Chicago/NY roots) | 118–124 | Jazzy seventh/ninth chords on Rhodes, organ or pads; warm round bass; soulful or gospel vocals; groove over drops; intimate "3am" feel | Mr. Fingers *Can You Feel It*, *Mystery of Love*; Larry Heard *Missing You*; Kerri Chandler *Rain*; Moodymann *Shades of Jae*; Frankie Knuckles & Jamie Principle *Your Love* |
| Jazzy / piano deep house, lo-fi house | 118–124 | Soft steady beat with loose, improvised-feeling piano riffs; sometimes sax/trumpet; lo-fi = dusty, short, mood-led | Barry Can't Swim *When Will We Land?*; St Germain *Rose Rouge*; Kerri Chandler *Bar A Thym*; Folamour; Ross from Friends; DJ Seinfeld |
| Raw / soulful queer house (Adonis, Gideön world) | 120–128 | Golden-era and early-90s deep house plus US garage; dubby, gritty; deep basslines, gospel, organ stabs, punchy vocals; edits over originals | Gideön *Aaron Carl Lives On*, *Brighter Day*; Cajmere & Dajae *Brighter Days*; Danny Tenaglia & Celeda *Music Is the Answer*; Hannah Holland; Prosumer; Tama Sumo & Lakuti |
| Emotive vocal house | 120–124 | Pop/R&B vocal over a soft rolling house beat; bittersweet and euphoric; polished; the "emotional grandchild" of deep house | Tobiahs, Jetta *Sicklysweet*; Frank Ocean *Lost* edits; Fred again..; Ben Böhmer |
| Tech house | 124–128 | Groove-first; punchy, bouncy bassline; crisp shuffling percussion; little melody; rolls rather than builds | Max Dean; Knober & Jaime Soeiro *Realize*; Emanuel Satie; Luke Dean; Josh Baker; Fisher, Chris Lake, Dom Dolla, Mau P (big-room end) |
| Minimal / deep tech | 124–128 | Stripped back, hypnotic, micro-percussion | Jaime Soeiro; Ricardo Villalobos; Raresh |
| Jackin' house | 124–128 | Tech house with swagger: swung, shuffling drums with a UK garage feel, chopped samples | Kolter (Hot Creations, Koltrax) |
| Progressive house | 120–126 | Long intros and slow builds, layered synths, long breakdowns; 6–8 min extended mixes for DJs | Hard Reset *Redemption (Extended Mix)* |
| Melodic house & techno | 120–126 | Cinematic builds, big breakdowns, festival-sunrise feel (Afterlife-style) | Agoria *Scala* (Vintage Culture); Ann Clue *Golden Child*; Stephan Bodzin *Powers of Ten*; Âme, Dixon (Innervisions) |
| High-tech minimal / melodic techno | 125–128 | Dark, hypnotic, few vocals, playful twisting synth lines | Boris Brejcha *Gravity*, *Night Owl*; Recondite |
| Classic house reworks | 120–128 | Modern edits of 90s/2000s classics; the nostalgic vocal is the hook | Armand Van Helden *You Don't Know Me*; Tim Deluxe *It Just Won't Do*; Chaka Khan *Ain't Nobody* |
| Pop-club / camp remixes | 125–135 | Pop-star vocals pushed harder and camper, often hard-house energy | Kim Petras *Gag On It*; Slayyyter *Purrr*; Doechii *Nissan Altima* mashup |
| Ballroom / vogue house | 125–130 | Masters at Work *The Ha Dance* "Ha" crash; choppy, stop-start beats for dips and duckwalks; commentator chants; overlaps with Jersey club and kiki | MikeQ (Qween Beat), Vjuan Allure, Byrell the Great, Kevin JZ Prodigy; Malcolm McLaren *Deep in Vogue* |
| Hard trance / hard bounce / hard groove | 140–155 | Fast, driving, euphoric; acid lines, big trance synths; hard bounce = offbeat "boing" bass; 90s/2000s Dutch and German hard dance revival | KI/KI; FOVOS *Work (Hard Bounce edit)*; Klangkuenstler; Nico Moreno; Øtta |
| Breakbeat / UK electronica | 120–135 | Broken beats, garage and rave nostalgia | Bicep *Glue* |
| Tropical house | 100–118 | Mellow, marimba/flute leads, mid-2010s | Thomas Jack |
| Afro house | 118–124 | Percussive, organic, often chant vocals | User has an existing Afro house playlist |

**Teaching notes the Mentor should keep**

- **Genre lives in the production, not the song.** *What's a Girl to Do* (Fatima Yamaha) is dreamy 2000s electronica in the original, festival melodic house in the Dubspinna remix and hard trance in the KI/KI remix.
- **Uploader tags are unreliable.** "Deep House" is used loosely. The 2012–2016 commercial "deep house" (Duke Dumont era, tropical) is not what the underground scene means by deep house.
- **Deep vs progressive:** deep house is the steady groove, progressive is the slow tease and build.
- **Ballroom vs roots house:** ballroom is all punctuation (Ha crashes, stops), roots house is all flow. They share the same Black and queer club lineage but are different sounds.
- **Quick ear tests:** "Could this have been played in a sweaty Chicago or New York club in 1992?" → roots/deep house. "Is the bassline the star and you're moving your shoulders?" → tech house. "Do the drums swing and skip?" → jackin'/garage. "Soft chords or big stabs?" → jazzy house vs piano house.
- **Scene map:** Adonis (London queer party; founder Shay Malt; residents Hannah Holland, Grace Sands; co-curator Gideön; NTS show), Gideön and Homo-Centric Records, Club Are (progressive and hard house, techy percussion), Panorama Bar / Berghain (Tama Sumo, Lakuti and Uzuri, Prosumer, Roi Perez), Body Movements festival, Eris Drew & Octo Octa, labels Ostgut Ton and Dark Entries.

## Appendix B: Playlist structure, validation set and prompt

The user's SoundCloud is being reorganised from one 56-track dump playlist into genre playlists. Ears must help place each track, and the Mentor must know this structure.

### Target playlists

| Playlist (name or working name) | Genre family | Sorting rule |
| --- | --- | --- |
| *B b baaangers* (source dump, 56 tracks) | Mixed | Being emptied into the playlists below |
| Emotive vocal house (e.g. *Sad Girl Sunrise*) | Emotive vocal house | Pop/R&B vocal, bittersweet, soft beat |
| High-tech minimal (e.g. *Brejcha Church*) | High-tech minimal / melodic techno | Dark, hypnotic, twisting synths |
| Melodic house & techno (e.g. *Afterglow*) | Melodic house & techno | Cinematic builds, festival-sunrise |
| *You Are Edging Me* | Progressive house | Long builds and teases before the drop |
| Tech house, "groove and shoulders" | Tech house, minimal/deep tech, jackin' | The bassline and drums are the star |
| *Old banger remixx* (existing) | Classic house reworks | You'd recognise and sing along to the original vocal |
| Pop-club & hard (e.g. *Gag Reflex*) | Pop-club / camp remixes | Camp, vocal-led, pushed harder |
| Hard trance (e.g. *BPM Is a Personality*) | Hard trance / hard bounce | Speed and the drop are the point, 140+ BPM |
| *Back to the Warehouse* | Raw/soulful queer house, deep house | "Could this play in a sweaty Chicago/NY club in 1992?" Tag: Deep House (+ Queer House) |
| Jazzy house (e.g. *Jazz Hands Up*) | Jazzy / piano deep house | Soft steady beat, piano riffs, horns |
| *The Category Is: SERVE* | Ballroom / vogue house | Ha crashes, choppy beats, chants. SoundCloud genre: Ballroom Vogue (MikeQ uses "Ballroom Vogue / House") |
| *Afro house* (existing) | Afro house |  |
| *drum & basssss* (existing) | Drum & bass |  |
| Unsorted inbox (e.g. *Category Is: TBC*) | Anything undecided | Holding pen until analysed |

### Validation set for the MVP

Reference calls were made from uploader tags, artist and label research, track length and the user's description of the sound, not from audio analysis. The MVP's results are compared against them.

| # | Track | Reference call | Evidence |
| --- | --- | --- | --- |
| 1 | [Hard Reset – Redemption (Extended Mix)](https://soundcloud.com/hardreset90087/redemption-extended-mix) | Progressive house | Uploader tag Progressive House; 7:33 extended mix |
| 2 | [Knober, Jaime Soeiro – Realize](https://soundcloud.com/jaimesoeiro/knober-jaime-soeiro-realize) | Tech house (minimal/deep tech lean) | No tags; artists' labels and style |
| 3 | [Kolter – Symphony No. 5](https://soundcloud.com/koltercologne/symphony-no-5) | Jackin' / tech house | No tags; artist releases on Hot Creations, Heist |
| 4 | [Retrouve – Music Is The Answer (Edit)](https://soundcloud.com/retrouve/music-is-the-answer) | Roots / deep NY house | Tag House; 1998 Tenaglia & Celeda original; user hears it as deep |
| 5 | [Cărbune Adrian – Lost in The Loop](https://soundcloud.com/carbune/lost-in-the-loop-o-deibys) | Jazzy deep house (possibly lo-fi) | Tags House, piano; user: soft constant beat with piano riffs |
| 6 | [Pupa Nas T x FOVOS – Work (Edit)](https://soundcloud.com/fovosmusic/fovos-work-edit-extended) | Hard bounce / hard trance | Tags Trance, hard bounce, hard trance, Techno |
| 7 | [KI/KI – What's a Girl to Do (KI/KI Remix)](https://soundcloud.com/djlekkerman/kiki-whats-a-girl-to-do-kiki-remix) | Hard trance | Tags Trance, Hardtrance, Hardhouse, Acid |
| 8 | [Dubspinna – What's A Girl To Do (Festival Remix)](https://soundcloud.com/dubspinna/whats-a-girl-to-do-dubspinna-festival-remix-fatima-yamaha) | Melodic house (tagged Deep House) | Tags Deep House, House; remixer cites proto-80s synths |
| 9 | [Mason Flint – It Just Won't Do (Remix)](https://soundcloud.com/masonflint/tim-deluxe-feat-sam-obernik-it-just-wont-do-mason-flint-remix) | Tech house (filed as Old banger) | Tags House, tech house; references Fisher, Chris Lake |
| 10 | [MikeQ – Beyoncé Alien Superstar (MikeQ x DJ Fade Remix)](https://soundcloud.com/djmikeq/beyonce-alien-superstar-mikeq-x-dj-fade-remix-dirty) | Ballroom / vogue house | Uploader genre Ballroom Vogue / House |

Track 8 is a deliberate test case: its uploader tag (Deep House) disagrees with the reference call, so the result shows whether the model hears past the tag.

### Copy for Claude template

```markdown
I analysed this track in Six AM:

Track: {title} by {uploader}
URL: {url}
Uploader genre tag: {uploaderGenreTag} | Tags: {uploaderTags}

Results ({analysedSeconds}s analysed):
- Genres: {genre1} {p1}%, {genre2} {p2}%, {genre3} {p3}%
- BPM: {bpm} | Key: {key} {scale}
- Energy: {energyLabel} | Brightness: {brightnessLabel}

What genre is this really, and why? Which of my playlists should it go in?
What should I listen for to recognise this style, and how would I start a
track like this in Six AM?
```

## Appendix C: Sources

- [Mixmag – Why Adonis is doing the queer underground proud](https://mixmag.net/feature/adonis-london-queer-rave-underground)
- [i-D – Adonis club night](https://i-d.co/article/adonis-club-night-photos-roxy-lee/)
- [DJ Mag – Recognise 110: Gideön](https://djmag.com/features/recognise-110-gideon)
- [Attitude – Gideön on Homo-Centric Records](https://attitude.co.uk/culture/music/gideon-on-launching-homo-centric-records-and-the-queer-roots-of-house-music-i-wanted-to-go-to-the-epicentre-of-culture-431178)
- [METAL Magazine – Club Are](https://metalmagazine.eu/en/post/club-are-emotional-sweaty-and-celebratory)
- [Mixmag – Lakuti joins Panorama Bar](https://mixmag.net/amp/lakuti-panorama-bar-resident-berghain-house-dj)
- [Nonchalant – Body Movements 2026 lineup](https://nonchalantmagazine.com/body-movements-2026-just-dropped-its-full-lineup-southwark-park-youre-not-ready/)
- [Techno Airlines – Kolter](https://www.technoairlines.com/artist/kolter)
- [Traxsource – Knober](https://www.traxsource.com/artist/354024/knober)
- [Volumo – Jaime Soeiro](https://volumo.com/artist/22288-jaime-soeiro/about)
- [SInES Tools – Genre Recognizer (Discogs 400)](https://sinestools.univie.ac.at/genre400detector.htm)
- [WLEDAudioSyncRTMGC – real-time genre classification with Essentia.js](https://github.com/zak-45/WLEDAudioSyncRTMGC)
- [Audio and Music Analysis on the Web using Essentia.js](https://www.researchgate.net/publication/356451173_Audio_and_Music_Analysis_on_the_Web_using_Essentiajs)
- [Audio Analyzer MCP (audio-analyzer-rs)](https://github.com/JuzzyDee/audio-analyzer-rs)
- [FreqBlog Music Metadata MCP](https://github.com/stevebirring-star/music-metadata-mcp)
- [Cyanite – Getting started](https://cyanite.ai/getting-started)
- [Music Analysis skill (MCP Market)](https://mcpmarket.com/tools/skills/music-analysis-audio-intelligence)
- [TrackCheck for SoundCloud (Chrome-Stats)](https://chrome-stats.com/d/jmjdcajkhmddfnfjhghodnijajdmcloe)
- [Bonedo – djay Neural Mix separates stems on the fly](https://www.bonedo.de/artikel/algoriddim-djay-ai-neuralmix-system-trennt-stems-on-the-fly)
- [SoundCloud Help – SoundCloud and Rekordbox integration](https://help.soundcloud.com/hc/en-us/articles/31405001621659-SoundCloud-and-Rekordbox-Integration)
- [StemSplit – Rekordbox stem separation](https://stemsplit.io/blog/rekordbox-stem-separation)
- [htdemucs for the browser (ONNX)](https://huggingface.co/monteslu/htdemucs-web-onnx)
- [Real-time low-latency music source separation (arXiv)](https://arxiv.org/html/2511.13146v1)
- [Spotify Community – deprecated Audio Features API](https://community.spotify.com/t5/Spotify-for-Developers/Depending-on-deprecated-Audio-Features-API-for-my-Thesis-Help/td-p/6741862)
