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
- **Feasibility (checked 22 Oct, probe):** the installed app is in Android's share sheet. The
  gallery sends the image itself (a 6 MB JPEG, so shrink before upload). Instagram and Pinterest
  send only a link, in the `text` field (the `url` field stays empty). Both links lead to a public
  preview image (`og:image`) when fetched from a server: Pinterest a stable 736 px image,
  Instagram a 640 px square crop on a signed link that expires, so the picture must be downloaded
  and kept, not linked. Instagram may block server fetches at any time; the screenshot stays the
  fallback.
- **Value:** the AI's reading of my board is accurate enough to trust. Test it against my own
  read first (Folio's lesson: build the test before the model), with my style notes below as the
  answer key.
- **Viability:** suggesting real products needs a catalogue; there's no free product API and
  scraping shops is fragile and against their terms. So brands and search phrases that open in
  shops, not products. AI cost: one vision call per board, pennies. Image storage: the free
  Supabase plan holds 1 GB, about 5,000 saves once shrunk in the browser.

**Answer key (my style today, written before the app):** relaxed and roomy silhouettes (boxy tees,
wide jeans, long denim shorts, loose trousers); a muted earthy palette (chocolate, cream,
sage/olive, slate, navy, black); camp-collar and short-sleeve shirts, heavyweight plain tees,
vintage graphic tees, Carhartt double-knees, olive chinos, a retro jersey; Dr. Martens 1461,
Birkenstock Boston, Adidas Gazelle, loafers with white socks; caps, crossbody and tote bags, a thin
chain, black sunglasses. Labels: relaxed Scandi/Copenhagen menswear, workwear meets skate, 90s
revival.

## Success: what good looks like

Main outcome: from scattered saves to "that's my style, and here's where to look" in one sitting,
and a character that looks like my taste.

| Signal | How I'll measure it | Target |
| --- | --- | --- |
| Quick save | On my phone: share sheet to "saved", counting taps and seconds | 2 taps after Share, under 5 s; as quick as a screenshot |
| Board in minutes | 20 saves in the inbox to a board I'd keep | Under 2 minutes, no hand layout |
| Style read I trust (day 2) | The read against the answer key, section by section | 4 of 5 sections "that's me"; no confident nonsense |
| Discovery (day 2) | Brands in the read I didn't know and would actually look at, and that are real | At least 3; none invented |

| Character (day 2) | "Is that my style?" for the character drawn from a board | Yes on first look, and it wears pieces from the board |
| Change over time | Two seasonal boards side by side | I can say what changed |

**Guardrail:** no save is lost; everything shared arrives in the inbox.

## MVP and stop line

Re-cut (owner, 22 Oct): the owner widened the idea to a **style DNA** with **seasonal boards**
and a **hand-drawn character** that wears each board's style. Named as a scope widening and
re-bet out loud: Selvedge becomes a **three-day product** (1 day planned), with the selfie
likeness later. Saving happens on the phone; boards are edited on the laptop, so saves sync
(decision 0021).

**Day 1:**

1. **Capture:** installable web app in Android's share sheet, taking images and links into an
   inbox (links get their picture from the page's `og:image`; if that fails, I'm asked for a
   screenshot); drag-and-drop bulk upload on the laptop. Same library on both devices.
2. **Boards by season:** several boards, each named by season ("Summer 2026", "Autumn 2026"), so
   I can see my taste change over time.
3. **Board:** pick saves and the app lays out a collage, with the palette pulled from the images
   as swatches (computed in the browser, no AI). Then edit it on the laptop: drag to reorder,
   make a piece bigger or smaller, remove it. The board saves itself.
4. **Character spike (one hour):** give two image models a real board and judge the drawings
   (hand-drawn fashion illustration, wearing the board's pieces) before designing around them.

Share-target probe: done 22 Oct (see journal).

**Day 2:** the **style read**, one AI call over the board: palette names, silhouettes, key pieces,
style names, brands and search phrases that open in shops. Brands the middle way (owner, 21 Oct):
the AI suggests freely, known and new, and every brand comes with a one-tap search link so I can
check it's real. Tested against the answer key before it ships. Then the **character**: a
hand-drawn figure wearing the board's style, drawn by OpenAI's `gpt-5.4-image-2` and revealed
as if painted live (draw-on), with doodles to watch while it's drawn (decision 0022, proposed);
the home page opens on the latest board's character.

**Later:** a character that looks like me, from a selfie, once the plain character works and
we've decided where face photos are stored (a shared database is wrong for them, decision 0021).

Stop line: no AI cropping or tagging per save, no logging in to Instagram for pictures, no
free-form canvas (no rotating, overlapping or text on the board), no shop catalogue or product
cards, no checkout, no native app (a v2 learning project), no outfit planning, no wardrobe of
owned clothes, no accounts beyond an access code. All to `backlog.md`.

## Requirements

Day 1. Rows 1–3 updated after the probe (22 Oct).

| # | Must | Check |
| --- | --- | --- |
| 1 | The installed app appears in Android's share sheet | Share a screenshot from the gallery; Selvedge is in the list |
| 2 | A shared image lands in the inbox in at most 2 taps after Share | Count taps from the gallery |
| 3 | A shared Instagram or Pinterest link lands in the inbox with its picture, kept by us | Share a post and a pin; both show a picture a day later |
| 3b | If a link's picture can't be fetched, I'm told and asked for a screenshot instead | Share a link that blocks fetching; the message suggests a screenshot |
| 4 | A save on the phone shows up on the laptop | Share on the phone, reload on the laptop; it's there |
| 5 | Dropping files on the laptop adds them all | Drop 20 screenshots; 20 in the inbox |
| 6 | Picking saves makes a board with no hand layout | Pick 12; a collage and 5–6 swatches appear |
| 7 | The board can be reordered, resized per piece and trimmed | Drag one, make one bigger, remove one; reload, it holds |
| 8 | Nothing shared is lost, even offline | Share in airplane mode; it arrives once back online |

Day 2: the style read covers palette, silhouettes, pieces, style names and brands; every brand
and search phrase opens a shop search.

**No-gos:** product scraping, real accounts, social features, prompting "in the style of" a named
living illustrator. *(AI-generated clothes images were a no-go until 22 Oct; the owner reversed
it: the character illustrates my own taste, it doesn't replace it.)*

**Rabbit holes:** link unfurling for Instagram and Pinterest, collage layout algorithms (pick a
simple masonry grid), a free-form canvas editor, background removal, colour-naming perfection,
iOS (no share target there), image sizes (shrink in the browser before upload).

## Owner calls (decided 21 Oct)

- **Both devices:** save on the phone, edit the board on the laptop, so saves sync (decision 0021).
- **The cut:** capture and board on day 1; the AI style read on day 2.
- **Brands:** the middle way; the AI suggests freely, each brand with a search link to check it.

## Unit tests

None: no date, time or streak logic. The style read gets an eval instead (the answer key above),
and "no save lost" is checked on the phone.

## Success check (at wrap-up)
