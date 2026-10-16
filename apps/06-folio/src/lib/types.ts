// One book on my shelves: book data (from the import or a search) plus what I think of it.
export type Shelf = "read" | "want";

export type Book = {
  id: string;
  /** Open Library work id ("/works/OL…W"); every edition of a book shares it. */
  workKey: string | null;
  goodreadsId: string | null;
  isbn: string | null;
  title: string;
  author: string;
  coverUrl: string | null;
  year: number | null;
  shelf: Shelf;
  /** Half stars, 0.5 to 5; null means not rated. */
  rating: number | null;
  /** The one-liner shown on the shelf. */
  line: string | null;
  /** The longer review, behind a tap. */
  review: string | null;
  genres: string[];
  /** YYYY-MM-DD, kept as text so it never shifts with time zones. */
  readOn: string | null;
  /** True when readOn came from Goodreads' "date added" because "date read" was empty. */
  readOnEstimated: boolean;
  addedOn: string;
  updatedAt: string;
};

export type BookInput = Omit<Book, "id" | "updatedAt">;

/** A book from a search or a list, before it's on a shelf. */
export type Found = {
  workKey: string | null;
  title: string;
  author: string;
  coverUrl: string | null;
  year: number | null;
  genres: string[];
  isbn?: string | null;
  /** Why it's here, e.g. "Because you loved Educated" or "Booker Prize 2024". */
  note?: string;
};
