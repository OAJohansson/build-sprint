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

## Coverage fix (16 genres, L59)

### Counts
- Corpus: 295 Wikipedia articles in `corpus/` (8.8 MB). This pass added 100: 22 genre articles (16 genres plus 6 folded-in companions) and 78 artist articles.
- One more article was already in the fetch log before this pass: `wp-el-general.txt`. No genre links to it, but `index.json` lists it.
- `index.json`: 295 URLs (57 genre, 238 artist).
- `genres.json`: 49 genres, 237 unique linked artists, 146 landmark recordings. The 16 new genres add 80 artist slots (78 new articles, plus Kraftwerk and Tangerine Dream reused for krautrock) and 48 recordings (3 each).
- `links.json`: 163 links (86 new). 155 are "stated in prose" and 8 are "infobox only". 103 are grew_out_of, 56 fused_with and 4 reacted_against. Of the new links, 49 are grew_out_of, 35 fused_with and 2 reacted_against; 5 are infobox only.
- Validator (`tools/build.py`): 435 source checks, 0 errors. Its one warning is the old one: Afrobeat has only 2 recordings.

### Families
- The old family "caribbean-latin-african" is renamed "caribbean-latin" for reggae, dub, salsa, bossa nova and reggaeton. Afrobeat moved to the new family "african".
- New families: "pop" (traditional pop, pop music, K-pop) and "african" (highlife, afrobeat, afrobeats, amapiano).
- Only the `family` field of the first 33 genres changed (6 lines in `data.py`). Backups are `tools/data.py.bak-pre-L59` and `tools/artists.json.bak-pre-L59`.

### Folded-in companions (`also_covers`)
- Tin Pan Alley into traditional pop
- New wave into post-punk
- Mambo into son cubano
- Kwaito into amapiano
- Italo disco into Hi-NRG
- Electronic body music into industrial

