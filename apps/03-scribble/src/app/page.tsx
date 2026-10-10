"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pieces, Reading } from "@/components/pieces";
import { Unlock } from "@/components/unlock";
import { Writer } from "@/components/writer";
import { api as makeApi, ApiError } from "@/lib/api";
import type { Piece } from "@/lib/types";
import { useLocalStorage } from "@/lib/use-local-storage";

type View = { type: "write" } | { type: "pieces" } | { type: "read"; id: string };

export default function Home() {
  const [code, setCode] = useLocalStorage("03-scribble:access-code", "");
  const [sound, setSound] = useLocalStorage("03-scribble:sound", true);
  const api = useMemo(() => makeApi(code), [code]);
  const [pieces, setPieces] = useState<Piece[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>({ type: "write" });
  // Coming back from a piece returns you to the same place in a long list (break-ui, 10 Oct).
  const listScroll = useRef(0);
  useEffect(() => {
    window.scrollTo({ top: view.type === "pieces" ? listScroll.current : 0 });
  }, [view]);

  const load = useCallback(async () => {
    try {
      setPieces(await api.list());
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setCode("");
        setError("That code didn't work. Check it and try again.");
      } else setError(err instanceof Error ? err.message : "Something went wrong. Please try again later.");
    }
  }, [api, setCode]);

  useEffect(() => {
    // Loading the pieces once the code is known is the point of this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (code) load();
  }, [code, load]);

  // A saved piece replaces its old copy, newest first.
  const onSaved = useCallback((piece: Piece) => {
    setPieces((list) => [piece, ...(list ?? []).filter((p) => p.id !== piece.id)]);
  }, []);

  if (!code) return <Unlock error={error} onUnlock={setCode} />;

  if (!pieces) {
    return (
      <main className="sc sc-gate">
        <div className="sc-gate-form">
          {error ? (
            <>
              <p className="sc-notice">{error}</p>
              <button className="sc-link sc-main" onClick={load}>
                try again
              </button>
            </>
          ) : (
            <p className="sc-reading breathe" role="status">opening the notebook…</p>
          )}
        </div>
      </main>
    );
  }

  if (view.type === "pieces") {
    return (
      <Pieces
        pieces={pieces}
        sound={sound}
        onToggleSound={() => setSound((s) => !s)}
        onOpen={(id) => {
          listScroll.current = window.scrollY;
          setView({ type: "read", id });
        }}
        onBack={() => {
          listScroll.current = 0;
          setView({ type: "write" });
        }}
      />
    );
  }

  if (view.type === "read") {
    const piece = pieces.find((p) => p.id === view.id);
    if (piece) return <Reading piece={piece} pieces={pieces} api={api} onSaved={onSaved} onBack={() => setView({ type: "pieces" })} />;
  }

  return (
    <Writer api={api} pieces={pieces} sound={sound} onSaved={onSaved} onOpenPieces={() => setView({ type: "pieces" })} />
  );
}
