// Prototype data: the owner's real Goodreads shelves (most recent 24 read, 18 want to read).
// shortcut: the one-liners and long reviews are SAMPLE text written for the prototype (the export
// has no reviews); delete this file with the prototype surface.
export type Book = {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  year: number | null;
  date: string;
  shelf: "read" | "want";
  rating?: number | null;
  line?: string;
  review?: string;
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
    "id": "2784",
    "title": "Ways of Seeing",
    "author": "John Berger",
    "isbn": "9780140135152",
    "year": 1972,
    "date": "2026-10-12",
    "shelf": "want"
  },
  {
    "id": "61049",
    "title": "Autobiography of Red",
    "author": "Anne Carson",
    "isbn": "9780375701290",
    "year": 1998,
    "date": "2026-10-11",
    "shelf": "want"
  },
  {
    "id": "241665302",
    "title": "Where the Light Gets In",
    "author": "Ben Crowe",
    "isbn": null,
    "year": 2026,
    "date": "2026-09-24",
    "shelf": "want"
  },
  {
    "id": "40539136",
    "title": "Lie With Me",
    "author": "Philippe Besson",
    "isbn": "9781501197871",
    "year": 2017,
    "date": "2026-09-22",
    "shelf": "want"
  },
  {
    "id": "46263943",
    "title": "Real Life",
    "author": "Brandon Taylor",
    "isbn": "9780525538882",
    "year": 2020,
    "date": "2026-09-22",
    "shelf": "want"
  },
  {
    "id": "241685587",
    "title": "Life at the Speed of Play",
    "author": "Mark Pincus",
    "isbn": "9780063352575",
    "year": 2026,
    "date": "2026-09-17",
    "shelf": "want"
  },
  {
    "id": "223436601",
    "title": "Careless People",
    "author": "Sarah Wynn-Williams",
    "isbn": "9781250391230",
    "year": 2025,
    "date": "2026-08-22",
    "shelf": "want"
  },
  {
    "id": "50202953",
    "title": "Piranesi",
    "author": "Susanna Clarke",
    "isbn": null,
    "year": 2020,
    "date": "2026-07-26",
    "shelf": "want"
  },
  {
    "id": "244934769",
    "title": "The Land and Its People",
    "author": "David Sedaris",
    "isbn": "9780316264839",
    "year": 2026,
    "date": "2026-07-18",
    "shelf": "want"
  },
  {
    "id": "28921",
    "title": "The Remains of the Day",
    "author": "Kazuo Ishiguro",
    "isbn": null,
    "year": 1989,
    "date": "2026-06-03",
    "shelf": "want"
  },
  {
    "id": "25334576",
    "title": "Grief Is the Thing with Feathers",
    "author": "Max Porter",
    "isbn": "9780571323760",
    "year": 2015,
    "date": "2026-06-03",
    "shelf": "want"
  },
  {
    "id": "243596291",
    "title": "Fruit Fly",
    "author": "Josh Silver",
    "isbn": "9798892426374",
    "year": 2026,
    "date": "2026-04-30",
    "shelf": "want"
  },
  {
    "id": "246248414",
    "title": "Made In Heaven",
    "author": "Victorian Poetry",
    "isbn": "9798242342385",
    "year": 2026,
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
    "year": 2026,
    "date": "2026-03-28",
    "shelf": "want"
  },
  {
    "id": "218583908",
    "title": "Nova Scotia House",
    "author": "Charlie Porter",
    "isbn": "9781802067453",
    "year": 2025,
    "date": "2026-03-28",
    "shelf": "want"
  },
  {
    "id": "157981748",
    "title": "Supercommunicators",
    "author": "Charles Duhigg",
    "isbn": null,
    "year": 2024,
    "date": "2026-03-13",
    "shelf": "want"
  },
  {
    "id": "52283963",
    "title": "The Mom Test",
    "author": "Rob Fitzpatrick",
    "isbn": null,
    "year": 2013,
    "date": "2026-02-19",
    "shelf": "want"
  }
];
