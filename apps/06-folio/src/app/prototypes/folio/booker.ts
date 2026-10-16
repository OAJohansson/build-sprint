// Booker Prize winners, 1969–2025 (joint winners in 1974, 1992 and 2019), matched to Open
// Library for covers on 16 Oct. Open Library's own "Booker prize" tag mixes winners and
// shortlisted books, so the list is ours.
// shortcut: a static list, add each year's winner by hand in November; fine until a second prize list.
export type Winner = { id: string; year: number; title: string; author: string; coverId?: number };

export const bookerWinners: Winner[] = [
  {
    "id": "/works/OL42549900W",
    "year": 2025,
    "title": "Flesh",
    "author": "David Szalay",
    "coverId": 15110590
  },
  {
    "id": "/works/OL35708581W",
    "year": 2024,
    "title": "Orbital",
    "author": "Samantha Harvey",
    "coverId": 14541972
  },
  {
    "id": "/works/OL34341539W",
    "year": 2023,
    "title": "Prophet Song",
    "author": "Paul Lynch",
    "coverId": 14814200
  },
  {
    "id": "/works/OL27816355W",
    "year": 2022,
    "title": "The Seven Moons of Maali Almeida",
    "author": "Shehan Karunatilaka",
    "coverId": 13822859
  },
  {
    "id": "/works/OL24764083W",
    "year": 2021,
    "title": "The Promise",
    "author": "Damon Galgut",
    "coverId": 11514543
  },
  {
    "id": "/works/OL20645179W",
    "year": 2020,
    "title": "Shuggie Bain",
    "author": "Douglas Stuart",
    "coverId": 9271540
  },
  {
    "id": "/works/OL20129837W",
    "year": 2019,
    "title": "The Testaments",
    "author": "Margaret Atwood",
    "coverId": 12366815
  },
  {
    "id": "/works/OL20470196W",
    "year": 2019,
    "title": "Girl, Woman, Other",
    "author": "Bernardine Evaristo",
    "coverId": 9134982
  },
  {
    "id": "/works/OL19344016W",
    "year": 2018,
    "title": "Milkman",
    "author": "Anna Burns",
    "coverId": 13561491
  },
  {
    "id": "/works/OL17635834W",
    "year": 2017,
    "title": "Lincoln in the Bardo",
    "author": "George Saunders",
    "coverId": 7909378
  },
  {
    "id": "/works/OL17616758W",
    "year": 2016,
    "title": "The Sellout",
    "author": "Paul Beatty",
    "coverId": 7897222
  },
  {
    "id": "/works/OL17187702W",
    "year": 2015,
    "title": "A Brief History of Seven Killings",
    "author": "Marlon James",
    "coverId": 7359856
  },
  {
    "id": "/works/OL17064845W",
    "year": 2014,
    "title": "The Narrow Road to the Deep North",
    "author": "Richard Flanagan",
    "coverId": 7307756
  },
  {
    "id": "/works/OL16810597W",
    "year": 2013,
    "title": "The Luminaries",
    "author": "Eleanor Catton",
    "coverId": 7268574
  },
  {
    "id": "/works/OL16547664W",
    "year": 2012,
    "title": "Bring Up the Bodies",
    "author": "Hilary Mantel",
    "coverId": 10236749
  },
  {
    "id": "/works/OL15991772W",
    "year": 2011,
    "title": "The Sense of an Ending",
    "author": "Julian Barnes",
    "coverId": 6997514
  },
  {
    "id": "/works/OL15899388W",
    "year": 2010,
    "title": "The Finkler Question",
    "author": "Howard Jacobson",
    "coverId": 10387493
  },
  {
    "id": "/works/OL464512W",
    "year": 2009,
    "title": "Wolf Hall",
    "author": "Hilary Mantel",
    "coverId": 8345848
  },
  {
    "id": "/works/OL9740815W",
    "year": 2008,
    "title": "The White Tiger",
    "author": "Aravind Adiga",
    "coverId": 2787359
  },
  {
    "id": "/works/OL5869525W",
    "year": 2007,
    "title": "The Gathering",
    "author": "Anne Enright",
    "coverId": 2762480
  },
  {
    "id": "/works/OL97945W",
    "year": 2006,
    "title": "The Inheritance of Loss",
    "author": "Kiran Desai",
    "coverId": 5728169
  },
  {
    "id": "/works/OL2687259W",
    "year": 2005,
    "title": "The Sea",
    "author": "John Banville",
    "coverId": 197928
  },
  {
    "id": "/works/OL1993508W",
    "year": 2004,
    "title": "The Line of Beauty",
    "author": "Alan Hollinghurst",
    "coverId": 8310475
  },
  {
    "id": "/works/OL5704311W",
    "year": 2003,
    "title": "Vernon God Little",
    "author": "DBC Pierre",
    "coverId": 115775
  },
  {
    "id": "/works/OL2827199W",
    "year": 2002,
    "title": "Life of Pi",
    "author": "Yann Martel",
    "coverId": 12840573
  },
  {
    "id": "/works/OL1707638W",
    "year": 2001,
    "title": "True History of the Kelly Gang",
    "author": "Peter Carey",
    "coverId": 229512
  },
  {
    "id": "/works/OL675698W",
    "year": 2000,
    "title": "The Blind Assassin",
    "author": "Margaret Atwood",
    "coverId": 11041760
  },
  {
    "id": "/works/OL500451W",
    "year": 1999,
    "title": "Disgrace",
    "author": "J. M. Coetzee",
    "coverId": 11434870
  },
  {
    "id": "/works/OL1855943W",
    "year": 1998,
    "title": "Amsterdam",
    "author": "Ian McEwan",
    "coverId": 241742
  },
  {
    "id": "/works/OL1052133W",
    "year": 1997,
    "title": "The God of Small Things",
    "author": "Arundhati Roy",
    "coverId": 10513792
  },
  {
    "id": "/works/OL3260505W",
    "year": 1996,
    "title": "Last Orders",
    "author": "Graham Swift",
    "coverId": 421413
  },
  {
    "id": "/works/OL11221644W",
    "year": 1995,
    "title": "The Ghost Road",
    "author": "Pat Barker",
    "coverId": 6618172
  },
  {
    "id": "/works/OL60988W",
    "year": 1994,
    "title": "How Late It Was, How Late",
    "author": "James Kelman",
    "coverId": 239132
  },
  {
    "id": "/works/OL762615W",
    "year": 1993,
    "title": "Paddy Clarke Ha Ha Ha",
    "author": "Roddy Doyle",
    "coverId": 8259705
  },
  {
    "id": "/works/OL53071W",
    "year": 1992,
    "title": "The English Patient",
    "author": "Michael Ondaatje",
    "coverId": 417585
  },
  {
    "id": "/works/OL452766W",
    "year": 1992,
    "title": "Sacred Hunger",
    "author": "Barry Unsworth",
    "coverId": 248781
  },
  {
    "id": "/works/OL928455W",
    "year": 1991,
    "title": "The Famished Road",
    "author": "Ben Okri",
    "coverId": 13858305
  },
  {
    "id": "/works/OL115647W",
    "year": 1990,
    "title": "Possession",
    "author": "A. S. Byatt",
    "coverId": 420243
  },
  {
    "id": "/works/OL59048W",
    "year": 1989,
    "title": "The Remains of the Day",
    "author": "Kazuo Ishiguro",
    "coverId": 95742
  },
  {
    "id": "/works/OL1707618W",
    "year": 1988,
    "title": "Oscar and Lucinda",
    "author": "Peter Carey",
    "coverId": 421810
  },
  {
    "id": "/works/OL1983042W",
    "year": 1987,
    "title": "Moon Tiger",
    "author": "Penelope Lively",
    "coverId": 4139250
  },
  {
    "id": "/works/OL10425070W",
    "year": 1986,
    "title": "The Old Devils",
    "author": "Kingsley Amis",
    "coverId": 4171882
  },
  {
    "id": "/works/OL3991459W",
    "year": 1985,
    "title": "The Bone People",
    "author": "Keri Hulme",
    "coverId": 3080172
  },
  {
    "id": "/works/OL166437W",
    "year": 1984,
    "title": "Hotel du Lac",
    "author": "Anita Brookner",
    "coverId": 4193156
  },
  {
    "id": "/works/OL500448W",
    "year": 1983,
    "title": "Life & Times of Michael K",
    "author": "J. M. Coetzee",
    "coverId": 12703026
  },
  {
    "id": "/works/OL10619574W",
    "year": 1982,
    "title": "Schindler's Ark",
    "author": "Thomas Keneally",
    "coverId": 6458534
  },
  {
    "id": "/works/OL457179W",
    "year": 1981,
    "title": "Midnight's Children",
    "author": "Salman Rushdie",
    "coverId": 8346713
  },
  {
    "id": "/works/OL2430180W",
    "year": 1980,
    "title": "Rites of Passage",
    "author": "William Golding",
    "coverId": 377323
  },
  {
    "id": "/works/OL20790W",
    "year": 1979,
    "title": "Offshore",
    "author": "Penelope Fitzgerald",
    "coverId": 745238
  },
  {
    "id": "/works/OL1326310W",
    "year": 1978,
    "title": "The Sea, the Sea",
    "author": "Iris Murdoch",
    "coverId": 5277962
  },
  {
    "id": "/works/OL1829451W",
    "year": 1977,
    "title": "Staying On",
    "author": "Paul Scott",
    "coverId": 6888943
  },
  {
    "id": "/works/OL646551W",
    "year": 1976,
    "title": "Saville",
    "author": "David Storey",
    "coverId": 5525678
  },
  {
    "id": "/works/OL335547W",
    "year": 1975,
    "title": "Heat and Dust",
    "author": "Ruth Prawer Jhabvala",
    "coverId": 845001
  },
  {
    "id": "/works/OL118280W",
    "year": 1974,
    "title": "The Conservationist",
    "author": "Nadine Gordimer",
    "coverId": 138568
  },
  {
    "id": "/works/OL2466701W",
    "year": 1974,
    "title": "Holiday",
    "author": "Stanley Middleton"
  },
  {
    "id": "/works/OL2694535W",
    "year": 1973,
    "title": "The Siege of Krishnapur",
    "author": "J. G. Farrell",
    "coverId": 859123
  },
  {
    "id": "/works/OL1980236W",
    "year": 1972,
    "title": "G.",
    "author": "John Berger",
    "coverId": 420280
  },
  {
    "id": "/works/OL103104W",
    "year": 1971,
    "title": "In a Free State",
    "author": "V. S. Naipaul",
    "coverId": 93425
  },
  {
    "id": "/works/OL2143620W",
    "year": 1970,
    "title": "The Elected Member",
    "author": "Bernice Rubens",
    "coverId": 7299296
  },
  {
    "id": "/works/OL1283495W",
    "year": 1969,
    "title": "Something to Answer For",
    "author": "P. H. Newby"
  }
];
