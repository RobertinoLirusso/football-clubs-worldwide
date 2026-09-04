// UEFA Europa League 2026-27 — Pots reales confirmados (sorteo 28 ago 2026)
// y calendario real de la fase de liga (8 jornadas), fuente: UEFA.com.
// Perdedores del Play-off Round 2026-27 (caen a Conference League)
export const EL2026_PLAYOFF_LOSERS: Array<{
  name: string; country: string;
  attack: number; defense: number; stamina: number;
}> = [
  { name: 'Trabzonspor',          country: 'Turkey',          attack: 72, defense: 68, stamina: 80 },
  { name: 'Universitatea Craiova', country: 'Romania',         attack: 67, defense: 65, stamina: 78 },
  { name: 'Sint-Truiden',          country: 'Belgium',         attack: 66, defense: 64, stamina: 77 },
  { name: 'Red Star Belgrade',     country: 'Serbia',          attack: 74, defense: 70, stamina: 81 },
  { name: 'Egnatia',               country: 'Albania',         attack: 58, defense: 57, stamina: 75 },
  { name: 'Iberia 1999',           country: 'Georgia',         attack: 60, defense: 58, stamina: 76 },
  { name: 'Mjällby AIF',           country: 'Sweden',          attack: 64, defense: 63, stamina: 77 },
  { name: 'Kairat',                country: 'Kazakhstan',      attack: 62, defense: 60, stamina: 76 },
  { name: 'Thun',                  country: 'Switzerland',     attack: 63, defense: 62, stamina: 77 },
  { name: 'Kauno Žalgiris',        country: 'Lithuania',       attack: 59, defense: 58, stamina: 75 },
  { name: 'AGF',                   country: 'Denmark',         attack: 68, defense: 66, stamina: 79 },
  { name: 'CSKA Sofia',            country: 'Bulgaria',        attack: 65, defense: 63, stamina: 78 },
];

// En el archivo de datos (el-teams-data.ts)
export const QUALIFYING_ROUND_FIXTURES: Record<string, string> = {
  // Winner                          →  Real opponent (loser)
  'Ferencváros':                     'Trabzonspor',
  'Ararat-Armenia':                  'Universitatea Craiova',
  'Omonia':                          'Sint-Truiden',
  'Viktoria Plzeň':                  'Red Star Belgrade',
  'Lillestrøm':                      'Egnatia',
  'Jagiellonia Białystok':           'Iberia 1999',
  'Red Bull Salzburg':               'Mjällby AIF',
  'Anderlecht':                      'Kairat',
  'Lech Poznań':                     'Thun',
  'Beşiktaş':                        'Kauno Žalgiris',
  'Benfica':                         'AGF',
  'OFI Crete':                       'CSKA Sofia',
};

