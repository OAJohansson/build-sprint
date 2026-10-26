// What the Studio autosaves (S5-1, L206): each new doc from the editor is compared with the last
// doc sent, not with the doc as opened. Undo restores an earlier doc object, and an undo back to
// the opened state used to be skipped (bug since 19 Oct), so the undone edit stayed saved.
// Pure; autosave.test.ts. Docs are compared by identity: every edit makes a new object.

export type Autosave<T> = {
  /** A doc the editor now shows. True when it is queued to save (it differs from the last one sent). */
  change(doc: T, draft?: boolean): boolean;
  /** The doc to save now (the latest queued), or null when nothing is waiting. */
  flush(): T | null;
};

export function autosave<T>(opened: T): Autosave<T> {
  let last = opened;
  let pending: T | null = null;
  return {
    change(doc, draft = false) {
      // A Mentor draft isn't saved until the owner saves it (N1).
      if (draft || doc === last) return false;
      last = doc;
      pending = doc;
      return true;
    },
    flush() {
      const p = pending;
      pending = null;
      return p;
    },
  };
}
