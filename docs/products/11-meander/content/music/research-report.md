# Music corpus and genre skeleton: build report

## Counts
- Corpus files: 194 Wikipedia articles in `corpus/` (6.2 MB of plain text). 35 genre articles (33 genres, plus Ska and Jungle as folded-in companions) and 159 artist articles.
- `index.json`: 194 URLs, each with its file, title, kind and section list.
- `genres.json`: 33 genres, 159 unique artists (4–5 per genre, some shared), 98 landmark recordings, and an `origin_source` quote for each origin date and place.
- `links.json`: 77 links. 74 are "stated in prose" and 3 are "infobox only". 54 are grew_out_of, 21 fused_with and 2 reacted_against.
- Validator (`tools/build.py`) ran 220 source checks with 0 errors. It gave 1 warning: Afrobeat has only 2 recordings.

## Format notes
- Each line is `[Section] paragraph`. The lead is `[intro]` and nested headings use the innermost heading. See also, References, External links, Notes, Further reading and similar sections were dropped.
- Genre files start with `[Infobox]` lines for stylistic/cultural origins, instruments, derivatives, subgenres, fusiongenres, regional and local scenes and other topics. Artist files start with `[Infobox]` years active, origin, genre and birth/death date (ISO) and place, where the infobox has them.
- Some headings repeat inside one article, for example two `[United Kingdom]` sections in Punk rock and two `[Musical characteristics]` sections in Reggae. A citation to such a heading means any paragraph under that name.
- Non-ASCII titles are transliterated in file names (wp-ruben-blades.txt, wp-tiesto.txt, wp-sven-vath.txt).

## Genre list: merges and drops
- None were dropped. The list comes to 33 genres, not 32.
- **Ska folded into Reggae**: `wp-ska.txt` is saved and listed under `also_covers`. Millie Small, The Skatalites and "My Boy Lollipop" carry the ska line.
- **Jungle folded into Drum and bass**: `wp-jungle-music.txt` is saved and listed under `also_covers`. The reggae→drum-and-bass link cites the jungle article.
- **EDM**: the Wikipedia article is the umbrella "Electronic dance music". The 2010s boom is covered in its [United States] and [Terminology] sections, which is what the links and recordings use.

## Thin coverage
- **Afrobeat**: the article is short (8k chars) and names no landmark Afrobeat record. It has 2 recordings: Fela's "Water No Get Enemy", called a "classic song" in the Femi Kuti article, with no year, and Remain in Light. Zombie is in the corpus but is not called important, so it was left out.
- **Disco**: the article has no History section, which is why the Bee Gees, Gloria Gaynor and Sylvester are never named. Two recordings come from other articles: Cerrone's "Love in C minor" from Techno [Proto-techno], and Chic's "Good Times" from the Chic article. Disco has only 4 artists.
- **Trance**: the History section is short and gives no years. "Tranceformed From Beyond" and "Love Stimulation" have `year: null`. The Paul van Dyk article dates his "Love Stimulation" remix to 1993.
- **Gospel music**: the article gives no origin date, so origin_years cites the first published use of the term "gospel song" (1874). Two of its recordings come from the Mahalia Jackson and Sister Rosetta Tharpe articles.
- **Contemporary R&B** (11k chars) and **Bossa nova** (14k) are thin. "Canção do Amor Demais" has no year in the corpus.
- **Salsa**: the infobox has no date. origin_years cites the intro (salsa bands in New York City in the 1970s). Siembra is cited from the Rubén Blades article.
- **Folk revival**: the article has no genre infobox, so it has no `[Infobox]` lines. "Tom Dooley" (1958) is cited from the Kingston Trio article.
- **One recording is shared by two genres**: Tharpe's "Strange Things Happening Every Day" appears under rock and roll ("first rock and roll record" contender) and under gospel ("first gospel record to cross over").
- **Weak but kept**:
  - "Boogie Chillen" (a "first hit" that reached No. 1).
  - "Goodnight, Irene" ("a big hit").
  - "Respect" ("significant and commercially successful").
  - "Sweet Like Chocolate": the year 1999 is inferred from the section's sequence of years.
  - "Gasolina": the year comes from the section heading "2004: Crossover".

## Artists
- All 159 requested articles were found. Redirects resolved: Lex Luger to "Lex Luger (music producer)", Arthur Baker to "Arthur Baker (producer)".
- No woman is named in the article or chosen for **dub, afrobeat, electro, house, trance, UK garage and EDM**. Elsewhere each genre has at least one woman, for example K-Hand in techno, Laurie Spiegel in ambient, DJ Rap in drum and bass, and Mary Anne Hobbs in dubstep.
- Every chosen artist is named in their genre's article, or in the Ska or Jungle article. Some are named as central figures rather than as "pioneers":
  - Larry Levan, as a disco DJ.
  - Teddy Riley, among the new jack swing artists.
  - Girlschool, in the women in metal section.

## Links found but left out
- **Rock → disco (Disco Demolition backlash)**: this is rock fans reacting against a newer genre. reacted_against means newer against older, so the direction does not fit.
- **Heavy metal → alternative rock (reacted_against)**: hair metal "fell out of favor". That is displacement, not a stated reaction, so only the fused_with link was kept.
- **Synth-pop reacted against punk** ("abandoned punk's emphasis on authenticity"): only the grew_out_of link was kept.
- **Trance → EDM**: only implied, through Tiësto.
- **Disco → EDM**: the disco intro means EDM in the broad sense, not the 2010s boom.
- **Electro → EDM**: "electro" there means electro house.
- **House → drum and bass, ambient → drum and bass, techno → EDM**: listed only inside long lists of influences.
- **Infobox-only items not used**:
  - Blues → country, gospel → country, jazz → rock, house and soul (derivatives lists).
  - Gospel → funk, electro → trap, dubstep → "trap music (EDM)".
  - Generic "folk" in rock's origins was not mapped to the folk revival node.

## Links to read with care
- gospel→R&B cites a short phrase ("R&B's stronger gospel influences") plus the infobox.
- electro→techno cites the UK section ("came to the music through electro and hip hop") plus the infobox.
- synth-pop→electro relies on "technopop", which the synth-pop article treats as the same genre (synth-pop is "also called techno-pop").
- The soul, funk and disco → contemporary R&B fused_with links share one umbrella sentence.
- house→EDM cites the Mixmag description of the EDM era sound.
- disco→hip-hop has two entries: grew_out_of ("disco birthed hip-hop") and reacted_against ("a rebellion against its parent").

## Fetching
- MediaWiki API with User-Agent "meander-research/0.1 (educational corpus builder)" and no personal details.
- Requests were sequential with 1–2 s delays and Retry-After backoff. The API sent many 429s, so artist wikitext was batched through `prop=revisions`. Extracts can only be fetched one page per request.
- Scripts are in `tools/`: `wp.py`, `fetch_artists.py`, `reslug.py`, `data.py` (curated data) and `build.py` (writes the three JSON files and validates). `fetched.jsonl` is the raw fetch log.
