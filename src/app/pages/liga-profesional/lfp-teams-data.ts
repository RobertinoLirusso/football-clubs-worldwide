// Torneo Clausura 2026 — Liga Profesional Argentina
// Zonas reales, fixture real (16 fechas, fuente: 365scores.com / AFA) y bracket real de playoffs.
// El orden exacto de cuartos/semis NO está confirmado oficialmente (Wikipedia: "Order to be decided"),
// se usa el bracket estándar P1 vs P2, P3 vs P4, P5 vs P6, P7 vs P8.

export type Zone = 'A' | 'B';

export const LPF2026_TEAMS: Array<{
  name: string; zone: Zone; city: string;
  attack: number; defense: number; stamina: number;
}> = [
  // ─── Zona A ───
  { name: 'Boca Juniors',              zone: 'A', city: 'Buenos Aires',      attack: 78, defense: 76, stamina: 82 },
  { name: 'Vélez Sarsfield',           zone: 'A', city: 'Buenos Aires',      attack: 75, defense: 74, stamina: 81 },
  { name: 'Talleres (C)',              zone: 'A', city: 'Córdoba',           attack: 74, defense: 72, stamina: 80 },
  { name: 'Estudiantes (LP)',          zone: 'A', city: 'La Plata',          attack: 73, defense: 74, stamina: 80 },
  { name: 'Lanús',                     zone: 'A', city: 'Lanús',             attack: 71, defense: 68, stamina: 79 },
  { name: 'San Lorenzo',               zone: 'A', city: 'Buenos Aires',      attack: 69, defense: 66, stamina: 78 },
  { name: 'Independiente',             zone: 'A', city: 'Avellaneda',        attack: 70, defense: 63, stamina: 78 },
  { name: 'Unión',                     zone: 'A', city: 'Santa Fe',          attack: 68, defense: 64, stamina: 77 },
  { name: 'Instituto',                 zone: 'A', city: 'Córdoba',           attack: 63, defense: 62, stamina: 77 },
  { name: 'Platense',                  zone: 'A', city: 'Florida Este',      attack: 61, defense: 63, stamina: 76 },
  { name: 'Gimnasia y Esgrima (M)',    zone: 'A', city: 'Mendoza',           attack: 58, defense: 55, stamina: 75 },
  { name: 'Central Córdoba (SdE)',     zone: 'A', city: 'Santiago del Estero', attack: 58, defense: 57, stamina: 76 },
  { name: "Newell's Old Boys",         zone: 'A', city: 'Rosario',           attack: 57, defense: 55, stamina: 75 },
  { name: 'Defensa y Justicia',        zone: 'A', city: 'Florencio Varela',  attack: 60, defense: 56, stamina: 76 },
  { name: 'Deportivo Riestra',         zone: 'A', city: 'Buenos Aires',      attack: 55, defense: 57, stamina: 74 },

  // ─── Zona B ───
  { name: 'River Plate',               zone: 'B', city: 'Buenos Aires',      attack: 82, defense: 78, stamina: 84 },
  { name: 'Racing',                    zone: 'B', city: 'Avellaneda',        attack: 77, defense: 75, stamina: 82 },
  { name: 'Argentinos Juniors',        zone: 'B', city: 'Buenos Aires',      attack: 73, defense: 71, stamina: 80 },
  { name: 'Rosario Central',           zone: 'B', city: 'Rosario',           attack: 73, defense: 70, stamina: 80 },
  { name: 'Independiente Rivadavia',   zone: 'B', city: 'Mendoza',           attack: 74, defense: 69, stamina: 80 },
  { name: 'Belgrano',                  zone: 'B', city: 'Córdoba',           attack: 68, defense: 66, stamina: 78 },
  { name: 'Gimnasia y Esgrima (LP)',   zone: 'B', city: 'La Plata',          attack: 66, defense: 63, stamina: 77 },
  { name: 'Huracán',                   zone: 'B', city: 'Buenos Aires',      attack: 68, defense: 65, stamina: 78 },
  { name: 'Barracas Central',          zone: 'B', city: 'Buenos Aires',      attack: 64, defense: 64, stamina: 77 },
  { name: 'CA Tigre',                  zone: 'B', city: 'Victoria',          attack: 64, defense: 62, stamina: 77 },
  { name: 'Sarmiento de Junín',        zone: 'B', city: 'Junín',             attack: 60, defense: 61, stamina: 76 },
  { name: 'Banfield',                  zone: 'B', city: 'Banfield',          attack: 59, defense: 58, stamina: 76 },
  { name: 'Atlético Tucumán',          zone: 'B', city: 'Tucumán',           attack: 57, defense: 57, stamina: 75 },
  { name: 'Aldosivi',                  zone: 'B', city: 'Mar del Plata',     attack: 54, defense: 55, stamina: 74 },
  { name: 'Estudiantes de Río Cuarto', zone: 'B', city: 'Río Cuarto',        attack: 50, defense: 52, stamina: 73 },
];

