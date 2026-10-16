import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanReview, cleanTitle, fromGoodreads, mergeBooks, parseCsv, readGoodreads, toIsoDate, toRating, today } from "./goodreads";
import type { Book } from "./types";

const HEADER =
  "Book Id,Title,Author,ISBN,ISBN13,My Rating,Year Published,Original Publication Year,Date Read,Date Added,Exclusive Shelf";
const csv = (...rows: string[]) => [HEADER, ...rows].join("\n");

afterEach(() => vi.useRealTimers());

describe("parseCsv", () => {
  it("keeps commas, quotes and line breaks inside quoted fields", () => {
    expect(parseCsv('a,"b, c","say ""hi""","two\nlines"\n1,2,3,4')).toEqual([
      ["a", "b, c", 'say "hi"', "two\nlines"],
      ["1", "2", "3", "4"],
    ]);
  });
  it("handles a byte-order mark, Windows line ends and a trailing newline", () => {
    expect(parseCsv("﻿a,b\r\n1,2\r\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("dates", () => {
  it("turns Goodreads' 2023/05/14 into 2023-05-14", () => {
    expect(toIsoDate("2023/05/14")).toBe("2023-05-14");
  });
  it("keeps month end and year end exactly, with no time-zone shift", () => {
    expect(toIsoDate("2024/02/29")).toBe("2024-02-29");
    expect(toIsoDate("2023/12/31")).toBe("2023-12-31");
  });
  it("rejects empty and malformed dates", () => {
    expect(toIsoDate("")).toBeNull();
    expect(toIsoDate("2023/13/01")).toBeNull();
    expect(toIsoDate("14 May 2023")).toBeNull();
  });
  it("today() is the local date, also just after midnight", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 31, 0, 0, 5)); // 00:00:05 on 31 Oct, local time
    expect(today()).toBe("2026-10-31");
    vi.setSystemTime(new Date(2026, 11, 31, 23, 59, 59));
    expect(today()).toBe("2026-12-31");
  });
});

describe("ratings", () => {
  it("maps Goodreads ratings exactly, halves included", () => {
    expect(toRating("4.0")).toBe(4);
    expect(toRating("3.5")).toBe(3.5);
    expect(toRating("5")).toBe(5);
  });
  it("treats 0 and empty as unrated, not zero stars", () => {
    expect(toRating("0")).toBeNull();
    expect(toRating("")).toBeNull();
  });
});

describe("fromGoodreads", () => {
  it("imports read and to-read rows; uses date added when date read is empty", () => {
    const rows = fromGoodreads(
      csv(
        '1,"Educated: A Memoir",Tara Westover,"=""0399590501""","=""9780399590504""",5.0,2018,2018,2023/09/02,2023/09/01,read',
        "2,Mindset,Carol S. Dweck,,,3.5,2006,2006,,2026/10/10,read",
        "3,Piranesi,Susanna  Clarke,,,0,2020,2020,,2026/09/01,to-read",
        "4,Some Book,Someone,,,0,,,,2020/01/01,currently-reading",
      ),
    );
    expect(rows).toHaveLength(4);
    expect(rows[3]).toMatchObject({ title: "Some Book", shelf: "reading", readOn: null });
    expect(rows[0]).toMatchObject({ title: "Educated", isbn: "9780399590504", rating: 5, shelf: "read", readOn: "2023-09-02", readOnEstimated: false });
    expect(rows[1]).toMatchObject({ rating: 3.5, readOn: "2026-10-10", readOnEstimated: true });
    expect(rows[2]).toMatchObject({ shelf: "want", rating: null, readOn: null, author: "Susanna Clarke" });
  });
  it("an empty export gives no books", () => {
    expect(fromGoodreads("")).toEqual([]);
    expect(fromGoodreads(HEADER)).toEqual([]);
  });
  it("a row without a date added gets today's date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 16, 0, 0, 1));
    expect(fromGoodreads(csv("5,Book,Author,,,0,,,,,to-read"))[0].addedOn).toBe("2026-10-16");
  });
  it("refuses a file that isn't a Goodreads export", () => {
    expect(() => fromGoodreads("name,email\nA,b@c.d")).toThrow();
  });
  it("cleans series markers and subtitles", () => {
    expect(cleanTitle("The Fellowship of the Ring (The Lord of the Rings, #1)")).toBe("The Fellowship of the Ring");
    expect(cleanTitle("Mindset: Changing the Way You Think")).toBe("Mindset");
  });
});

