import { Component, OnInit, OnDestroy } from '@angular/core';
import { ClubService } from '../../services/club.service';
import { SeoService } from '../../services/seo.service';
import { LPF2026_TEAMS, LPF2026_SCHEDULE, FINAL_INFO_LPF, Zone } from './lfp-teams-data';

// ─── Types ────────────────────────────────────────────────────────────────

type GamePhase =
  | 'home' | 'select'
  | 'league_match' | 'league_result' | 'league_standings'
  | 'knockout_match' | 'knockout_extratime' | 'knockout_shootout' | 'knockout_result'
  | 'eliminated' | 'fired' | 'resigned' | 'champion';

interface Team {
  name: string; logo: string; city: string; zone: Zone;
  attack: number; defense: number; stamina: number; morale: number;
  seedRank?: number;
}

interface MatchEvent {
  minute: number;
  type: 'goal' | 'yellow' | 'red' | 'save' | 'miss' | 'var' |
        'foul' | 'corner' | 'offside' | 'penalty' | 'info';
  team: string;
  description: string;
}

interface MatchResult {
  home: Team; away: Team;
  homeGoals: number; awayGoals: number;
  events: MatchEvent[];
  isPlayerMatch: boolean;
  penalties?: { homeScore: number; awayScore: number };
}

interface ZoneStanding {
  team: Team; played: number; won: number; drawn: number; lost: number;
  gf: number; ga: number; gd: number; points: number;
}

interface BracketSlot {
  home: Team | null; away: Team | null; winner: Team | null; matchIndex: number;
}

interface Formation {
  id: string; label: string; attackMod: number; defenseMod: number; description: string;
}

const KNOCKOUT_ROUND_NAMES = ['Octavos de Final', 'Cuartos de Final', 'Semifinal', 'Final'];
const MAX_LOSS_STREAK = 5;

const FORMATIONS: Formation[] = [
  { id: '4-4-2',   label: '4-4-2 · Equilibrado',      attackMod: 0,   defenseMod: 0,   description: 'Balance clásico entre control de mitad de cancha y salidas ofensivas.' },
  { id: '4-3-3',   label: '4-3-3 · Ofensivo',          attackMod: 12,  defenseMod: -8,  description: 'Extremos abiertos, pero deja espacios atrás.' },
  { id: '3-5-2',   label: '3-5-2 · Control',           attackMod: 4,   defenseMod: 4,   description: 'Superioridad numérica en el medio, carrileros dan ancho.' },
  { id: '4-2-3-1', label: '4-2-3-1 · Moderno',         attackMod: 7,   defenseMod: 1,   description: 'Doble cinco protege la línea de cuatro, libertad creativa arriba.' },
  { id: '3-4-3',   label: '3-4-3 · Todo ataque',       attackMod: 18,  defenseMod: -16, description: 'Máximo poder ofensivo, alto riesgo atrás.' },
  { id: '5-3-2',   label: '5-3-2 · Defensivo',         attackMod: -12, defenseMod: 16,  description: 'Cinco en el fondo, pensado para frustrar a un rival más fuerte.' },
  { id: '5-4-1',   label: '5-4-1 · Ultra defensivo',   attackMod: -20, defenseMod: 20,  description: 'Achicar espacios y salir de contra.' },
];

// ─── Component ──────────────────────────────────────────────────────────────

@Component({
  selector: 'app-liga-profesional',
  templateUrl: './liga-profesional.component.html',
  styleUrl: './liga-profesional.component.css',
})
export class LigaProfesionalComponent implements OnInit, OnDestroy {
  readonly FINAL_INFO = FINAL_INFO_LPF;
  readonly KNOCKOUT_ROUND_NAMES = KNOCKOUT_ROUND_NAMES;
  readonly FORMATIONS = FORMATIONS;
  readonly MAX_LOSS_STREAK = MAX_LOSS_STREAK;

  allClubsData: any[] = [];
  phase: GamePhase = 'home';

  allTeams: Team[] = [];
  playerTeam: Team | null = null;
  searchQuery = '';

  // Racha de derrotas → despido
  lossStreak = 0;

  // Renuncia
  showResignConfirm = false;

  // Fase de zonas (16 fechas)
  leagueSchedule: MatchResult[][] = [];
  leagueMatchday = 0;
  standingsA: ZoneStanding[] = [];
  standingsB: ZoneStanding[] = [];
  roundResults: MatchResult[] = [];

  // Knockout a partido único (octavos → final)
  knockoutRoundIndex = 0;
  knockoutPairs: Array<[Team, Team]> = [];
  currentKnockoutMatch: MatchResult | null = null;
  fullBracket: BracketSlot[][] = [];
  finalStage: 'regulation' | 'extratime' | 'shootout' = 'regulation';
  wentToExtraTime = false;
  extraTimeGoals = { home: 0, away: 0 };
  penalties?: { homeScore: number; awayScore: number };

  // Playback compartido
  currentMatch: MatchResult | null = null;
  currentEventIndex = 0;
  displayedEvents: MatchEvent[] = [];
  matchPlaying = false;
  private matchInterval: any = null;
  private playbackOnComplete: (() => void) | null = null;

  // Tácticas y power-ups
  selectedFormation: Formation = FORMATIONS[0];
  attackBoostsLeft = 3;
  defenseBoostsLeft = 3;
  refreshBoostsLeft = 3;
  matchAttackBoostUsed = false;
  matchDefenseBoostUsed = false;
  matchRefreshBoostUsed = false;