export const FINAL_INFO_LPF = {
  venue: 'Estadio Único Diego Armando Maradona',
  city: 'La Plata, Argentina',
  date: '13 December 2026',
};

// Fixture real del Torneo Clausura 2026 — 16 fechas (fuente: 365scores.com, 22 jul 2026).
// Nombres normalizados contra LPF2026_TEAMS.
export const LPF2026_SCHEDULE: Array<Array<[string, string]>> = [
  // Fecha 1
  [
    ['Belgrano', 'Rosario Central'], ['Sarmiento de Junín', 'Argentinos Juniors'], ['Defensa y Justicia', 'Aldosivi'],
    ['Gimnasia y Esgrima (M)', 'Central Córdoba (SdE)'], ['Racing', 'Gimnasia y Esgrima (LP)'], ['Vélez Sarsfield', 'Instituto'],
    ['Huracán', 'Banfield'], ['Platense', 'Unión'], ['Estudiantes de Río Cuarto', 'CA Tigre'],
    ["Newell's Old Boys", 'Talleres (C)'], ['River Plate', 'Barracas Central'], ['Lanús', 'San Lorenzo'],
    ['Atlético Tucumán', 'Independiente Rivadavia'], ['Estudiantes (LP)', 'Independiente'], ['Deportivo Riestra', 'Boca Juniors'],
  ],
  // Fecha 2
  [
    ['San Lorenzo', 'Gimnasia y Esgrima (M)'], ['Banfield', 'Sarmiento de Junín'], ['Argentinos Juniors', 'Estudiantes de Río Cuarto'],
    ['Rosario Central', 'Racing'], ['Barracas Central', 'Aldosivi'], ['Defensa y Justicia', 'Deportivo Riestra'],
    ['Gimnasia y Esgrima (LP)', 'River Plate'], ['Instituto', 'Platense'], ['Independiente Rivadavia', 'Huracán'],
    ['Talleres (C)', 'Vélez Sarsfield'], ['Independiente', "Newell's Old Boys"], ['Central Córdoba (SdE)', 'Atlético Tucumán'],
    ['Boca Juniors', 'Estudiantes (LP)'], ['CA Tigre', 'Belgrano'], ['Unión', 'Lanús'],
  ],
  // Fecha 3
  [
    ['Gimnasia y Esgrima (M)', 'Unión'], ['Estudiantes de Río Cuarto', 'Banfield'], ['Belgrano', 'Argentinos Juniors'],
    ['Estudiantes (LP)', 'Defensa y Justicia'], ['Racing', 'CA Tigre'], ['Deportivo Riestra', 'Barracas Central'],
    ['Aldosivi', 'Gimnasia y Esgrima (LP)'], ["Newell's Old Boys", 'Boca Juniors'], ['River Plate', 'Rosario Central'],
    ['Lanús', 'Instituto'], ['Sarmiento de Junín', 'Independiente Rivadavia'], ['Platense', 'Talleres (C)'],
    ['Vélez Sarsfield', 'Independiente'], ['Central Córdoba (SdE)', 'San Lorenzo'], ['Huracán', 'Atlético Tucumán'],
  ],
  // Fecha 4
  [
    ['Unión', 'Central Córdoba (SdE)'], ['Rosario Central', 'Aldosivi'], ['Argentinos Juniors', 'Racing'],
    ['CA Tigre', 'River Plate'], ['Defensa y Justicia', "Newell's Old Boys"], ['Banfield', 'Belgrano'],
    ['Independiente', 'Platense'], ['Atlético Tucumán', 'Sarmiento de Junín'], ['San Lorenzo', 'Huracán'],
    ['Instituto', 'Gimnasia y Esgrima (M)'], ['Boca Juniors', 'Vélez Sarsfield'], ['Gimnasia y Esgrima (LP)', 'Barracas Central'],
    ['Deportivo Riestra', 'Estudiantes (LP)'], ['Talleres (C)', 'Lanús'], ['Independiente Rivadavia', 'Estudiantes de Río Cuarto'],
  ],
  // Fecha 5
  [
    ['Aldosivi', 'CA Tigre'], ['River Plate', 'Argentinos Juniors'], ['Lanús', 'Independiente'],
    ['San Lorenzo', 'Unión'], ['Vélez Sarsfield', 'Defensa y Justicia'], ['Racing', 'Banfield'],
    ['Gimnasia y Esgrima (M)', 'Talleres (C)'], ['Sarmiento de Junín', 'Huracán'], ['Estudiantes de Río Cuarto', 'Atlético Tucumán'],
    ['Belgrano', 'Independiente Rivadavia'], ['Estudiantes (LP)', 'Gimnasia y Esgrima (LP)'], ['Platense', 'Boca Juniors'],
    ['Barracas Central', 'Rosario Central'], ['Central Córdoba (SdE)', 'Instituto'], ["Newell's Old Boys", 'Deportivo Riestra'],
  ],
  // Fecha 6 — Interzonal
  [
    ['Belgrano', 'Defensa y Justicia'], ['Sarmiento de Junín', 'Estudiantes (LP)'], ['Racing', 'Boca Juniors'],
    ['Atlético Tucumán', 'Instituto'], ['Gimnasia y Esgrima (LP)', 'Gimnasia y Esgrima (M)'], ['Talleres (C)', 'Rosario Central'],
    ['Barracas Central', 'Platense'], ['Independiente', 'Independiente Rivadavia'], ["Newell's Old Boys", 'Banfield'],
    ['Huracán', 'Deportivo Riestra'], ['CA Tigre', 'Central Córdoba (SdE)'], ['Estudiantes de Río Cuarto', 'San Lorenzo'],
    ['River Plate', 'Vélez Sarsfield'], ['Aldosivi', 'Unión'], ['Lanús', 'Argentinos Juniors'],
  ],
  // Fecha 7
  [
    ['Defensa y Justicia', 'Platense'], ['Instituto', 'San Lorenzo'], ['Atlético Tucumán', 'Belgrano'],
    ['Talleres (C)', 'Central Córdoba (SdE)'], ['Independiente', 'Gimnasia y Esgrima (M)'], ['CA Tigre', 'Barracas Central'],
    ['Rosario Central', 'Gimnasia y Esgrima (LP)'], ['Deportivo Riestra', 'Vélez Sarsfield'], ['Estudiantes (LP)', "Newell's Old Boys"],
    ['Unión', 'Sarmiento de Junín'], ['Independiente Rivadavia', 'Racing'], ['Huracán', 'Estudiantes de Río Cuarto'],
    ['Banfield', 'River Plate'], ['Boca Juniors', 'Lanús'], ['Argentinos Juniors', 'Aldosivi'],
  ],
  // Fecha 8
  [
    ['Gimnasia y Esgrima (M)', 'Boca Juniors'], ['Central Córdoba (SdE)', 'Independiente'], ['San Lorenzo', 'Talleres (C)'],
    ['Rosario Central', "Newell's Old Boys"], ['Barracas Central', 'Argentinos Juniors'], ['Unión', 'Instituto'],
    ['Lanús', 'Defensa y Justicia'], ['Gimnasia y Esgrima (LP)', 'CA Tigre'], ['Aldosivi', 'Banfield'],
    ['Platense', 'Deportivo Riestra'], ['Vélez Sarsfield', 'Estudiantes (LP)'], ['River Plate', 'Independiente Rivadavia'],
    ['Belgrano', 'Huracán'], ['Estudiantes de Río Cuarto', 'Sarmiento de Junín'], ['Racing', 'Atlético Tucumán'],
  ],
  // Fecha 9
  [
    ['Banfield', 'Barracas Central'], ['Deportivo Riestra', 'Lanús'], ['Boca Juniors', 'Central Córdoba (SdE)'],
    ['Independiente', 'San Lorenzo'], ['Talleres (C)', 'Unión'], ['Estudiantes (LP)', 'Platense'],
    ['Independiente Rivadavia', 'Aldosivi'], ['CA Tigre', 'Rosario Central'], ['Huracán', 'Racing'],
    ['Argentinos Juniors', 'Gimnasia y Esgrima (LP)'], ['Sarmiento de Junín', 'Belgrano'], ['Atlético Tucumán', 'River Plate'],
    ['Defensa y Justicia', 'Gimnasia y Esgrima (M)'], ["Newell's Old Boys", 'Vélez Sarsfield'], ['Instituto', 'Estudiantes de Río Cuarto'],
  ],
  // Fecha 10
  [
    ['Vélez Sarsfield', 'CA Tigre'], ['Unión', 'Independiente'], ['Platense', "Newell's Old Boys"],
    ['Racing', 'Sarmiento de Junín'], ['Gimnasia y Esgrima (LP)', 'Banfield'], ['Rosario Central', 'Argentinos Juniors'],
    ['San Lorenzo', 'Boca Juniors'], ['Barracas Central', 'Independiente Rivadavia'], ['Aldosivi', 'Atlético Tucumán'],
    ['Gimnasia y Esgrima (M)', 'Deportivo Riestra'], ['Central Córdoba (SdE)', 'Defensa y Justicia'], ['Instituto', 'Talleres (C)'],
    ['Belgrano', 'Estudiantes de Río Cuarto'], ['River Plate', 'Huracán'], ['Lanús', 'Estudiantes (LP)'],
  ],
  // Fecha 11
  [
    ['Vélez Sarsfield', 'Platense'], ['Banfield', 'Rosario Central'], ['Independiente Rivadavia', 'Gimnasia y Esgrima (LP)'],
    ['Talleres (C)', 'Belgrano'], ['Sarmiento de Junín', 'River Plate'], ['Boca Juniors', 'Unión'],
    ['Argentinos Juniors', 'CA Tigre'], ['Atlético Tucumán', 'Barracas Central'], ['Huracán', 'Aldosivi'],
    ['Defensa y Justicia', 'San Lorenzo'], ['Estudiantes de Río Cuarto', 'Racing'], ['Independiente', 'Instituto'],
    ["Newell's Old Boys", 'Lanús'], ['Deportivo Riestra', 'Central Córdoba (SdE)'], ['Estudiantes (LP)', 'Gimnasia y Esgrima (M)'],
  ],
  // Fecha 12
  [
    ['CA Tigre', 'Banfield'], ['Gimnasia y Esgrima (LP)', 'Atlético Tucumán'], ['Lanús', 'Vélez Sarsfield'],
    ['Gimnasia y Esgrima (M)', "Newell's Old Boys"], ['Unión', 'Defensa y Justicia'], ['Talleres (C)', 'Independiente'],
    ['Racing', 'Belgrano'], ['Aldosivi', 'Sarmiento de Junín'], ['River Plate', 'Estudiantes de Río Cuarto'],
    ['Instituto', 'Boca Juniors'], ['Rosario Central', 'Independiente Rivadavia'], ['Platense', 'Argentinos Juniors'],
    ['Central Córdoba (SdE)', 'Estudiantes (LP)'], ['Barracas Central', 'Huracán'], ['San Lorenzo', 'Deportivo Riestra'],
  ],
  // Fecha 13
  [
    ['Platense', 'Lanús'], ['Sarmiento de Junín', 'Barracas Central'], ['Independiente Rivadavia', 'CA Tigre'],
    ['Boca Juniors', 'Talleres (C)'], ['Vélez Sarsfield', 'Gimnasia y Esgrima (M)'], ['Deportivo Riestra', 'Unión'],
    ['Estudiantes (LP)', 'San Lorenzo'], ['Estudiantes de Río Cuarto', 'Aldosivi'], ['Racing', 'Independiente'],
    ['Atlético Tucumán', 'Rosario Central'], ['Huracán', 'Gimnasia y Esgrima (LP)'], ['Belgrano', 'River Plate'],
    ["Newell's Old Boys", 'Central Córdoba (SdE)'], ['Banfield', 'Argentinos Juniors'], ['Defensa y Justicia', 'Instituto'],
  ],
  // Fecha 14
  [
    ['Aldosivi', 'Belgrano'], ['Instituto', 'Deportivo Riestra'], ['Argentinos Juniors', 'Independiente Rivadavia'],
    ['Unión', 'Estudiantes (LP)'], ['Independiente', 'Boca Juniors'], ['Barracas Central', 'Estudiantes de Río Cuarto'],
    ['San Lorenzo', "Newell's Old Boys"], ['Gimnasia y Esgrima (M)', 'Platense'], ['CA Tigre', 'Atlético Tucumán'],
    ['Rosario Central', 'Huracán'], ['River Plate', 'Racing'], ['Gimnasia y Esgrima (LP)', 'Sarmiento de Junín'],
    ['Talleres (C)', 'Defensa y Justicia'], ['Banfield', 'Lanús'], ['Central Córdoba (SdE)', 'Vélez Sarsfield'],
  ],
  // Fecha 15
  [
    ["Newell's Old Boys", 'Unión'], ['Estudiantes de Río Cuarto', 'Gimnasia y Esgrima (LP)'], ['Estudiantes (LP)', 'Instituto'],
    ['Defensa y Justicia', 'Independiente'], ['Atlético Tucumán', 'Argentinos Juniors'], ['Racing', 'Aldosivi'],
    ['Boca Juniors', 'River Plate'], ['Sarmiento de Junín', 'Rosario Central'], ['Deportivo Riestra', 'Talleres (C)'],
    ['Belgrano', 'Barracas Central'], ['Platense', 'Central Córdoba (SdE)'], ['Independiente Rivadavia', 'Banfield'],
    ['Vélez Sarsfield', 'San Lorenzo'], ['Lanús', 'Gimnasia y Esgrima (M)'], ['Huracán', 'CA Tigre'],
  ],
  // Fecha 16
  [
    ['Boca Juniors', 'Defensa y Justicia'], ['Independiente', 'Deportivo Riestra'], ['Rosario Central', 'Estudiantes de Río Cuarto'],
    ['Central Córdoba (SdE)', 'Lanús'], ['Barracas Central', 'Racing'], ['San Lorenzo', 'Platense'],
    ['Talleres (C)', 'Estudiantes (LP)'], ['CA Tigre', 'Sarmiento de Junín'], ['Aldosivi', 'River Plate'],
    ['Gimnasia y Esgrima (M)', 'Independiente Rivadavia'], ['Instituto', "Newell's Old Boys"], ['Gimnasia y Esgrima (LP)', 'Belgrano'],
    ['Banfield', 'Atlético Tucumán'], ['Unión', 'Vélez Sarsfield'], ['Argentinos Juniors', 'Huracán'],
  ],
];