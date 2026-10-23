"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { startTabCapture, CaptureError, type TabCapture } from "@/lib/ears/capture";
import { EarsClient, TARGET_RATE } from "@/lib/ears/ears-client";
import { queueCounts, type QueueItem, type QueueTrack } from "@/lib/ears/queue";
import type { EarsAnalysis } from "@/lib/ears/results";
import { snippetPlan, type Snippet } from "@/lib/ears/snippets";
import { parseSoundCloudList } from "@/lib/ears/soundcloud-url";
import { styleDisplayName, styleLabels } from "@/lib/ears/styles";
import type { EarsModelInfo, EarsResult } from "@/lib/ears/types";
import { useEarsQueue } from "@/lib/ears/use-ears-queue";
import { oembedTitle, Player, soundUrl, widgetSrc } from "@/lib/ears/widget";
import { renderTestLoop, TEST_BPM } from "./test-loop";

const DEFAULT_URL = "https://soundcloud.com/hardreset90087/redemption-extended-mix";
type Mode = "snippets" | "window";

export function ModelSpike({ testMode }: { testMode: boolean }) {
  const [ears, setEars] = useState<EarsClient | null>(null);
  const [model, setModel] = useState<EarsModelInfo | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Worker: created once, loads the model straight away so the first analysis is quick.
  useEffect(() => {
    const client = new EarsClient();
    client.onProgress = setProgress;
    client.onError = setError;
    client.ready().then((info) => { setModel(info); setEars(client); });
    return () => client.terminate();
  }, []);

  return (
    <main className="mx-auto w-full max-w-3xl space-y-3 px-4 py-6 font-mono text-sm">
      <h1 className="text-base font-semibold uppercase tracking-widest">Six AM · model spike</h1>
      <p className="text-neutral-500">
        Discogs-EffNet in a Web Worker on audio from this tab. Nothing is recorded or uploaded: PCM stays in memory for one snippet, only numbers come out and only numbers are saved.
      </p>
      <Section title="Model">
        {model ? (
          <p>Loaded in {(model.loadMs / 1000).toFixed(1)} s · {(model.bytes / 1e6).toFixed(1)} MB · {model.classes} classes · input {model.inputName} · outputs {model.outputNames.join(", ")}</p>
        ) : (
          <p>Loading model… {progress !== null ? `${Math.round(progress * 100)}%` : ""}</p>
        )}
        {error && <p className="text-red-600">{error}</p>}
      </Section>
      {testMode ? <TestMode ears={ears} model={model} /> : <QueueMode ears={ears} />}
    </main>
  );
}

// ---------- Real tracks: queue ----------

