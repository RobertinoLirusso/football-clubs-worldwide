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

// Calendario real (jornadas 1-8), fuente: UEFA.com — actualizado 29 ago 2026
export const CL2026_SCHEDULE: Array<Array<[string, string]>> = [
  // Matchday 1 — 8-10 Sep 2026
  [
    ['AEK Athens', 'LASK'], ['Club Brugge', 'Aston Villa'], ['Borussia Dortmund', 'Villarreal'],
    ['Porto', 'Manchester City'], ['Lille', 'Real Betis'], ['Real Madrid', 'Inter Milan'],
    ['Barcelona', 'Feyenoord'], ['VfB Stuttgart', 'Viking FK Stavanger'], ['Liverpool', 'Atlético Madrid'],
    ['Paris Saint-Germain', 'Slovan Bratislava'], ['Sporting CP', 'Galatasaray'], ['Napoli', 'Arsenal'],
    ['Fenerbahçe', 'AS Roma'], ['PSV Eindhoven', 'Shakhtar Donetsk'], ['Como', 'RB Leipzig'],
    ['Bayern Munich', 'Bodø/Glimt'], ['Manchester United', 'Sabah FK'], ['Slavia Praha', 'Lens'],
  ],
  // Matchday 2 — 13-14 Oct 2026
  [
    ['Arsenal', 'Lille'], ['Atlético Madrid', 'Manchester United'], ['Galatasaray', 'Barcelona'],
    ['Inter Milan', 'Club Brugge'], ['RB Leipzig', 'PSV Eindhoven'], ['Lens', 'Sporting CP'],
    ['Sabah FK', 'Slavia Praha'], ['Viking FK Stavanger', 'Bayern Munich'], ['Villarreal', 'Napoli'],
    ['Aston Villa', 'Fenerbahçe'], ['Bodø/Glimt', 'Borussia Dortmund'], ['Feyenoord', 'Como'],
    ['LASK', 'Liverpool'], ['Manchester City', 'Paris Saint-Germain'], ['Real Betis', 'Porto'],
    ['AS Roma', 'Real Madrid'], ['Shakhtar Donetsk', 'AEK Athens'], ['Slovan Bratislava', 'VfB Stuttgart'],
  ],
  // Matchday 3 — 20-21 Oct 2026
  [
    ['Fenerbahçe', 'Slavia Praha'], ['Liverpool', 'Villarreal'], ['Manchester City', 'AEK Athens'],
    ['Napoli', 'Bodø/Glimt'], ['Paris Saint-Germain', 'Barcelona'], ['Porto', 'PSV Eindhoven'],
    ['AS Roma', 'Slovan Bratislava'], ['Sabah FK', 'Borussia Dortmund'], ['VfB Stuttgart', 'Atlético Madrid'],
    ['Aston Villa', 'Viking FK Stavanger'], ['Bayern Munich', 'Arsenal'], ['Club Brugge', 'Lens'],
    ['Como', 'Manchester United'], ['Inter Milan', 'Shakhtar Donetsk'], ['Lille', 'Galatasaray'],
    ['Real Madrid', 'RB Leipzig'], ['Real Betis', 'Feyenoord'], ['Sporting CP', 'LASK'],
  ],
  // Matchday 4 — 3-4 Nov 2026
  [
    ['Atlético Madrid', 'Bayern Munich'], ['Barcelona', 'Aston Villa'], ['Bodø/Glimt', 'Lille'],
    ['Borussia Dortmund', 'Real Betis'], ['Feyenoord', 'Inter Milan'], ['Galatasaray', 'VfB Stuttgart'],
    ['Shakhtar Donetsk', 'Sporting CP'], ['Villarreal', 'Paris Saint-Germain'], ['LASK', 'Slovan Bratislava'],
    ['AEK Athens', 'Real Madrid'], ['Fenerbahçe', 'Liverpool'], ['RB Leipzig', 'Manchester City'],
    ['Manchester United', 'AS Roma'], ['Porto', 'Napoli'], ['PSV Eindhoven', 'Club Brugge'],
    ['Slavia Praha', 'Arsenal'], ['Lens', 'Como'], ['Viking FK Stavanger', 'Sabah FK'],
  ],
  // Matchday 5 — 24-25 Nov 2026
  [
    ['Arsenal', 'Borussia Dortmund'], ['Bodø/Glimt', 'LASK'], ['Como', 'AEK Athens'],
    ['Feyenoord', 'Porto'], ['Galatasaray', 'Aston Villa'], ['RB Leipzig', 'Lens'],
    ['Manchester City', 'Napoli'], ['Real Madrid', 'PSV Eindhoven'], ['Slovan Bratislava', 'Real Betis'],
    ['Atlético Madrid', 'Viking FK Stavanger'], ['Club Brugge', 'Liverpool'], ['Inter Milan', 'VfB Stuttgart'],
    ['Lille', 'Bayern Munich'], ['Paris Saint-Germain', 'AS Roma'], ['Sabah FK', 'Barcelona'],
    ['Shakhtar Donetsk', 'Fenerbahçe'], ['Slavia Praha', 'Villarreal'], ['Sporting CP', 'Manchester United'],
  ],
  // Matchday 6 — 8-9 Dec 2026
  [
    ['AEK Athens', 'Galatasaray'], ['Aston Villa', 'Paris Saint-Germain'], ['Barcelona', 'Manchester City'],
    ['Bayern Munich', 'Slavia Praha'], ['Manchester United', 'RB Leipzig'], ['Napoli', 'Club Brugge'],
    ['AS Roma', 'Sporting CP'], ['Viking FK Stavanger', 'Feyenoord'], ['Villarreal', 'Sabah FK'],
    ['Arsenal', 'Real Madrid'], ['Borussia Dortmund', 'Inter Milan'], ['Lens', 'Bodø/Glimt'],
    ['Liverpool', 'Porto'], ['LASK', 'Fenerbahçe'], ['PSV Eindhoven', 'Atlético Madrid'],
    ['Real Betis', 'Como'], ['Slovan Bratislava', 'Shakhtar Donetsk'], ['VfB Stuttgart', 'Lille'],
  ],
  // Matchday 7 — 19-20 Jan 2027
  [
    ['AEK Athens', 'AS Roma'], ['Aston Villa', 'Borussia Dortmund'], ['Bodø/Glimt', 'Atlético Madrid'],
    ['Galatasaray', 'Feyenoord'], ['Inter Milan', 'Liverpool'], ['Lille', 'Slovan Bratislava'],
    ['Porto', 'Slavia Praha'], ['Real Madrid', 'LASK'], ['VfB Stuttgart', 'Club Brugge'],
    ['Como', 'Paris Saint-Germain'], ['Fenerbahçe', 'Villarreal'], ['RB Leipzig', 'Shakhtar Donetsk'],
    ['Lens', 'Manchester City'], ['Manchester United', 'Bayern Munich'], ['Real Betis', 'Arsenal'],
    ['Sabah FK', 'Napoli'], ['Sporting CP', 'Barcelona'], ['Viking FK Stavanger', 'PSV Eindhoven'],
  ],
  // Matchday 8 — 27 Jan 2027
  [
    ['Arsenal', 'Sabah FK'], ['Atlético Madrid', 'Fenerbahçe'], ['Barcelona', 'Como'],
    ['Bayern Munich', 'Real Betis'], ['Borussia Dortmund', 'AEK Athens'], ['Club Brugge', 'Bodø/Glimt'],
    ['Feyenoord', 'RB Leipzig'], ['Liverpool', 'Lens'], ['Manchester City', 'Sporting CP'],
    ['Napoli', 'Viking FK Stavanger'], ['Paris Saint-Germain', 'Galatasaray'], ['PSV Eindhoven', 'VfB Stuttgart'],
    ['AS Roma', 'Lille'], ['Shakhtar Donetsk', 'Real Madrid'], ['Slavia Praha', 'Aston Villa'],
    ['Slovan Bratislava', 'Inter Milan'], ['Villarreal', 'Manchester United'], ['LASK', 'Porto'],
  ],
];