export const EL2026_TEAMS: Array<{
    name: string; country: string; pot: 1 | 2 | 3 | 4;
    attack: number; defense: number; stamina: number;
  }> = [
    // Pot 1
    { name: 'Bayer 04 Leverkusen', country: 'Germany', pot: 1, attack: 85, defense: 82, stamina: 86 },
    { name: 'Benfica', country: 'Portugal', pot: 1, attack: 82, defense: 80, stamina: 84 },
    { name: 'Juventus', country: 'Italy', pot: 1, attack: 80, defense: 82, stamina: 83 },
    { name: 'AC Milan', country: 'Italy', pot: 1, attack: 81, defense: 79, stamina: 83 },
    { name: 'Lyon', country: 'France', pot: 1, attack: 78, defense: 74, stamina: 82 },
    { name: 'AZ Alkmaar', country: 'Netherlands', pot: 1, attack: 76, defense: 73, stamina: 81 },
    { name: 'Olympiacos', country: 'Greece', pot: 1, attack: 77, defense: 76, stamina: 82 },
    { name: 'Real Sociedad', country: 'Spain', pot: 1, attack: 78, defense: 77, stamina: 81 },
    { name: 'Marseille', country: 'France', pot: 1, attack: 79, defense: 75, stamina: 81 },
    // Pot 2
    { name: 'Ferencváros', country: 'Hungary', pot: 2, attack: 68, defense: 66, stamina: 78 },
    { name: 'Viktoria Plzeň', country: 'Czech Republic', pot: 2, attack: 69, defense: 67, stamina: 79 },
    { name: 'Union Saint-Gilloise', country: 'Belgium', pot: 2, attack: 74, defense: 71, stamina: 80 },
    { name: 'Dinamo Zagreb', country: 'Croatia', pot: 2, attack: 72, defense: 69, stamina: 79 },
    { name: 'Red Bull Salzburg', country: 'Austria', pot: 2, attack: 76, defense: 72, stamina: 82 },
    { name: 'Celtic', country: 'Scotland', pot: 2, attack: 75, defense: 70, stamina: 80 },
    { name: 'Sparta Praha', country: 'Czech Republic', pot: 2, attack: 71, defense: 69, stamina: 79 },
    { name: 'Stade Rennais', country: 'France', pot: 2, attack: 73, defense: 70, stamina: 79 },
    { name: 'Anderlecht', country: 'Belgium', pot: 2, attack: 71, defense: 68, stamina: 79 },
    // Pot 3
    { name: 'Sturm Graz', country: 'Austria', pot: 3, attack: 66, defense: 64, stamina: 78 },
    { name: 'Lech Poznań', country: 'Poland', pot: 3, attack: 65, defense: 63, stamina: 77 },
    { name: 'Crystal Palace', country: 'England', pot: 3, attack: 70, defense: 71, stamina: 80 },
    { name: 'Bournemouth', country: 'England', pot: 3, attack: 71, defense: 69, stamina: 80 },
    { name: 'Sunderland', country: 'England', pot: 3, attack: 66, defense: 65, stamina: 78 },
    { name: 'Celje', country: 'Slovenia', pot: 3, attack: 60, defense: 60, stamina: 76 },
    { name: 'Jagiellonia Białystok', country: 'Poland', pot: 3, attack: 61, defense: 60, stamina: 76 },
    { name: 'Omonia', country: 'Cyprus', pot: 3, attack: 60, defense: 59, stamina: 75 },
    { name: 'Celta de Vigo', country: 'Spain', pot: 3, attack: 68, defense: 65, stamina: 78 },
    // Pot 4
    { name: 'TSG Hoffenheim', country: 'Germany', pot: 4, attack: 65, defense: 62, stamina: 78 },
    { name: 'Beşiktaş', country: 'Turkey', pot: 4, attack: 66, defense: 63, stamina: 78 },
    { name: 'Torreense', country: 'Portugal', pot: 4, attack: 54, defense: 55, stamina: 74 },
    { name: 'Hapoel Beer-Sheva', country: 'Israel', pot: 4, attack: 58, defense: 57, stamina: 75 },
    { name: 'NEC Nijmegen', country: 'Netherlands', pot: 4, attack: 60, defense: 59, stamina: 76 },
    { name: 'OFI Crete', country: 'Greece', pot: 4, attack: 57, defense: 56, stamina: 75 },
    { name: 'Lillestrøm', country: 'Norway', pot: 4, attack: 58, defense: 58, stamina: 76 },
    { name: 'Levski Sofia', country: 'Bulgaria', pot: 4, attack: 57, defense: 55, stamina: 75 },
    { name: 'Ararat-Armenia', country: 'Armenia', pot: 4, attack: 52, defense: 52, stamina: 73 },
  ];
  
  export const FINAL_INFO_EL = {
    venue: 'Waldstadion',
    city: 'Frankfurt, Germany',
    date: '26 May 2027',
  };
  
  // Calendario real (jornadas 1-8), fuente: UEFA.com — actualizado 29 ago 2026
  export const EL2026_SCHEDULE: Array<Array<[string, string]>> = [
    // Matchday 1 — 16-17 Sep 2026
    [
      ['Ararat-Armenia', 'Sparta Praha'], ['Omonia', 'Celta de Vigo'], ['AC Milan', 'Benfica'],
      ['Bayer 04 Leverkusen', 'Celje'], ['Hapoel Beer-Sheva', 'Dinamo Zagreb'], ['Olympiacos', 'Jagiellonia Białystok'],
      ['Anderlecht', 'Lyon'], ['Sturm Graz', 'Stade Rennais'], ['Sunderland', 'AZ Alkmaar'],
      ['OFI Crete', 'TSG Hoffenheim'], ['Levski Sofia', 'Red Bull Salzburg'], ['Beşiktaş', 'Marseille'],
      ['Celtic', 'Ferencváros'], ['Crystal Palace', 'Lech Poznań'], ['Viktoria Plzeň', 'Union Saint-Gilloise'],
      ['Juventus', 'NEC Nijmegen'], ['Lillestrøm', 'Torreense'], ['Real Sociedad', 'Bournemouth'],
    ],
    // Matchday 2 — 15 Oct 2026
    [
      ['Sparta Praha', 'Lillestrøm'], ['AZ Alkmaar', 'Hapoel Beer-Sheva'], ['Red Bull Salzburg', 'AC Milan'],
      ['Lech Poznań', 'Bayer 04 Leverkusen'], ['Celje', 'Omonia'], ['Lyon', 'Crystal Palace'],
      ['Union Saint-Gilloise', 'Real Sociedad'], ['Torreense', 'Sunderland'], ['Bournemouth', 'Sturm Graz'],
      ['Ferencváros', 'Viktoria Plzeň'], ['Dinamo Zagreb', 'Anderlecht'], ['Jagiellonia Białystok', 'Ararat-Armenia'],
      ['NEC Nijmegen', 'Levski Sofia'], ['Marseille', 'Olympiacos'], ['Celta de Vigo', 'Juventus'],
      ['Benfica', 'Celtic'], ['Stade Rennais', 'OFI Crete'], ['TSG Hoffenheim', 'Beşiktaş'],
    ],
    // Matchday 3 — 22 Oct 2026
    [
      ['Ararat-Armenia', 'AZ Alkmaar'], ['Ferencváros', 'Torreense'], ['Dinamo Zagreb', 'NEC Nijmegen'],
      ['Juventus', 'Stade Rennais'], ['Lech Poznań', 'Sunderland'], ['OFI Crete', 'Bayer 04 Leverkusen'],
      ['Union Saint-Gilloise', 'Hapoel Beer-Sheva'], ['Sturm Graz', 'Marseille'], ['Bournemouth', 'AC Milan'],
      ['Beşiktaş', 'Crystal Palace'], ['Celtic', 'Celta de Vigo'], ['Viktoria Plzeň', 'Levski Sofia'],
      ['Jagiellonia Białystok', 'Anderlecht'], ['Lillestrøm', 'Real Sociedad'], ['Celje', 'Red Bull Salzburg'],
      ['Olympiacos', 'Sparta Praha'], ['Omonia', 'Benfica'], ['TSG Hoffenheim', 'Lyon'],
    ],
    // Matchday 4 — 5 Nov 2026
    [
      ['AC Milan', 'Ferencváros'], ['Sparta Praha', 'Bournemouth'], ['Crystal Palace', 'TSG Hoffenheim'],
      ['Lillestrøm', 'Viktoria Plzeň'], ['NEC Nijmegen', 'Omonia'], ['Levski Sofia', 'Jagiellonia Białystok'],
      ['Real Sociedad', 'Lyon'], ['Anderlecht', 'Red Bull Salzburg'], ['Stade Rennais', 'Olympiacos'],
      ['AZ Alkmaar', 'Juventus'], ['Bayer 04 Leverkusen', 'Marseille'], ['Celtic', 'Beşiktaş'],
      ['Hapoel Beer-Sheva', 'OFI Crete'], ['Celta de Vigo', 'Union Saint-Gilloise'], ['Torreense', 'Ararat-Armenia'],
      ['Sturm Graz', 'Celje'], ['Benfica', 'Lech Poznań'], ['Sunderland', 'Dinamo Zagreb'],
    ],
    // Matchday 5 — 26 Nov 2026
    [
      ['Beşiktaş', 'Hapoel Beer-Sheva'], ['Red Bull Salzburg', 'Ararat-Armenia'], ['Viktoria Plzeň', 'Benfica'],
      ['Dinamo Zagreb', 'Bayer 04 Leverkusen'], ['Olympiacos', 'AC Milan'], ['Marseille', 'Levski Sofia'],
      ['Union Saint-Gilloise', 'Lech Poznań'], ['Celta de Vigo', 'Bournemouth'], ['Sparta Praha', 'AZ Alkmaar'],
      ['Crystal Palace', 'Real Sociedad'], ['Ferencváros', 'Celje'], ['Juventus', 'Omonia'],
      ['NEC Nijmegen', 'Stade Rennais'], ['OFI Crete', 'Anderlecht'], ['Lyon', 'Lillestrøm'],
      ['Torreense', 'Celtic'], ['Sunderland', 'Jagiellonia Białystok'], ['TSG Hoffenheim', 'Sturm Graz'],
    ],
    // Matchday 6 — 10 Dec 2026
    [
      ['AZ Alkmaar', 'Sturm Graz'], ['Ararat-Armenia', 'NEC Nijmegen'], ['Hapoel Beer-Sheva', 'Juventus'],
      ['Jagiellonia Białystok', 'Crystal Palace'], ['Marseille', 'Celta de Vigo'], ['Omonia', 'Celtic'],
      ['Anderlecht', 'TSG Hoffenheim'], ['Stade Rennais', 'Dinamo Zagreb'], ['AC Milan', 'Sunderland'],
      ['Bournemouth', 'Viktoria Plzeň'], ['Bayer 04 Leverkusen', 'Beşiktaş'], ['Red Bull Salzburg', 'Sparta Praha'],
      ['Lech Poznań', 'Ferencváros'], ['Celje', 'Olympiacos'], ['Lyon', 'Union Saint-Gilloise'],
      ['Levski Sofia', 'Lillestrøm'], ['Real Sociedad', 'Torreense'], ['Benfica', 'OFI Crete'],
    ],
    // Matchday 7 — 21 Jan 2027
    [
      ['Beşiktaş', 'Union Saint-Gilloise'], ['Ararat-Armenia', 'Celje'], ['Ferencváros', 'Juventus'],
      ['Jagiellonia Białystok', 'Lyon'], ['Lillestrøm', 'Bournemouth'], ['NEC Nijmegen', 'Benfica'],
      ['Olympiacos', 'TSG Hoffenheim'], ['Real Sociedad', 'Viktoria Plzeň'], ['Sturm Graz', 'OFI Crete'],
      ['AZ Alkmaar', 'Dinamo Zagreb'], ['Bayer 04 Leverkusen', 'Red Bull Salzburg'], ['Celtic', 'Marseille'],
      ['Crystal Palace', 'Sparta Praha'], ['Hapoel Beer-Sheva', 'Celta de Vigo'], ['Lech Poznań', 'Torreense'],
      ['Levski Sofia', 'AC Milan'], ['Anderlecht', 'Sunderland'], ['Stade Rennais', 'Omonia'],
    ],
    // Matchday 8 — 28 Jan 2027
    [
      ['AC Milan', 'Ararat-Armenia'], ['Sparta Praha', 'Stade Rennais'], ['Bournemouth', 'Hapoel Beer-Sheva'],
      ['Red Bull Salzburg', 'Crystal Palace'], ['Viktoria Plzeň', 'Jagiellonia Białystok'], ['Dinamo Zagreb', 'Sturm Graz'],
      ['Juventus', 'Real Sociedad'], ['Celje', 'NEC Nijmegen'], ['OFI Crete', 'Lech Poznań'],
      ['Marseille', 'Anderlecht'], ['Lyon', 'Bayer 04 Leverkusen'], ['Omonia', 'Beşiktaş'],
      ['Union Saint-Gilloise', 'Celtic'], ['Celta de Vigo', 'Lillestrøm'], ['Torreense', 'Olympiacos'],
      ['Benfica', 'AZ Alkmaar'], ['Sunderland', 'Levski Sofia'], ['TSG Hoffenheim', 'Ferencváros'],
    ],
  ];