  // Pre-partido
  awaitingFormation = false;
  pendingHome: Team | null = null;
  pendingAway: Team | null = null;
  private formationAction: (() => void) | null = null;

  // Entretiempo
  atHalftime = false;
  halftimeHomeGoals = 0;
  halftimeAwayGoals = 0;
  private halftimeMatchCtx: { home: Team; away: Team; isFinal: boolean } | null = null;

  constructor(private clubService: ClubService, private seoService: SeoService) {}

  ngOnInit(): void {
    this.clubService.getClubs().subscribe(data => {
      this.allClubsData = data;
      this.buildTeams();
    });
    this.setupSeo();
  }

  ngOnDestroy(): void { this.clearTimerInterval(); }

  private setupSeo(): void {
    this.seoService.updateSeo({
      title: 'Torneo Clausura 2026 Simulator — Liga Profesional Argentina',
      description: 'Elegí tu club y simulá el Torneo Clausura 2026 de la Liga Profesional: fase de zonas, octavos de final y la definición en el Estadio Único de La Plata.',
      keywords: 'torneo clausura 2026, liga profesional argentina, simulador futbol argentino',
      url: 'https://football-clubs-worldwide.vercel.app/liga-argentina',
      type: 'website',
    });
  }

  // ─── Build teams ──────────────────────────────────────────────────────────

  private normalize(s: string): string {
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  }

  private buildTeams(): void {
    this.allTeams = LPF2026_TEAMS.map(t => {
      const tn = this.normalize(t.name);
      const match = this.allClubsData.find((c: any) => {
        const cn = this.normalize(c.club_name ?? '');
        return cn === tn || cn.includes(tn) || tn.includes(cn);
      });
      return {
        name: t.name, city: t.city, zone: t.zone,
        attack: t.attack, defense: t.defense, stamina: t.stamina,
        logo: match?.club_logo ?? '',
        morale: 80,
      };
    });
  }

  // ─── Selection screen ───────────────────────────────────────────────────

  get filteredTeams(): Team[] {
    const q = this.searchQuery.toLowerCase();
    return q ? this.allTeams.filter(t => t.name.toLowerCase().includes(q)) : this.allTeams;
  }

  teamsByZone(): { zone: Zone; teams: Team[] }[] {
    return (['A', 'B'] as Zone[]).map(z => ({ zone: z, teams: this.allTeams.filter(t => t.zone === z) }));
  }

  selectTeam(team: Team): void { this.playerTeam = team; }

  confirmSelection(): void {
    if (!this.playerTeam) return;
    this.initTournament();
    this.phase = 'league_match';
    this.playNextLeagueMatchday();
  }

  // ─── League phase (fase de zonas) ────────────────────────────────────────

  private initTournament(): void {
    this.standingsA = this.allTeams.filter(t => t.zone === 'A').map(t => this.emptyStanding(t));
    this.standingsB = this.allTeams.filter(t => t.zone === 'B').map(t => this.emptyStanding(t));
    this.buildLeagueSchedule();
    this.leagueMatchday = 0;
    this.roundResults = [];
    this.lossStreak = 0;
  }

  private emptyStanding(t: Team): ZoneStanding {
    return { team: t, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 };
  }

  private buildLeagueSchedule(): void {
    const byName = new Map(this.allTeams.map(t => [t.name, t]));
    this.leagueSchedule = LPF2026_SCHEDULE.map(round =>
      round
        .map(([homeName, awayName]) => {
          const home = byName.get(homeName), away = byName.get(awayName);
          if (!home || !away) {
            console.error(`Fixture desconocido: ${homeName} vs ${awayName}`);
            return null;
          }
          return this.buildMatch(home, away);
        })
        .filter((m): m is MatchResult => m !== null)
    );
  }

  private buildMatch(home: Team, away: Team): MatchResult {
    const isPlayer = home === this.playerTeam || away === this.playerTeam;
    const { homeGoals, awayGoals, events } = this.simulateMatch(home, away, false);
    return { home, away, homeGoals, awayGoals, events, isPlayerMatch: isPlayer };
  }

  playNextLeagueMatchday(): void {
    if (this.leagueMatchday >= LPF2026_SCHEDULE.length) {
      this.sortStandings();
      this.setupBracketDisplay();
      this.phase = 'league_standings';
      return;
    }
    this.roundResults = this.leagueSchedule[this.leagueMatchday];
    for (const m of this.roundResults) {
      if (!m.isPlayerMatch) this.applyToStandings(m);
    }
    const idx = this.roundResults.findIndex(m => m.isPlayerMatch);
    if (idx === -1) {
      // El jugador no tiene partido esta fecha (no debería pasar con este fixture, pero por las dudas)
      this.sortStandings();
      this.leagueMatchday++;
      this.playNextLeagueMatchday();
      return;
    }
    const original = this.roundResults[idx];
    this.openFormationGate('league_match', original.home, original.away, () =>
      this.playRegulationMatch(original.home, original.away, 'league_match', false));
  }

  confirmMatchResult(): void {
    this.clearTimerInterval();
    this.matchPlaying = false;
    if (this.currentMatch) {
      this.applyToStandings(this.currentMatch);
      this.registerPlayerMatchOutcome(this.currentMatch);
    }
    this.sortStandings();
    this.leagueMatchday++;
    if (this.lossStreak >= MAX_LOSS_STREAK) { this.phase = 'fired'; return; }
    this.phase = 'league_result';
  }

