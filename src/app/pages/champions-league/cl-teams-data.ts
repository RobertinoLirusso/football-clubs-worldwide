// ─── 2026-27 UEFA Champions League — League Phase teams (36, real pots) ──────

export const CL2026_TEAMS: Array<{
  name: string; country: string; pot: 1 | 2 | 3 | 4;
  attack: number; defense: number; stamina: number;
}> = [
  // Pot 1
  { name: 'Paris Saint-Germain', country: 'France',      pot: 1, attack: 92, defense: 90, stamina: 88 },
  { name: 'Bayern Munich',       country: 'Germany',     pot: 1, attack: 94, defense: 91, stamina: 90 },
  { name: 'Real Madrid',         country: 'Spain',       pot: 1, attack: 95, defense: 89, stamina: 89 },
  { name: 'Liverpool',           country: 'England',     pot: 1, attack: 90, defense: 87, stamina: 88 },
  { name: 'Inter Milan',         country: 'Italy',       pot: 1, attack: 87, defense: 90, stamina: 86 },
  { name: 'Manchester City',     country: 'England',     pot: 1, attack: 91, defense: 86, stamina: 87 },
  { name: 'Arsenal',             country: 'England',     pot: 1, attack: 87, defense: 89, stamina: 87 },
  { name: 'Barcelona',           country: 'Spain',       pot: 1, attack: 90, defense: 84, stamina: 86 },
  { name: 'Atlético Madrid',     country: 'Spain',       pot: 1, attack: 84, defense: 88, stamina: 85 },

  // Pot 2
  { name: 'Borussia Dortmund',   country: 'Germany',     pot: 2, attack: 83, defense: 79, stamina: 84 },
  { name: 'AS Roma',             country: 'Italy',       pot: 2, attack: 78, defense: 80, stamina: 82 },
  { name: 'Sporting CP',         country: 'Portugal',    pot: 2, attack: 80, defense: 78, stamina: 83 },
  { name: 'Aston Villa',         country: 'England',     pot: 2, attack: 78, defense: 79, stamina: 82 },
  { name: 'Porto',               country: 'Portugal',    pot: 2, attack: 79, defense: 77, stamina: 81 },
  { name: 'Manchester United',   country: 'England',     pot: 2, attack: 79, defense: 76, stamina: 81 },
  { name: 'Club Brugge',         country: 'Belgium',     pot: 2, attack: 75, defense: 75, stamina: 80 },
  { name: 'Real Betis',          country: 'Spain',       pot: 2, attack: 76, defense: 74, stamina: 79 },
  { name: 'PSV Eindhoven',       country: 'Netherlands', pot: 2, attack: 78, defense: 73, stamina: 80 },

  // Pot 3
  { name: 'Feyenoord',           country: 'Netherlands', pot: 3, attack: 75, defense: 74, stamina: 79 },
  { name: 'Lille',               country: 'France',      pot: 3, attack: 74, defense: 75, stamina: 78 },
  { name: 'Bodø/Glimt',          country: 'Norway',      pot: 3, attack: 73, defense: 70, stamina: 82 },
  { name: 'Napoli',              country: 'Italy',       pot: 3, attack: 80, defense: 78, stamina: 82 },
  { name: 'RB Leipzig',          country: 'Germany',     pot: 3, attack: 78, defense: 74, stamina: 81 },
  { name: 'Villarreal',          country: 'Spain',       pot: 3, attack: 75, defense: 73, stamina: 79 },
  { name: 'Shakhtar Donetsk',    country: 'Ukraine',     pot: 3, attack: 70, defense: 68, stamina: 77 },
  { name: 'Galatasaray',         country: 'Türkiye',     pot: 3, attack: 76, defense: 71, stamina: 80 },
  { name: 'Fenerbahçe',          country: 'Türkiye',     pot: 3, attack: 74, defense: 70, stamina: 79 },

  // Pot 4
  { name: 'Slavia Praha',       country: 'Czech Republic', pot: 4, attack: 68, defense: 68, stamina: 78 },
  { name: 'Slovan Bratislava',   country: 'Slovakia',       pot: 4, attack: 63, defense: 64, stamina: 75 },
  { name: 'VfB Stuttgart',       country: 'Germany',        pot: 4, attack: 75, defense: 70, stamina: 81 },
  { name: 'LASK',                country: 'Austria',        pot: 4, attack: 62, defense: 63, stamina: 76 },
  { name: 'Como',                country: 'Italy',          pot: 4, attack: 68, defense: 65, stamina: 78 },
  { name: 'Lens',                country: 'France',         pot: 4, attack: 72, defense: 71, stamina: 79 },
  { name: 'Sabah FK',            country: 'Azerbaijan',     pot: 4, attack: 58, defense: 58, stamina: 74 },
  { name: 'Viking FK Stavanger',              country: 'Norway',         pot: 4, attack: 60, defense: 61, stamina: 76 },
  { name: 'AEK Athens',          country: 'Greece',         pot: 4, attack: 66, defense: 65, stamina: 77 },
];

