// A yum: something I tasted and loved. Shared by the server and the pages.

export type Kind = "food" | "drink" | "dessert";
export type StickerState = "none" | "drawing" | "ready" | "failed";

export type Yum = {
  id: string;
  number: number;
  name: string;
  kind: Kind;
  subKind: string | null;
  place: string | null;
  city: string | null;
  country: string | null;
  hearts: number;
  note: string | null;
  hasPhoto: boolean;
  sticker: StickerState;
  savedAt: string;
  updatedAt: string;
};

/** What the details form sends (create and edit). */
export type YumFields = Pick<Yum, "name" | "kind" | "subKind" | "place" | "city" | "country" | "hearts" | "note">;

export const KINDS: { id: Kind; label: string; plural: string }[] = [
  { id: "food", label: "Food", plural: "Food" },
  { id: "drink", label: "Drink", plural: "Drinks" },
  { id: "dessert", label: "Dessert", plural: "Desserts" },
];

// Food has one "Dishes" bucket to start (kickoff); desserts have none.
export const SUB_KINDS: Record<Kind, { id: string; label: string; plural: string }[]> = {
  drink: [
    { id: "wine", label: "Wine", plural: "wines" },
    { id: "cocktail", label: "Cocktail", plural: "cocktails" },
    { id: "beer", label: "Beer", plural: "beers" },
    { id: "coffee-tea", label: "Coffee and tea", plural: "coffees and teas" },
  ],
  food: [{ id: "dishes", label: "Dishes", plural: "dishes" }],
  dessert: [],
};

export const kindLabel = (k: Kind) => KINDS.find((x) => x.id === k)?.label ?? k;
export const subKindInfo = (kind: Kind, sub: string | null) => SUB_KINDS[kind].find((s) => s.id === sub) ?? null;

/** The default sub-kind when a kind is picked: food goes in Dishes, drinks wait for a pick. */
export const defaultSubKind = (k: Kind) => (k === "food" ? "dishes" : null);

/** What a shelf row calls a group of yums: "wines", "dishes", "desserts". */
export function groupPlural(kind: Kind, sub: string | null): string {
  if (kind === "dessert") return "desserts";
  return subKindInfo(kind, sub)?.plural ?? (kind === "drink" ? "drinks" : "dishes");
}

/** The group a yum belongs to on the shelves: its sub-kind, or its kind for desserts. */
export const groupOf = (y: Pick<Yum, "kind" | "subKind">) => (y.kind === "dessert" ? "dessert" : `${y.kind}:${y.subKind ?? ""}`);

export const hearts = (n: number) => "♥".repeat(n) + "♡".repeat(5 - n);

/** Odd yum numbers get a round sticker, even ones a rounded square, as in the design. */
export const stickerShape = (n: number): "round" | "square" => (n % 2 ? "round" : "square");

export function whereLine(y: Pick<Yum, "place" | "city" | "country">): string {
  return [y.place, y.city, y.country].filter(Boolean).join(", ");
}

const clean = (v: unknown, max: number) => {
  if (typeof v !== "string") return null;
  const t = v.trim().slice(0, max);
  return t || null;
};

/** Checks and tidies form input; returns the fields or a plain-language problem. */
export function parseFields(input: Record<string, unknown>): YumFields | { problem: string } {
  const name = clean(input.name, 120);
  if (!name) return { problem: "Give it a name." };
  const kind = input.kind;
  if (kind !== "food" && kind !== "drink" && kind !== "dessert") return { problem: "Pick food, drink or dessert." };
  const sub = clean(input.subKind, 30);
  const subKind = sub && SUB_KINDS[kind].some((s) => s.id === sub) ? sub : defaultSubKind(kind);
  const h = Number(input.hearts);
  if (!Number.isInteger(h) || h < 1 || h > 5) return { problem: "Give it one to five hearts." };
  return {
    name,
    kind,
    subKind,
    place: clean(input.place, 120),
    city: clean(input.city, 80),
    country: clean(input.country, 80),
    hearts: h,
    note: clean(input.note, 1000),
  };
}