  continueAfterMatchday(): void {
    if (this.leagueMatchday >= LPF2026_SCHEDULE.length) {
      this.sortStandings();
      this.setupBracketDisplay();
      this.phase = 'league_standings';
    } else {
      this.playNextLeagueMatchday();
    }
  }

  private applyToStandings(m: MatchResult): void {
    const table = m.home.zone === 'A' ? this.standingsA : this.standingsB;
    const hs = table.find(s => s.team === m.home)!;
    const as_ = (m.away.zone === m.home.zone ? table : (m.away.zone === 'A' ? this.standingsA : this.standingsB)).find(s => s.team === m.away)!;
    hs.played++; as_.played++;
    hs.gf += m.homeGoals; hs.ga += m.awayGoals; hs.gd = hs.gf - hs.ga;
    as_.gf += m.awayGoals; as_.ga += m.homeGoals; as_.gd = as_.gf - as_.ga;
    if (m.homeGoals > m.awayGoals) { hs.won++; hs.points += 3; as_.lost++; }
    else if (m.homeGoals === m.awayGoals) { hs.drawn++; hs.points++; as_.drawn++; as_.points++; }
    else { as_.won++; as_.points += 3; hs.lost++; }
    this.sortStandings();
  }

  private sortStandings(): void {
    const cmp = (a: ZoneStanding, b: ZoneStanding) => b.points - a.points || b.gd - a.gd || b.gf - a.gf;
    this.standingsA.sort(cmp);
    this.standingsB.sort(cmp);
  }

  get playerZone(): Zone | null { return this.playerTeam?.zone ?? null; }

  get playerZoneStandings(): ZoneStanding[] {
    return this.playerZone === 'A' ? this.standingsA : this.playerZone === 'B' ? this.standingsB : [];
  }

  get playerRank(): number {
    return this.playerZoneStandings.findIndex(s => s.team === this.playerTeam) + 1;
  }

  get playerQualified(): boolean { return this.playerRank > 0 && this.playerRank <= 8; }

  get nonPlayerLeagueResults(): MatchResult[] {
    return (this.roundResults ?? []).filter(m => !m.isPlayerMatch);
  }

  // ─── Racha de derrotas → despido ─────────────────────────────────────────

  private registerPlayerMatchOutcome(m: MatchResult): void {
    const won = this.playerWon(m);
    const drew = this.playerDrew(m);
    if (won || drew) this.lossStreak = 0;
    else this.lossStreak++;
  }

  // ─── Renuncia ─────────────────────────────────────────────────────────────

  requestResign(): void { this.showResignConfirm = true; }
  cancelResign(): void { this.showResignConfirm = false; }
  confirmResign(): void {
    this.clearTimerInterval();
    this.showResignConfirm = false;
    this.phase = 'resigned';
  }

  // ─── Transición zona → octavos ────────────────────────────────────────────

  private setupBracketDisplay(): void {
    this.fullBracket = [];
    if (!this.playerQualified) return;
    this.knockoutPairs = this.buildRoundOf16Pairs();
    this.fullBracket[0] = this.knockoutPairs.map(([h, a], i) => ({ home: h, away: a, winner: null, matchIndex: i }));
    const sizes = [4, 2, 1];
    for (let r = 0; r < sizes.length; r++) {
      this.fullBracket[r + 1] = Array.from({ length: sizes[r] }, (_, i) => ({ home: null, away: null, winner: null, matchIndex: i }));
    }
  }

  // Seeding real de octavos según reglamento AFA:
  // A1-B8, B1-A8, A2-B7, B2-A7, A3-B6, B3-A6, A4-B5, B4-A5 (local: el mejor ubicado de cada cruce)
  private buildRoundOf16Pairs(): Array<[Team, Team]> {
    const A = this.standingsA.slice(0, 8).map(s => s.team);
    const B = this.standingsB.slice(0, 8).map(s => s.team);
    const pairs: Array<[Team, Team]> = [
      [A[0], B[7]], [B[0], A[7]],
      [A[1], B[6]], [B[1], A[6]],
      [A[2], B[5]], [B[2], A[5]],
      [A[3], B[4]], [B[3], A[4]],
    ];
    // Seed persistente: define quién es local en las rondas siguientes.
    // Nota: el cruce de cuartos/semis en adelante no está confirmado oficialmente por AFA;
    // se usa el bracket estándar (ganador P1 vs ganador P2, etc.).
    pairs.forEach(([h, a], i) => { h.seedRank = i * 2 + 1; a.seedRank = i * 2 + 2; });
    return pairs;
  }

  proceedFromLeague(): void {
    if (!this.playerQualified) { this.phase = 'eliminated'; return; }
    this.knockoutRoundIndex = 0;
    this.playKnockoutMatch();
  }

  // ─── Knockout (partido único, con prórroga y penales) ────────────────────

  private playKnockoutMatch(): void {
    const pair = this.knockoutPairs.find(([h, a]) => h === this.playerTeam || a === this.playerTeam);
    if (!pair) { this.phase = 'eliminated'; return; }

    const isFinal = this.knockoutRoundIndex === KNOCKOUT_ROUND_NAMES.length - 1;
    this.finalStage = 'regulation';
    this.wentToExtraTime = false;
    this.penalties = undefined;

    let home = pair[0], away = pair[1];
    if (!isFinal) {
      // Local: mejor seed (menor seedRank). Si no hay seed (no debería pasar), local = pair[0].
      const seedHome = home.seedRank ?? 99, seedAway = away.seedRank ?? 99;
      if (seedAway < seedHome) { home = pair[1]; away = pair[0]; }
    }

    this.openFormationGate('knockout_match', home, away, () =>
      this.playRegulationMatch(home, away, 'knockout_match', isFinal));
  }