function QueueMode({ ears }: { ears: EarsClient | null }) {
  const [text, setText] = useState(DEFAULT_URL);
  const [player, setPlayer] = useState<Player | null>(null);
  const [capture, setCapture] = useState<TabCapture | null>(null);
  const [mode, setMode] = useState<Mode>("snippets");
  const [seconds, setSeconds] = useState(60);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  // "One window" = the old spike behaviour (N s from the start); "Snippets" = L26's 4 × 30 s.
  const plan = useMemo(
    () => (mode === "window" ? (d: number, policy?: string): Snippet[] => (policy === "SNIP" ? snippetPlan(d, policy) : [{ startMs: 0, lengthMs: Math.min(seconds * 1000, d || seconds * 1000) }]) : undefined),
    [mode, seconds],
  );
  const q = useEarsQueue({ player, capture, ears, plan });
  const counts = queueCounts(q.queue);
  const resultsById = useMemo(() => new Map(q.results.map((r) => [r.id, r])), [q.results]);

  useEffect(() => () => capture?.stop(), [capture]);

  const onIframe = useCallback((el: HTMLIFrameElement | null) => {
    if (!el) return;
    Player.attach(el).then(setPlayer, (e: Error) => setError(e.message));
  }, []);

  async function enableListening() {
    setError(null);
    try {
      const c = await startTabCapture(() => setCapture(null));
      setCapture(c);
    } catch (e) {
      setError(e instanceof CaptureError ? e.message : String(e));
    }
  }

  async function addToQueue() {
    if (!player) return;
    setError(null); setNote(null); setBusy(true);
    const { valid, invalid } = parseSoundCloudList(text);
    const tracks: QueueTrack[] = [];
    const notes: string[] = [];
    try {
      for (const p of valid) {
        if (p.kind !== "set") { tracks.push({ url: p.url }); continue; }
        // A playlist: load it, read every track (beyond the ~20 the widget details), queue them all.
        setNote(`Reading playlist ${p.url}…`);
        await player.load(p.url);
        const t0 = performance.now();
        const sounds = await player.loadSetDetails((done, of) => setNote(`Reading playlist: details ${done} / ${of}…`));
        const missing = sounds.filter((s) => !s.title);
        for (const s of missing) {
          const url = soundUrl(s);
          const o = url ? await oembedTitle(url) : null;
          if (o) { s.title = o.title; s.user = { username: o.uploader }; }
        }
        for (const s of sounds) {
          const url = soundUrl(s);
          if (url) tracks.push({ url, title: s.title, uploader: s.user?.username, durationMs: s.full_duration ?? s.duration });
        }
        notes.push(`${p.url}: ${sounds.length} tracks, ${sounds.filter((s) => s.title).length} with titles (${missing.length} via oEmbed fallback), ${((performance.now() - t0) / 1000).toFixed(1)} s`);
      }
      q.add(tracks);
      setNote([`Queued ${tracks.length} track(s).`, ...notes, ...invalid.map((i) => `Skipped "${i.input}": ${i.message}`)].join("\n"));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function copyResults() {
    const payload = { userAgent: navigator.userAgent, captureRate: capture?.rate ?? null, model: ears?.info ?? null, analyses: q.results };
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <Section title="1 · Player">
        <iframe ref={onIframe} className="w-full" height={166} allow="autoplay" src={widgetSrc(DEFAULT_URL)} title="SoundCloud player" />
        {!player && <p className="text-neutral-500">Loading the SoundCloud player…</p>}
      </Section>

      <Section title="2 · Enable listening">
        <p className="text-neutral-500">Keep this tab selected and switch on “Also share tab audio”. After a reload the queue waits here.</p>
        <Button onClick={enableListening} disabled={!!capture}>Enable listening</Button>{" "}
        <Button onClick={() => capture?.stop()} disabled={!capture} ghost>Stop</Button>
        <span className="ml-3">{capture ? `Listening at ${capture.rate} Hz` : "Not listening"}</span>
      </Section>

      <Section title="3 · Queue">
        <p className="text-neutral-500">SoundCloud links, one per line. A playlist link adds every track in it.</p>
        <textarea className="h-24 w-full rounded border border-neutral-300 px-2 py-2" value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={addToQueue} disabled={!player || busy}>{busy ? "Reading…" : "Add / Analyse all"}</Button>
          <label className="mt-2 flex items-center gap-1"><input type="radio" checked={mode === "snippets"} onChange={() => setMode("snippets")} /> Snippets (4 × 30 s)</label>
          <label className="mt-2 flex items-center gap-1">
            <input type="radio" checked={mode === "window"} onChange={() => setMode("window")} /> One window from the start,
            <input type="number" min={5} max={180} className="w-16 rounded border border-neutral-300 px-1" value={seconds} onChange={(e) => setSeconds(Number(e.target.value) || 60)} /> s
          </label>
        </div>
        {note && <pre className="mt-2 whitespace-pre-wrap text-neutral-600">{note}</pre>}
        {error && <p className="mt-2 text-red-600">{error}</p>}
        {q.lastError && <p className="mt-2 text-red-600">Last error: {q.lastError}</p>}
        <p className="mt-3">
          {counts.total} in queue · {counts.done} done · {counts.failed} failed · {counts.queued} waiting
          {counts.queued > 0 && !capture && <b className="ml-2 text-amber-600">waiting for listening</b>}
        </p>
        <div className="flex gap-2">
          <Button onClick={q.cancel} disabled={!counts.active} ghost>Cancel current</Button>
          <Button onClick={q.clear} disabled={!counts.total} ghost>Clear queue</Button>
        </div>
        <ol className="mt-2 space-y-1">
          {q.queue.items.map((i) => <QueueRow key={i.id} item={i} result={i.resultId ? resultsById.get(i.resultId) : undefined} onRemove={() => q.remove(i.id)} onRetry={() => q.retry(i.id)} />)}
        </ol>
      </Section>

      <Section title={`Results (${q.results.length}, saved in this browser)`}>
        {q.results.map((r) => <ResultCard key={r.id} r={r} />)}
        <div className="flex gap-2">
          <Button onClick={copyResults} disabled={!q.results.length} ghost>{copied ? "Copied" : "Copy results"}</Button>
          <Button onClick={q.clearResults} disabled={!q.results.length} ghost>Clear results</Button>
        </div>
      </Section>
    </>
  );
}

function statusText(i: QueueItem) {
  switch (i.status) {
    case "listening": return i.progress ? `listening ${i.progress.snippet}/${i.progress.of} · ${i.progress.seconds}/${i.progress.snippetSeconds} s` : "listening";
    case "failed": return `failed: ${i.reason}${i.message ? ` (${i.message})` : ""}`;
    default: return i.status;
  }
}

function QueueRow({ item, result, onRemove, onRetry }: { item: QueueItem; result?: EarsAnalysis; onRemove: () => void; onRetry: () => void }) {
  const top = result?.genres[0];
  return (
    <li className="flex flex-wrap items-baseline gap-x-3 border-b border-neutral-100 py-1">
      <span className="min-w-0 flex-1 truncate">{item.title ? `${item.title}${item.uploader ? ` — ${item.uploader}` : ""}` : item.url}</span>
      <span className={item.status === "failed" ? "text-red-600" : item.status === "done" ? "text-green-700" : "text-amber-600"}>{statusText(item)}</span>
      {result && <span>{result.bpm} BPM · {top ? `${styleDisplayName(top.style)} ${Math.round(top.p * 100)}%` : ""}</span>}
      {(item.status === "failed" || item.status === "done") && <button className="underline" onClick={onRetry}>again</button>}
      <button className="underline" onClick={onRemove}>remove</button>
    </li>
  );
}

function ResultCard({ r }: { r: EarsAnalysis }) {
  const labels = styleLabels(r.genres.map((g) => g.style));
  return (
    <div className="mb-3 border-b border-neutral-200 pb-2">
      <p className="font-semibold">{r.title} — {r.uploader}{r.preview && <b className="ml-2 text-amber-600">preview only (30 s)</b>}</p>
      <p className="text-neutral-500">{r.soundcloudUrl} · tag: {r.uploaderGenreTag ?? "none"} · heard {r.analysedSeconds} s</p>
      <p>{r.genres.slice(0, 3).map((g, i) => `${labels[i]} ${(g.p * 100).toFixed(1)}%`).join(" · ")}</p>
      <p>
        BPM <b>{r.bpm}</b>
        {r.bpmAlternative && <span className={r.bpmAmbiguous ? "text-amber-600" : "text-neutral-500"}> (or {r.bpmAlternative.bpm}, {r.bpmAlternative.relation}, {Math.round(r.bpmAlternative.ratio * 100)}%{r.bpmAmbiguous ? ", ambiguous" : ""})</span>}
        {" "}· key <b>{r.key} {r.scale}</b> ({r.keyStrength}) · energy <b>{r.energy}</b> ({r.energyDbfs} dBFS) · brightness <b>{r.brightness}</b> ({r.brightnessHz} Hz)
      </p>
      <p className="text-neutral-500">
        snippets: {r.snippets.map((s) => `@${fmt(s.startMs)} ${s.heardSeconds}s ${s.topStyle ? styleDisplayName(s.topStyle) : "–"} ${s.bpm}`).join(" | ")}
      </p>
    </div>
  );
}

const fmt = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;

// ---------- ?test=tone: no tab capture ----------

type TestRun = { label: string; pass: boolean; detail: string; result: Omit<EarsResult, "stats"> | null };

function TestMode({ ears, model }: { ears: EarsClient | null; model: EarsModelInfo | null }) {
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [status, setStatus] = useState("Idle.");
  const [busy, setBusy] = useState(false);

  async function run(kind: "single" | "snippets") {
    if (!ears) return;
    setBusy(true);
    try {
      if (kind === "single") {
        setStatus(`Rendering a 30 s test loop at ${TEST_BPM} BPM…`);
        const r = await ears.analyse(await renderTestLoop(TARGET_RATE, 30));
        const pass = Math.abs(r.bpm - TEST_BPM) <= 1 && r.activations.count === 400 && r.activations.finite;
        const { stats: _stats, ...rest } = r; // eslint-disable-line @typescript-eslint/no-unused-vars
        setRuns((x) => [{ label: "single 30 s", pass, detail: `BPM ${r.bpm} (want ${TEST_BPM} ± 1), alt ${r.bpmAlternative?.bpm} ${r.bpmAlternative?.relation}, ${r.activations.count} activations`, result: rest }, ...x]);
      } else {
        // The snippet path: 4 separate 30 s loops analysed one by one, then combined in the worker.
        const stats = [];
        for (let i = 0; i < 4; i++) {
          setStatus(`Snippet ${i + 1} / 4…`);
          stats.push((await ears.analyse(await renderTestLoop(TARGET_RATE, 30))).stats);
        }
        const c = await ears.combine(stats);
        const pass = Math.abs(c.bpm - TEST_BPM) <= 1 && c.activations.count === 400 && c.activations.finite && c.seconds >= 119;
        setRuns((x) => [{ label: "4 × 30 s combined", pass, detail: `BPM ${c.bpm} (want ${TEST_BPM} ± 1), ${c.seconds} s, ${c.patches} patches, key ${c.key} ${c.scale}`, result: { ...c, timings: { featuresMs: 0, inferenceMs: 0 } } }, ...x]);
      }
      setStatus("Done.");
    } catch (e) {
      setStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title="Test mode (no tab capture)">
      <p className="text-neutral-500">Renders a 30 s kick + bass + hat loop at {TEST_BPM} BPM with an A minor stab per bar, at 16 kHz, and runs the same worker path.</p>
      <Button onClick={() => run("single")} disabled={busy || !model}>Run test loop</Button>{" "}
      <Button onClick={() => run("snippets")} disabled={busy || !model}>Run 4 × 30 s snippets</Button>
      <p className="mt-2 text-neutral-500">{status}</p>
      {runs.map((r, i) => (
        <div key={i} className="mt-2">
          <p className={r.pass ? "font-semibold text-green-700" : "font-semibold text-red-600"}>Test {r.pass ? "PASS" : "FAIL"} ({r.label}): {r.detail}</p>
          {r.result && <p>{r.result.styles.map((s) => `${styleDisplayName(s.style)} ${s.pct}%`).join(" · ")}</p>}
        </div>
      ))}
    </Section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-neutral-200 p-4">
      <h2 className="mb-2 text-xs uppercase tracking-widest text-neutral-500">{title}</h2>
      {children}
    </section>
  );
}

function Button({ ghost, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { ghost?: boolean }) {
  return (
    <button
      {...props}
      className={`mt-2 rounded px-3 py-2 font-semibold disabled:opacity-40 ${ghost ? "border border-neutral-300" : "bg-amber-500 text-black"}`}
    />
  );
}
