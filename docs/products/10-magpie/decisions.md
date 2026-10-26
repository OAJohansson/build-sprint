# Decision log

Every decision except ops (decision 0026): L-numbers for learning decisions, T-numbers for toil. Veto any T-number at any time ("veto T7"). Read at the retro.

| # | Date | Decision | Who | Gate or step | Outcome |
| --- | --- | --- | --- | --- | --- |
| L1 | 26 Oct | Sticker model: `google/gemini-2.5-flash-image` (8 s, $0.039, outline on every sticker), alternating round and rounded-square like the design. Reason: the only model of four that was fast, cheap and kept the outline the cut-out needs (decision 0029). | PM | Slice 1 spike | provisional until the data-evals run |
| L2 | 26 Oct | The sticker is drawn on the server after the save responds (`after()`), and a yum shows its photo in a sticker frame until then. Reason: R4, capture never waits on the AI and closing the app can't lose the drawing. | PM | Slice 2 | |
| L3 | 26 Oct | A yum with no photo gets a sticker drawn from its name and kind. Reason: keeps the shelf one style; the same call and cost. Owner can veto. | PM | Slice 2 | provisional |
| T1 | 26 Oct | Access code for Magpie is the same as Selvedge's, so the owner already knows it; graders get a separate sandbox code. | PM | Setup | |