  confirmKnockoutResult(): void {
    if (!this.currentMatch || !this.playerTeam) return;
    this.clearTimerInterval();
    this.matchPlaying = false;

    const m = this.currentMatch;
    this.currentKnockoutMatch = m;

    if (this.finalStage === 'regulation') {
      if (m.homeGoals === m.awayGoals) {
        this.finalStage = 'extratime';
        this.wentToExtraTime = true;
        const { t1, t2, events } = this.simulateExtraTime(m.home, m.away);
        this.extraTimeGoals = { home: t1, away: t2 };
        const etMatch: MatchResult = { home: m.home, away: m.away, homeGoals: m.homeGoals + t1, awayGoals: m.awayGoals + t2, events, isPlayerMatch: true };
        this.currentKnockoutMatch = etMatch;
        this.startPlayback(etMatch, 'knockout_match', 18000, undefined, false);
        return;
      }
      this.finishKnockoutMatch(m);
      return;
    }

    if (this.finalStage === 'extratime') {
      if (m.homeGoals === m.awayGoals) {
        this.finalStage = 'shootout';
        const { team1: s1, team2: s2, kicks } = this.simulateShootout();
        const events = this.buildShootoutEvents(m.home, m.away, kicks);
        this.penalties = { homeScore: s1, awayScore: s2 };
        const shootoutMatch: MatchResult = { ...m, events, penalties: this.penalties };
        this.currentKnockoutMatch = shootoutMatch;
        this.startPlayback(shootoutMatch, 'knockout_match');
        return;
      }
      this.finishKnockoutMatch(m);
      return;
    }

    // finalStage === 'shootout'
    this.finishKnockoutMatch(m);
  }

  private finishKnockoutMatch(m: MatchResult): void {
    const playerIsHome = m.home === this.playerTeam;
    let playerWon: boolean;
    if (m.penalties) {
      playerWon = playerIsHome ? m.penalties.homeScore > m.penalties.awayScore : m.penalties.awayScore > m.penalties.homeScore;
    } else {
      playerWon = playerIsHome ? m.homeGoals > m.awayGoals : m.awayGoals > m.homeGoals;
    }

    if (playerWon) this.lossStreak = 0; else this.lossStreak++;

    if (!playerWon) {
      if (this.lossStreak >= MAX_LOSS_STREAK) { this.phase = 'fired'; return; }
      this.phase = 'eliminated';
      return;
    }

    const isFinal = this.knockoutRoundIndex === KNOCKOUT_ROUND_NAMES.length - 1;
    if (isFinal) { this.phase = 'champion'; return; }

    // Resolver el resto de los cruces de la ronda (sin el jugador) para armar la siguiente ronda
    const winners: Team[] = [];
    for (const [h, a] of this.knockoutPairs) {
      if (h === this.playerTeam || a === this.playerTeam) { winners.push(this.playerTeam!); continue; }
      winners.push(this.resolveSingleLegTie(h, a));
    }

    const bracketSlotIndex = this.knockoutRoundIndex + 1;
    if (this.fullBracket[bracketSlotIndex]) {
      this.fullBracket[bracketSlotIndex].forEach((slot, i) => { if (i < winners.length) slot.winner = winners[i]; });
    }

    this.knockoutRoundIndex++;
    this.knockoutPairs = [];
    for (let i = 0; i < winners.length; i += 2) if (winners[i + 1]) this.knockoutPairs.push([winners[i], winners[i + 1]]);

    const nextBracketSlotIndex = this.knockoutRoundIndex + 1;
    if (this.fullBracket[nextBracketSlotIndex]) {
      this.fullBracket[nextBracketSlotIndex] = this.knockoutPairs.map(([h, a], i) => ({ home: h, away: a, winner: null, matchIndex: i }));
    }

    this.phase = 'knockout_result';
  }

  private resolveSingleLegTie(team1: Team, team2: Team): Team {
    const seed1 = team1.seedRank ?? 99, seed2 = team2.seedRank ?? 99;
    const home = seed2 < seed1 ? team2 : team1;
    const away = home === team1 ? team2 : team1;
    const reg = this.simulateMatch(home, away, false);
    if (reg.homeGoals !== reg.awayGoals) {
      const winner = reg.homeGoals > reg.awayGoals ? home : away;
      winner.seedRank = Math.min(home.seedRank ?? 99, away.seedRank ?? 99);
      return winner;
    }
    const { t1, t2 } = this.simulateExtraTime(home, away);
    if (t1 !== t2) {
      const winner = t1 > t2 ? home : away;
      winner.seedRank = Math.min(home.seedRank ?? 99, away.seedRank ?? 99);
      return winner;
    }
    const { team1: s1 } = this.simulateShootout();
    const winner = s1 > 0 && Math.random() < 0.5 ? home : away; // desempate por penales simplificado
    winner.seedRank = Math.min(home.seedRank ?? 99, away.seedRank ?? 99);
    return winner;
  }

  continueKnockout(): void { this.playKnockoutMatch(); }

  get currentKnockoutRoundName(): string { return KNOCKOUT_ROUND_NAMES[this.knockoutRoundIndex] ?? 'Final'; }
  get isFinalRound(): boolean { return this.knockoutRoundIndex === KNOCKOUT_ROUND_NAMES.length - 1; }

