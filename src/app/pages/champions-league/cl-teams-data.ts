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
  { name: 'Slavia Prague',       country: 'Czech Republic', pot: 4, attack: 68, defense: 68, stamina: 78 },
  { name: 'Slovan Bratislava',   country: 'Slovakia',       pot: 4, attack: 63, defense: 64, stamina: 75 },
  { name: 'VfB Stuttgart',       country: 'Germany',        pot: 4, attack: 75, defense: 70, stamina: 81 },
  { name: 'LASK',                country: 'Austria',        pot: 4, attack: 62, defense: 63, stamina: 76 },
  { name: 'Como',                country: 'Italy',          pot: 4, attack: 68, defense: 65, stamina: 78 },
  { name: 'Lens',                country: 'France',         pot: 4, attack: 72, defense: 71, stamina: 79 },
  { name: 'Sabah FK',            country: 'Azerbaijan',     pot: 4, attack: 58, defense: 58, stamina: 74 },
  { name: 'Viking',              country: 'Norway',         pot: 4, attack: 60, defense: 61, stamina: 76 },
  { name: 'AEK Athens',          country: 'Greece',         pot: 4, attack: 66, defense: 65, stamina: 77 },
];

export const FINAL_INFO = {
  venue: 'Estadio Metropolitano',
  city: 'Madrid, Spain',
  date: '5 June 2027',
};