export const FINAL_INFO = {
  venue: 'Estadio Metropolitano',
  city: 'Madrid, Spain',
  date: '5 June 2027',
};

// Away opponents per club — kept separate because in a couple of cases the
// source table lists a fixture as "away" on BOTH sides (a data error in the
// original draw table), which meant that pairing never appeared in either
// club's home list. Merging home ∪ away below guarantees every club ends up
// with exactly 8 unique opponents.
export const CL2026_AWAY: Record<string, string[]> = {
  'Paris Saint-Germain': ['Manchester City', 'Aston Villa', 'Villarreal', 'Como'],
  'Real Madrid':         ['Arsenal', 'AS Roma', 'Shakhtar Donetsk', 'AEK Athens'],
  'Manchester City':     ['Barcelona', 'Porto', 'RB Leipzig', 'Lens'],
  'Bayern Munich':       ['Atlético Madrid', 'Manchester United', 'Lille', 'Viking FK Stavanger'],
  'Barcelona':           ['Paris Saint-Germain', 'Sporting CP', 'Galatasaray', 'Sabah FK'],
  'Liverpool':           ['Inter Milan', 'Club Brugge', 'Fenerbahçe', 'LASK'],
  'Inter Milan':         ['Real Madrid', 'Borussia Dortmund', 'Feyenoord', 'Slovan Bratislava'],
  'Borussia Dortmund':   ['Arsenal', 'Aston Villa', 'Bodø/Glimt', 'Sabah FK'],
  'Atlético Madrid':     ['Liverpool', 'PSV Eindhoven', 'Bodø/Glimt', 'VfB Stuttgart'],

  'Arsenal':             ['Bayern Munich', 'Real Betis', 'Napoli', 'Slavia Praha'],
  'Aston Villa':         ['Barcelona', 'Club Brugge', 'Galatasaray', 'Slavia Praha'],
  'Manchester United':   ['Atlético Madrid', 'Sporting CP', 'Villarreal', 'Como'],
  'Porto':               ['Liverpool', 'Real Betis', 'Feyenoord', 'LASK'],
  'Sporting CP':         ['Manchester City', 'AS Roma', 'Shakhtar Donetsk', 'Lens'],
  'AS Roma':             ['Paris Saint-Germain', 'Manchester United', 'Fenerbahçe', 'AEK Athens'],
  'PSV Eindhoven':       ['Real Madrid', 'Porto', 'RB Leipzig', 'Viking FK Stavanger'],
  'Real Betis':          ['Bayern Munich', 'Borussia Dortmund', 'Lille', 'Slovan Bratislava'],
  'Club Brugge':         ['Inter Milan', 'PSV Eindhoven', 'Napoli', 'VfB Stuttgart'],

  'Napoli':              ['Manchester City', 'Porto', 'Villarreal', 'Sabah FK'],
  'Lille':               ['Arsenal', 'AS Roma', 'Bodø/Glimt', 'VfB Stuttgart'],
  'Feyenoord':           ['Barcelona', 'Real Betis', 'Galatasaray', 'Viking FK Stavanger'],
  'RB Leipzig':          ['Real Madrid', 'Manchester United', 'Feyenoord', 'Como'],
  'Galatasaray':         ['Paris Saint-Germain', 'Sporting CP', 'Lille', 'AEK Athens'],
  'Shakhtar Donetsk':    ['Inter Milan', 'PSV Eindhoven', 'RB Leipzig', 'Slovan Bratislava'],
  'Fenerbahçe':          ['Atlético Madrid', 'Aston Villa', 'Shakhtar Donetsk', 'LASK'],
  'Villarreal':          ['Liverpool', 'Borussia Dortmund', 'Fenerbahçe', 'Slavia Praha'],
  'Bodø/Glimt':          ['Bayern Munich', 'Club Brugge', 'Napoli', 'Lens'],

  'Slavia Praha':       ['Bayern Munich', 'Porto', 'Fenerbahçe', 'Sabah FK'],
  'Slovan Bratislava':   ['Paris Saint-Germain', 'AS Roma', 'Lille', 'LASK'],
  'VfB Stuttgart':       ['Inter Milan', 'PSV Eindhoven', 'Galatasaray', 'Slovan Bratislava'],
  'AEK Athens':          ['Manchester City', 'Borussia Dortmund', 'Shakhtar Donetsk', 'Como'],
  'LASK':                ['Real Madrid', 'Sporting CP', 'Bodø/Glimt', 'AEK Athens'],
  'Como':                ['Barcelona', 'Real Betis', 'Feyenoord', 'Lens'],
  'Lens':                ['Manchester City', 'Sporting CP', 'Bodø/Glimt', 'Como'],
  'Viking FK Stavanger':              ['Atlético Madrid', 'Aston Villa', 'Napoli', 'VfB Stuttgart'],
  'Sabah FK':            ['Barcelona', 'Borussia Dortmund', 'Napoli', 'Slavia Praha'],
};
export const CL2026_FIXTURES: Record<string, string[]> = {
  'Paris Saint-Germain': ['Barcelona', 'AS Roma', 'Galatasaray', 'Slovan Bratislava'],
  'Real Madrid':         ['Inter Milan', 'PSV Eindhoven', 'RB Leipzig', 'LASK'],
  'Manchester City':     ['Paris Saint-Germain', 'Sporting CP', 'Napoli', 'AEK Athens'],
  'Bayern Munich':       ['Arsenal', 'Real Betis', 'Bodø/Glimt', 'Slavia Praha'],
  'Barcelona':           ['Manchester City', 'Aston Villa', 'Feyenoord', 'Como'],
  'Liverpool':           ['Atlético Madrid', 'Porto', 'Villarreal', 'Lens'],
  'Inter Milan':         ['Liverpool', 'Club Brugge', 'Shakhtar Donetsk', 'VfB Stuttgart'],
  'Borussia Dortmund':   ['Inter Milan', 'Real Betis', 'Villarreal', 'AEK Athens'],
  'Atlético Madrid':     ['Bayern Munich', 'Manchester United', 'Fenerbahçe', 'Viking FK Stavanger'],

  'Arsenal':             ['Real Madrid', 'Borussia Dortmund', 'Lille', 'Sabah FK'],
  'Aston Villa':         ['Paris Saint-Germain', 'Borussia Dortmund', 'Fenerbahçe', 'Viking FK Stavanger'],
  'Manchester United':   ['Bayern Munich', 'AS Roma', 'RB Leipzig', 'Sabah FK'],
  'Porto':               ['Manchester City', 'PSV Eindhoven', 'Napoli', 'Slavia Praha'],
  'Sporting CP':         ['Barcelona', 'Manchester United', 'Galatasaray', 'LASK'],
  'AS Roma':             ['Real Madrid', 'Sporting CP', 'Lille', 'Slovan Bratislava'],
  'PSV Eindhoven':       ['Atlético Madrid', 'Club Brugge', 'Shakhtar Donetsk', 'VfB Stuttgart'],
  'Real Betis':          ['Arsenal', 'Porto', 'Feyenoord', 'Como'],
  'Club Brugge':         ['Liverpool', 'Aston Villa', 'Bodø/Glimt', 'Lens'],

  'Napoli':              ['Arsenal', 'Club Brugge', 'Bodø/Glimt', 'Viking FK Stavanger'],
  'Lille':               ['Bayern Munich', 'Real Betis', 'Galatasaray', 'Slovan Bratislava'],
  'Feyenoord':           ['Inter Milan', 'Porto', 'RB Leipzig', 'Como'],
  'RB Leipzig':          ['Manchester City', 'PSV Eindhoven', 'Shakhtar Donetsk', 'Lens'],
  'Galatasaray':         ['Barcelona', 'Aston Villa', 'Feyenoord', 'VfB Stuttgart'],
  'Shakhtar Donetsk':    ['Real Madrid', 'Sporting CP', 'Fenerbahçe', 'AEK Athens'],
  'Fenerbahçe':          ['Liverpool', 'AS Roma', 'Villarreal', 'Slavia Praha'],
  'Villarreal':          ['Paris Saint-Germain', 'Manchester United', 'Napoli', 'Sabah FK'],
  'Bodø/Glimt':          ['Atlético Madrid', 'Borussia Dortmund', 'Lille', 'LASK'],

  'Slavia Praha':       ['Arsenal', 'Aston Villa', 'Villarreal', 'Lens'],
  'Slovan Bratislava':   ['Inter Milan', 'Real Betis', 'Shakhtar Donetsk', 'VfB Stuttgart'],
  'VfB Stuttgart':       ['Atlético Madrid', 'Club Brugge', 'Lille', 'Viking FK Stavanger'],
  'AEK Athens':          ['Real Madrid', 'AS Roma', 'Galatasaray', 'LASK'],
  'LASK':                ['Liverpool', 'Porto', 'Fenerbahçe', 'Slovan Bratislava'],
  'Como':                ['Paris Saint-Germain', 'Manchester United', 'RB Leipzig', 'AEK Athens'],
  'Lens':                ['Liverpool', 'Club Brugge', 'RB Leipzig', 'Slavia Praha'],
  'Viking FK Stavanger':              ['Bayern Munich', 'PSV Eindhoven', 'Feyenoord', 'Sabah FK'],
  'Sabah FK':            ['Arsenal', 'Manchester United', 'Villarreal', 'Viking FK Stavanger'],
};