describe("mergeBooks", () => {
  const base: Omit<Book, "updatedAt"> = {
    id: "a",
    workKey: "/works/OL1W",
    goodreadsId: "1",
    isbn: null,
    title: "Mindset",
    author: "Carol S. Dweck",
    coverUrl: null,
    year: 2006,
    shelf: "read",
    rating: null,
    line: null,
    review: null,
    genres: ["Psychology & self"],
    readOn: "2026-10-10",
    readOnEstimated: true,
    startedOn: null,
    addedOn: "2026-10-10",
  };
  const other: Omit<Book, "id" | "updatedAt"> = { ...base, goodreadsId: "2", shelf: "want", rating: 3.5, readOn: null, readOnEstimated: false, addedOn: "2021-06-06" };
  delete (other as Partial<Book>).id;

  it("read wins, the other edition's rating is kept, the id stays", () => {
    const merged = mergeBooks(base, other);
    expect(merged).toMatchObject({ id: "a", shelf: "read", rating: 3.5, readOn: "2026-10-10", addedOn: "2021-06-06" });
  });
  it("never overwrites my own rating or words", () => {
    const merged = mergeBooks({ ...base, rating: 4, line: "Mine" }, { ...other, line: "Theirs" });
    expect(merged).toMatchObject({ rating: 4, line: "Mine" });
  });
  it("the furthest shelf wins: read, then reading, then want", () => {
    expect(mergeBooks({ ...base, shelf: "want", readOn: null }, { ...other, shelf: "reading" }).shelf).toBe("reading");
    expect(mergeBooks({ ...base, shelf: "reading", readOn: null }, { ...other, shelf: "want" }).shelf).toBe("reading");
    expect(mergeBooks({ ...base, shelf: "reading", readOn: null }, { ...other, shelf: "read", readOn: "2026-01-01" }).shelf).toBe("read");
  });
  it("a real date read beats an estimated one", () => {
    const merged = mergeBooks(base, { ...other, shelf: "read", readOn: "2026-09-30", readOnEstimated: false });
    expect(merged).toMatchObject({ readOn: "2026-09-30", readOnEstimated: false });
  });
});

// Every field from the export must arrive in Folio exactly as it was (owner, 16 Oct).
describe("field fidelity", () => {
  const FULL =
    "Book Id,Title,Author,Author l-f,Additional Authors,ISBN,ISBN13,My Rating,Average Rating,Publisher,Binding,Number of Pages,Year Published,Original Publication Year,Date Read,Date Added,Bookshelves,Bookshelves with positions,Exclusive Shelf,My Review,Spoiler,Private Notes,Read Count,Owned Copies";
  const row = [
    "123",
    '"Say ""Hello"", Again: A Novel (Greetings, #2)"',
    "Lena  Andersson",
    '"Andersson, Lena"',
    "",
    '"=""0123456789"""',
    '"=""9780123456789"""',
    "4.5",
    "3.9",
    "Publisher",
    "Paperback",
    "300",
    "2021",
    "2019",
    "2024/02/29",
    "2024/01/31",
    "",
    "",
    "read",
    '"Loved it.<br/><br/>Second <i>paragraph</i> &amp; more:<br />""quoted"" — åäö, emoji 📚."',
    "",
    "my private note",
    "1",
    "0",
  ].join(",");

  it("keeps title, author, ISBN, year, rating, dates and shelf exactly", () => {
    const [b] = fromGoodreads(`${FULL}\n${row}`);
    expect(b).toEqual({
      goodreadsId: "123",
      isbn: "9780123456789",
      title: 'Say "Hello", Again',
      author: "Lena Andersson",
      year: 2019,
      shelf: "read",
      rating: 4.5,
      readOn: "2024-02-29",
      readOnEstimated: false,
      addedOn: "2024-01-31",
      review: 'Loved it.\n\nSecond paragraph & more:\n"quoted" — åäö, emoji 📚.',
    });
  });
  it("never imports private notes", () => {
    const [b] = fromGoodreads(`${FULL}\n${row}`);
    expect(JSON.stringify(b)).not.toContain("my private note");
  });
  it("keeps non-English titles and authors as written", () => {
    const [b] = fromGoodreads(csv("9,Om falsk och äkta liberalism,Lena Andersson,,,0,,,,2026/01/02,to-read"));
    expect(b).toMatchObject({ title: "Om falsk och äkta liberalism", author: "Lena Andersson" });
  });
  it("an empty review stays empty, not a blank string", () => {
    expect(cleanReview("")).toBeNull();
    expect(cleanReview("  <br/>  ")).toBeNull();
  });
});

// No book lost: rows on shelves Folio doesn't have are reported, not dropped (owner, 16 Oct).
describe("no book lost", () => {
  it("every row is either imported or reported as skipped", () => {
    const file = csv(
      "1,A,Author One,,,5,,,2024/01/01,2024/01/01,read",
      "2,B,Author Two,,,0,,,,2024/01/02,to-read",
      "3,C,Author Three,,,0,,,,2024/01/03,currently-reading",
      "4,D,Author Four,,,0,,,,2024/01/04,did-not-finish",
    );
    const { rows, skipped } = readGoodreads(file);
    expect(rows.length + skipped.length).toBe(4);
    // Currently reading goes to Current read; a custom shelf is reported.
    expect(rows.find((r) => r.title === "C")?.shelf).toBe("reading");
    expect(skipped).toEqual([{ title: "D", author: "Author Four", shelf: "did-not-finish" }]);
  });
});