  get bracketRounds(): { name: string; slots: BracketSlot[] }[] {
    return this.fullBracket.map((slots, i) => ({ name: KNOCKOUT_ROUND_NAMES[i] ?? '', slots }));
  }

  isPlayerSlot(slot: BracketSlot): boolean { return slot.home === this.playerTeam || slot.away === this.playerTeam; }

  // ─── Tactic & power-ups ─────────────────────────────────────────────────

  private effectiveTeam(team: Team, applyFormation: boolean): Team {
    if (team !== this.playerTeam) return team;
    let attack = team.attack, defense = team.defense;
    if (applyFormation) {
      attack += this.selectedFormation.attackMod;
      defense += this.selectedFormation.defenseMod;
    }
    if (this.matchAttackBoostUsed) attack += 20;
    if (this.matchDefenseBoostUsed) defense += 20;
    if (this.matchRefreshBoostUsed) { attack += 12; defense += 12; }
    attack = Math.min(99, Math.max(20, attack));
    defense = Math.min(99, Math.max(20, defense));
    return { ...team, attack, defense };
  }

  useAttackBoost(): void {
    if (this.attackBoostsLeft <= 0 || this.matchAttackBoostUsed) return;
    this.attackBoostsLeft--; this.matchAttackBoostUsed = true;
  }
  useDefenseBoost(): void {
    if (this.defenseBoostsLeft <= 0 || this.matchDefenseBoostUsed) return;
    this.defenseBoostsLeft--; this.matchDefenseBoostUsed = true;
  }
  useRefreshBoost(): void {
    if (this.refreshBoostsLeft <= 0 || this.matchRefreshBoostUsed) return;
    this.refreshBoostsLeft--; this.matchRefreshBoostUsed = true;
  }

  private openFormationGate(phase: GamePhase, home: Team, away: Team, action: () => void): void {
    this.matchAttackBoostUsed = false;
    this.matchDefenseBoostUsed = false;
    this.matchRefreshBoostUsed = false;
    this.pendingHome = home;
    this.pendingAway = away;
    this.formationAction = action;
    this.awaitingFormation = true;
    this.phase = phase;
  }

  confirmFormation(): void {
    this.awaitingFormation = false;
    const action = this.formationAction;
    this.formationAction = null;
    if (action) action();
  }

  // ─── Simulation engine ────────────────────────────────────────────────────

  private simulateMatch(home: Team, away: Team, detailed: boolean) {
    const homeAdvantage = 6;
    const homeMorale = this.rand(-10, 10);
    const awayMorale = this.rand(-10, 10);

    const homeStr = home.attack * 0.55 + (100 - away.defense) * 0.35 + home.stamina * 0.1 + homeAdvantage + homeMorale;
    const awayStr = away.attack * 0.55 + (100 - home.defense) * 0.35 + away.stamina * 0.1 + awayMorale;

    const homeGoals = this.goalsFromStrength(homeStr);
    const awayGoals = this.goalsFromStrength(awayStr);
    const events: MatchEvent[] = detailed ? this.generateEvents(home, away, homeGoals, awayGoals, homeStr, awayStr) : [];
    return { homeGoals, awayGoals, events };
  }

  private goalsFromStrength(str: number): number { return this.poissonSample(Math.max(0.1, (str - 38) / 15)); }

  private poissonSample(avg: number): number {
    const r = Math.random();
    const e = Math.exp(-avg);
    let cumulative = 0;
    for (let k = 0; k <= 6; k++) {
      cumulative += e * Math.pow(avg, k) / this.factorial(k);
      if (r < cumulative) return k;
    }
    return 6;
  }

  private factorial(n: number): number { return n <= 1 ? 1 : n * this.factorial(n - 1); }

  private descMap(): Record<string, (t: Team) => string> {
    return {
      save:    t => `🧤 What a fantastic save! ${t.name}'s goalkeeper denies the goal!`,
      miss:    t => `😬 ${t.name} hits the crossbar! So close!`,
      yellow:  t => `🟨 Yellow card for ${t.name}.`,
      foul:    t => `🦵 Foul by ${t.name}, a dangerous free kick.`,
      corner:  t => `🚩 Corner kick for ${t.name}.`,
      offside: t => `🚫 Offside! ${t.name}'s attack is stopped.`,
      var:     _t => `📺 VAR is reviewing the play...`,
    };
  }

