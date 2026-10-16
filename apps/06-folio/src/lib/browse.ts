// Search's genre chips. Each is a tuned Open Library query, because subjects are reader-tagged
// and messy ("memoir" alone returns Atomic Habits). Checked by hand on 16 Oct; "Queer stories"
// was suggested from the strongest thread on my shelf.
export const browseGenres = [
  { label: "Literary fiction", q: 'subject:"literary fiction" first_publish_year:[1990 TO 2026]' },
  { label: "Memoir", q: "subject:autobiography subject:memoir" },
  { label: "Psychology & self", q: 'subject:psychology subject:"self-help"' },
  { label: "Business & product", q: "subject:business subject:management" },
  { label: "Queer stories", q: "subject:lgbtq" },
] as const;
