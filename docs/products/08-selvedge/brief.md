# Brief

A one-page PRD, written before any code (playbook step 1). Short answers; the success check is filled in at wrap-up.

## Problem

I like dressing well but don't know much about fashion. When I see a piece I love, I save it
wherever I am (an Instagram save, a Pinterest pin, a screenshot), so my taste is scattered across
apps and I never see it together. A moodboard by hand takes an evening, so I can't put my style
into words, and finding clothes and brands that match is random.

## Who

Me: likes dressing well and shopping, knows little about fashion vocabulary or brands beyond the
ones I already wear. Scrolls Instagram, Pinterest and shops on an Android phone; sits down with a
laptop to look at things properly. Has built a moodboard by hand once and won't do it again.

## Moment of use and jobs to be done

Two moments: on the phone, mid-scroll, a few seconds, thumb already on the share button; and later
on the sofa or at the laptop, 10–20 minutes, curious about "what is my style, actually?"

1. When I see a piece I like, I want to save it in two taps from wherever I am, so it's never
   lost. *(Get this right first.)*
2. When I sit down, I want all my saves in one place and a moodboard that almost makes itself, so
   seeing my style takes minutes, not an evening.
3. When my board is there, I want my style put into words (palette, silhouettes, key pieces, style
   names), so I can say what I like and recognise it in a shop.
4. Then I want brands I already like organised and new brands and pieces to explore, so shopping
   matches my taste instead of being random.

## Today's alternatives

| Alternative | Good | Annoying |
| --- | --- | --- |
| Instagram saves, Pinterest boards, screenshots | One tap, already a habit | Scattered across three places; nothing reads them back to me |
| Pinterest (boards, Lens) | Collecting and visual search | Generic "more like this", not *my* style; ads and noise |
| Cosmos | Beautiful moodboards | No words for the style, no shopping |
| Wardrobe apps (Whering, Indyx, Acloset, Stylebook) | Digitise clothes I own | About my wardrobe, not my taste |
| AI stylists / fashion search (Alta, Daydream, Lyst) | Good search across shops | Start from words I don't have, not from my board |
| A moodboard by hand (Canva, Figma) | Exactly my pieces | An evening of copy-paste |

**Why switch:** the only place that goes *my saves → my style in words → brands and pieces to
explore*. And saving into it is as quick as a screenshot, from the same share button.

## Riskiest assumptions

- **Usability (riskiest):** saving through the share sheet is as quick as an Instagram save or a
  screenshot, or I'll keep the old habit and the inbox stays empty. Everything else depends on it.
- **Feasibility (check first, on the phone):** an installed web app (PWA) shows up in Android's
  share sheet (Web Share Target API). The unknown is *what each app sends*: the gallery sends the
  image; Instagram and Pinterest probably send only a link, and Instagram hides images behind a
  login. If links bring no picture, screenshots are the capture path and links are a fallback.
- **Value:** the AI's reading of my board is accurate enough to trust. Test it against my own
  read first (Folio's lesson: build the test before the model), with my style notes below as the
  answer key.
- **Viability:** suggesting real products needs a catalogue; there's no free product API and
  scraping shops is fragile and against their terms. So brands and search phrases that open in
  shops, not products. AI cost: one vision call per board, pennies.

**Answer key (my style today, written before the app):** relaxed and roomy silhouettes (boxy tees,
wide jeans, long denim shorts, loose trousers); a muted earthy palette (chocolate, cream,
sage/olive, slate, navy, black); camp-collar and short-sleeve shirts, heavyweight plain tees,
vintage graphic tees, Carhartt double-knees, olive chinos, a retro jersey; Dr. Martens 1461,
Birkenstock Boston, Adidas Gazelle, loafers with white socks; caps, crossbody and tote bags, a thin
chain, black sunglasses. Labels: relaxed Scandi/Copenhagen menswear, workwear meets skate, 90s
revival.

## Success: what good looks like

Main outcome: from scattered saves to "that's my style, and here's where to look" in one sitting.

| Signal | How I'll measure it | Target |
| --- | --- | --- |
| Quick save | On my phone: share sheet to "saved", counting taps and seconds | 2 taps after Share, under 5 s; as quick as a screenshot |
| Board in minutes | 20 saves in the inbox to a board I'd keep | Under 2 minutes, no hand layout |
| Style read I trust | The read against the answer key, section by section | 4 of 5 sections "that's me"; no confident nonsense |
| Discovery | Brands in the read I didn't know and would actually look at | At least 3 |

**Guardrail:** no save is lost; everything shared arrives in the inbox.

## MVP and stop line

Proposed cut (owner to confirm): the four steps from the idea are about two days of work, so the
MVP keeps the chain whole but thin, and drops per-save AI.

1. **Capture:** installable web app in Android's share sheet, taking images and links into an
   inbox; drag-and-drop bulk upload on the laptop for old saves.
2. **Board:** pick saves and the app lays out a collage, with the palette pulled from the images
   as swatches (computed in the browser, no AI).
3. **Style read:** one AI call over the board gives palette names, silhouettes, key pieces, style
   names, brands (ones I know and new ones) and search phrases that open in shops.

First hour, before the real app: a **share-target probe**, the empty starter shipped with a share
target that only shows what arrived. Share from Instagram, Pinterest and the gallery on my phone
and write down what each sends. That answers the feasibility question before any design.

Stop line: no AI cropping or tagging per save (the board read covers it), no fetching images
behind Instagram links, no shop catalogue or product cards, no checkout, no native app (a v2
learning project), no outfit planning, no wardrobe of owned clothes, no accounts. All to
`backlog.md`.

## Requirements

Drafted after the probe and the owner's calls below; the table is a first pass.

| # | Must | Check |
| --- | --- | --- |
| 1 | The installed app appears in Android's share sheet | Share a screenshot from the gallery; Selvedge is in the list |
| 2 | A shared image lands in the inbox in at most 2 taps after Share | Count taps from the gallery |
| 3 | A shared link lands in the inbox with its preview if one is public | Share an Instagram post and a Pinterest pin |
| 4 | Dropping files on the laptop adds them all | Drop 20 screenshots; 20 in the inbox |
| 5 | Picking saves makes a board with no hand layout | Pick 12; a collage and 5–6 swatches appear |
| 6 | The style read covers palette, silhouettes, pieces, style names, brands | Read my test board; every section is filled |
| 7 | Each search phrase opens a shop search | Tap one; the shop's results open |
| 8 | Nothing shared is lost, even offline | Share in airplane mode; it's there afterwards |

**No-gos:** product scraping, AI-generated clothes images, accounts, social features.

**Rabbit holes:** link unfurling for Instagram and Pinterest, collage layout algorithms (pick a
simple masonry), background removal, colour-naming perfection, iOS (no share target there).

## Owner calls before the design

- **One device or both?** Saving on the phone and looking at the board on the laptop means the
  saves must sync, which needs a backend (image storage, like Six AM's Supabase with an access
  code). Phone-only keeps everything on the device (images in the browser's IndexedDB, since
  localStorage is too small for pictures).
- **The MVP cut above:** keep the chain thin (capture, board, read) or go deeper on fewer steps?
- **Where new brands come from:** the AI's own knowledge for the MVP (fast, may be dated or
  invented), or a short hand-made list it chooses from (trustworthy, slower to build)?

## Unit tests

None: no date, time or streak logic. The style read gets an eval instead (the answer key above),
and "no save lost" is checked on the phone.

## Success check (at wrap-up)
