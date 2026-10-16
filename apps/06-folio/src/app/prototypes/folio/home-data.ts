// Prototype data for Home. Popular and new releases are real Open Library lists fetched on
// 16 Oct (trending this month; 2026 English releases by reading-log count), lightly filtered.
// shortcut: the Folio picks are SAMPLE recommendations chosen by hand from the owner's taste and
// checked against their shelf; the real recommender replaces them (brief, days 2-4).
export type Pick = { id: string; title: string; author: string; coverId: number; because?: string };

export const popular: Pick[] = [
  {
    "id": "/works/OL17930368W",
    "title": "Atomic Habits",
    "author": "James Clear",
    "coverId": 12539702
  },
  {
    "id": "/works/OL1968368W",
    "title": "The 48 Laws of Power",
    "author": "Robert Greene",
    "coverId": 6424160
  },
  {
    "id": "/works/OL2010879W",
    "title": "Rich Dad, Poor Dad",
    "author": "Robert T. Kiyosaki",
    "coverId": 8315603
  },
  {
    "id": "/works/OL21640039W",
    "title": "The Psychology of Money",
    "author": "Morgan Housel",
    "coverId": 10389354
  },
  {
    "id": "/works/OL82563W",
    "title": "Harry Potter and the Philosopher's Stone",
    "author": "J. K. Rowling",
    "coverId": 15155833
  },
  {
    "id": "/works/OL1063267W",
    "title": "How to Win Friends and Influence People",
    "author": "Dale Carnegie",
    "coverId": 13314878
  },
  {
    "id": "/works/OL24178205W",
    "title": "The Love Hypothesis",
    "author": "Ali Hazelwood",
    "coverId": 10601402
  },
  {
    "id": "/works/OL2629977W",
    "title": "The 7 Habits of Highly Effective People",
    "author": "Stephen R. Covey",
    "coverId": 10079937
  },
  {
    "id": "/works/OL27310398W",
    "title": "Haunting Adeline",
    "author": "H. D. Carlton",
    "coverId": 12992962
  },
  {
    "id": "/works/OL20068530W",
    "title": "Verity",
    "author": "Colleen Hoover",
    "coverId": 8747160
  }
];

export const newReleases: Pick[] = [
  {
    "id": "/works/OL45106188W",
    "title": "King of Gluttony",
    "author": "Ana Huang",
    "coverId": 15207442
  },
  {
    "id": "/works/OL45345941W",
    "title": "Tempting Venom",
    "author": "Rina Kent",
    "coverId": 15248444
  },
  {
    "id": "/works/OL45177696W",
    "title": "Yesteryear",
    "author": "Caro Claire Burke",
    "coverId": 15234864
  },
  {
    "id": "/works/OL44800712W",
    "title": "Dear Debbie",
    "author": "Freida McFadden",
    "coverId": 15163694
  },
  {
    "id": "/works/OL45084051W",
    "title": "Starside",
    "author": "Alex Aster",
    "coverId": 15248355
  },
  {
    "id": "/works/OL44344307W",
    "title": "A Parade of Horribles",
    "author": "Matt Dinniman",
    "coverId": 15221497
  },
  {
    "id": "/works/OL44829733W",
    "title": "Half His Age",
    "author": "Jennette McCurdy",
    "coverId": 15166163
  },
  {
    "id": "/works/OL44063672W",
    "title": "When I Kill You",
    "author": "B.A. Paris",
    "coverId": 15125665
  },
  {
    "id": "/works/OL45106192W",
    "title": "Game On",
    "author": "Navessa Allen",
    "coverId": 15235861
  },
  {
    "id": "/works/OL45101987W",
    "title": "Rites of the Starling",
    "author": "Devney Perry",
    "coverId": 15239383
  }
];

export const folioPicks: Pick[] = [
  {
    "id": "/works/OL17079567W",
    "title": "Being Mortal",
    "author": "Atul Gawande",
    "coverId": 8477368,
    "because": "When Breath Becomes Air"
  },
  {
    "id": "/works/OL228702W",
    "title": "Giovanni's Room",
    "author": "James Baldwin",
    "coverId": 97395,
    "because": "Brokeback Mountain"
  },
  {
    "id": "/works/OL22448002W",
    "title": "Crying in H Mart",
    "author": "Michelle Zauner",
    "coverId": 10462708,
    "because": "Educated"
  },
  {
    "id": "/works/OL25453949W",
    "title": "Stolen Focus",
    "author": "Johann Hari",
    "coverId": 12664855,
    "because": "Four Thousand Weeks"
  },
  {
    "id": "/works/OL20883297W",
    "title": "Klara and the Sun",
    "author": "Kazuo Ishiguro",
    "coverId": 10648686,
    "because": "The Remains of the Day, on your list"
  },
  {
    "id": "/works/OL17370186W",
    "title": "A Little Life",
    "author": "Hanya Yanagihara",
    "coverId": 12065783,
    "because": "Young Mungo"
  }
];
