# Backlog

| Idea | Why | Status |
| --- | --- | --- |

## Next focus (owner, 27 Oct): Magpie with friends

The owner loves the app and wants to keep building it. The vision: **a Letterboxd for food**, for
foodies who like to keep a record of where they've been. Short, fun, snappy reviews, shared with
friends. The trigger is real and has a date: the owner's cousin is travelling in Japan now and is
a big foodie; they want to share what they're eating, him there and the owner here.

**Problem to frame first (not the solution):** when a friend is somewhere else, I can't easily
see what they're eating and loving, or share my yums with them; we send photos in chats that
scroll away, with no name, place or opinion attached. Who: me and my cousin first (two people,
one abroad). Riskiest assumption: that we'd actually post and look at each other's yums, not just
our own.

**MVP the owner described (to be worked out in discovery):**
- **An account** where all my information is saved (today it's an access code; an account
  replaces it, and my existing book must move over without losing anything).
- **Add friends** by account, so I can add my cousin.
- **A small feed** of friends' yums: just sharing the yum and its short review, nothing more.

**Open questions for its kickoff:** private by default, with friends only, or public profiles?
Is the review the existing note, or a new short public line? What happens to the access code and
the sandbox? Likes and comments, or just looking? Sign-in method (Supabase Auth, magic link?).
Japan: does the cousin capture on a phone in Japanese places (non-Latin names, city detection)?

## Later

- **Recipes** (owner, 26–27 Oct): a recipe attached to a yum, or saved recipes that never get
  cooked (the problem this product started from). Not before the community MVP.

- **Recommendations on the smart shelves** (owner, 26 Oct): the reason option 3 won. Rows like
  "You might like" built from what I loved (kind, hearts, notes).
- **"By place" view** (option 2b on the canvas): restaurants inside cities, home vs away.
- **Browser bar colour per screen** (audit, feedback 18): dark on the camera, coral on the saved screen.
- **Change a yum's photo** when editing (edit keeps the original photo today).
- **Trips row** (user test, Relive scored 3/5): one card per away city and month ("Taipei · Oct 2026 · 2 yums") under Latest, opening that trip's yums in date order. The single most valuable addition for the relive job. Start here.
- **The photo's own date** for shared photos (EXIF), and an editable date.
- **Sticker double ring** on stickers where the model still draws its own outline (eval v3); a prompt or cut-out tweak.