  private generateEvents(home: Team, away: Team, homeGoals: number, awayGoals: number, homeStr: number, awayStr: number): MatchEvent[] {
    const events: MatchEvent[] = [];
    const usedMins = new Set<number>([0, 45, 91]);
    const randMin = (from = 1, to = 90): number => {
      let m: number, tries = 0;
      do { m = this.rand(from, to); tries++; } while (usedMins.has(m) && tries < 40);
      usedMins.add(m);
      return m;
    };

    for (let i = 0; i < homeGoals; i++) { const min = randMin(); events.push({ minute: min, type: 'goal', team: home.name, description: this.pickGoalDesc(home.name, min) }); }
    for (let i = 0; i < awayGoals; i++) { const min = randMin(); events.push({ minute: min, type: 'goal', team: away.name, description: this.pickGoalDesc(away.name, min) }); }

    const dominantTeam = homeStr >= awayStr ? home : away;
    const weakerTeam = dominantTeam === home ? away : home;
    const extraCount = this.rand(10, 16);
    const pool = ['save', 'miss', 'yellow', 'foul', 'corner', 'offside', 'var'] as const;
    const descMap = this.descMap();
    for (let i = 0; i < extraCount; i++) {
      const type = pool[Math.floor(Math.random() * pool.length)];
      const useWeak = (type === 'foul' || type === 'yellow') && Math.random() < 0.65;
      const team = useWeak ? weakerTeam : (Math.random() < 0.55 ? dominantTeam : weakerTeam);
      events.push({ minute: randMin(), type, team: team.name, description: descMap[type](team) });
    }

    const htHome = events.filter(e => e.type === 'goal' && e.team === home.name && e.minute < 45).length;
    const htAway = events.filter(e => e.type === 'goal' && e.team === away.name && e.minute < 45).length;

    events.push({ minute: 0,  type: 'info' as any, team: '', description: `🏟️ ¡Arranca el partido! ${home.name} vs ${away.name}.` });
    events.push({ minute: 45, type: 'info' as any, team: '', description: `⏸️ Entretiempo: ${home.name} ${htHome}–${htAway} ${away.name}.` });
    events.push({ minute: 91, type: 'info' as any, team: '', description: `🏁 Final del partido: ${home.name} ${homeGoals}–${awayGoals} ${away.name}.` });

    return events.sort((a, b) => a.minute - b.minute || (a.type === 'info' ? -1 : 1));
  }

