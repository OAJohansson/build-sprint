"use client";

import { useState } from "react";
import { Care } from "./care";
import { Journey, type JourneyKind } from "./journey";
import { Setup } from "./setup";
import { demoStore, type Store } from "./store";
import { Today } from "./today";

// The prototype app: Today, Journey and Care behind a three-item tab bar, plus first-run setup.

type Tab = "today" | "journey" | "care";

export default function MallowApp({ journey }: { journey: JourneyKind }) {
  const [store, setStoreRaw] = useState<Store>(demoStore);
  const [setup, setSetup] = useState(() => readParam("setup") === "1");
  const [tab, setTabRaw] = useState<Tab>(() => (readParam("tab") as Tab) || "today");
  const [addingMedicine, setAddingMedicine] = useState(false);
  const setStore = (fn: (s: Store) => Store) => setStoreRaw(fn);

  const setTab = (t: Tab) => {
    setTabRaw(t);
    writeParam("tab", t);
    window.scrollTo(0, 0);
  };

  if (setup)
    return (
      <Setup
        onDone={(s) => {
          setStoreRaw(s);
          setSetup(false);
          writeParam("setup", null);
          setTab("today");
        }}
      />
    );

  return (
    <>
      {tab === "today" && (
        <Today
          store={store}
          setStore={setStore}
          onAddMedicine={() => {
            setAddingMedicine(true);
            setTab("care");
          }}
        />
      )}
      {tab === "journey" && <Journey store={store} kind={journey} />}
      {tab === "care" && (
        <Care
          store={store}
          setStore={setStore}
          addingMedicine={addingMedicine}
          setAddingMedicine={setAddingMedicine}
          onLoadDemo={() => {
            setStoreRaw(demoStore());
            setTab("today");
          }}
          onStartFresh={() => {
            setSetup(true);
            writeParam("setup", "1");
          }}
        />
      )}
      <TabBar tab={tab} onTab={setTab} />
    </>
  );
}

function TabBar({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const items: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "today", label: "Today", icon: <LeafIcon /> },
    { id: "journey", label: "Journey", icon: <PathIcon /> },
    { id: "care", label: "Care", icon: <DropIcon /> },
  ];
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t"
      style={{ background: "color-mix(in oklch, var(--paper) 92%, transparent)", borderColor: "var(--line)", backdropFilter: "blur(12px)", paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Main"
    >
      <div className="mx-auto grid max-w-[440px] grid-cols-3">
        {items.map((it) => {
          const on = tab === it.id;
          return (
            <button
              key={it.id}
              onClick={() => onTab(it.id)}
              aria-current={on ? "page" : undefined}
              className="press flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium"
              style={{ color: on ? "var(--mallow-deep)" : "var(--ink-faint)" }}
            >
              {it.icon}
              {it.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

const iconProps = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
const LeafIcon = () => (
  <svg {...iconProps}>
    <path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14Z" />
    <path d="M5 19 13 11" />
  </svg>
);
const PathIcon = () => (
  <svg {...iconProps}>
    <circle cx="6" cy="18" r="2" />
    <circle cx="18" cy="6" r="2" />
    <path d="M8 18h6a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h6" />
  </svg>
);
const DropIcon = () => (
  <svg {...iconProps}>
    <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" />
  </svg>
);

function readParam(k: string) {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(k);
}
function writeParam(k: string, v: string | null) {
  const url = new URL(window.location.href);
  if (v === null) url.searchParams.delete(k);
  else url.searchParams.set(k, v);
  history.replaceState(null, "", url);
}
