"use client";

import { useState } from "react";
import { today } from "@/lib/goodreads";
import type { Book, BookInput, Found } from "@/lib/types";
import { Cover, Sheet, Stars } from "./shared";

export type SheetTarget = { book: Book } | { found: Found };

export const fromFound = (f: Found, shelf: Book["shelf"]): BookInput => ({
  workKey: f.workKey,
  goodreadsId: null,
  isbn: f.isbn ?? null,
  title: f.title,
  author: f.author,
  coverUrl: f.coverUrl,
  year: f.year,
  shelf,
  rating: null,
  line: null,
  review: null,
  genres: f.genres,
  readOn: null,
  readOnEstimated: false,
  addedOn: today(),
});

const longDate = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

// One book: what it is, what I thought, and what I can do with it.
export function BookSheet({
  target,
  onSave,
  onRemove,
  onClose,
}: {
  target: SheetTarget;
  /** Saves and resolves when stored; the sheet closes after. */
  onSave: (input: BookInput, id?: string) => Promise<void>;
  onRemove: (book: Book) => Promise<void>;
  onClose: () => void;
}) {
  const book = "book" in target ? target.book : null;
  const info = book ?? ("found" in target ? target.found : null)!;
  const [logging, setLogging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  };
  const base = (): BookInput => {
    if (book) {
      const rest: Partial<Book> = { ...book };
      delete rest.id;
      delete rest.updatedAt;
      return rest as BookInput;
    }
    return fromFound((target as { found: Found }).found, "want");
  };

  return (
    <Sheet label={info.title} onClose={onClose}>
      <div className="px-5">
        <div className="flex gap-4">
          <Cover book={info} className="w-20 shrink-0" />
          <div className="min-w-0 pt-1">
            <h2 className="text-[17px] font-semibold leading-snug">{info.title}</h2>
            <p className="mt-0.5 text-[14px] text-[var(--f-muted)]">
              {info.author}
              {info.year ? ` · ${info.year}` : ""}
            </p>
            {info.genres.length > 0 && <p className="mt-2 text-[13px] text-[var(--f-muted)]">{info.genres.join(" · ")}</p>}
            {!book && "found" in target && target.found.note && <p className="mt-2 text-[13px] text-[var(--f-faint)]">{target.found.note}</p>}
            {book?.shelf === "want" && <p className="mt-2 text-[13px] text-[var(--f-faint)]">Saved {longDate(book.addedOn)}</p>}
          </div>
        </div>

        {logging ? (
          <LogForm
            initial={book?.shelf === "read" ? book : null}
            busy={busy}
            onCancel={() => setLogging(false)}
            onSave={(v) => run(() => onSave({ ...base(), ...v, shelf: "read" }, book?.id))}
          />
        ) : (
          <>
            {book?.shelf === "read" && (
              <div className="mt-5">
                <div className="flex items-baseline gap-3">
                  <Stars rating={book.rating} className="text-[16px]" />
                  {book.readOn && (
                    <span className="text-[13px] text-[var(--f-faint)]">
                      {book.readOnEstimated ? `Added ${longDate(book.readOn)}` : `Read ${longDate(book.readOn)}`}
                    </span>
                  )}
                </div>
                {book.line && <p className="mt-3 text-[16px] leading-relaxed">{book.line}</p>}
                {book.review && <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-[var(--f-muted)]">{book.review}</p>}
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              {!book && (
                <button disabled={busy} onClick={() => run(() => onSave(base()))} className="rounded-full bg-[var(--f-text)] px-4 py-2.5 text-[15px] text-[var(--f-bg)] disabled:opacity-60">
                  Want to read
                </button>
              )}
              <button
                onClick={() => setLogging(true)}
                className={`rounded-full px-4 py-2.5 text-[15px] ${book?.shelf === "want" ? "bg-[var(--f-text)] text-[var(--f-bg)]" : "shadow-[0_0_0_1px_var(--f-line)]"}`}
              >
                {book?.shelf === "read" ? (book.line || book.rating ? "Edit" : "Add rating and a line") : "I've read it"}
              </button>
              {book &&
                (confirmRemove ? (
                  <button disabled={busy} onClick={() => run(() => onRemove(book))} className="rounded-full px-4 py-2.5 text-[15px] text-red-300 shadow-[0_0_0_1px_var(--f-line)]">
                    Remove from shelf
                  </button>
                ) : (
                  <button onClick={() => setConfirmRemove(true)} className="px-3 py-2.5 text-[15px] text-[var(--f-faint)]">
                    Remove
                  </button>
                ))}
            </div>
          </>
        )}
        {error && (
          <p role="alert" className="mt-3 text-[14px] text-red-300">
            {error}
          </p>
        )}
      </div>
    </Sheet>
  );
}

function LogForm({
  initial,
  busy,
  onCancel,
  onSave,
}: {
  initial: Book | null;
  busy: boolean;
  onCancel: () => void;
  onSave: (v: Pick<BookInput, "rating" | "line" | "review" | "readOn" | "readOnEstimated">) => void;
}) {
  const [rating, setRating] = useState<number | null>(initial?.rating ?? null);
  const [line, setLine] = useState(initial?.line ?? "");
  const [review, setReview] = useState(initial?.review ?? "");
  const [showReview, setShowReview] = useState(Boolean(initial?.review));
  const [readOn, setReadOn] = useState(initial?.readOn ?? today());
  const estimatedUnchanged = initial?.readOnEstimated && readOn === initial.readOn;

  return (
    <form
      className="mt-5 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          rating,
          line: line.trim() || null,
          review: showReview ? review.trim() || null : null,
          readOn,
          readOnEstimated: Boolean(estimatedUnchanged),
        });
      }}
    >
      <RatingInput value={rating} onChange={setRating} />
      <input
        value={line}
        onChange={(e) => setLine(e.target.value)}
        maxLength={140}
        aria-label="Your one-line review"
        placeholder="What you thought, in one line"
        className="w-full rounded-xl bg-[var(--f-bg)] px-3.5 py-3 outline-none shadow-[0_0_0_1px_var(--f-line)] placeholder:text-[var(--f-faint)] focus:shadow-[0_0_0_1.5px_var(--f-muted)]"
      />
      {showReview ? (
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          rows={5}
          aria-label="Your longer review"
          placeholder="More, if you want to"
          className="w-full resize-y rounded-xl bg-[var(--f-bg)] px-3.5 py-3 leading-relaxed outline-none shadow-[0_0_0_1px_var(--f-line)] placeholder:text-[var(--f-faint)] focus:shadow-[0_0_0_1.5px_var(--f-muted)]"
        />
      ) : (
        <button type="button" onClick={() => setShowReview(true)} className="text-[14px] text-[var(--f-muted)] underline underline-offset-4">
          Add a longer review
        </button>
      )}
      <label className="flex items-center justify-between gap-3 text-[15px] text-[var(--f-muted)]">
        Finished
        <input
          type="date"
          value={readOn}
          max={today()}
          onChange={(e) => e.target.value && setReadOn(e.target.value)}
          className="rounded-lg bg-[var(--f-bg)] px-3 py-2 text-[var(--f-text)] shadow-[0_0_0_1px_var(--f-line)] [color-scheme:dark]"
        />
      </label>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={busy} className="rounded-full bg-[var(--f-text)] px-5 py-2.5 text-[15px] text-[var(--f-bg)] disabled:opacity-60">
          {busy ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={onCancel} className="px-3 py-2.5 text-[15px] text-[var(--f-faint)]">
          Cancel
        </button>
      </div>
    </form>
  );
}

// Half stars: each star has a left half (n − ½) and a right half (n). Tapping the current rating
// clears it.
function RatingInput({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div className="flex items-center gap-3">
      <div role="radiogroup" aria-label="Rating" className="flex">
        {[1, 2, 3, 4, 5].map((n) => {
          const fill = value === null ? 0 : value >= n ? 1 : value === n - 0.5 ? 0.5 : 0;
          return (
            <span key={n} className="relative inline-block h-10 w-9 text-[30px] leading-10">
              <span className="absolute inset-0 text-center text-[var(--f-line)]" aria-hidden>
                ★
              </span>
              <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }} aria-hidden>
                <span className="block w-9 text-center text-[var(--f-star)]">★</span>
              </span>
              {[n - 0.5, n].map((v, i) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={value === v}
                  aria-label={`${v} ${v === 1 ? "star" : "stars"}`}
                  onClick={() => onChange(value === v ? null : v)}
                  className={`absolute inset-y-0 w-1/2 ${i === 0 ? "left-0" : "right-0"}`}
                />
              ))}
            </span>
          );
        })}
      </div>
      <span className="text-[14px] text-[var(--f-faint)] tabular-nums">{value ? `${value}` : "Not rated"}</span>
    </div>
  );
}