  private pickGoalDesc(team: string, min: number): string {
    const pool = [
      `⚽ ¡GOL! ${team} rompe el cero en el minuto ${min}!`,
      `⚽ ¡GOLAZO de ${team}!`,
      `⚽ ¡GOL de cabeza tras el córner, lo grita ${team}!`,
      `⚽ ¡GOL de ${team} desde afuera del área!`,
      `⚽ ¡GOL! ${team} castiga un error defensivo!`,
      `⚽ ¡GOL! Definición fría de ${team} dentro del área!`,
      `⚽ ¡GOLAZO de media distancia de ${team}, no hubo nada que hacer!`,
      `⚽ ¡GOL! Mano a mano y ${team} no perdona!`,
      `⚽ ¡GOL de ${team}, estira la ventaja!`,
      `⚽ ¡GOLAZO de tiro libre de ${team}!`,
    ];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // ─── Live regulation match ──────────────────────────────────────────────

  private simulateHalfGoals(home: Team, away: Team) {
    const homeAdvantage = 3;
    const homeMorale = this.rand(-6, 6);
    const awayMorale = this.rand(-6, 6);
    const homeStr = home.attack * 0.55 + (100 - away.defense) * 0.35 + home.stamina * 0.1 + homeAdvantage + homeMorale;
    const awayStr = away.attack * 0.55 + (100 - home.defense) * 0.35 + away.stamina * 0.1 + awayMorale;
    const homeGoals = this.poissonSample(Math.max(0.05, (homeStr - 38) / 15 / 2));
    const awayGoals = this.poissonSample(Math.max(0.05, (awayStr - 38) / 15 / 2));
    return { homeGoals, awayGoals };
  }

  private buildHalfEvents(home: Team, away: Team, homeGoals: number, awayGoals: number, half: 1 | 2, isFinal: boolean): MatchEvent[] {
    const events: MatchEvent[] = [];
    const minFrom = half === 1 ? 1 : 46;
    const minTo = half === 1 ? 45 : 90;
    const usedMins = new Set<number>();
    const randMin = (): number => {
      let m: number, tries = 0;
      do { m = this.rand(minFrom, minTo); tries++; } while (usedMins.has(m) && tries < 40);
      usedMins.add(m);
      return m;
    };

    for (let i = 0; i < homeGoals; i++) { const min = randMin(); events.push({ minute: min, type: 'goal', team: home.name, description: this.pickGoalDesc(home.name, min) }); }
    for (let i = 0; i < awayGoals; i++) { const min = randMin(); events.push({ minute: min, type: 'goal', team: away.name, description: this.pickGoalDesc(away.name, min) }); }

    const dominantTeam = (home.attack + home.defense) >= (away.attack + away.defense) ? home : away;
    const weakerTeam = dominantTeam === home ? away : home;
    const extraCount = isFinal ? this.rand(9, 15) : this.rand(5, 8);
    const pool = ['save', 'miss', 'yellow', 'foul', 'corner', 'offside', 'var'] as const;
    const descMap = this.descMap();
    for (let i = 0; i < extraCount; i++) {
      const type = pool[Math.floor(Math.random() * pool.length)];
      const useWeak = (type === 'foul' || type === 'yellow') && Math.random() < 0.65;
      const team = useWeak ? weakerTeam : (Math.random() < 0.55 ? dominantTeam : weakerTeam);
      events.push({ minute: randMin(), type, team: team.name, description: descMap[type](team) });
    }

    if (half === 1) events.push({ minute: 0, type: 'info' as any, team: '', description: `🏟️ ¡Arranca el partido! ${home.name} vs ${away.name}.` });
    else events.push({ minute: 46, type: 'info' as any, team: '', description: `▶️ ¡Arranca el complemento!` });

    return events.sort((a, b) => a.minute - b.minute || (a.type === 'info' ? -1 : 1));
  }

  private playRegulationMatch(home: Team, away: Team, phase: GamePhase, isFinal: boolean): void {
    const bHome = this.effectiveTeam(home, true), bAway = this.effectiveTeam(away, true);
    const { homeGoals: h1, awayGoals: a1 } = this.simulateHalfGoals(bHome, bAway);
    const half1Events = this.buildHalfEvents(home, away, h1, a1, 1, isFinal);
    const half1Match: MatchResult = { home, away, homeGoals: h1, awayGoals: a1, events: half1Events, isPlayerMatch: true };
    this.halftimeMatchCtx = { home, away, isFinal };
    this.startPlayback(half1Match, phase, isFinal ? 25000 : undefined, () => this.enterHalftime());
  }

  private enterHalftime(): void {
    this.atHalftime = true;
    this.halftimeHomeGoals = this.currentMatch?.homeGoals ?? 0;
    this.halftimeAwayGoals = this.currentMatch?.awayGoals ?? 0;
  }

  resumeSecondHalf(): void {
    const ctx = this.halftimeMatchCtx;
    if (!ctx) return;
    this.atHalftime = false;
    const bHome = this.effectiveTeam(ctx.home, true), bAway = this.effectiveTeam(ctx.away, true);
    const { homeGoals: h2, awayGoals: a2 } = this.simulateHalfGoals(bHome, bAway);
    const half2Events = this.buildHalfEvents(ctx.home, ctx.away, h2, a2, 2, ctx.isFinal);
    const totalHome = this.halftimeHomeGoals + h2;
    const totalAway = this.halftimeAwayGoals + a2;
    half2Events.push({ minute: 91, type: 'info' as any, team: '', description: `🏁 Final del partido: ${ctx.home.name} ${totalHome}–${totalAway} ${ctx.away.name}.` });
    half2Events.sort((a, b) => a.minute - b.minute || (a.type === 'info' ? -1 : 1));
    const fullMatch: MatchResult = { home: ctx.home, away: ctx.away, homeGoals: totalHome, awayGoals: totalAway, events: half2Events, isPlayerMatch: true };
    this.startPlayback(fullMatch, this.phase, ctx.isFinal ? 25000 : undefined, undefined, false);
  }

  // ─── Extra time ─────────────────────────────────────────────────────────

  private simulateExtraTime(team1: Team, team2: Team): { t1: number; t2: number; events: MatchEvent[] } {
    const b1 = this.effectiveTeam(team1, true), b2 = this.effectiveTeam(team2, true);
    const str1 = b1.attack * 0.5 + (100 - b2.defense) * 0.3 + b1.stamina * 0.1;
    const str2 = b2.attack * 0.5 + (100 - b1.defense) * 0.3 + b2.stamina * 0.1;
    const g1 = this.poissonSample(Math.max(0.03, ((str1 - 38) / 15) * 0.4));
    const g2 = this.poissonSample(Math.max(0.03, ((str2 - 38) / 15) * 0.4));

    const events: MatchEvent[] = [
      { minute: 91, type: 'info' as any, team: '', description: `⏱️ ¡Empieza la prórroga! 30 minutos para desempatar entre ${team1.name} y ${team2.name}.` },
    ];
    const usedMins = new Set<number>([91, 105, 106, 120]);
    const randMin = (from: number, to: number): number => {
      let m: number, tries = 0;
      do { m = this.rand(from, to); tries++; } while (usedMins.has(m) && tries < 20);
      usedMins.add(m);
      return m;
    };

    for (let i = 0; i < g1; i++) { const min = randMin(92, 119); events.push({ minute: min, type: 'goal', team: team1.name, description: this.pickGoalDesc(team1.name, min) }); }
    for (let i = 0; i < g2; i++) { const min = randMin(92, 119); events.push({ minute: min, type: 'goal', team: team2.name, description: this.pickGoalDesc(team2.name, min) }); }

    const dominantTeam = (str1 >= str2) ? team1 : team2;
    const weakerTeam = dominantTeam === team1 ? team2 : team1;
    const pool = ['save', 'miss', 'yellow', 'foul', 'corner', 'offside', 'var'] as const;
    const descMap = this.descMap();
    const extraCount = this.rand(6, 10);
    for (let i = 0; i < extraCount; i++) {
      const type = pool[Math.floor(Math.random() * pool.length)];
      const useWeak = (type === 'foul' || type === 'yellow') && Math.random() < 0.65;
      const team = useWeak ? weakerTeam : (Math.random() < 0.55 ? dominantTeam : weakerTeam);
      events.push({ minute: randMin(92, 119), type, team: team.name, description: descMap[type](team) });
    }

    const g1First = events.filter(e => e.type === 'goal' && e.team === team1.name && e.minute <= 105).length;
    const g2First = events.filter(e => e.type === 'goal' && e.team === team2.name && e.minute <= 105).length;
    events.push({ minute: 105, type: 'info' as any, team: '', description: `⏸️ Fin del primer tiempo de prórroga: ${team1.name} ${g1First}-${g2First} ${team2.name}.` });
    events.push({ minute: 106, type: 'info' as any, team: '', description: `▶️ ¡Arranca el segundo tiempo de la prórroga!` });
    events.push({ minute: 120, type: 'info' as any, team: '', description: `🏁 Fin de la prórroga: ${team1.name} ${g1}-${g2} ${team2.name}.` });
    events.sort((a, b) => a.minute - b.minute || (a.type === 'info' ? -1 : 1));

    return { t1: g1, t2: g2, events };
  }

  // ─── Penalty shootout ───────────────────────────────────────────────────

  private simulateShootout(): { team1: number; team2: number; kicks: Array<{ team: 1 | 2; scored: boolean }> } {
    const kicks: Array<{ team: 1 | 2; scored: boolean }> = [];
    let s1 = 0, s2 = 0;
    const takeRound = () => {
      const t1 = Math.random() < 0.76; kicks.push({ team: 1, scored: t1 }); if (t1) s1++;
      const t2 = Math.random() < 0.76; kicks.push({ team: 2, scored: t2 }); if (t2) s2++;
    };
    for (let round = 1; round <= 5; round++) takeRound();
    while (s1 === s2) takeRound();
    return { team1: s1, team2: s2, kicks };
  }

  private buildShootoutEvents(team1: Team, team2: Team, kicks: Array<{ team: 1 | 2; scored: boolean }>): MatchEvent[] {
    const events: MatchEvent[] = [{
      minute: 0, type: 'info' as any, team: '',
      description: `🎯 ¡Definición por penales! ${team1.name} vs ${team2.name}.`,
    }];
    let n1 = 0, n2 = 0;
    kicks.forEach((k, i) => {
      const team = k.team === 1 ? team1 : team2;
      const num = k.team === 1 ? ++n1 : ++n2;
      events.push(k.scored
        ? { minute: 121 + i, type: 'goal', team: team.name, description: `⚽ ¡Gol! ${team.name} convierte el penal ${num}.` }
        : { minute: 121 + i, type: 'miss', team: team.name, description: `❌ ¡Errado! ${team.name} falla el penal ${num}.` });
    });
    return events;
  }

  // ─── Shared playback ─────────────────────────────────────────────────────

  private startPlayback(
    match: MatchResult, returnPhase: GamePhase, totalDurationMs?: number,
    onComplete?: () => void, resetDisplay: boolean = true
  ): void {
    this.clearTimerInterval();
    this.currentMatch = match;
    this.currentEventIndex = 0;
    if (resetDisplay) this.displayedEvents = [];
    this.matchPlaying = true;
    this.phase = returnPhase;
    this.playbackOnComplete = onComplete ?? null;

    const events = match.events;
    const interval = totalDurationMs && events.length > 0
      ? Math.max(300, Math.floor(totalDurationMs / events.length))
      : 650;

    this.matchInterval = setInterval(() => {
      if (!this.currentMatch) return;
      if (this.currentEventIndex < this.currentMatch.events.length) {
        this.displayedEvents = [...this.displayedEvents, this.currentMatch.events[this.currentEventIndex]];
        this.currentEventIndex++;
      } else {
        this.clearTimerInterval();
        this.matchPlaying = false;
        const cb = this.playbackOnComplete;
        this.playbackOnComplete = null;
        if (cb) cb();
      }
    }, interval);
  }

  onContinueClick(): void {
    switch (this.phase) {
      case 'league_match': this.confirmMatchResult(); break;
      case 'knockout_match': this.confirmKnockoutResult(); break;
    }
  }

  liveScore(teamName: string): number {
    return this.displayedEvents.filter(e => e.type === 'goal' && e.team === teamName).length;
  }

  scoreLabel(m: MatchResult): string { return `${m.homeGoals} – ${m.awayGoals}`; }

  playerWon(m: MatchResult | null): boolean {
    if (!m || !this.playerTeam) return false;
    return m.home === this.playerTeam ? m.homeGoals > m.awayGoals : m.awayGoals > m.homeGoals;
  }

  playerDrew(m: MatchResult | null): boolean { return !!m && m.homeGoals === m.awayGoals; }

  matchOutcomeLabel(m: MatchResult): string { return this.playerWon(m) ? 'GANÓ' : this.playerDrew(m) ? 'EMPATÓ' : 'PERDIÓ'; }

  matchOutcomeClass(m: MatchResult): string {
    return this.playerWon(m) ? 'outcome-win' : this.playerDrew(m) ? 'outcome-draw' : 'outcome-loss';
  }

  isPlayerEvent(ev: MatchEvent): boolean { return ev.team === this.playerTeam?.name; }

  resetGame(): void {
    this.clearTimerInterval();
    this.phase = 'home'; this.playerTeam = null;
    this.leagueSchedule = []; this.standingsA = []; this.standingsB = []; this.leagueMatchday = 0;
    this.knockoutPairs = []; this.knockoutRoundIndex = 0; this.currentKnockoutMatch = null;
    this.wentToExtraTime = false; this.extraTimeGoals = { home: 0, away: 0 }; this.penalties = undefined;
    this.currentMatch = null; this.displayedEvents = []; this.roundResults = [];
    this.searchQuery = ''; this.fullBracket = []; this.finalStage = 'regulation';
    this.selectedFormation = FORMATIONS[0];
    this.attackBoostsLeft = 3; this.defenseBoostsLeft = 3; this.refreshBoostsLeft = 3;
    this.matchAttackBoostUsed = false; this.matchDefenseBoostUsed = false; this.matchRefreshBoostUsed = false;
    this.awaitingFormation = false; this.pendingHome = null; this.pendingAway = null; this.formationAction = null;
    this.atHalftime = false; this.halftimeHomeGoals = 0; this.halftimeAwayGoals = 0; this.halftimeMatchCtx = null;
    this.playbackOnComplete = null; this.lossStreak = 0; this.showResignConfirm = false;
  }

  // ─── Utils ────────────────────────────────────────────────────────────────

  private rand(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }
  private clearTimerInterval(): void { if (this.matchInterval) { clearInterval(this.matchInterval); this.matchInterval = null; } }

  trackByName(_: number, t: Team): string { return t.name; }
  trackByIdx(i: number): number { return i; }
  trackByZone(_: number, g: { zone: Zone }): string { return g.zone; }
  trackByFormation(_: number, f: Formation): string { return f.id; }
}