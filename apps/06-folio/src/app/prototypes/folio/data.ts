// Prototype data: the owner's real Goodreads shelves (all 65 read; all 285 want to
// read, with Open Library subjects mapped to shelf genres by the rules in the journal, 16 Oct).
// shortcut: the one-liners and long reviews are SAMPLE text written for the prototype (the export
// has no reviews); delete this file with the prototype surface.
export type Book = {
  id: string;
  title: string;
  author: string;
  isbn?: string | null;
  coverId?: number;
  year?: number | null;
  date: string;
  shelf: "read" | "want";
  rating?: number | null;
  line?: string;
  review?: string;
  genres?: string[];
};

export const books: Book[] = [
 {
  "id": "33980368",
  "title": "Mindset",
  "author": "Carol S. Dweck",
  "isbn": "9782133487514",
  "year": 2006,
  "date": "2026-10-10",
  "shelf": "read",
  "rating": 3.5,
  "line": "Useful once I stopped reading it as self-help and started catching my own fixed voice."
 },
 {
  "id": "54874365",
  "title": "On Connection",
  "author": "Kae Tempest",
  "isbn": null,
  "year": 2020,
  "date": "2026-06-03",
  "shelf": "read",
  "rating": 4.0,
  "line": "A short, warm argument for paying attention to each other. Read it in one sitting."
 },
 {
  "id": "22551809",
  "title": "The Road to Character",
  "author": "David Brooks",
  "isbn": "9780812993257",
  "year": 2015,
  "date": "2025-10-08",
  "shelf": "read",
  "rating": 3.0,
  "line": "Good questions about character, but the portraits went on longer than the point."
 },
 {
  "id": "193791641",
  "title": "The Shortest History of Economics",
  "author": "Andrew Leigh",
  "isbn": "9781743823422",
  "year": 2024,
  "date": "2025-06-08",
  "shelf": "read",
  "rating": 4.0,
  "line": "Ten thousand years of economics that somehow never drags."
 },
 {
  "id": "25899336",
  "title": "When Breath Becomes Air",
  "author": "Paul Kalanithi",
  "isbn": "9780812988413",
  "year": 2016,
  "date": "2025-06-08",
  "shelf": "read",
  "rating": 5.0,
  "line": "Quiet, honest and devastating. The last chapter stayed with me for weeks.",
  "review": "Kalanithi writes like someone who knows exactly how much time he has, and refuses to waste a sentence. The first half is a neurosurgeon's education; the second is a patient's. What got me was how little self-pity there is. Lucy's epilogue made me put the book down and go for a walk."
 },
 {
  "id": "54785515",
  "title": "Four Thousand Weeks",
  "author": "Oliver Burkeman",
  "isbn": "9780374159122",
  "year": 2021,
  "date": "2025-03-21",
  "shelf": "read",
  "rating": 4.0,
  "line": "Changed how I think about to-do lists, and about time more generally.",
  "review": "I picked this up expecting productivity tips and got the opposite: an argument that you'll never get on top of everything, and that this is a relief. The chapter on 'cosmic insignificance therapy' is the one I keep quoting. Some of it repeats, but the core idea is worth the whole book."
 },
 {
  "id": "49418",
  "title": "The Velvet Rage",
  "author": "Alan Downs",
  "isbn": "9780738210612",
  "year": 2005,
  "date": "2024-03-14",
  "shelf": "read",
  "rating": 4.0
 },
 {
  "id": "53915332",
  "title": "Gay Bar",
  "author": "Jeremy Atherton Lin",
  "isbn": "9780316458733",
  "year": 2021,
  "date": "2024-03-11",
  "shelf": "read",
  "rating": 3.0
 },
 {
  "id": "53720447",
  "title": "Connect",
  "author": "David L. Bradford",
  "isbn": "9780593237090",
  "year": 2021,
  "date": "2024-02-15",
  "shelf": "read",
  "rating": 4.0
 },
 {
  "id": "49977811",
  "title": "Swimming in the Dark",
  "author": "Tomasz Jedrowski",
  "isbn": "9780062890009",
  "year": 2020,
  "date": "2023-12-07",
  "shelf": "read",
  "rating": 4.0
 },
 {
  "id": "44525305",
  "title": "The Ride of a Lifetime",
  "author": "Robert Iger",
  "isbn": null,
  "year": 2019,
  "date": "2023-10-31",
  "shelf": "read",
  "rating": 4.0
 },
 {
  "id": "35133922",
  "title": "Educated",
  "author": "Tara Westover",
  "isbn": "9780399590504",
  "year": 2018,
  "date": "2023-09-02",
  "shelf": "read",
  "rating": 5.0,
  "line": "Hard to believe it's true; impossible to put down."
 },
 {
  "id": "42611483",
  "title": "Escaping the Build Trap",
  "author": "Melissa Perri",
  "isbn": "9781491973752",
  "year": 2018,
  "date": "2023-09-01",
  "shelf": "read",
  "rating": 4.0,
  "line": "The book that made outcomes over outputs click for me."
 },
 {
  "id": "1627",
  "title": "Brokeback Mountain",
  "author": "Annie Proulx",
  "isbn": "9780743271325",
  "year": 1997,
  "date": "2023-07-09",
  "shelf": "read",
  "rating": 5.0,
  "line": "Thirty pages that hit harder than most novels.",
  "review": "I'd seen the film first, which was a mistake. Proulx does in a few pages what the film needs two hours for, and the language is so plain it almost hides how much it's carrying."
 },
 {
  "id": "58891551",
  "title": "Young Mungo",
  "author": "Douglas Stuart",
  "isbn": "9780802159557",
  "year": 2022,
  "date": "2023-05-01",
  "shelf": "read",
  "rating": 5.0,
  "line": "Brutal and tender at once. Mungo will stay with me."
 },
 {
  "id": "57701764",
  "title": "Wish You Were Here",
  "author": "Jodi Picoult",
  "isbn": "9781984818416",
  "year": 2021,
  "date": "2023-03-21",
  "shelf": "read",
  "rating": 3.0
 },
 {
  "id": "58437578",
  "title": "A Cure for Darkness",
  "author": "Alex Riley",
  "isbn": "9781501198786",
  "year": 2021,
  "date": "2023-01-31",
  "shelf": "read",
  "rating": 4.0
 },
 {
  "id": "11084145",
  "title": "Steve Jobs",
  "author": "Walter Isaacson",
  "isbn": "9781451648539",
  "year": 2011,
  "date": "2022-09-13",
  "shelf": "read",
  "rating": 5.0
 },
 {
  "id": "37786022",
  "title": "Storyworthy",
  "author": "Matthew Dicks",
  "isbn": "9781608685486",
  "year": 2018,
  "date": "2022-09-11",
  "shelf": "read",
  "rating": 4.0
 },
 {
  "id": "41150487",
  "title": "Red, White & Royal Blue",
  "author": "Casey McQuiston",
  "isbn": "9781250316776",
  "year": 2019,
  "date": "2022-09-09",
  "shelf": "read",
  "rating": 3.0
 },
 {
  "id": "61215351",
  "title": "The Fellowship of the Ring",
  "author": "J.R.R. Tolkien",
  "isbn": null,
  "year": 1954,
  "date": "2022-08-25",
  "shelf": "read",
  "rating": 5.0,
  "line": "Slow to start, then a world I didn't want to leave."
 },
 {
  "id": "1208713",
  "title": "The Art of Creative Thinking",
  "author": "John Adair",
  "isbn": "9780749447991",
  "year": 2007,
  "date": "2022-07-02",
  "shelf": "read",
  "rating": 4.0
 },
 {
  "id": "840",
  "title": "The Design of Everyday Things",
  "author": "Donald A. Norman",
  "isbn": "9780465067107",
  "year": 1988,
  "date": "2022-06-30",
  "shelf": "read",
  "rating": 5.0,
  "line": "Every door I push now is a design lesson."
 },
 {
  "id": "35274263",
  "title": "The Product Book",
  "author": "Product School",
  "isbn": "9780998973838",
  "year": 2017,
  "date": "2022-05-31",
  "shelf": "read",
  "rating": 4.0
 },
 {
  "id": "18050143",
  "title": "Zero to One",
  "author": "Peter Thiel",
  "isbn": "9780804139298",
  "coverId": 9002334,
  "year": 2001,
  "date": "2022-05-19",
  "shelf": "read",
  "rating": 4.0
 },
 {
  "id": "32887592",
  "title": "A Pelican Introduction",
  "author": "Guy Standing",
  "isbn": "9780141985480",
  "coverId": 14848258,
  "year": 2017,
  "date": "2022-05-14",
  "shelf": "read",
  "rating": 3.0
 },
 {
  "id": "54944",
  "title": "The Ethical Slut",
  "author": "Dossie Easton",
  "isbn": "9781890159016",
  "coverId": 938291,
  "year": 1997,
  "date": "2022-05-09",
  "shelf": "read",
  "rating": 4.0
 },
 {
  "id": "368593",
  "title": "The 4-Hour Workweek",
  "author": "Timothy Ferriss",
  "isbn": "9780307353139",
  "coverId": 539652,
  "year": 2006,
  "date": "2022-04-17",
  "shelf": "read",
  "rating": 4.0
 },
 {
  "id": "170448",
  "title": "Animal Farm",
  "author": "George Orwell",
  "isbn": "9780451526342",
  "coverId": 11261770,
  "year": 1945,
  "date": "2022-04-10",
  "shelf": "read",
  "rating": 4.0
 },
 {
  "id": "18373",
  "title": "Flowers for Algernon",
  "author": "Daniel Keyes",
  "isbn": "9780156030083",
  "coverId": 12947700,
  "year": 1966,
  "date": "2022-03-29",
  "shelf": "read",
  "rating": 5.0
 },
 {
  "id": "18458190",
  "title": "Egenmäktigt förfarande",
  "author": "Lena Andersson",
  "isbn": "9789127136991",
  "year": 2013,
  "date": "2022-03-05",
  "shelf": "read",
  "rating": 4.0
 },
 {
  "id": "6708",
  "title": "The Power of Now",
  "author": "Eckhart Tolle",
  "coverId": 551262,
  "year": 1997,
  "date": "2022-02-27",
  "shelf": "read",
  "rating": 3.0
 },
 {
  "id": "35959740",
  "title": "Circe",
  "author": "Madeline Miller",
  "isbn": "9780316556347",
  "coverId": 8739376,
  "year": 2018,
  "date": "2022-01-20",
  "shelf": "read",
  "rating": 4.0
 },
 {
  "id": "55278923",
  "title": "The Frontiers of Knowledge",
  "author": "A.C. Grayling",
  "isbn": "9780241304587",
  "coverId": 11976099,
  "year": 2021,
  "date": "2022-01-17",
  "shelf": "read",
  "rating": 3.0
 },
 {
  "id": "42285012",
  "title": "The Beekeeper of Aleppo",
  "author": "Christy Lefteri",
  "year": 2019,
  "date": "2022-01-07",
  "shelf": "read",
  "rating": 5.0
 },
 {
  "id": "6181",
  "title": "If This Is a Man / The Truce",
  "author": "Primo Levi",
  "isbn": "9780349100135",
  "coverId": 212617,
  "year": 1963,
  "date": "2021-12-01",
  "shelf": "read",
  "rating": 4.0
 },
 {
  "id": "23422",
  "title": "The Art of Travel",
  "author": "Alain de Botton",
  "isbn": "9780375725340",
  "coverId": 10410653,
  "year": 2002,
  "date": "2021-11-01",
  "shelf": "read",
  "rating": 3.0
 },
 {
  "id": "54898389",
  "title": "The Almanack of Naval Ravikant",
  "author": "Eric Jorgenson",
  "isbn": "9781544514208",
  "coverId": 10449931,
  "year": 2020,
  "date": "2021-10-10",
  "shelf": "read",
  "rating": 4.0
 },
 {
  "id": "30474",
  "title": "The Communist Manifesto",
  "author": "Karl Marx",
  "isbn": "9780140447576",
  "coverId": 11048623,
  "year": 1848,
  "date": "2021-10-01",
  "shelf": "read",
  "rating": 3.0
 },
 {
  "id": "23120225",
  "title": "The Establishment",
  "author": "Owen Jones",
  "isbn": "9781846147197",
  "coverId": 8064202,
  "year": 2014,
  "date": "2021-09-11",
  "shelf": "read",
  "rating": 3.0
 },
 {
  "id": "11337189",
  "title": "A Universe from Nothing",
  "author": "Lawrence M. Krauss",
  "isbn": "9781451624458",
  "coverId": 9454845,
  "year": 2010,
  "date": "2021-08-28",
  "shelf": "read",
  "rating": 3.0
 },
 {
  "id": "32895535",
  "title": "Why Buddhism Is True",
  "author": "Robert Wright",
  "isbn": "9781508235408",
  "date": "2021-07-23",
  "shelf": "read",
  "rating": 4.0
 },
 {
  "id": "31799",
  "title": "The Problems of Philosophy",
  "author": "Bertrand Russell",
  "isbn": "9781421903675",
  "coverId": 6947403,
  "year": 1900,
  "date": "2021-07-10",
  "shelf": "read",
  "rating": 4.0
 },
 {
  "id": "81959",
  "title": "As a Man Thinketh",
  "author": "James Allen",
  "isbn": "9781585425648",
  "coverId": 850412,
  "year": 2006,
  "date": "2021-06-27",
  "shelf": "read",
  "rating": 4.0
 },
 {
  "id": "11250317",
  "title": "The Song of Achilles",
  "author": "Madeline Miller",
  "isbn": "9781408816035",
  "coverId": 7098465,
  "year": 2011,
  "date": "2021-06-25",
  "shelf": "read",
  "rating": 5.0
 },
 {
  "id": "40876575",
  "title": "Utopia for Realists",
  "author": "Rutger Bregman",
  "isbn": "9780316471909",
  "coverId": 12684144,
  "year": 2016,
  "date": "2021-06-22",
  "shelf": "read",
  "rating": 3.0
 },
 {
  "id": "24213",
  "title": "Alice’s Adventures in Wonderland / Through the Looking-Glass",
  "author": "Lewis Carroll",
  "coverId": 8595966,
  "year": 1889,
  "date": "2021-06-08",
  "shelf": "read",
  "rating": 4.0
 },
 {
  "id": "6334",
  "title": "Never Let Me Go",
  "author": "Kazuo Ishiguro",
  "isbn": "9781400078776",
  "coverId": 1047334,
  "year": 2005,
  "date": "2021-06-08",
  "shelf": "read",
  "rating": 3.0
 },
 {
  "id": "25135194",
  "title": "Prisoners of Geography",
  "author": "Tim Marshall",
  "isbn": "9781783961412",
  "coverId": 8900233,
  "year": 2015,
  "date": "2021-06-08",
  "shelf": "read",
  "rating": 4.0
 },
 {
  "id": "46212868",
  "title": "How Proust Can Change Your Life",
  "author": "Alain de Botton",
  "isbn": "9781509870691",
  "year": 2019,
  "date": "2021-06-06",
  "shelf": "read",
  "rating": 4.0
 },
 {
  "id": "26147",
  "title": "Man's Search for Meaning",
  "author": "Viktor E. Frankl",
  "isbn": "9781844132393",
  "coverId": 8516506,
  "year": 1946,
  "date": "2021-06-06",
  "shelf": "read",
  "rating": 5.0
 },
 {
  "id": "12576334",
  "title": "Religion for Atheists",
  "author": "Alain de Botton",
  "isbn": "9780241144770",
  "coverId": 10165125,
  "year": 2012,
  "date": "2021-06-06",
  "shelf": "read",
  "rating": 3.0
 },
 {
  "id": "30372952",
  "title": "Black Box Thinking",
  "author": "Matthew Syed",
  "isbn": "9781473613805",
  "coverId": 11349464,
  "year": 2015,
  "date": "2021-04-08",
  "shelf": "read",
  "rating": 5.0
 },
 {
  "id": "36203368",
  "title": "The Choice",
  "author": "Edith Eger",
  "isbn": "9781846045127",
  "coverId": 14814936,
  "year": 1900,
  "date": "2021-03-27",
  "shelf": "read",
  "rating": 5.0
 },
 {
  "id": "52879286",
  "title": "Humankind",
  "author": "Rutger Bregman",
  "isbn": "9780316418539",
  "coverId": 9410738,
  "year": 2019,
  "date": "2021-03-24",
  "shelf": "read",
  "rating": 4.0
 },
 {
  "id": "23423",
  "title": "The Consolations of Philosophy",
  "author": "Alain de Botton",
  "isbn": "9780140276619",
  "coverId": 10124965,
  "year": 2001,
  "date": "2021-02-25",
  "shelf": "read",
  "rating": 3.0
 },
 {
  "id": "41015249",
  "title": "Beren and Lúthien",
  "author": "J.R.R. Tolkien",
  "coverId": 12639912,
  "year": 2017,
  "date": "2021-02-09",
  "shelf": "read",
  "rating": 3.0
 },
 {
  "id": "35510008",
  "title": "This is Going to Hurt",
  "author": "Adam Kay",
  "coverId": 9355118,
  "year": 2017,
  "date": "2020-09-30",
  "shelf": "read",
  "rating": 5.0
 },
 {
  "id": "23692271",
  "title": "Sapiens",
  "author": "Yuval Noah Harari",
  "coverId": 8634250,
  "year": 2011,
  "date": "2018-10-15",
  "shelf": "read",
  "rating": 5.0
 },
 {
  "id": "31138556",
  "title": "Homo Deus",
  "author": "Yuval Noah Harari",
  "coverId": 8846275,
  "year": 2017,
  "date": "2018-10-09",
  "shelf": "read",
  "rating": 4.0
 },
 {
  "id": "34890015",
  "title": "Factfulness",
  "author": "Hans Rosling",
  "isbn": "9781473637467",
  "coverId": 8186237,
  "year": 2018,
  "date": "2018-10-09",
  "shelf": "read",
  "rating": 4.0
 },
 {
  "id": "38820046",
  "title": "21 Lessons for the 21st Century",
  "author": "Yuval Noah Harari",
  "isbn": "9780525512172",
  "coverId": 10108277,
  "year": 2018,
  "date": "2018-10-09",
  "shelf": "read",
  "rating": 4.0
 },
 {
  "id": "22557272",
  "title": "The Girl on the Train",
  "author": "Paula Hawkins",
  "isbn": "9781594633669",
  "coverId": 7350360,
  "year": 2014,
  "date": "2018-10-09",
  "shelf": "read",
  "rating": 4.0
 },
 {
  "id": "17157681",
  "title": "The Hobbit, Part One",
  "author": "J.R.R. Tolkien",
  "isbn": "9780007926664",
  "coverId": 14627509,
  "year": 1937,
  "date": "2018-10-09",
  "shelf": "read",
  "rating": 4.0
 },
 {
  "id": "865",
  "title": "The Alchemist",
  "author": "Paulo Coelho",
  "isbn": "9780061122415",
  "coverId": 7414780,
  "year": 1988,
  "date": "2018-10-09",
  "shelf": "read",
  "rating": 5.0
 },
 {
  "id": "2784",
  "title": "Ways of Seeing",
  "author": "John Berger",
  "isbn": "9780140135152",
  "coverId": 95272,
  "year": 1972,
  "date": "2026-10-12",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "61049",
  "title": "Autobiography of Red",
  "author": "Anne Carson",
  "isbn": "9780375701290",
  "coverId": 225443,
  "year": 1998,
  "date": "2026-10-11",
  "shelf": "want",
  "genres": [
   "Poetry & drama"
  ]
 },
 {
  "id": "241665302",
  "title": "Where the Light Gets In",
  "author": "Ben Crowe",
  "date": "2026-09-24",
  "shelf": "want"
 },
 {
  "id": "40539136",
  "title": "Lie With Me",
  "author": "Philippe Besson",
  "isbn": "9781501197871",
  "coverId": 13306225,
  "year": 2017,
  "date": "2026-09-22",
  "shelf": "want",
  "genres": [
   "Literary fiction",
   "Queer stories"
  ]
 },
 {
  "id": "46263943",
  "title": "Real Life",
  "author": "Brandon Taylor",
  "isbn": "9780525538882",
  "coverId": 9280646,
  "year": 2020,
  "date": "2026-09-22",
  "shelf": "want",
  "genres": [
   "Literary fiction",
   "Queer stories"
  ]
 },
 {
  "id": "241685587",
  "title": "Life at the Speed of Play",
  "author": "Mark Pincus",
  "isbn": "9780063352575",
  "coverId": 15239287,
  "year": 2026,
  "date": "2026-09-17",
  "shelf": "want"
 },
 {
  "id": "223436601",
  "title": "Careless People",
  "author": "Sarah Wynn-Williams",
  "isbn": "9781250391230",
  "coverId": 14852090,
  "year": 2025,
  "date": "2026-08-22",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "50202953",
  "title": "Piranesi",
  "author": "Susanna Clarke",
  "coverId": 10226290,
  "year": 2020,
  "date": "2026-07-26",
  "shelf": "want",
  "genres": [
   "Fantasy & sci-fi"
  ]
 },
 {
  "id": "244934769",
  "title": "The Land and Its People",
  "author": "David Sedaris",
  "isbn": "9780316264839",
  "coverId": 15249913,
  "year": 2026,
  "date": "2026-07-18",
  "shelf": "want"
 },
 {
  "id": "28921",
  "title": "The Remains of the Day",
  "author": "Kazuo Ishiguro",
  "coverId": 95742,
  "year": 1989,
  "date": "2026-06-03",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "25334576",
  "title": "Grief Is the Thing with Feathers",
  "author": "Max Porter",
  "isbn": "9780571323760",
  "coverId": 10302038,
  "year": 2015,
  "date": "2026-06-03",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "243596291",
  "title": "Fruit Fly",
  "author": "Josh Silver",
  "isbn": "9798892426374",
  "coverId": 15249355,
  "year": 2026,
  "date": "2026-04-30",
  "shelf": "want"
 },
 {
  "id": "246248414",
  "title": "Made In Heaven",
  "author": "Victorian Poetry",
  "isbn": "9798242342385",
  "date": "2026-04-26",
  "shelf": "want"
 },
 {
  "id": "209348298",
  "title": "Isaac",
  "author": "Curtis Garner",
  "isbn": "9780857308665",
  "year": 2024,
  "date": "2026-03-28",
  "shelf": "want"
 },
 {
  "id": "241456738",
  "title": "Orange",
  "author": "Curtis Garner",
  "isbn": "9780857309419",
  "date": "2026-03-28",
  "shelf": "want"
 },
 {
  "id": "218583908",
  "title": "Nova Scotia House",
  "author": "Charlie Porter",
  "isbn": "9781802067453",
  "coverId": 15135611,
  "year": 2025,
  "date": "2026-03-28",
  "shelf": "want"
 },
 {
  "id": "157981748",
  "title": "Supercommunicators",
  "author": "Charles Duhigg",
  "coverId": 14591638,
  "year": 2024,
  "date": "2026-03-13",
  "shelf": "want",
  "genres": [
   "Psychology & self"
  ]
 },
 {
  "id": "52283963",
  "title": "The Mom Test",
  "author": "Rob Fitzpatrick",
  "coverId": 10660557,
  "year": 2014,
  "date": "2026-02-19",
  "shelf": "want",
  "genres": [
   "Business & product"
  ]
 },
 {
  "id": "15815364",
  "title": "How to Get Filthy Rich in Rising Asia",
  "author": "Mohsin Hamid",
  "isbn": "9781594487293",
  "coverId": 7555109,
  "year": 2013,
  "date": "2026-02-11",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "5883629",
  "title": "Yellow Face",
  "author": "David Henry Hwang",
  "isbn": "9781559363402",
  "coverId": 9804403,
  "year": 2008,
  "date": "2026-02-08",
  "shelf": "want",
  "genres": [
   "Poetry & drama",
   "Psychology & self"
  ]
 },
 {
  "id": "61714633",
  "title": "The Wager",
  "author": "David Grann",
  "isbn": "9780385534260",
  "coverId": 13245246,
  "year": 2023,
  "date": "2026-02-08",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "214152261",
  "title": "Flesh",
  "author": "David Szalay",
  "isbn": "9781982122799",
  "coverId": 15110590,
  "year": 2025,
  "date": "2026-02-01",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "58056091",
  "title": "On Earth We're Briefly Gorgeous - Di Semesta Ini Kita Pernah Gemilang",
  "author": "Ocean Vuong",
  "isbn": "9786020652665",
  "year": 2019,
  "date": "2026-02-01",
  "shelf": "want"
 },
 {
  "id": "212294434",
  "title": "Talk",
  "author": "Alison Wood Brooks",
  "isbn": "9780593443491",
  "year": 2025,
  "date": "2025-12-18",
  "shelf": "want",
  "genres": [
   "Psychology & self"
  ]
 },
 {
  "id": "41940283",
  "title": "Out of the Shadows",
  "author": "Walt Odets",
  "isbn": "9780374285852",
  "coverId": 10109083,
  "year": 2019,
  "date": "2025-12-12",
  "shelf": "want",
  "genres": [
   "Queer stories",
   "History & ideas"
  ]
 },
 {
  "id": "199809440",
  "title": "Supremacy",
  "author": "Parmy Olson",
  "isbn": "9781250337740",
  "coverId": 14815392,
  "year": 2024,
  "date": "2025-12-04",
  "shelf": "want"
 },
 {
  "id": "202468422",
  "title": "There Are Rivers in the Sky",
  "author": "Elif Shafak",
  "isbn": "9780593801710",
  "coverId": 14653203,
  "year": 2024,
  "date": "2025-12-04",
  "shelf": "want"
 },
 {
  "id": "195474144",
  "title": "Table for Two",
  "author": "Amor Towles",
  "isbn": "9780593296370",
  "coverId": 14602757,
  "year": 2024,
  "date": "2025-12-04",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "10260",
  "title": "The Pleasure of Finding Things Out",
  "author": "Richard P. Feynman",
  "coverId": 463308,
  "year": 1999,
  "date": "2025-12-01",
  "shelf": "want",
  "genres": [
   "Memoir",
   "History & ideas"
  ]
 },
 {
  "id": "19381636",
  "title": "A History of Loneliness (International Edition)",
  "author": "John Boyne",
  "isbn": "9780857520951",
  "coverId": 12720621,
  "year": 2014,
  "date": "2025-11-27",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "63042968",
  "title": "The Heart's Invisible Furies / A History of Loneliness / A Ladder to the Sky (John Boyne 3 Books Collection Set)",
  "author": "John Boyne",
  "isbn": "9789123477494",
  "date": "2025-11-27",
  "shelf": "want"
 },
 {
  "id": "45047384",
  "title": "The House in the Cerulean Sea",
  "author": "T.J. Klune",
  "coverId": 9312772,
  "year": 2019,
  "date": "2025-11-07",
  "shelf": "want",
  "genres": [
   "Queer stories",
   "Fantasy & sci-fi",
   "Children's"
  ]
 },
 {
  "id": "219848315",
  "title": "The Emperor of Gladness",
  "author": "Ocean Vuong",
  "isbn": "9780593831878",
  "coverId": 15146234,
  "year": 2025,
  "date": "2025-10-05",
  "shelf": "want",
  "genres": [
   "Literary fiction",
   "Queer stories",
   "Poetry & drama"
  ]
 },
 {
  "id": "306940",
  "title": "Impro",
  "author": "Keith Johnstone",
  "isbn": "9780878301171",
  "coverId": 261287,
  "year": 1979,
  "date": "2025-10-02",
  "shelf": "want"
 },
 {
  "id": "217388128",
  "title": "The Möbius Book",
  "author": "Catherine Lacey",
  "isbn": "9780374615406",
  "year": 2025,
  "date": "2025-06-22",
  "shelf": "want"
 },
 {
  "id": "33253215",
  "title": "The Heart's Invisible Furies",
  "author": "John Boyne",
  "coverId": 12718262,
  "year": 2017,
  "date": "2025-06-06",
  "shelf": "want",
  "genres": [
   "Literary fiction",
   "Queer stories"
  ]
 },
 {
  "id": "179311316",
  "title": "Why We Die",
  "author": "Venki Ramakrishnan",
  "isbn": "9780063113275",
  "coverId": 15103411,
  "year": 2024,
  "date": "2025-05-30",
  "shelf": "want"
 },
 {
  "id": "218372426",
  "title": "Moral Ambition",
  "author": "Rutger Bregman",
  "isbn": "9780316580359",
  "coverId": 15221130,
  "year": 2024,
  "date": "2025-04-26",
  "shelf": "want",
  "genres": [
   "Psychology & self",
   "Business & product",
   "History & ideas"
  ]
 },
 {
  "id": "6452796",
  "title": "Drive",
  "author": "Daniel H. Pink",
  "isbn": "9781594488849",
  "coverId": 6404786,
  "year": 2009,
  "date": "2025-01-13",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "99315",
  "title": "A Whole New Mind",
  "author": "Daniel H. Pink",
  "isbn": "9781594481710",
  "coverId": 872503,
  "year": 2005,
  "date": "2025-01-13",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "406235",
  "title": "Giovanni’s Room",
  "author": "James Baldwin",
  "coverId": 97395,
  "year": 1956,
  "date": "2024-12-07",
  "shelf": "want",
  "genres": [
   "Classics",
   "Queer stories"
  ]
 },
 {
  "id": "24618",
  "title": "The Art of Living",
  "author": "Epictetus",
  "isbn": "9780062513465",
  "coverId": 47899,
  "year": 1995,
  "date": "2024-10-11",
  "shelf": "want",
  "genres": [
   "Psychology & self"
  ]
 },
 {
  "id": "58642436",
  "title": "The Status Game",
  "author": "Will Storr",
  "isbn": "9780008354657",
  "coverId": 14296323,
  "year": 2021,
  "date": "2024-10-10",
  "shelf": "want"
 },
 {
  "id": "50157885",
  "title": "The Science of Storytelling",
  "author": "Will Storr",
  "isbn": "9781419743030",
  "coverId": 9295681,
  "year": 2019,
  "date": "2024-10-10",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "177068",
  "title": "The Fabric of Reality",
  "author": "David Deutsch",
  "isbn": "9780140275414",
  "coverId": 452204,
  "year": 1997,
  "date": "2024-10-08",
  "shelf": "want",
  "genres": [
   "History & ideas"
  ]
 },
 {
  "id": "58169",
  "title": "Catching the Big Fish",
  "author": "David Lynch",
  "isbn": "9781585425402",
  "coverId": 850405,
  "year": 2006,
  "date": "2024-09-14",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "59948520",
  "title": "In Memoriam",
  "author": "Alice Winn",
  "isbn": "9780593534564",
  "coverId": 13299708,
  "year": 2023,
  "date": "2024-09-08",
  "shelf": "want",
  "genres": [
   "Literary fiction",
   "Queer stories"
  ]
 },
 {
  "id": "204927599",
  "title": "Nexus",
  "author": "Yuval Noah Harari",
  "isbn": "9780593734223",
  "coverId": 14812834,
  "year": 2024,
  "date": "2024-09-08",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "60705867",
  "title": "Living for Pleasure",
  "author": "Emily A. Austin",
  "isbn": "9780197558324",
  "year": 2023,
  "date": "2024-08-18",
  "shelf": "want"
 },
 {
  "id": "176443397",
  "title": "Vulture Capitalism",
  "author": "Grace Blakeley",
  "isbn": "9781982180850",
  "coverId": 14625525,
  "year": 2024,
  "date": "2024-08-09",
  "shelf": "want",
  "genres": [
   "History & ideas"
  ]
 },
 {
  "id": "76334",
  "title": "A New Earth",
  "author": "Eckhart Tolle",
  "isbn": "9780452287587",
  "coverId": 10858608,
  "year": 2005,
  "date": "2024-04-27",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "181109983",
  "title": "The House of Hidden Meanings",
  "author": "RuPaul",
  "isbn": "9780063263901",
  "coverId": 14602785,
  "year": 2024,
  "date": "2024-03-27",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "55216172",
  "title": "Empireland",
  "author": "Sathnam Sanghera",
  "isbn": "9780241445297",
  "coverId": 10846156,
  "year": 2021,
  "date": "2024-01-24",
  "shelf": "want",
  "genres": [
   "History & ideas"
  ]
 },
 {
  "id": "3228917",
  "title": "Outliers",
  "author": "Malcolm Gladwell",
  "isbn": "9780316017923",
  "coverId": 10021591,
  "year": 2008,
  "date": "2023-12-24",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "17614857",
  "title": "Straight Jacket",
  "author": "Matthew Todd",
  "isbn": "9781448111107",
  "coverId": 8475087,
  "year": 2012,
  "date": "2023-12-11",
  "shelf": "want",
  "genres": [
   "Queer stories",
   "Psychology & self"
  ]
 },
 {
  "id": "10828095",
  "title": "Populärmusik från Vittula",
  "author": "Mikael Niemi",
  "isbn": "9789172970007",
  "coverId": 12638422,
  "year": 2000,
  "date": "2023-12-02",
  "shelf": "want"
 },
 {
  "id": "157095669",
  "title": "Hidden Potential",
  "author": "Adam M. Grant",
  "isbn": "9780593653142",
  "coverId": 14445208,
  "year": 2023,
  "date": "2023-11-20",
  "shelf": "want"
 },
 {
  "id": "53343",
  "title": "On Writing Well",
  "author": "William Zinsser",
  "isbn": "9780060891541",
  "coverId": 20450,
  "year": 1976,
  "date": "2023-11-05",
  "shelf": "want"
 },
 {
  "id": "96177657",
  "title": "Politics On the Edge",
  "author": "Rory Stewart",
  "coverId": 14745636,
  "year": 2023,
  "date": "2023-10-21",
  "shelf": "want",
  "genres": [
   "History & ideas"
  ]
 },
 {
  "id": "9717",
  "title": "The Unbearable Lightness of Being",
  "author": "Milan Kundera",
  "isbn": "9780571224388",
  "coverId": 967823,
  "year": 1984,
  "date": "2023-09-10",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "60097435",
  "title": "Quit",
  "author": "Annie Duke",
  "isbn": "9780593422991",
  "coverId": 12537626,
  "year": 2022,
  "date": "2023-08-10",
  "shelf": "want"
 },
 {
  "id": "41134642",
  "title": "Turning Pro",
  "author": "Steven Pressfield",
  "coverId": 7323168,
  "year": 2012,
  "date": "2023-08-01",
  "shelf": "want",
  "genres": [
   "Psychology & self"
  ]
 },
 {
  "id": "3431",
  "title": "The Five People You Meet in Heaven",
  "author": "Mitch Albom",
  "isbn": "9780786868711",
  "coverId": 12553870,
  "year": 2003,
  "date": "2023-07-26",
  "shelf": "want",
  "genres": [
   "Literary fiction",
   "Poetry & drama"
  ]
 },
 {
  "id": "52741293",
  "title": "Shuggie Bain",
  "author": "Douglas Stuart",
  "isbn": "9780802148049",
  "coverId": 9271540,
  "year": 2019,
  "date": "2023-05-01",
  "shelf": "want",
  "genres": [
   "Queer stories",
   "Children's"
  ]
 },
 {
  "id": "61030740",
  "title": "Edible Economics",
  "author": "Ha-Joon Chang",
  "isbn": "9781541700543",
  "coverId": 14774225,
  "year": 2022,
  "date": "2023-02-05",
  "shelf": "want",
  "genres": [
   "Business & product",
   "History & ideas"
  ]
 },
 {
  "id": "58725007",
  "title": "Butler to the World",
  "author": "Oliver Bullough",
  "isbn": "9781250281920",
  "coverId": 14543830,
  "year": 2022,
  "date": "2023-02-05",
  "shelf": "want"
 },
 {
  "id": "41160292",
  "title": "Exhalation",
  "author": "Ted Chiang",
  "coverId": 8793546,
  "year": 2014,
  "date": "2022-12-18",
  "shelf": "want",
  "genres": [
   "Fantasy & sci-fi"
  ]
 },
 {
  "id": "25489625",
  "title": "Between the World and Me",
  "author": "Ta-Nehisi Coates",
  "coverId": 11328078,
  "year": 2015,
  "date": "2022-12-18",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "60018587",
  "title": "Good Arguments",
  "author": "Bo Seo",
  "isbn": "9780593299517",
  "year": 2022,
  "date": "2022-11-29",
  "shelf": "want"
 },
 {
  "id": "48691943",
  "title": "The Great CEO Within",
  "author": "Matt Mochary",
  "isbn": "9780578599298",
  "coverId": 10085060,
  "year": 2019,
  "date": "2022-11-14",
  "shelf": "want"
 },
 {
  "id": "52962238",
  "title": "Principles for Dealing with the Changing World Order",
  "author": "Ray Dalio",
  "isbn": "9781982160272",
  "coverId": 10452559,
  "year": 2020,
  "date": "2022-10-29",
  "shelf": "want",
  "genres": [
   "Business & product",
   "History & ideas"
  ]
 },
 {
  "id": "2615",
  "title": "The Innovator's Dilemma",
  "author": "Clayton M. Christensen",
  "isbn": "9780060521998",
  "coverId": 9274687,
  "year": 1997,
  "date": "2022-10-20",
  "shelf": "want",
  "genres": [
   "Psychology & self",
   "Business & product",
   "History & ideas"
  ]
 },
 {
  "id": "53138083",
  "title": "Working Backwards",
  "author": "Colin Bryar",
  "isbn": "9781250267597",
  "coverId": 10297403,
  "year": 2021,
  "date": "2022-10-15",
  "shelf": "want",
  "genres": [
   "Business & product"
  ]
 },
 {
  "id": "15798078",
  "title": "Decisive",
  "author": "Chip Heath",
  "isbn": "9780307956392",
  "coverId": 8537216,
  "year": 2013,
  "date": "2022-09-28",
  "shelf": "want",
  "genres": [
   "Psychology & self",
   "Business & product"
  ]
 },
 {
  "id": "30316244",
  "title": "Listening to Ayahuasca",
  "author": "Rachel Harris",
  "isbn": "9781608684021",
  "year": 2017,
  "date": "2022-09-17",
  "shelf": "want"
 },
 {
  "id": "43701904",
  "title": "When Plants Dream",
  "author": "Daniel Pinchbeck",
  "isbn": "9781786780799",
  "year": 2019,
  "date": "2022-09-17",
  "shelf": "want"
 },
 {
  "id": "58046715",
  "title": "Continuous Discovery Habits",
  "author": "Teresa Torres",
  "isbn": "9781736633304",
  "coverId": 11136152,
  "year": 2021,
  "date": "2022-09-15",
  "shelf": "want"
 },
 {
  "id": "76865",
  "title": "Good to Great",
  "author": "Jim Collins",
  "isbn": "9780066620992",
  "coverId": 7431270,
  "year": 2001,
  "date": "2022-08-30",
  "shelf": "want",
  "genres": [
   "Business & product",
   "History & ideas"
  ]
 },
 {
  "id": "17660462",
  "title": "The Everything Store",
  "author": "Brad Stone",
  "isbn": "9780316219266",
  "coverId": 7264584,
  "year": 2013,
  "date": "2022-08-29",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "4406",
  "title": "East of Eden",
  "author": "John Steinbeck",
  "isbn": "9780142000656",
  "coverId": 11386937,
  "year": 1952,
  "date": "2022-08-25",
  "shelf": "want",
  "genres": [
   "Classics",
   "Children's"
  ]
 },
 {
  "id": "10614",
  "title": "Misery",
  "author": "Stephen King",
  "isbn": "9780450417399",
  "coverId": 8259296,
  "year": 1978,
  "date": "2022-08-25",
  "shelf": "want",
  "genres": [
   "Fantasy & sci-fi"
  ]
 },
 {
  "id": "2547",
  "title": "The Prophet",
  "author": "Kahlil Gibran",
  "isbn": "9780001000391",
  "coverId": 418324,
  "year": 1923,
  "date": "2022-08-12",
  "shelf": "want",
  "genres": [
   "Classics",
   "Poetry & drama"
  ]
 },
 {
  "id": "55338968",
  "title": "The Cold Start Problem",
  "author": "Andrew Chen",
  "isbn": "9780062969743",
  "coverId": 10607120,
  "year": 2021,
  "date": "2022-08-09",
  "shelf": "want"
 },
 {
  "id": "58604389",
  "title": "This Much is True",
  "author": "Miriam Margolyes",
  "coverId": 12437883,
  "year": 2021,
  "date": "2022-07-25",
  "shelf": "want",
  "genres": [
   "Queer stories",
   "Memoir"
  ]
 },
 {
  "id": "21",
  "title": "A Short History of Nearly Everything",
  "author": "Bill Bryson",
  "isbn": "9780767908184",
  "coverId": 12725620,
  "year": 2003,
  "date": "2022-07-18",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "6597",
  "title": "The Four Agreements Companion Book",
  "author": "Miguel Ruiz",
  "isbn": "9781878424488",
  "coverId": 9510955,
  "year": 2000,
  "date": "2022-07-18",
  "shelf": "want",
  "genres": [
   "Psychology & self",
   "History & ideas"
  ]
 },
 {
  "id": "41580312",
  "title": "Be Here Now",
  "author": "Ram Dass",
  "coverId": 12441918,
  "year": 1971,
  "date": "2022-07-17",
  "shelf": "want"
 },
 {
  "id": "11324722",
  "title": "The Righteous Mind",
  "author": "Jonathan Haidt",
  "coverId": 7256782,
  "year": 2012,
  "date": "2022-07-16",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "1044831",
  "title": "Are Your Lights On?",
  "author": "Donald C. Gause",
  "isbn": "9780932633163",
  "coverId": 711868,
  "year": 1977,
  "date": "2022-07-05",
  "shelf": "want",
  "genres": [
   "Psychology & self"
  ]
 },
 {
  "id": "67825",
  "title": "Peopleware",
  "author": "Tom DeMarco",
  "isbn": "9780932633439",
  "coverId": 711859,
  "year": 1987,
  "date": "2022-07-05",
  "shelf": "want",
  "genres": [
   "Business & product"
  ]
 },
 {
  "id": "32816087",
  "title": "7 Powers",
  "author": "Hamilton Wright Helmer",
  "isbn": "9780998116310",
  "coverId": 10208801,
  "year": 2016,
  "date": "2022-07-05",
  "shelf": "want"
 },
 {
  "id": "56866234",
  "title": "Strong Product People",
  "author": "Petra Wille",
  "date": "2022-07-05",
  "shelf": "want"
 },
 {
  "id": "53481975",
  "title": "Empowered",
  "author": "Marty Cagan",
  "isbn": "9781119691297",
  "coverId": 10847862,
  "year": 2020,
  "date": "2022-07-05",
  "shelf": "want",
  "genres": [
   "Business & product"
  ]
 },
 {
  "id": "25374501",
  "title": "The Lean Product Playbook",
  "author": "Dan Olsen",
  "coverId": 14816612,
  "year": 2015,
  "date": "2022-07-05",
  "shelf": "want",
  "genres": [
   "Business & product",
   "History & ideas"
  ]
 },
 {
  "id": "35249663",
  "title": "Inspired",
  "author": "Marty Cagan",
  "isbn": "9781119387503",
  "coverId": 9700654,
  "year": 2008,
  "date": "2022-07-05",
  "shelf": "want"
 },
 {
  "id": "13078769",
  "title": "Running Lean",
  "author": "Ash Maurya",
  "isbn": "9781449305178",
  "coverId": 8122897,
  "year": 2012,
  "date": "2022-06-29",
  "shelf": "want",
  "genres": [
   "Business & product"
  ]
 },
 {
  "id": "54505323",
  "title": "Invent and Wander",
  "author": "Jeff Bezos",
  "isbn": "9781647820718",
  "coverId": 10229085,
  "year": 2020,
  "date": "2022-06-29",
  "shelf": "want",
  "genres": [
   "Memoir",
   "Business & product"
  ]
 },
 {
  "id": "1633",
  "title": "Getting Things Done",
  "author": "David Allen",
  "isbn": "9780142000281",
  "coverId": 109288,
  "year": 2001,
  "date": "2022-06-23",
  "shelf": "want",
  "genres": [
   "Psychology & self",
   "Business & product"
  ]
 },
 {
  "id": "60726415",
  "title": "Don't Believe Everything You Think",
  "author": "Joseph Nguyen",
  "coverId": 15260462,
  "year": 2022,
  "date": "2022-06-14",
  "shelf": "want",
  "genres": [
   "Psychology & self"
  ]
 },
 {
  "id": "375802",
  "title": "Ender’s Game",
  "author": "Orson Scott Card",
  "isbn": "9780812550702",
  "coverId": 12996033,
  "year": 1985,
  "date": "2022-06-12",
  "shelf": "want",
  "genres": [
   "Fantasy & sci-fi",
   "Children's"
  ]
 },
 {
  "id": "15823480",
  "title": "Anna Karenina",
  "author": "Leo Tolstoy",
  "isbn": "9780345803924",
  "coverId": 7740257,
  "year": 2012,
  "date": "2022-06-08",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "15811554",
  "title": "Honor",
  "author": "Elif Shafak",
  "isbn": "9780670784837",
  "coverId": 12182328,
  "year": 2013,
  "date": "2022-06-08",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "17910144",
  "title": "Talk Like TED",
  "author": "Carmine Gallo",
  "isbn": "9781250041128",
  "coverId": 7316010,
  "year": 2014,
  "date": "2022-06-05",
  "shelf": "want",
  "genres": [
   "Business & product",
   "History & ideas"
  ]
 },
 {
  "id": "20995",
  "title": "The Art of Seduction",
  "author": "Robert Greene",
  "isbn": "9781861977694",
  "coverId": 917840,
  "year": 2001,
  "date": "2022-06-05",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "242530",
  "title": "The Hero's Journey",
  "author": "Joseph Campbell",
  "isbn": "9781577314042",
  "coverId": 832567,
  "year": 1990,
  "date": "2022-06-05",
  "shelf": "want"
 },
 {
  "id": "56332351",
  "title": "Cracking the PM Career",
  "author": "Jackie Bavaro",
  "isbn": "9780984782895",
  "coverId": 10669886,
  "year": 2021,
  "date": "2022-05-31",
  "shelf": "want",
  "genres": [
   "Business & product"
  ]
 },
 {
  "id": "80396",
  "title": "Psychology",
  "author": "William James",
  "isbn": "9780486416045",
  "coverId": 153443,
  "year": 1892,
  "date": "2022-05-07",
  "shelf": "want",
  "genres": [
   "Psychology & self"
  ]
 },
 {
  "id": "236093",
  "title": "The Wonderful Wizard of Oz",
  "author": "L. Frank Baum",
  "isbn": "9780140621679",
  "coverId": 552443,
  "year": 1899,
  "date": "2022-04-27",
  "shelf": "want",
  "genres": [
   "Classics",
   "Fantasy & sci-fi",
   "Poetry & drama",
   "Children's"
  ]
 },
 {
  "id": "6310",
  "title": "Charlie and the Chocolate Factory",
  "author": "Roald Dahl",
  "isbn": "9780142403884",
  "coverId": 12459564,
  "year": 1964,
  "date": "2022-04-27",
  "shelf": "want",
  "genres": [
   "Fantasy & sci-fi",
   "Children's"
  ]
 },
 {
  "id": "49552",
  "title": "The Stranger",
  "author": "Albert Camus",
  "year": 1980,
  "date": "2022-04-27",
  "shelf": "want"
 },
 {
  "id": "48727813",
  "title": "She Who Became the Sun",
  "author": "Shelley Parker-Chan",
  "isbn": "9781250621795",
  "coverId": 10609174,
  "year": 2021,
  "date": "2022-04-27",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "318431",
  "title": "Long Walk to Freedom",
  "author": "Nelson Mandela",
  "isbn": "9780316548182",
  "coverId": 12702407,
  "year": 1994,
  "date": "2022-04-27",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "4894",
  "title": "Who Moved My Cheese?",
  "author": "Spencer Johnson",
  "isbn": "9780091883768",
  "coverId": 258839,
  "year": 1998,
  "date": "2022-04-27",
  "shelf": "want",
  "genres": [
   "Children's"
  ]
 },
 {
  "id": "19380",
  "title": "Candide",
  "author": "Voltaire",
  "isbn": "9780486266893",
  "coverId": 12736044,
  "year": 1746,
  "date": "2022-04-24",
  "shelf": "want",
  "genres": [
   "Classics"
  ]
 },
 {
  "id": "87985",
  "title": "A Soldier of the Great War",
  "author": "Mark Helprin",
  "isbn": "9780156031134",
  "coverId": 8309740,
  "year": 1920,
  "date": "2022-04-16",
  "shelf": "want",
  "genres": [
   "Classics"
  ]
 },
 {
  "id": "2153780",
  "title": "Hold Me Tight",
  "author": "Sue Johnson",
  "isbn": "9780316113007",
  "coverId": 2379203,
  "year": 2008,
  "date": "2022-04-13",
  "shelf": "want",
  "genres": [
   "Psychology & self"
  ]
 },
 {
  "id": "1303",
  "title": "The 48 Laws of Power",
  "author": "Robert Greene",
  "isbn": "9780140280197",
  "coverId": 6424160,
  "year": 1998,
  "date": "2022-04-13",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "13099738",
  "title": "Steal Like an Artist",
  "author": "Austin Kleon",
  "isbn": "9780761169253",
  "coverId": 7244512,
  "year": 2012,
  "date": "2022-04-13",
  "shelf": "want"
 },
 {
  "id": "4898",
  "title": "Blue Ocean Strategy",
  "author": "W. Chan Kim",
  "isbn": "9781591396192",
  "coverId": 8219313,
  "year": 2005,
  "date": "2022-04-13",
  "shelf": "want",
  "genres": [
   "Business & product"
  ]
 },
 {
  "id": "17245",
  "title": "Dracula",
  "author": "Bram Stoker",
  "isbn": "9780393970128",
  "coverId": 12216503,
  "year": 1897,
  "date": "2022-04-11",
  "shelf": "want",
  "genres": [
   "Classics",
   "Fantasy & sci-fi",
   "Poetry & drama"
  ]
 },
 {
  "id": "35031085",
  "title": "Frankenstein",
  "author": "Mary Wollstonecraft Shelley",
  "isbn": "9780143131847",
  "coverId": 7267770,
  "year": 1818,
  "date": "2022-04-11",
  "shelf": "want",
  "genres": [
   "Classics"
  ]
 },
 {
  "id": "168642",
  "title": "In Cold Blood",
  "author": "Truman Capote",
  "isbn": "9780679745587",
  "coverId": 228066,
  "year": 1965,
  "date": "2022-04-11",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "6514",
  "title": "The Bell Jar",
  "author": "Sylvia Plath",
  "coverId": 8477115,
  "year": 1948,
  "date": "2022-04-11",
  "shelf": "want",
  "genres": [
   "Classics",
   "Poetry & drama",
   "Children's"
  ]
 },
 {
  "id": "41881472",
  "title": "The Psychology of Money",
  "author": "Morgan Housel",
  "coverId": 10389354,
  "year": 2020,
  "date": "2022-04-02",
  "shelf": "want",
  "genres": [
   "Psychology & self",
   "Business & product",
   "History & ideas"
  ]
 },
 {
  "id": "28787203",
  "title": "Ikigai",
  "author": "Héctor García",
  "coverId": 11300391,
  "year": 2016,
  "date": "2022-03-28",
  "shelf": "want",
  "genres": [
   "Psychology & self"
  ]
 },
 {
  "id": "57328582",
  "title": "Empowered",
  "author": "Vee Kativhu",
  "year": 2021,
  "date": "2022-03-17",
  "shelf": "want"
 },
 {
  "id": "54493401",
  "title": "Project Hail Mary",
  "author": "Andy Weir",
  "isbn": "9780593135204",
  "coverId": 11200092,
  "year": 2021,
  "date": "2022-03-17",
  "shelf": "want",
  "genres": [
   "Fantasy & sci-fi"
  ]
 },
 {
  "id": "128029",
  "title": "A Thousand Splendid Suns",
  "author": "Khaled Hosseini",
  "isbn": "9781594489501",
  "coverId": 8579790,
  "year": 2007,
  "date": "2022-03-13",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "195762",
  "title": "The Essential Epicurus",
  "author": "Epicurus",
  "isbn": "9780879758103",
  "coverId": 675974,
  "year": 1993,
  "date": "2022-03-06",
  "shelf": "want",
  "genres": [
   "History & ideas"
  ]
 },
 {
  "id": "10534",
  "title": "The Art of War",
  "author": "Sun Tzu",
  "coverId": 4849549,
  "year": 1900,
  "date": "2022-03-06",
  "shelf": "want",
  "genres": [
   "Classics"
  ]
 },
 {
  "id": "67896",
  "title": "Tao Te Ching",
  "author": "Lao Tzu",
  "isbn": "9780679724346",
  "coverId": 662232,
  "year": 1842,
  "date": "2022-03-06",
  "shelf": "want",
  "genres": [
   "Classics",
   "Children's"
  ]
 },
 {
  "id": "18288",
  "title": "Critique of Pure Reason",
  "author": "Immanuel Kant",
  "isbn": "9780521657297",
  "coverId": 8462052,
  "year": 1999,
  "date": "2022-03-06",
  "shelf": "want"
 },
 {
  "id": "78159",
  "title": "Story of Civilization",
  "author": "Will Durant",
  "isbn": "9781567310238",
  "coverId": 15070150,
  "year": 1935,
  "date": "2022-03-06",
  "shelf": "want",
  "genres": [
   "History & ideas"
  ]
 },
 {
  "id": "31795",
  "title": "The Story of Philosophy",
  "author": "Will Durant",
  "isbn": "9780671739164",
  "coverId": 405360,
  "year": 1926,
  "date": "2022-03-06",
  "shelf": "want",
  "genres": [
   "Classics"
  ]
 },
 {
  "id": "27036528",
  "title": "Ego Is the Enemy",
  "author": "Ryan Holiday",
  "isbn": "9781591847816",
  "coverId": 12447129,
  "year": 2016,
  "date": "2022-03-01",
  "shelf": "want",
  "genres": [
   "Psychology & self",
   "Business & product"
  ]
 },
 {
  "id": "39999",
  "title": "The Boy in the Striped Pajamas",
  "author": "John Boyne",
  "isbn": "9780385751070",
  "coverId": 12720687,
  "year": 2006,
  "date": "2022-02-28",
  "shelf": "want",
  "genres": [
   "Poetry & drama",
   "Children's"
  ]
 },
 {
  "id": "56450",
  "title": "Trickster Makes This World",
  "author": "Lewis Hyde",
  "isbn": "9780865475366",
  "coverId": 223529,
  "year": 1997,
  "date": "2022-02-24",
  "shelf": "want"
 },
 {
  "id": "38447",
  "title": "The Handmaid’s Tale",
  "author": "Margaret Atwood",
  "isbn": "9780385490818",
  "coverId": 8231851,
  "year": 1985,
  "date": "2022-02-20",
  "shelf": "want",
  "genres": [
   "Fantasy & sci-fi"
  ]
 },
 {
  "id": "102868",
  "title": "A Study in Scarlet",
  "author": "Arthur Conan Doyle",
  "isbn": "9781420925531",
  "coverId": 13405534,
  "year": 1887,
  "date": "2022-02-20",
  "shelf": "want",
  "genres": [
   "Classics",
   "Children's"
  ]
 },
 {
  "id": "7126",
  "title": "The Count of Monte Cristo",
  "author": "Alexandre Dumas",
  "isbn": "9780140449266",
  "coverId": 14566393,
  "year": 1830,
  "date": "2022-02-20",
  "shelf": "want",
  "genres": [
   "Classics",
   "Poetry & drama"
  ]
 },
 {
  "id": "40629898",
  "title": "The Power of Attachment",
  "author": "Diane Poole Heller",
  "isbn": "9781622038251",
  "coverId": 12291587,
  "year": 2019,
  "date": "2022-02-15",
  "shelf": "want"
 },
 {
  "id": "9547888",
  "title": "Attached",
  "author": "Amir Levine",
  "isbn": "9781585428489",
  "coverId": 8620497,
  "year": 2010,
  "date": "2022-02-15",
  "shelf": "want",
  "genres": [
   "Psychology & self"
  ]
 },
 {
  "id": "36072",
  "title": "The 7 Habits of Highly Effective People",
  "author": "Stephen R. Covey",
  "isbn": "9780743269513",
  "coverId": 10079937,
  "year": 1989,
  "date": "2022-02-10",
  "shelf": "want",
  "genres": [
   "Psychology & self",
   "Business & product"
  ]
 },
 {
  "id": "36794080",
  "title": "Think Again",
  "author": "Walter Sinnott-Armstrong",
  "isbn": "9780190627119",
  "year": 2018,
  "date": "2022-02-03",
  "shelf": "want"
 },
 {
  "id": "18774981",
  "title": "Waking Up",
  "author": "Sam Harris",
  "isbn": "9781451636017",
  "coverId": 7311247,
  "year": 2014,
  "date": "2022-02-03",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "52578297",
  "title": "The Midnight Library",
  "author": "Matt Haig",
  "isbn": "9780525559474",
  "coverId": 10313767,
  "year": 2020,
  "date": "2022-01-29",
  "shelf": "want",
  "genres": [
   "Fantasy & sci-fi"
  ]
 },
 {
  "id": "43565368",
  "title": "Good Habits, Bad Habits",
  "author": "Wendy Wood",
  "isbn": "9781250159076",
  "coverId": 8980978,
  "year": 2019,
  "date": "2022-01-27",
  "shelf": "want",
  "genres": [
   "Psychology & self"
  ]
 },
 {
  "id": "55145261",
  "title": "The Anthropocene Reviewed",
  "author": "John Green",
  "isbn": "9780525555216",
  "coverId": 11426520,
  "year": 2019,
  "date": "2022-01-06",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "54968118",
  "title": "The Code Breaker",
  "author": "Walter Isaacson",
  "isbn": "9781982115852",
  "coverId": 10675496,
  "year": 2001,
  "date": "2021-12-15",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "40102",
  "title": "Blink",
  "author": "Malcolm Gladwell",
  "isbn": "9780316010665",
  "coverId": 14421850,
  "year": 2004,
  "date": "2021-12-15",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "91950",
  "title": "The Myth of Sisyphus",
  "author": "Albert Camus",
  "coverId": 12726570,
  "year": 1955,
  "date": "2021-12-10",
  "shelf": "want",
  "genres": [
   "History & ideas"
  ]
 },
 {
  "id": "19243347",
  "title": "Cracking the PM Interview",
  "author": "Gayle Laakmann McDowell",
  "isbn": "9780984782819",
  "coverId": 7793723,
  "year": 2013,
  "date": "2021-12-07",
  "shelf": "want",
  "genres": [
   "Business & product"
  ]
 },
 {
  "id": "754272",
  "title": "The Birth of Tragedy",
  "author": "Friedrich Nietzsche",
  "isbn": "9781594625855",
  "coverId": 1010784,
  "year": 1872,
  "date": "2021-11-18",
  "shelf": "want",
  "genres": [
   "Classics",
   "Poetry & drama",
   "History & ideas"
  ]
 },
 {
  "id": "174713",
  "title": "The Lessons of History",
  "author": "Will Durant",
  "isbn": "9781567310245",
  "coverId": 7240225,
  "year": 1968,
  "date": "2021-11-05",
  "shelf": "want",
  "genres": [
   "History & ideas"
  ]
 },
 {
  "id": "7776209",
  "title": "The Rational Optimist",
  "author": "Matt Ridley",
  "isbn": "9780061452055",
  "coverId": 7024445,
  "year": 2010,
  "date": "2021-11-05",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "50794221",
  "title": "A Corruption of Blood",
  "author": "Ambrose Parry",
  "year": 2021,
  "date": "2021-09-04",
  "shelf": "want"
 },
 {
  "id": "56771617",
  "title": "The Lost Storyteller",
  "author": "Amanda Block",
  "isbn": "9781529360783",
  "coverId": 12440722,
  "year": 2021,
  "date": "2021-09-04",
  "shelf": "want"
 },
 {
  "id": "35210",
  "title": "How to Talk to Anyone",
  "author": "Leil Lowndes",
  "isbn": "9780071418584",
  "coverId": 58950,
  "year": 1999,
  "date": "2021-08-22",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "4865",
  "title": "How to Win Friends & Influence People",
  "author": "Dale Carnegie",
  "coverId": 13314878,
  "year": 1936,
  "date": "2021-08-22",
  "shelf": "want",
  "genres": [
   "Psychology & self",
   "Business & product",
   "History & ideas"
  ]
 },
 {
  "id": "34921573",
  "title": "Lost Connections",
  "author": "Johann Hari",
  "isbn": "9781632868305",
  "coverId": 8838533,
  "year": 2018,
  "date": "2021-08-17",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "50485582",
  "title": "The Precipice",
  "author": "Toby Ord",
  "isbn": "9781526600219",
  "coverId": 9386888,
  "year": 2020,
  "date": "2021-08-17",
  "shelf": "want"
 },
 {
  "id": "38651604",
  "title": "The Ape that Understood the Universe",
  "author": "Steve Stewart-Williams",
  "isbn": "9781108425049",
  "coverId": 9232811,
  "year": 2018,
  "date": "2021-08-17",
  "shelf": "want"
 },
 {
  "id": "168668",
  "title": "Catch-22",
  "author": "Joseph Heller",
  "isbn": "9780684833392",
  "coverId": 6468653,
  "year": 1961,
  "date": "2021-08-07",
  "shelf": "want",
  "genres": [
   "Literary fiction",
   "Poetry & drama"
  ]
 },
 {
  "id": "656",
  "title": "War and Peace",
  "author": "Leo Tolstoy",
  "isbn": "9780192833983",
  "coverId": 12621906,
  "year": 1845,
  "date": "2021-08-07",
  "shelf": "want",
  "genres": [
   "Classics"
  ]
 },
 {
  "id": "10483171",
  "title": "The Beginning of Infinity",
  "author": "David Deutsch",
  "isbn": "9780670022755",
  "coverId": 8622269,
  "year": 2008,
  "date": "2021-08-03",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "44308000",
  "title": "Om falsk och äkta liberalism",
  "author": "Lena Andersson",
  "isbn": "9789198166033",
  "date": "2021-07-26",
  "shelf": "want"
 },
 {
  "id": "53319528",
  "title": "Non zero. De logica van de menselijke bestemming",
  "author": "Robert Wright",
  "isbn": "9789027472762",
  "date": "2021-06-28",
  "shelf": "want"
 },
 {
  "id": "29283884",
  "title": "The Gentleman's Guide to Vice and Virtue",
  "author": "Mackenzi Lee",
  "isbn": "9780062382801",
  "coverId": 8367802,
  "year": 2017,
  "date": "2021-06-25",
  "shelf": "want",
  "genres": [
   "Queer stories",
   "Children's"
  ]
 },
 {
  "id": "1319",
  "title": "The War of Art",
  "author": "Steven Pressfield",
  "coverId": 288439,
  "year": 2002,
  "date": "2021-06-23",
  "shelf": "want"
 },
 {
  "id": "10883",
  "title": "Benjamin Franklin",
  "author": "Walter Isaacson",
  "isbn": "9780743258074",
  "coverId": 541092,
  "year": 2003,
  "date": "2021-06-23",
  "shelf": "want",
  "genres": [
   "Memoir",
   "History & ideas"
  ]
 },
 {
  "id": "12857",
  "title": "The Gambler",
  "author": "Fyodor Dostoevsky",
  "coverId": 9412633,
  "year": 1914,
  "date": "2021-06-15",
  "shelf": "want",
  "genres": [
   "Classics"
  ]
 },
 {
  "id": "4934",
  "title": "The Brothers Karamazov",
  "author": "Fyodor Dostoevsky",
  "isbn": "9780374528379",
  "coverId": 8272336,
  "year": 1880,
  "date": "2021-06-15",
  "shelf": "want",
  "genres": [
   "Classics"
  ]
 },
 {
  "id": "312596",
  "title": "For Your Own Good",
  "author": "Alice Miller",
  "isbn": "9780374518592",
  "coverId": 5408774,
  "year": 1983,
  "date": "2021-06-15",
  "shelf": "want",
  "genres": [
   "Psychology & self"
  ]
 },
 {
  "id": "561909",
  "title": "The Hiding Place",
  "author": "Corrie ten Boom",
  "isbn": "9780553256697",
  "coverId": 12817925,
  "year": 1971,
  "date": "2021-06-15",
  "shelf": "want",
  "genres": [
   "Memoir",
   "History & ideas"
  ]
 },
 {
  "id": "37934304",
  "title": "Donuteconomie",
  "author": "Kate Raworth",
  "isbn": "9789046823187",
  "year": 2017,
  "date": "2021-06-14",
  "shelf": "want"
 },
 {
  "id": "12000020",
  "title": "Aristotle and Dante Discover the Secrets of the Universe",
  "author": "Benjamin Alire Sáenz",
  "isbn": "9781442408920",
  "coverId": 12313804,
  "year": 2012,
  "date": "2021-06-13",
  "shelf": "want",
  "genres": [
   "Queer stories",
   "Children's"
  ]
 },
 {
  "id": "36336078",
  "title": "Call Me By Your Name",
  "author": "André Aciman",
  "coverId": 11123807,
  "year": 2007,
  "date": "2021-06-13",
  "shelf": "want",
  "genres": [
   "Literary fiction",
   "Queer stories"
  ]
 },
 {
  "id": "12172",
  "title": "Memoirs of Hadrian",
  "author": "Marguerite Yourcenar",
  "isbn": "9780374529260",
  "coverId": 1003164,
  "year": 1951,
  "date": "2021-06-13",
  "shelf": "want",
  "genres": [
   "Literary fiction",
   "Queer stories"
  ]
 },
 {
  "id": "7336",
  "title": "J.R.R. Tolkien",
  "author": "Humphrey Carpenter",
  "isbn": "9780618057023",
  "coverId": 3327791,
  "year": 1977,
  "date": "2021-06-09",
  "shelf": "want",
  "genres": [
   "Fantasy & sci-fi"
  ]
 },
 {
  "id": "597790",
  "title": "The Children of Húrin",
  "author": "J.R.R. Tolkien",
  "isbn": "9780007246229",
  "coverId": 8220298,
  "year": 2001,
  "date": "2021-06-09",
  "shelf": "want",
  "genres": [
   "Fantasy & sci-fi"
  ]
 },
 {
  "id": "52090",
  "title": "Eichmann in Jerusalem",
  "author": "Hannah Arendt",
  "coverId": 97789,
  "year": 1963,
  "date": "2021-06-08",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "127227",
  "title": "The Human Condition",
  "author": "Hannah Arendt",
  "isbn": "9780226025988",
  "coverId": 5746840,
  "year": 1958,
  "date": "2021-06-08",
  "shelf": "want",
  "genres": [
   "History & ideas"
  ]
 },
 {
  "id": "396931",
  "title": "The Origins of Totalitarianism",
  "author": "Hannah Arendt",
  "coverId": 10793645,
  "year": 1951,
  "date": "2021-06-08",
  "shelf": "want",
  "genres": [
   "History & ideas"
  ]
 },
 {
  "id": "55502856",
  "title": "Framers",
  "author": "Kenneth Cukier",
  "isbn": "9780593182598",
  "coverId": 11274436,
  "year": 2021,
  "date": "2021-06-08",
  "shelf": "want",
  "genres": [
   "Psychology & self"
  ]
 },
 {
  "id": "149267",
  "title": "The Stand",
  "author": "Stephen King",
  "coverId": 9255992,
  "year": 1978,
  "date": "2021-06-08",
  "shelf": "want",
  "genres": [
   "Fantasy & sci-fi"
  ]
 },
 {
  "id": "183033",
  "title": "A Brief History of Neoliberalism",
  "author": "David Harvey",
  "isbn": "9780199283279",
  "coverId": 133834,
  "year": 2005,
  "date": "2021-06-07",
  "shelf": "want",
  "genres": [
   "Business & product",
   "History & ideas"
  ]
 },
 {
  "id": "16299",
  "title": "And Then There Were None",
  "author": "Agatha Christie",
  "isbn": "9780312330873",
  "coverId": 11172296,
  "year": 1939,
  "date": "2021-06-07",
  "shelf": "want",
  "genres": [
   "Classics"
  ]
 },
 {
  "id": "9854",
  "title": "The End of Poverty",
  "author": "Jeffrey D. Sachs",
  "isbn": "9780143036586",
  "coverId": 452515,
  "year": 2005,
  "date": "2021-06-07",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "28257707",
  "title": "The Subtle Art of Not Giving a F*ck",
  "author": "Mark Manson",
  "isbn": "9798804636129",
  "coverId": 8231990,
  "year": 2016,
  "date": "2021-06-07",
  "shelf": "want",
  "genres": [
   "Psychology & self",
   "History & ideas"
  ]
 },
 {
  "id": "49628",
  "title": "Cloud Atlas",
  "author": "David Mitchell",
  "isbn": "9780375507250",
  "coverId": 6714077,
  "year": 2004,
  "date": "2021-06-07",
  "shelf": "want",
  "genres": [
   "Fantasy & sci-fi"
  ]
 },
 {
  "id": "40164661",
  "title": "The Business of Changing the World",
  "author": "Raj Kumar",
  "isbn": "9780807059579",
  "coverId": 8806698,
  "year": 2019,
  "date": "2021-06-07",
  "shelf": "want",
  "genres": [
   "Business & product",
   "History & ideas"
  ]
 },
 {
  "id": "3836",
  "title": "Don Quixote",
  "author": "Miguel de Cervantes Saavedra",
  "year": 2020,
  "date": "2021-06-07",
  "shelf": "want"
 },
 {
  "id": "51858470",
  "title": "Go Big",
  "author": "Ed Miliband",
  "isbn": "9781847926241",
  "coverId": 15220685,
  "year": 2020,
  "date": "2021-06-07",
  "shelf": "want",
  "genres": [
   "History & ideas"
  ]
 },
 {
  "id": "9507278",
  "title": "The Complete Works of Edgar Allan Poe",
  "author": "Edgar Allan Poe",
  "isbn": "9781453744512",
  "coverId": 10360523,
  "year": 2010,
  "date": "2021-06-06",
  "shelf": "want"
 },
 {
  "id": "100165",
  "title": "The Moral Animal",
  "author": "Robert Wright",
  "isbn": "9780349107042",
  "coverId": 212779,
  "year": 1994,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Psychology & self"
  ]
 },
 {
  "id": "43792660",
  "title": "Surely You`re Joking, Mr. Feynman!",
  "author": "Richard P. Feynman",
  "isbn": "9785170728817",
  "year": 1985,
  "date": "2021-06-06",
  "shelf": "want"
 },
 {
  "id": "7144",
  "title": "Crime and Punishment",
  "author": "Fyodor Dostoevsky",
  "coverId": 13116014,
  "year": 1941,
  "date": "2021-06-06",
  "shelf": "want"
 },
 {
  "id": "24583",
  "title": "The Adventures of Tom Sawyer",
  "author": "Mark Twain",
  "isbn": "9780143039563",
  "coverId": 12043351,
  "year": 1817,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Classics",
   "Children's"
  ]
 },
 {
  "id": "2956",
  "title": "The Adventures of Huckleberry Finn",
  "author": "Mark Twain",
  "isbn": "9780142437179",
  "coverId": 8157718,
  "year": 1876,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Classics",
   "Children's"
  ]
 },
 {
  "id": "70561",
  "title": "The Gulag Archipelago 1918–1956 (Abridged)",
  "author": "Aleksandr Solzhenitsyn",
  "isbn": "9780060007768",
  "coverId": 12715912,
  "year": 1970,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Classics"
  ]
 },
 {
  "id": "30659",
  "title": "Meditations",
  "author": "Marcus Aurelius",
  "isbn": "9780140449334",
  "coverId": 211529,
  "year": 1626,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Classics"
  ]
 },
 {
  "id": "10959",
  "title": "Sophie’s World",
  "author": "Jostein Gaarder",
  "isbn": "9781857993288",
  "coverId": 223463,
  "year": 1991,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Children's"
  ]
 },
 {
  "id": "4671",
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "isbn": "9780743273565",
  "coverId": 10590366,
  "year": 1920,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Classics",
   "Poetry & drama",
   "Children's"
  ]
 },
 {
  "id": "61535",
  "title": "The Selfish Gene",
  "author": "Richard Dawkins",
  "isbn": "9780199291151",
  "coverId": 133936,
  "year": 1976,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "1842",
  "title": "Guns, Germs, and Steel",
  "author": "Jared Diamond",
  "isbn": "9780739467350",
  "coverId": 7884018,
  "year": 1997,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "History & ideas"
  ]
 },
 {
  "id": "5297",
  "title": "The Picture of Dorian Gray",
  "author": "Oscar Wilde",
  "coverId": 14314858,
  "year": 1890,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Classics",
   "Queer stories",
   "Fantasy & sci-fi",
   "Poetry & drama"
  ]
 },
 {
  "id": "56302573",
  "title": "Farenheit 451",
  "author": "Ray Bradbury",
  "year": 1963,
  "date": "2021-06-06",
  "shelf": "want"
 },
 {
  "id": "55224372",
  "title": "Dottern",
  "author": "Lena Andersson",
  "isbn": "9789177952787",
  "year": 2020,
  "date": "2021-06-06",
  "shelf": "want"
 },
 {
  "id": "39109459",
  "title": "Sveas son",
  "author": "Lena Andersson",
  "isbn": "9789177950158",
  "year": 2018,
  "date": "2021-06-06",
  "shelf": "want"
 },
 {
  "id": "22601256",
  "title": "Utan personligt ansvar",
  "author": "Lena Andersson",
  "isbn": "9789127139961",
  "year": 2014,
  "date": "2021-06-06",
  "shelf": "want"
 },
 {
  "id": "43723901",
  "title": "Lifespan",
  "author": "David A. Sinclair",
  "isbn": "9781501191978",
  "coverId": 8780421,
  "year": 2019,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "920151",
  "title": "The Man Who Invented Fidel",
  "author": "Anthony DePalma",
  "isbn": "9781586483326",
  "coverId": 852954,
  "year": 2006,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Memoir"
  ]
 },
 {
  "id": "43306206",
  "title": "The Courage to Be Disliked",
  "author": "Ichiro Kishimi",
  "year": 2013,
  "date": "2021-06-06",
  "shelf": "want"
 },
 {
  "id": "479572",
  "title": "Anarchy, State, and Utopia",
  "author": "Robert Nozick",
  "isbn": "9780465097203",
  "coverId": 3086752,
  "year": 1974,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "History & ideas"
  ]
 },
 {
  "id": "56696339",
  "title": "The Power of Geography",
  "author": "Tim Marshall",
  "isbn": "9781783965373",
  "coverId": 11559287,
  "year": 2021,
  "date": "2021-06-06",
  "shelf": "want"
 },
 {
  "id": "21083719",
  "title": "Human Universe",
  "author": "Brian Cox",
  "isbn": "9780007488803",
  "coverId": 9380330,
  "year": 2014,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "History & ideas"
  ]
 },
 {
  "id": "83518",
  "title": "The Singularity is Near",
  "author": "Ray Kurzweil",
  "isbn": "9780143037880",
  "coverId": 400518,
  "year": 2005,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "48019",
  "title": "The Effective Executive",
  "author": "Peter F. Drucker",
  "isbn": "9780060833459",
  "coverId": 4941284,
  "year": 1967,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "18077875",
  "title": "Essentialism",
  "author": "Greg McKeown",
  "isbn": "9780804137386",
  "coverId": 7285986,
  "year": 2014,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Psychology & self",
   "History & ideas"
  ]
 },
 {
  "id": "8520610",
  "title": "Quiet",
  "author": "Susan Cain",
  "isbn": "9780307352149",
  "coverId": 7079753,
  "year": 2012,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "522525",
  "title": "Mistakes Were Made (But Not by Me)",
  "author": "Carol Tavris",
  "isbn": "9780151010981",
  "coverId": 1119860,
  "year": 2007,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Psychology & self",
   "History & ideas"
  ]
 },
 {
  "id": "25614523",
  "title": "Originals",
  "author": "Adam M. Grant",
  "isbn": "9780525429562",
  "coverId": 8237054,
  "year": 2001,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "16158498",
  "title": "Give and Take",
  "author": "Adam M. Grant",
  "isbn": "9780670026555",
  "coverId": 7391212,
  "year": 2013,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "18668059",
  "title": "The Obstacle Is the Way",
  "author": "Ryan Holiday",
  "isbn": "9781591846352",
  "coverId": 14428233,
  "year": 2013,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Psychology & self",
   "Business & product",
   "History & ideas"
  ]
 },
 {
  "id": "243685",
  "title": "A History of Western Philosophy",
  "author": "Bertrand Russell",
  "isbn": "9780671201586",
  "coverId": 405359,
  "year": 1945,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "History & ideas"
  ]
 },
 {
  "id": "15658",
  "title": "Strangers to Ourselves",
  "author": "Timothy D. Wilson",
  "isbn": "9780674013827",
  "coverId": 412250,
  "year": 2002,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Psychology & self",
   "History & ideas"
  ]
 },
 {
  "id": "1202",
  "title": "Freakonomics",
  "author": "Steven D. Levitt",
  "isbn": "9780061234002",
  "coverId": 11172914,
  "year": 2005,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "52036",
  "title": "Siddhartha",
  "author": "Hermann Hesse",
  "coverId": 6562535,
  "year": 1922,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Classics"
  ]
 },
 {
  "id": "29093292",
  "title": "The Daily Stoic",
  "author": "Ryan Holiday",
  "coverId": 13098570,
  "year": 2016,
  "date": "2021-06-06",
  "shelf": "want"
 },
 {
  "id": "24878857",
  "title": "Postcapitalism",
  "author": "Paul Mason",
  "isbn": "9781846147388",
  "coverId": 8148854,
  "year": 2015,
  "date": "2021-06-06",
  "shelf": "want"
 },
 {
  "id": "670089",
  "title": "The Fourth Turning",
  "author": "William Strauss",
  "isbn": "9780767900461",
  "coverId": 367879,
  "year": 1996,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "100247",
  "title": "Vagabonding",
  "author": "Rolf Potts",
  "isbn": "9780812992182",
  "coverId": 9283857,
  "year": 2002,
  "date": "2021-06-06",
  "shelf": "want"
 },
 {
  "id": "13187824",
  "title": "Abundance",
  "author": "Peter H. Diamandis",
  "isbn": "9781451614213",
  "coverId": 7105433,
  "year": 2012,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "22609444",
  "title": "Bold",
  "author": "Peter H. Diamandis",
  "isbn": "9781476709567",
  "coverId": 7341911,
  "year": 1905,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Business & product",
   "History & ideas"
  ]
 },
 {
  "id": "40121378",
  "title": "Atomic Habits",
  "author": "James Clear",
  "coverId": 12539702,
  "year": 2016,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Psychology & self",
   "Business & product",
   "History & ideas"
  ]
 },
 {
  "id": "55539565",
  "title": "Think Again",
  "author": "Adam M. Grant",
  "isbn": "9781984878106",
  "coverId": 10470266,
  "year": 2021,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "7108725",
  "title": "Start with Why",
  "author": "Simon Sinek",
  "isbn": "9781591842804",
  "coverId": 6395237,
  "year": 2009,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "50892125",
  "title": "The Gift",
  "author": "Edith Eger",
  "isbn": "9781982143091",
  "coverId": 10340794,
  "year": 2020,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Memoir",
   "Psychology & self"
  ]
 },
 {
  "id": "4122",
  "title": "Built to Last",
  "author": "Jim Collins",
  "isbn": "9780060566104",
  "coverId": 684195,
  "year": 1994,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Business & product",
   "History & ideas"
  ]
 },
 {
  "id": "49099937",
  "title": "No Rules Rules",
  "author": "Reed Hastings",
  "isbn": "9780593152386",
  "coverId": 10524294,
  "year": 2020,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Business & product",
   "History & ideas"
  ]
 },
 {
  "id": "18077903",
  "title": "Creativity, Inc.",
  "author": "Ed Catmull",
  "isbn": "9780812993011",
  "coverId": 13124793,
  "year": 2001,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "34684622",
  "title": "Leonardo da Vinci",
  "author": "Walter Isaacson",
  "isbn": "9781501139154",
  "coverId": 8087691,
  "year": 2017,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "39074555",
  "title": "Blueprint",
  "author": "Robert Plomin",
  "isbn": "9780241282076",
  "coverId": 13872897,
  "year": 2018,
  "date": "2021-06-06",
  "shelf": "want"
 },
 {
  "id": "39863499",
  "title": "How to Think Like a Roman Emperor",
  "author": "Donald J. Robertson",
  "coverId": 8802189,
  "year": 2019,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Memoir",
   "History & ideas"
  ]
 },
 {
  "id": "55042283",
  "title": "Populista",
  "author": "Will Grant",
  "coverId": 13638969,
  "year": 2021,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Business & product",
   "History & ideas"
  ]
 },
 {
  "id": "10884",
  "title": "Einstein",
  "author": "Walter Isaacson",
  "isbn": "9780743264730",
  "coverId": 474440,
  "year": 2007,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "245344",
  "title": "Structures",
  "author": "J.E. Gordon",
  "isbn": "9780306812835",
  "coverId": 164385,
  "year": 1981,
  "date": "2021-06-06",
  "shelf": "want"
 },
 {
  "id": "23425",
  "title": "Status Anxiety",
  "author": "Alain de Botton",
  "isbn": "9780375725357",
  "coverId": 6565547,
  "year": 2005,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Psychology & self"
  ]
 },
 {
  "id": "37858",
  "title": "Sources of the Self",
  "author": "Charles Margrave Taylor",
  "coverId": 5383727,
  "year": 1989,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "History & ideas",
   "Children's"
  ]
 },
 {
  "id": "26195941",
  "title": "The Age of Surveillance Capitalism",
  "author": "Shoshana Zuboff",
  "isbn": "9781610395694",
  "coverId": 8353262,
  "year": 2018,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Business & product",
   "History & ideas"
  ]
 },
 {
  "id": "15946768",
  "title": "The School of Life",
  "author": "Alain de Botton",
  "isbn": "9781447223726",
  "coverId": 9069639,
  "year": 2012,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Psychology & self"
  ]
 },
 {
  "id": "27845690",
  "title": "The Course of Love",
  "author": "Alain de Botton",
  "isbn": "9780241145470",
  "coverId": 10478046,
  "year": 2016,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "34403035",
  "title": "Sitting with Lao-Tzu",
  "author": "Andrew Beaulac",
  "isbn": "9781944769604",
  "coverId": 11094752,
  "year": 2017,
  "date": "2021-06-06",
  "shelf": "want"
 },
 {
  "id": "413179",
  "title": "The Clash of Civilizations and the Remaking of World Order",
  "author": "Samuel P. Huntington",
  "isbn": "9780684844411",
  "coverId": 472725,
  "year": 1996,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "History & ideas"
  ]
 },
 {
  "id": "5043",
  "title": "The Pillars of the Earth",
  "author": "Ken Follett",
  "isbn": "9780451222138",
  "coverId": 9269909,
  "year": 1989,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "188572",
  "title": "The Complete Sherlock Holmes",
  "author": "Arthur Conan Doyle",
  "coverId": 12501284,
  "year": 1900,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Classics",
   "Children's"
  ]
 },
 {
  "id": "662",
  "title": "Atlas Shrugged",
  "author": "Ayn Rand",
  "isbn": "9780452011878",
  "coverId": 362277,
  "year": 1936,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Classics",
   "Fantasy & sci-fi"
  ]
 },
 {
  "id": "838729",
  "title": "The Return of the King",
  "author": "J.R.R. Tolkien",
  "isbn": "9780345240347",
  "coverId": 14627062,
  "year": 1950,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Fantasy & sci-fi",
   "Children's"
  ]
 },
 {
  "id": "15241",
  "title": "The Two Towers",
  "author": "J.R.R. Tolkien",
  "isbn": "9780618346264",
  "coverId": 14627564,
  "year": 1954,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Fantasy & sci-fi",
   "Children's"
  ]
 },
 {
  "id": "5129",
  "title": "Brave New World",
  "author": "Aldous Huxley",
  "isbn": "9780060929879",
  "coverId": 8231823,
  "year": 1932,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Classics",
   "Fantasy & sci-fi"
  ]
 },
 {
  "id": "157993",
  "title": "The Little Prince",
  "author": "Antoine de Saint-Exupéry",
  "isbn": "9780152023980",
  "coverId": 10708272,
  "year": 1943,
  "date": "2021-06-06",
  "shelf": "want",
  "genres": [
   "Classics",
   "Fantasy & sci-fi",
   "Poetry & drama",
   "Children's"
  ]
 },
 {
  "id": "34272565",
  "title": "Life 3.0",
  "author": "Max Tegmark",
  "isbn": "9780451485076",
  "coverId": 10239283,
  "year": 2017,
  "date": "2018-10-15",
  "shelf": "want",
  "genres": [
   "Business & product",
   "History & ideas"
  ]
 },
 {
  "id": "36204285",
  "title": "Origin Story",
  "author": "David Christian",
  "isbn": "9780316392006",
  "year": 2018,
  "date": "2018-10-15",
  "shelf": "want",
  "genres": [
   "History & ideas"
  ]
 },
 {
  "id": "34928269",
  "title": "Capitalism without Capital",
  "author": "Jonathan Haskel",
  "isbn": "9780691175034",
  "year": 2017,
  "date": "2018-10-15",
  "shelf": "want",
  "genres": [
   "Business & product",
   "History & ideas"
  ]
 },
 {
  "id": "40961427",
  "title": "1984",
  "author": "George Orwell",
  "coverId": 8745958,
  "year": 2003,
  "date": "2018-10-09",
  "shelf": "want",
  "genres": [
   "Fantasy & sci-fi",
   "Children's"
  ]
 },
 {
  "id": "19083",
  "title": "Politics",
  "author": "Aristotle",
  "isbn": "9780486414249",
  "coverId": 1277085,
  "year": 1492,
  "date": "2018-10-09",
  "shelf": "want",
  "genres": [
   "Classics",
   "Poetry & drama",
   "History & ideas"
  ]
 },
 {
  "id": "22632",
  "title": "The Trial and Death of Socrates (Euthyphro, Apology, Crito, Phaedo)",
  "author": "Plato",
  "isbn": "9780872205543",
  "coverId": 14390287,
  "year": 1871,
  "date": "2018-10-09",
  "shelf": "want",
  "genres": [
   "Memoir",
   "History & ideas"
  ]
 },
 {
  "id": "92307",
  "title": "Being and Time",
  "author": "Martin Heidegger",
  "isbn": "9780060638504",
  "coverId": 2208564,
  "year": 1927,
  "date": "2018-10-09",
  "shelf": "want",
  "genres": [
   "Classics",
   "Poetry & drama",
   "History & ideas"
  ]
 },
 {
  "id": "19068",
  "title": "The Nicomachean Ethics",
  "author": "Aristotle",
  "isbn": "9780140449495",
  "coverId": 12593945,
  "year": 1558,
  "date": "2018-10-09",
  "shelf": "want",
  "genres": [
   "Classics",
   "History & ideas"
  ]
 },
 {
  "id": "12321",
  "title": "Beyond Good and Evil",
  "author": "Friedrich Nietzsche",
  "isbn": "9780140449235",
  "coverId": 8245356,
  "year": 1885,
  "date": "2018-10-09",
  "shelf": "want",
  "genres": [
   "Classics",
   "Poetry & drama"
  ]
 },
 {
  "id": "51893",
  "title": "Thus Spoke Zarathustra",
  "author": "Friedrich Nietzsche",
  "year": 2021,
  "date": "2018-10-09",
  "shelf": "want"
 },
 {
  "id": "30289",
  "title": "The Republic",
  "author": "Plato",
  "isbn": "9780140449143",
  "coverId": 14418448,
  "year": 1554,
  "date": "2018-10-09",
  "shelf": "want",
  "genres": [
   "Classics"
  ]
 },
 {
  "id": "386162",
  "title": "The Hitchhiker’s Guide to the Galaxy",
  "author": "Douglas Adams",
  "coverId": 12986869,
  "year": 1979,
  "date": "2018-10-09",
  "shelf": "want",
  "genres": [
   "Fantasy & sci-fi"
  ]
 },
 {
  "id": "6656",
  "title": "The Divine Comedy",
  "author": "Dante Alighieri",
  "isbn": "9780679433132",
  "coverId": 11621024,
  "year": 1472,
  "date": "2018-10-09",
  "shelf": "want",
  "genres": [
   "Classics",
   "Poetry & drama"
  ]
 },
 {
  "id": "2165",
  "title": "The Old Man and the Sea",
  "author": "Ernest Hemingway",
  "isbn": "9780684830490",
  "coverId": 463307,
  "year": 1952,
  "date": "2018-10-09",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "19063",
  "title": "The Book Thief",
  "author": "Markus Zusak",
  "coverId": 8153054,
  "year": 1998,
  "date": "2018-10-09",
  "shelf": "want",
  "genres": [
   "Children's"
  ]
 },
 {
  "id": "25698",
  "title": "An Inquiry into the Nature and Causes of the Wealth of Nations",
  "author": "Adam Smith",
  "isbn": "9780226763743",
  "coverId": 12816911,
  "year": 1776,
  "date": "2018-10-09",
  "shelf": "want",
  "genres": [
   "Classics"
  ]
 },
 {
  "id": "32191710",
  "title": "Astrophysics for People in a Hurry",
  "author": "Neil deGrasse Tyson",
  "isbn": "9780393609394",
  "coverId": 7984709,
  "year": 2017,
  "date": "2018-10-09",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "1371",
  "title": "The Iliad",
  "author": "Homer",
  "isbn": "9780140275360",
  "coverId": 9045853,
  "year": 1488,
  "date": "2018-10-09",
  "shelf": "want",
  "genres": [
   "Classics",
   "Poetry & drama",
   "Children's"
  ]
 },
 {
  "id": "1420",
  "title": "Hamlet",
  "author": "William Shakespeare",
  "isbn": "9780521618748",
  "coverId": 8281954,
  "year": 1603,
  "date": "2018-10-09",
  "shelf": "want",
  "genres": [
   "Classics",
   "Poetry & drama",
   "Children's"
  ]
 },
 {
  "id": "1381",
  "title": "The Odyssey",
  "author": "Homer",
  "isbn": "9780143039952",
  "coverId": 9045853,
  "year": 1488,
  "date": "2018-10-09",
  "shelf": "want",
  "genres": [
   "Classics",
   "Poetry & drama",
   "Children's"
  ]
 },
 {
  "id": "320",
  "title": "One Hundred Years of Solitude",
  "author": "Gabriel García Márquez",
  "year": 2007,
  "date": "2018-10-09",
  "shelf": "want",
  "genres": [
   "Literary fiction"
  ]
 },
 {
  "id": "36620738",
  "title": "The Secret Barrister",
  "author": "The Secret Barrister",
  "coverId": 10249122,
  "year": 2018,
  "date": "2018-10-09",
  "shelf": "want"
 },
 {
  "id": "485894",
  "title": "The Metamorphosis",
  "author": "Franz Kafka",
  "isbn": "9780553213690",
  "coverId": 12820198,
  "year": 1915,
  "date": "2018-10-01",
  "shelf": "want",
  "genres": [
   "Classics",
   "Fantasy & sci-fi",
   "Children's"
  ]
 },
 {
  "id": "4645",
  "title": "The Snows of Kilimanjaro and Other Stories",
  "author": "Ernest Hemingway",
  "isbn": "9780684862217",
  "coverId": 75458,
  "year": 1927,
  "date": "2018-10-01",
  "shelf": "want",
  "genres": [
   "Classics"
  ]
 }
];
