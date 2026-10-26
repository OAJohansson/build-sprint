# Decision log

Every decision except ops (decision 0026): L-numbers for learning decisions, T-numbers for toil. Veto any T-number at any time ("veto T7"). Read at the retro.

| # | Date | Decision | Who | Gate or step | Outcome |
| --- | --- | --- | --- | --- | --- |
| L1 | 26 Oct | Sticker model: `google/gemini-2.5-flash-image` (8 s, $0.039, outline on every sticker), alternating round and rounded-square like the design. Reason: the only model of four that was fast, cheap and kept the outline the cut-out needs (decision 0029). | PM | Slice 1 spike | provisional until the data-evals run |
| L2 | 26 Oct | The sticker is drawn on the server after the save responds (`after()`), and a yum shows its photo in a sticker frame until then. Reason: R4, capture never waits on the AI and closing the app can't lose the drawing. | PM | Slice 2 | |
| L3 | 26 Oct | A yum with no photo gets a sticker drawn from its name and kind. Reason: keeps the shelf one style; the same call and cost. Owner can veto. | PM | Slice 2 | provisional |
| T1 | 26 Oct | Access code for Magpie is the same as Selvedge's, so the owner already knows it; graders get a separate sandbox code. | PM | Setup | |
| L4 | 26 Oct | City and country come from the phone's location through BigDataCloud's free reverse-geocoding endpoint (coordinates rounded to ~100 m), falling back to the last city typed. Reason: kickoff says reverse geocoding, no places API; no key needed. | PM | Slice 2 | |
| L5 | 26 Oct | "Remove from my book" is a soft remove with Undo on the shelf; the row and photos are kept. Reason: R10 asks for a way back; nothing of the owner's is ever hard-deleted. | PM | Slice 3 | |
| L6 | 26 Oct | "Your top …" shows up to two rows, one per group with 5-heart yums, biggest first; search also covers city and country. Reason: R7 names one row but the kickoff says "…"; the success signal finds items "by name or country". | PM | Slice 3 | provisional |
| L7 | 26 Oct | Slices 2–4 built in one pass and graded together. Reason: they share one home page and one data layer; the graders run per requirement, so the evidence is the same. | PM | Plan | |
| T2 | 26 Oct | Button text on coral is cocoa, not white (white is 2.9:1, cocoa 5.2:1); same for the saved screen's title. | PM | Slice 2 | |
| T3 | 26 Oct | Hearts are drawn as outlined shapes (coral alone on cream is 2.7:1). | PM | Slice 2 | |
| T4 | 26 Oct | Note field 16 px, not 15 (iOS zooms the page on smaller inputs). | PM | Slice 2 | |
| T5 | 26 Oct | Welcome screen without the three pager dots (only one intro page exists). | PM | Slice 2 | |
| T6 | 26 Oct | The laptop's filter panel also has the sub-kinds and the restaurant field, like the phone sheet. | PM | Slice 4 | |
| T7 | 26 Oct | Copy: "Fix the details" / "Save changes" for editing; "Taking a little longer. It'll pop up on your shelf." past 40 s; "Nothing here yet. Try fewer filters?" for no results. | PM | Slice 3 | |
| L8 | 26 Oct | Sticker prompt v2: names the item and kind, flat fills with no gloss or shadow, plain dishes without prints, a bold outer outline. Reason: the eval's worst failures (wrong item on a busy photo, copied prints) and the critic's "glossy, thin edge" all pointed at the prompt; the model stays. Before/after eval run. | PM | Slice 1 rework | |
| T8 | 26 Oct | Saved screen: Maggie at hero size holding the sticker up between her wings, untilted; the stray white sparkle dot removed. | PM | Critic r1 | |
