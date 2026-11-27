"use client";

// The menu bar (#38): the view switch (Globe now, Timeline next) and Your thread. Quiet text buttons; the
// current view is marked. The phone has no globe, so its first view is the list of schools.
import type { Nav, View } from "./meander";

export function MenuBar({ nav, phone = false }: { nav: Nav; phone?: boolean }) {
  // Desktop: switch the view and keep the open school. Phone: one screen at a time, so go to that view's list.
  const go = (v: View) => () => {
    if (phone) nav.overview();
    nav.showView(v);
  };
  return (
    <nav className="menu" aria-label="Menu">
      <div className="views" role="group" aria-label="View">
        <button type="button" className="mi" aria-pressed={nav.view === "globe"} onClick={go("globe")}>{phone ? "Schools" : "Globe"}</button>
        <button type="button" className="mi" aria-pressed={nav.view === "timeline"} onClick={go("timeline")}>Timeline</button>
      </div>
      <i className="sep" aria-hidden="true" />
      <button
        type="button"
        className="mi yt"
        aria-expanded={nav.threadOpen}
        aria-controls={phone ? undefined : "thread-panel"}
        onClick={nav.toggleThread}
      >
        <i aria-hidden="true" />Your thread
      </button>
    </nav>
  );
}
