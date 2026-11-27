"use client";

// The menu bar (#38): the field switch (phase 4), the view switch and Your thread. Quiet text buttons; the current
// field and view are marked. The phone has no globe, so its first view is the list of schools.
import { FIELD_IDS, getField } from "@/lib/content";
import type { Nav, View } from "./meander";

/** "Philosophy · Music": which map you are in. On the phone it sits in the header, beside the wordmark. */
export function FieldSwitch({ nav }: { nav: Nav }) {
  return (
    <div className="fields" role="group" aria-label="Field">
      {FIELD_IDS.map((id, i) => (
        <span key={id} className="fi">
          {i > 0 && <span className="dotsep" aria-hidden="true">·</span>}
          <button type="button" className="mi" aria-pressed={nav.field.id === id} onClick={() => nav.showField(id)}>
            {getField(id).words.field}
          </button>
        </span>
      ))}
    </div>
  );
}

export function MenuBar({ nav, phone = false }: { nav: Nav; phone?: boolean }) {
  // Desktop: switch the view and keep the open school. Phone: one screen at a time, so go to that view's list.
  const go = (v: View) => () => {
    if (phone) nav.overview();
    nav.showView(v);
  };
  return (
    <nav className="menu" aria-label="Menu">
      {!phone && (
        <>
          <FieldSwitch nav={nav} />
          <i className="sep" aria-hidden="true" />
        </>
      )}
      <div className="views" role="group" aria-label="View">
        <button type="button" className="mi" aria-pressed={nav.view === "globe"} onClick={go("globe")}>{phone ? nav.field.words.listMenu : "Globe"}</button>
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
