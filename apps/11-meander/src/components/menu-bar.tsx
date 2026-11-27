"use client";

// The menu bar (#38): the view switch (Globe now, Timeline next) and Your thread. Quiet text buttons; the
// current view is marked. The phone has no globe, so its first view is the list of schools.
import type { Nav } from "./meander";

export function MenuBar({ nav, phone = false }: { nav: Nav; phone?: boolean }) {
  // Back to the current view's home: the globe (out of Your thread and the skeleton), or the phone's list.
  const onView = phone ? nav.overview : () => { nav.closeThread(); nav.stepOut(); };
  return (
    <nav className="menu" aria-label="Menu">
      <div className="views" role="group" aria-label="View">
        <button type="button" className="mi" aria-pressed="true" onClick={onView}>{phone ? "Schools" : "Globe"}</button>
        {/* shortcut: Timeline is not built yet, so it is a disabled placeholder; wire it to the timeline view in the next slice. */}
        <button type="button" className="mi soon" aria-disabled="true" title="Timeline is coming soon">
          Timeline<small>soon</small>
        </button>
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