### Notes on ids and sources
- Ids follow the corpus slug: `hardcore-electronic-dance-music-genre`, and `grime-music` (Wikipedia's title is "Grime music").
- **Hardcore**: the article covers Dutch, Belgian and German hardcore techno. The UK "breakbeat hardcore" that fed jungle has no article of its own here, so the hardcore → drum and bass link rests on the drum and bass and jungle articles, plus the hardcore article's note that Goldie emerged from the UK "hardcore" scene.
- **Redirects and fixes**:
  - "Lenny Dee" was a disambiguation page. It was removed from the log and corpus and refetched as "Lenny Dee (DJ)".
  - "E. K. Nyame" was missing and was fetched as "E.K. Nyame". The missing entry stays in `fetched.jsonl`.
  - Other redirects: Mescalinum United to Marc Trauner, Paul Elstak to DJ Paul Elstak, Kofi Ghanaba to Guy Warren, Tyla (singer) to Tyla.

### Thin spots
- **No woman is named in the article** for krautrock or highlife, so neither has one. Every other new genre has at least one:
  - Patti Page and Peggy Lee (traditional pop)
  - BoA and Blackpink (K-pop)
  - Bikini Kill (indie rock)
  - Siouxsie and the Banshees and Blondie (post-punk and new wave)
  - Lady Saw (dancehall)
  - María Teresa Vera (son cubano)
  - Carmen Miranda (samba)
  - Tems (afrobeats)
  - Brenda Fassie and Tyla (amapiano and kwaito)
  - Hazell Dean and Sabrina Salerno (Hi-NRG and Italo disco)
  - Cosey Fanni Tutti (industrial)
  - Liza 'N' Eliaz (hardcore)
  - Lady Sovereign (grime)
- **Thin artist articles**: Lenny Dee (DJ) has 5 lines, DJ Paul Elstak 6, Marc Trauner 1.6k chars, and Donga 2.4k chars.
- **Traditional pop** is short (16 lines), and Tin Pan Alley's list sections ("Notable hit songs", "Composers and lyricists") came through empty. All 3 recordings come from artist articles.
- **Recordings with `year: null`**: none of these sources gives a year.
  - "Blinding Lights" (the pop article says only "in the 2020s")
  - Faust's "Krautrock"
  - the Buena Vista Social Club album
  - E. T. Mensah's "Ghana Freedom"
  - Davido's "Fall"
- **Years taken from section headings or surrounding years**:
  - "I Will Always Love You" 1992 (heading "1992–1994: The Bodyguard")
  - "Tennessee Waltz" 1950 (heading)
  - "Candy" 1996 (debut year)
  - "White Christmas" 1941 (the first broadcast in the corpus)
  - "Eskimo" 2002 (release year; it was produced in 1999/2000)
  - "Essence" 2021 ("in the same year" after April 2021)
- **Weak but kept recordings**:
  - "Searchin' (I Gotta Find a Man)" ("her first dance record", and a hit in the same section)
  - "Umshove" ("gained international recognition after the release of")
  - "Ghana Freedom" ("notable compositions")
  - the Thunderdome compilations (a series, not one record)
  - "No New York" (a compilation, "the quintessential testament to the scene")
- **Recordings from companion or other genre articles**:
  - "Heart of Glass" (new wave)
  - "Mambo No. 5" (mambo)
  - "Warm Leatherette" (EBM; also a synth-pop landmark, so it is now shared by two genres)
  - "Neu! '75" (Punk rock [Around the world])
  - "Water" (amapiano article, which calls it an "afrobeats and amapiano fusion song")

### Links to read with care
- **Direction by origin date is debatable**:
  - jazz → highlife: highlife's infobox says 1870s, and the jazz influence came later.
  - jazz → samba: the jazz influence is on post-war samba-canção.
  - traditional pop → country: both nodes date from the 1920s, and the borrowing is the late-1950s Nashville sound.
  - punk rock → industrial and post-punk → industrial: industrial's own origin, early-to-mid 1970s, predates both. These links cite the EBM strand (early 1980s), which is folded into the industrial node.
- **Single or indirect sources**:
  - post-punk → house cites the Warehouse playlist ("a hint of new and different post-punk") plus the house infobox.
  - disco → amapiano and hip-hop → amapiano cite kwaito (sampling, and the guz style).
  - synth-pop → Hi-NRG cites the Italo disco article.
  - Hi-NRG → trance cites "nu-NRG ... a form of trance music evolved from hi-NRG" plus the infobox.
  - hardcore → drum and bass: see the hardcore note above.
  - son cubano → funk is infobox only, from the mambo derivatives list.
- **Shared umbrella sentences**: one K-pop sentence ("a fusion of hip-hop, techno and rock") backs three links (hip-hop, techno and rock → K-pop). One post-punk sentence backs four (dub, reggae, funk, disco). One afrobeats sentence backs three (hip-hop, house, dancehall).
- **Two links each for one pair**:
  - alternative rock → indie rock: grew_out_of ("originally described a style of alternative rock") and reacted_against ("a rejection of alternative rock's absorption into the mainstream").
  - punk rock → post-punk: grew_out_of and reacted_against ("emerged as a rejection of punk's raw and simplistic conventions").

### Links looked for but not added
- **Krautrock → electro**: the electro article names only Kraftwerk ("immediate forebears", "technopop wizards"), never krautrock as a genre. Synth-pop → electro already exists.
- **Rock and roll reacted against traditional pop**: the corpus describes displacement only ("crooners ... found their access to the pop charts significantly curtailed"; traditional pop "was pushed aside"). No reaction is stated.
- **Jazz ↔ son cubano (mambo)**: mambo "leaned towards swing and jazz", but son (mid-19th century) is older than jazz, so the older-to-newer rule would point the wrong way. Left out.
- **Trap → dancehall** ("influenced by American trap music"), **hip-hop → dancehall** (Vybz Kartel's "hip-hop-influenced lyricism") and **contemporary R&B → dancehall**: each is about single artists or a late-2010s wave, and trap → dancehall would point from newer to older.
- **Industrial → house**: one Frankie Knuckles quote about mixing in EBM records.
- **Krautrock → indie rock** (indietronica "followed in the traditions of ... krautrock and synth-pop"): this describes a subgenre only.
- **Son cubano → highlife**: a highlife guitar part is "modelled after an Afro-Cuban guajeo". It never names son.
- **Infobox-only items not used**:
  - punk rock → industrial (punk's derivatives list; direction conflict)
  - electro → EBM
  - krautrock → "electronic dance music" (the EDM node is the 2010s boom, as before)
  - samba → "sambass"
  - pop music → new wave (new wave is folded into post-punk; the pop → synth-pop link covers the pop parent)

### New links (86)
traditional-pop → pop-music (grew_out_of); rock-and-roll → pop-music (grew_out_of); jazz → traditional-pop (grew_out_of); blues → traditional-pop (fused_with); traditional-pop → rock-music (grew_out_of); traditional-pop → country-music (fused_with); pop-music → contemporary-r-b (fused_with); pop-music → synth-pop (grew_out_of, infobox only); pop-music → k-pop (grew_out_of); hip-hop → k-pop (fused_with); techno → k-pop (fused_with); rock-music → k-pop (fused_with); contemporary-r-b → k-pop (fused_with); synth-pop → k-pop (fused_with); rock-music → indie-rock (grew_out_of); punk-rock → indie-rock (grew_out_of); post-punk → indie-rock (grew_out_of); alternative-rock → indie-rock (grew_out_of); alternative-rock → indie-rock (reacted_against); punk-rock → post-punk (grew_out_of); punk-rock → post-punk (reacted_against); krautrock → post-punk (grew_out_of); dub-music → post-punk (fused_with); reggae → post-punk (fused_with); funk → post-punk (fused_with); disco → post-punk (fused_with); jazz → post-punk (fused_with); heavy-metal-music → post-punk (fused_with); post-punk → alternative-rock (grew_out_of); post-punk → synth-pop (grew_out_of); post-punk → industrial-music (grew_out_of); post-punk → house-music (grew_out_of); rock-music → krautrock (grew_out_of); funk → krautrock (fused_with); jazz → krautrock (fused_with); krautrock → synth-pop (grew_out_of); krautrock → ambient-music (grew_out_of); krautrock → techno (grew_out_of); krautrock → industrial-music (grew_out_of); reggae → dancehall (grew_out_of); dub-music → dancehall (grew_out_of, infobox only); dancehall → reggaeton (grew_out_of); dancehall → drum-and-bass (grew_out_of); dancehall → grime-music (fused_with); dancehall → afrobeats (fused_with); son-cubano → salsa-music (grew_out_of); son-cubano → funk (grew_out_of, infobox only); samba → bossa-nova (grew_out_of); jazz → samba (fused_with); samba → disco (fused_with); jazz → highlife (fused_with); highlife → afrobeat (grew_out_of); afrobeat → afrobeats (grew_out_of); highlife → afrobeats (grew_out_of); hip-hop → afrobeats (fused_with); house-music → afrobeats (fused_with); trap-music → afrobeats (fused_with); contemporary-r-b → afrobeats (fused_with); house-music → amapiano (grew_out_of); jazz → amapiano (fused_with); soul-music → amapiano (fused_with); hip-hop → amapiano (fused_with); disco → amapiano (fused_with); afrobeats → amapiano (fused_with); disco → hi-nrg (grew_out_of); synth-pop → hi-nrg (grew_out_of); hi-nrg → house-music (grew_out_of); hi-nrg → techno (grew_out_of); hi-nrg → trance-music (grew_out_of); synth-pop → industrial-music (grew_out_of); punk-rock → industrial-music (grew_out_of); rock-music → industrial-music (grew_out_of, infobox only); disco → industrial-music (fused_with); heavy-metal-music → industrial-music (fused_with); industrial-music → techno (grew_out_of); industrial-music → trance-music (grew_out_of); industrial-music → hardcore-electronic-dance-music-genre (grew_out_of); techno → hardcore-electronic-dance-music-genre (grew_out_of); house-music → hardcore-electronic-dance-music-genre (grew_out_of); hardcore-electronic-dance-music-genre → drum-and-bass (grew_out_of); hardcore-electronic-dance-music-genre → trance-music (grew_out_of, infobox only); uk-garage → grime-music (grew_out_of); drum-and-bass → grime-music (grew_out_of); hip-hop → grime-music (fused_with); indie-rock → grime-music (fused_with); grime-music → dubstep (fused_with).

### Orphans resolved
- reggaeton now has the parent dancehall.
- salsa has son cubano.
- bossa nova has samba.
- afrobeat has highlife, and afrobeat → afrobeats continues the line.
- The new roots are son cubano, samba (jazz fused only) and highlife (jazz fused only). Their origins predate the rest of the map.

### Tools added
- `tools/kwc.py`: a keyword-in-context search over corpus files.
- `tools/new-artists.txt` and `tools/new-artists-2.txt`: the artist fetch lists.
