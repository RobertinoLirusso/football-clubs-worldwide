import { Component, OnInit, OnDestroy } from '@angular/core';
import { ClubService } from '../../services/club.service';
import { SeoService } from '../../services/seo.service';
import { CL2026_TEAMS, CL2026_SCHEDULE, FINAL_INFO } from './cl-teams-data';

// ─── Types ────────────────────────────────────────────────────────────────

type GamePhase =
  | 'home' | 'select'
  | 'league_match' | 'league_result' | 'league_standings'
  | 'playoff_match' | 'playoff_extratime' | 'playoff_shootout' | 'playoff_result'
  | 'knockout_match' | 'knockout_extratime' | 'knockout_shootout' | 'knockout_result'
  | 'eliminated' | 'champion';

interface Team {
  name: string; logo: string; country: string; pot: 1 | 2 | 3 | 4;
  attack: number; defense: number; stamina: number; morale: number;
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

interface LeagueStanding {
  team: Team; played: number; won: number; drawn: number; lost: number;
  gf: number; ga: number; gd: number; points: number;
}

interface BracketSlot {
  home: Team | null; away: Team | null; winner: Team | null; matchIndex: number;
}

const KNOCKOUT_ROUND_NAMES = ['Round of 16', 'Quarter-final', 'Semi-final', 'Final'];

// ─── Component ──────────────────────────────────────────────────────────────

@Component({
  selector: 'app-champions-league',
  templateUrl: './champions-league.component.html',
  styleUrl: './champions-league.component.css',
})
export class ChampionsLeagueComponent implements OnInit, OnDestroy {
  readonly FINAL_INFO = FINAL_INFO;
  readonly KNOCKOUT_ROUND_NAMES = KNOCKOUT_ROUND_NAMES;

  allClubsData: any[] = [];
  phase: GamePhase = 'home';

  allTeams: Team[] = [];
  playerTeam: Team | null = null;
  searchQuery = '';

  // League phase (Swiss-style single table)
  leagueSchedule: MatchResult[][] = [];
  leagueMatchday = 0;
  leagueStandings: LeagueStanding[] = [];
  roundResults: MatchResult[] = [];

  // Playoff round (9th-24th)
  playoffPairs: Array<[Team, Team]> = [];
  currentPlayoffMatch: MatchResult | null = null;

  // Knockout (R16 → Final) — two-legged ties except the single-match Final
  knockoutRoundIndex = 0;
  knockoutPairs: Array<[Team, Team]> = [];
  currentKnockoutMatch: MatchResult | null = null;
  fullBracket: BracketSlot[][] = [];
  finalStage: 'regulation' | 'extratime' | 'shootout' = 'regulation';

  // Shared two-legged tie state (playoff + R16/QF/SF)
  tieTeam1: Team | null = null;
  tieTeam2: Team | null = null;
  currentTieLeg: 1 | 2 = 1;
  tieLeg1: MatchResult | null = null;
  tieAggregateTeam1 = 0;
  tieAggregateTeam2 = 0;
  tiePenalties?: { team1Score: number; team2Score: number };
  extraTimeGoals = { team1: 0, team2: 0 };
  tieContext: 'playoff' | 'knockout' | null = null;

  // Shared playback state
  currentMatch: MatchResult | null = null;
  currentEventIndex = 0;
  displayedEvents: MatchEvent[] = [];
  matchPlaying = false;
  private matchInterval: any = null;

  // Power-ups
  attackBoostsLeft = 3;
  defenseBoostsLeft = 3;
  refreshBoostsLeft = 3;
  matchAttackBoostUsed = false;
  matchDefenseBoostUsed = false;
  matchRefreshBoostUsed = false;

  // Pre-match kickoff gate
  awaitingKickoff = false;
  pendingHome: Team | null = null;
  pendingAway: Team | null = null;
  private kickoffAction: (() => void) | null = null;

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
      title: 'UEFA Champions League 2026-27 Simulator',
      description: 'Pick your club and simulate the 2026-27 UEFA Champions League — league phase, knockout playoffs and the road to the Metropolitano final!',
      keywords: 'champions league 2026, uefa champions league simulator, football game, soccer simulator',
      url: 'https://football-clubs-worldwide.vercel.app/champions-league',
      type: 'website',
    });
  }

  // ─── Build teams ──────────────────────────────────────────────────────────

  private normalize(s: string): string {
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  }

  private buildTeams(): void {
    this.allTeams = CL2026_TEAMS.map(t => {
      const tn = this.normalize(t.name);
      const match = this.allClubsData.find((c: any) => {
        const cn = this.normalize(c.club_name ?? '');
        return cn === tn || cn.includes(tn) || tn.includes(cn);
      });
      return {
        name: t.name, country: t.country, pot: t.pot,
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

  teamsByPot(): { pot: number; teams: Team[] }[] {
    return [1, 2, 3, 4].map(p => ({ pot: p, teams: this.allTeams.filter(t => t.pot === p) }));
  }

  selectTeam(team: Team): void { this.playerTeam = team; }

  confirmSelection(): void {
    if (!this.playerTeam) return;
    this.initTournament();
    this.phase = 'league_match';
    this.playNextLeagueMatchday();
  }

  // ─── League phase schedule (real UEFA fixtures) ──────────────────────────

  private initTournament(): void {
    this.leagueStandings = this.allTeams.map(t => ({
      team: t, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0,
    }));
    this.buildLeagueSchedule();
    this.leagueMatchday = 0;
    this.roundResults = [];
  }

  private buildLeagueSchedule(): void {
    const byName = new Map(this.allTeams.map(t => [t.name, t]));
    this.leagueSchedule = CL2026_SCHEDULE.map(round =>
      round
        .map(([homeName, awayName]) => {
          const home = byName.get(homeName), away = byName.get(awayName);
          if (!home || !away) {
            console.error(`Fixture desconocido en el calendario real: ${homeName} vs ${awayName}`);
            return null;
          }
          return this.buildMatch(home, away);
        })
        .filter((m): m is MatchResult => m !== null)
    );
  }

  private buildMatch(home: Team, away: Team): MatchResult {
    const isPlayer = home === this.playerTeam || away === this.playerTeam;
    const { homeGoals, awayGoals, events } = this.simulatePlayerAware(home, away, isPlayer);
    return { home, away, homeGoals, awayGoals, events, isPlayerMatch: isPlayer };
  }

  // ─── Power-ups ────────────────────────────────────────────────────────────

  private boostedTeam(team: Team): Team {
    if (team !== this.playerTeam) return team;
    if (!this.matchAttackBoostUsed && !this.matchDefenseBoostUsed && !this.matchRefreshBoostUsed) return team;
    let attack = team.attack, defense = team.defense;
    if (this.matchAttackBoostUsed) attack = Math.min(99, attack + 12);
    if (this.matchDefenseBoostUsed) defense = Math.min(99, defense + 12);
    if (this.matchRefreshBoostUsed) { attack = Math.min(99, attack + 6); defense = Math.min(99, defense + 6); }
    return { ...team, attack, defense };
  }

  private simulatePlayerAware(home: Team, away: Team, detailed: boolean, isFinal = false) {
    return this.simulateMatch(this.boostedTeam(home), this.boostedTeam(away), detailed, isFinal);
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

  private openKickoffGate(phase: GamePhase, home: Team, away: Team, action: () => void): void {
    this.matchAttackBoostUsed = false;
    this.matchDefenseBoostUsed = false;
    this.matchRefreshBoostUsed = false;
    this.pendingHome = home;
    this.pendingAway = away;
    this.kickoffAction = action;
    this.awaitingKickoff = true;
    this.phase = phase;
  }

  confirmKickoff(): void {
    this.awaitingKickoff = false;
    const action = this.kickoffAction;
    this.kickoffAction = null;
    if (action) action();
  }

  // ─── Simulation engine ────────────────────────────────────────────────────

  private simulateMatch(home: Team, away: Team, detailed: boolean, isFinal = false) {
    const homeAdvantage = 6;
    const homeMorale = this.rand(-10, 10);
    const awayMorale = this.rand(-10, 10);

    const homeStr = home.attack * 0.55 + (100 - away.defense) * 0.35
                   + home.stamina * 0.1 + homeAdvantage + homeMorale;
    const awayStr = away.attack * 0.55 + (100 - home.defense) * 0.35
                   + away.stamina * 0.1 + awayMorale;

    const homeGoals = this.goalsFromStrength(homeStr);
    const awayGoals = this.goalsFromStrength(awayStr);
    const events: MatchEvent[] = detailed
      ? this.generateEvents(home, away, homeGoals, awayGoals, homeStr, awayStr, isFinal)
      : [];
    return { homeGoals, awayGoals, events };
  }

  private goalsFromStrength(str: number): number {
    return this.poissonSample(Math.max(0.1, (str - 38) / 20));
  }

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

  private generateEvents(
    home: Team, away: Team, homeGoals: number, awayGoals: number,
    homeStr: number, awayStr: number, isFinal = false
  ): MatchEvent[] {
    const events: MatchEvent[] = [];
    const usedMins = new Set<number>([0, 45, 91]);
    const randMin = (from = 1, to = 90): number => {
      let m: number, tries = 0;
      do { m = this.rand(from, to); tries++; } while (usedMins.has(m) && tries < 40);
      usedMins.add(m);
      return m;
    };

    for (let i = 0; i < homeGoals; i++) {
      const min = randMin();
      events.push({ minute: min, type: 'goal', team: home.name, description: this.pickGoalDesc(home.name, min) });
    }
    for (let i = 0; i < awayGoals; i++) {
      const min = randMin();
      events.push({ minute: min, type: 'goal', team: away.name, description: this.pickGoalDesc(away.name, min) });
    }

    const dominantTeam = homeStr >= awayStr ? home : away;
    const weakerTeam = homeStr >= awayStr ? away : home;
    // La final tiene muchas menos incidencias — un partido más limpio y realista,
    // que además dura ~1 minuto de reproducción (ver startPlayback con totalDurationMs).
    const extraCount = isFinal ? this.rand(4, 8) : this.rand(10, 16);
    const pool = ['save', 'miss', 'yellow', 'foul', 'corner', 'offside', 'var'] as const;
    type PoolType = typeof pool[number];
    const descMap: Record<PoolType, (t: Team) => string> = {
      save:    t => `🧤 Big save! The ${t.name} goalkeeper denies a certain goal!`,
      miss:    t => `😬 ${t.name} rattles the crossbar! So close!`,
      yellow:  t => `🟨 Yellow card for ${t.name}.`,
      foul:    t => `🦵 Foul by ${t.name}, dangerous free kick conceded.`,
      corner:  t => `🚩 Corner for ${t.name}, set-piece chance.`,
      offside: t => `🚫 Offside! ${t.name}'s attack is called back.`,
      var:     _t => `📺 VAR is checking the play…`,
    };

    for (let i = 0; i < extraCount; i++) {
      const type: PoolType = pool[Math.floor(Math.random() * pool.length)];
      const useWeak = (type === 'foul' || type === 'yellow') && Math.random() < 0.65;
      const team = useWeak ? weakerTeam : (Math.random() < 0.55 ? dominantTeam : weakerTeam);
      events.push({ minute: randMin(), type, team: team.name, description: descMap[type](team) });
    }

    const htHome = events.filter(e => e.type === 'goal' && e.team === home.name && e.minute < 45).length;
    const htAway = events.filter(e => e.type === 'goal' && e.team === away.name && e.minute < 45).length;

    events.push({ minute: 0,  type: 'info' as any, team: '', description: `🏟️ Kick-off! ${home.name} vs ${away.name}.` });
    events.push({ minute: 45, type: 'info' as any, team: '', description: `⏸️ Half-time: ${home.name} ${htHome}–${htAway} ${away.name}.` });
    events.push({ minute: 91, type: 'info' as any, team: '', description: `🏁 Full time: ${home.name} ${homeGoals}–${awayGoals} ${away.name}.` });

    return events.sort((a, b) => a.minute - b.minute || (a.type === 'info' ? -1 : 1));
  }

  private pickGoalDesc(team: string, min: number): string {
    const pool = [
      `⚽ GOAL! ${team} breaks the deadlock in minute ${min}!`,
      `⚽ GOAL! Brilliant finish from ${team}!`,
      `⚽ GOAL! Header from a corner — ${team} strikes!`,
      `⚽ GOAL! ${team} scores from outside the box!`,
      `⚽ GOAL! ${team} punishes a defensive mistake!`,
      `⚽ GOAL! Cool finish from ${team} in the box!`,
      `⚽ GOAL! Long-range strike from ${team} — no chance for the keeper!`,
      `⚽ GOAL! One-on-one, and ${team} slots it home!`,
      `⚽ GOAL! ${team} extends their lead — Champions League class!`,
      `⚽ GOAL! Stunning free kick from ${team}!`,
    ];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // ─── Extra time (used in every tied knockout tie, incl. the final) ────────

  private simulateExtraTime(team1: Team, team2: Team): { t1: number; t2: number; events: MatchEvent[] } {
    const b1 = this.boostedTeam(team1), b2 = this.boostedTeam(team2);
    const str1 = b1.attack * 0.5 + (100 - b2.defense) * 0.3 + b1.stamina * 0.1;
    const str2 = b2.attack * 0.5 + (100 - b1.defense) * 0.3 + b2.stamina * 0.1;
    const g1 = this.poissonSample(Math.max(0.03, ((str1 - 38) / 20) * 0.35));
    const g2 = this.poissonSample(Math.max(0.03, ((str2 - 38) / 20) * 0.35));

    const events: MatchEvent[] = [
      { minute: 91, type: 'info' as any, team: '', description: `⏱️ Extra time begins! 30 more minutes to separate ${team1.name} and ${team2.name}.` },
    ];
    const usedMins = new Set<number>([91, 120]);
    const randMin = (): number => {
      let m: number, tries = 0;
      do { m = this.rand(92, 119); tries++; } while (usedMins.has(m) && tries < 20);
      usedMins.add(m);
      return m;
    };
    for (let i = 0; i < g1; i++) { const min = randMin(); events.push({ minute: min, type: 'goal', team: team1.name, description: this.pickGoalDesc(team1.name, min) }); }
    for (let i = 0; i < g2; i++) { const min = randMin(); events.push({ minute: min, type: 'goal', team: team2.name, description: this.pickGoalDesc(team2.name, min) }); }
    events.push({ minute: 120, type: 'info' as any, team: '', description: `🏁 End of extra time: ${team1.name} ${g1}-${g2} ${team2.name}.` });
    events.sort((a, b) => a.minute - b.minute || (a.type === 'info' ? -1 : 1));

    return { t1: g1, t2: g2, events };
  }

  private startExtraTime(context: 'playoff' | 'knockout'): void {
    const team1 = this.tieTeam1!, team2 = this.tieTeam2!;
    const { t1, t2, events } = this.simulateExtraTime(team1, team2);
    this.extraTimeGoals = { team1: t1, team2: t2 };
    const etMatch: MatchResult = { home: team1, away: team2, homeGoals: t1, awayGoals: t2, events, isPlayerMatch: true };
    this.tieContext = context;
    this.startPlayback(etMatch, context === 'playoff' ? 'playoff_extratime' : 'knockout_extratime');
  }

  confirmExtraTimeResult(): void {
    this.clearTimerInterval();
    this.matchPlaying = false;
    this.tieAggregateTeam1 += this.extraTimeGoals.team1;
    this.tieAggregateTeam2 += this.extraTimeGoals.team2;

    if (this.tieAggregateTeam1 === this.tieAggregateTeam2) {
      this.startShootout(this.tieContext!);
      return;
    }
    const winner = this.tieAggregateTeam1 > this.tieAggregateTeam2 ? this.tieTeam1! : this.tieTeam2!;
    if (this.tieContext === 'playoff') this.finishPlayoffTie(winner);
    else this.finishKnockoutTie(winner);
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
    while (s1 === s2) takeRound(); // muerte súbita
    return { team1: s1, team2: s2, kicks };
  }

  private buildShootoutEvents(team1: Team, team2: Team, kicks: Array<{ team: 1 | 2; scored: boolean }>): MatchEvent[] {
    const events: MatchEvent[] = [{
      minute: 0, type: 'info' as any, team: '',
      description: `🎯 ¡Tanda de penales! ${team1.name} vs ${team2.name}.`,
    }];
    let n1 = 0, n2 = 0;
    kicks.forEach((k, i) => {
      const team = k.team === 1 ? team1 : team2;
      const num = k.team === 1 ? ++n1 : ++n2;
      events.push(k.scored
        ? { minute: 121 + i, type: 'goal', team: team.name, description: `⚽ ¡Gol! ${team.name} convierte el penal ${num}.` }
        : { minute: 121 + i, type: 'miss', team: team.name, description: `❌ ¡Falla! ${team.name} desperdicia el penal ${num}.` });
    });
    return events;
  }

  private startShootout(context: 'playoff' | 'knockout'): void {
    const team1 = this.tieTeam1!, team2 = this.tieTeam2!;
    const { team1: s1, team2: s2, kicks } = this.simulateShootout();
    this.tiePenalties = { team1Score: s1, team2Score: s2 };
    const events = this.buildShootoutEvents(team1, team2, kicks);
    const shootoutMatch: MatchResult = { home: team1, away: team2, homeGoals: s1, awayGoals: s2, events, isPlayerMatch: true };
    this.tieContext = context;
    this.startPlayback(shootoutMatch, context === 'playoff' ? 'playoff_shootout' : 'knockout_shootout');
  }

  confirmShootoutResult(): void {
    this.clearTimerInterval();
    this.matchPlaying = false;
    const { team1Score, team2Score } = this.tiePenalties!;
    const tieWinner = team1Score > team2Score ? this.tieTeam1! : this.tieTeam2!;
    if (this.tieContext === 'playoff') this.finishPlayoffTie(tieWinner);
    else this.finishKnockoutTie(tieWinner);
  }

  private finishPlayoffTie(tieWinner: Team): void {
    if (tieWinner !== this.playerTeam) { this.phase = 'eliminated'; return; }
    const winners = this.playoffPairs.map(pair =>
      (pair[0] === this.playerTeam || pair[1] === this.playerTeam) ? this.playerTeam! : this.resolveTwoLeggedTie(pair[0], pair[1])
    );
    this.markPlayoffWinnersAndBuildR16(winners);
    this.phase = 'playoff_result';
  }

  private finishKnockoutTie(tieWinner: Team): void {
    if (tieWinner !== this.playerTeam) { this.phase = 'eliminated'; return; }
    const winners: Team[] = [];
    for (const [h, a] of this.knockoutPairs) {
      if (h === this.playerTeam || a === this.playerTeam) { winners.push(this.playerTeam); continue; }
      winners.push(this.resolveTwoLeggedTie(h, a));
    }
    const bracketSlotIndex = this.knockoutRoundIndex + 1;
    if (this.fullBracket[bracketSlotIndex]) {
      this.fullBracket[bracketSlotIndex].forEach((slot, i) => { if (i < this.knockoutPairs.length) slot.winner = winners[i]; });
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

  private finishFinal(m: MatchResult): void {
    const playerHome = m.home === this.playerTeam;
    let playerWins: boolean;
    if (m.penalties) {
      playerWins = playerHome ? m.penalties.homeScore > m.penalties.awayScore : m.penalties.awayScore > m.penalties.homeScore;
    } else {
      playerWins = playerHome ? m.homeGoals > m.awayGoals : m.awayGoals > m.homeGoals;
    }
    this.phase = playerWins ? 'champion' : 'eliminated';
  }

  // ─── League phase flow ──────────────────────────────────────────────────

  playNextLeagueMatchday(): void {
    if (this.leagueMatchday >= 8) {
      this.sortStandings();
      this.setupBracketDisplay();
      this.phase = 'league_standings';
      return;
    }
    this.roundResults = this.leagueSchedule[this.leagueMatchday];
    for (const m of this.roundResults) {
      if (!m.isPlayerMatch) this.applyToLeagueStandings(m);
    }
    const idx = this.roundResults.findIndex(m => m.isPlayerMatch);
    const original = this.roundResults[idx];
    this.openKickoffGate('league_match', original.home, original.away, () => {
      const rebuilt = this.buildMatch(original.home, original.away); // re-simula con comodines activos
      this.roundResults[idx] = rebuilt;
      this.leagueSchedule[this.leagueMatchday][idx] = rebuilt;
      this.startPlayback(rebuilt, 'league_match');
    });
  }

  confirmMatchResult(): void {
    this.clearTimerInterval();
    this.matchPlaying = false;
    if (this.currentMatch) this.applyToLeagueStandings(this.currentMatch);
    this.sortStandings();
    this.leagueMatchday++;
    this.phase = 'league_result';
  }

  continueAfterMatchday(): void {
    if (this.leagueMatchday >= 8) {
      this.sortStandings();
      this.setupBracketDisplay();
      this.phase = 'league_standings';
    } else {
      this.playNextLeagueMatchday();
    }
  }

  // Builds the full bracket (Playoff → R16 → QF → SF → Final) as soon as the
  // final league table is known, so the playoff pairings are visible right away.
  private setupBracketDisplay(): void {
    this.fullBracket = [];
    if (this.playerRank > 24) return;

    this.playoffPairs = this.buildPlayoffPairs();
    this.fullBracket[0] = this.playoffPairs.map(([h, a], i) => ({ home: h, away: a, winner: null, matchIndex: i }));
    const sizes = [8, 4, 2, 1]; // R16, QF, SF, Final
    for (let r = 0; r < sizes.length; r++) {
      this.fullBracket[r + 1] = Array.from({ length: sizes[r] }, (_, i) => ({ home: null, away: null, winner: null, matchIndex: i }));
    }
  }

  private applyToLeagueStandings(m: MatchResult): void {
    const hs = this.leagueStandings.find(s => s.team === m.home)!;
    const as_ = this.leagueStandings.find(s => s.team === m.away)!;
    hs.played++; as_.played++;
    hs.gf += m.homeGoals; hs.ga += m.awayGoals; hs.gd = hs.gf - hs.ga;
    as_.gf += m.awayGoals; as_.ga += m.homeGoals; as_.gd = as_.gf - as_.ga;
    if (m.homeGoals > m.awayGoals) { hs.won++; hs.points += 3; as_.lost++; }
    else if (m.homeGoals === m.awayGoals) { hs.drawn++; hs.points++; as_.drawn++; as_.points++; }
    else { as_.won++; as_.points += 3; hs.lost++; }
    this.sortStandings();
  }

  private sortStandings(): void {
    this.leagueStandings.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
  }

  get playerRank(): number {
    return this.leagueStandings.findIndex(s => s.team === this.playerTeam) + 1;
  }

  get playerQualStatus(): 'direct' | 'playoff' | 'out' {
    const r = this.playerRank;
    return r <= 8 ? 'direct' : r <= 24 ? 'playoff' : 'out';
  }

  get nonPlayerLeagueResults(): MatchResult[] {
    return (this.roundResults ?? []).filter(m => !m.isPlayerMatch);
  }

  get playoffPreviewPairs(): Array<[Team, Team]> {
    if (this.leagueStandings.length < 24 || this.playerQualStatus === 'out') return [];
    return this.buildPlayoffPairs();
  }

  isPlayerPair(pair: [Team, Team]): boolean {
    return pair[0] === this.playerTeam || pair[1] === this.playerTeam;
  }

  // ─── Transition: league → playoff / direct bye → knockout ──────────────

  proceedFromLeague(): void {
    const status = this.playerQualStatus;
    if (status === 'out') { this.phase = 'eliminated'; return; }

    if (status === 'direct') {
      const winners = this.playoffPairs.map(pair => this.resolveTwoLeggedTie(pair[0], pair[1]));
      this.markPlayoffWinnersAndBuildR16(winners);
      this.knockoutRoundIndex = 0;
      this.playKnockoutMatch();
    } else {
      this.playPlayoffMatch();
    }
  }

  private buildPlayoffPairs(): Array<[Team, Team]> {
    const seeded = this.leagueStandings.slice(8, 16).map(s => s.team);
    const unseeded = this.leagueStandings.slice(16, 24).map(s => s.team).reverse();
    return seeded.map((t, i) => [t, unseeded[i]] as [Team, Team]);
  }

  // Two-legged tie resolved instantly for CPU-vs-CPU pairs (sin comodines: nunca involucra al jugador).
  private resolveTwoLeggedTie(team1: Team, team2: Team): Team {
    const leg1 = this.simulateMatch(team1, team2, false);
    const leg2 = this.simulateMatch(team2, team1, false);
    const t1 = leg1.homeGoals + leg2.awayGoals;
    const t2 = leg1.awayGoals + leg2.homeGoals;
    if (t1 === t2) return Math.random() < 0.5 ? team1 : team2;
    return t1 > t2 ? team1 : team2;
  }

  private playTieLeg(returnPhase: 'playoff_match' | 'knockout_match'): void {
    const home = this.currentTieLeg === 1 ? this.tieTeam1! : this.tieTeam2!;
    const away = this.currentTieLeg === 1 ? this.tieTeam2! : this.tieTeam1!;
    const { homeGoals, awayGoals, events } = this.simulatePlayerAware(home, away, true);
    const match: MatchResult = { home, away, homeGoals, awayGoals, events, isPlayerMatch: true };
    if (returnPhase === 'playoff_match') this.currentPlayoffMatch = match;
    else this.currentKnockoutMatch = match;
    this.startPlayback(match, returnPhase);
  }

  playPlayoffMatch(): void {
    const pair = this.playoffPairs.find(([h, a]) => h === this.playerTeam || a === this.playerTeam)!;
    this.tieTeam1 = pair[0];
    this.tieTeam2 = pair[1];
    this.currentTieLeg = 1;
    this.tieLeg1 = null;
    this.tiePenalties = undefined;
    this.openKickoffGate('playoff_match', pair[0], pair[1], () => this.playTieLeg('playoff_match'));
  }

  confirmPlayoffResult(): void {
    if (!this.currentPlayoffMatch || !this.playerTeam) return;
    this.clearTimerInterval();
    this.matchPlaying = false;

    if (this.currentTieLeg === 1) {
      this.tieLeg1 = this.currentPlayoffMatch;
      this.currentTieLeg = 2;
      this.openKickoffGate('playoff_match', this.tieTeam2!, this.tieTeam1!, () => this.playTieLeg('playoff_match'));
      return;
    }

    const leg1 = this.tieLeg1!, leg2 = this.currentPlayoffMatch;
    this.tieAggregateTeam1 = leg1.homeGoals + leg2.awayGoals;
    this.tieAggregateTeam2 = leg1.awayGoals + leg2.homeGoals;

    if (this.tieAggregateTeam1 === this.tieAggregateTeam2) {
      this.startExtraTime('playoff');
      return;
    }
    this.tiePenalties = undefined;
    const tieWinner = this.tieAggregateTeam1 > this.tieAggregateTeam2 ? this.tieTeam1! : this.tieTeam2!;
    this.finishPlayoffTie(tieWinner);
  }

  private markPlayoffWinnersAndBuildR16(playoffWinners: Team[]): void {
    if (this.fullBracket[0]) {
      this.fullBracket[0].forEach((slot, i) => { if (i < playoffWinners.length) slot.winner = playoffWinners[i]; });
    }
    const top8 = this.leagueStandings.slice(0, 8).map(s => s.team);
    this.knockoutPairs = top8.map((t, i) => [t, playoffWinners[7 - i]] as [Team, Team]);
    if (this.fullBracket[1]) {
      this.fullBracket[1] = this.knockoutPairs.map(([h, a], i) => ({ home: h, away: a, winner: null, matchIndex: i }));
    }
  }

  continuePlayoffResult(): void {
    this.knockoutRoundIndex = 0;
    this.playKnockoutMatch();
  }

  // ─── Knockout flow (Round of 16 → Final) ────────────────────────────────

  private playKnockoutMatch(): void {
    const pair = this.knockoutPairs.find(([h, a]) => h === this.playerTeam || a === this.playerTeam);
    if (!pair) { this.phase = 'eliminated'; return; }

    const isFinal = this.knockoutRoundIndex === KNOCKOUT_ROUND_NAMES.length - 1;

    if (isFinal) {
      const [home, away] = pair;
      this.finalStage = 'regulation';
      this.openKickoffGate('knockout_match', home, away, () => {
        const { homeGoals, awayGoals, events } = this.simulatePlayerAware(home, away, true, true);
        this.currentKnockoutMatch = { home, away, homeGoals, awayGoals, events, isPlayerMatch: true };
        // La final se reproduce en ~1 minuto real (60000ms), sin importar la cantidad de incidencias.
        this.startPlayback(this.currentKnockoutMatch, 'knockout_match', 60000);
      });
      return;
    }

    this.tieTeam1 = pair[0];
    this.tieTeam2 = pair[1];
    this.currentTieLeg = 1;
    this.tieLeg1 = null;
    this.tiePenalties = undefined;
    this.openKickoffGate('knockout_match', pair[0], pair[1], () => this.playTieLeg('knockout_match'));
  }

  confirmKnockoutResult(): void {
    if (!this.currentKnockoutMatch || !this.playerTeam) return;
    this.clearTimerInterval();
    this.matchPlaying = false;

    const isFinal = this.knockoutRoundIndex === KNOCKOUT_ROUND_NAMES.length - 1;

    if (isFinal) {
      const m = this.currentKnockoutMatch;

      if (this.finalStage === 'regulation') {
        if (m.homeGoals === m.awayGoals) {
          this.finalStage = 'extratime';
          const { t1, t2, events } = this.simulateExtraTime(m.home, m.away);
          const etMatch: MatchResult = {
            home: m.home, away: m.away,
            homeGoals: m.homeGoals + t1, awayGoals: m.awayGoals + t2,
            events, isPlayerMatch: true,
          };
          this.currentKnockoutMatch = etMatch;
          this.startPlayback(etMatch, 'knockout_match');
          return;
        }
        this.finishFinal(m);
        return;
      }

      if (this.finalStage === 'extratime') {
        if (m.homeGoals === m.awayGoals) {
          this.finalStage = 'shootout';
          const { team1: s1, team2: s2, kicks } = this.simulateShootout();
          const events = this.buildShootoutEvents(m.home, m.away, kicks);
          const shootoutMatch: MatchResult = { ...m, events, penalties: { homeScore: s1, awayScore: s2 } };
          this.currentKnockoutMatch = shootoutMatch;
          this.startPlayback(shootoutMatch, 'knockout_match');
          return;
        }
        this.finishFinal(m);
        return;
      }

      // finalStage === 'shootout'
      this.finishFinal(m);
      return;
    }

    if (this.currentTieLeg === 1) {
      this.tieLeg1 = this.currentKnockoutMatch;
      this.currentTieLeg = 2;
      this.openKickoffGate('knockout_match', this.tieTeam2!, this.tieTeam1!, () => this.playTieLeg('knockout_match'));
      return;
    }

    const leg1 = this.tieLeg1!, leg2 = this.currentKnockoutMatch;
    this.tieAggregateTeam1 = leg1.homeGoals + leg2.awayGoals;
    this.tieAggregateTeam2 = leg1.awayGoals + leg2.homeGoals;

    if (this.tieAggregateTeam1 === this.tieAggregateTeam2) {
      this.startExtraTime('knockout');
      return;
    }
    this.tiePenalties = undefined;
    const tieWinner = this.tieAggregateTeam1 > this.tieAggregateTeam2 ? this.tieTeam1! : this.tieTeam2!;
    this.finishKnockoutTie(tieWinner);
  }

  continueKnockout(): void { this.playKnockoutMatch(); }

  get currentKnockoutRoundName(): string { return KNOCKOUT_ROUND_NAMES[this.knockoutRoundIndex] ?? 'Final'; }

  get isFinalRound(): boolean { return this.knockoutRoundIndex === KNOCKOUT_ROUND_NAMES.length - 1; }

  get bracketRounds(): { name: string; slots: BracketSlot[] }[] {
    return this.fullBracket.map((slots, i) => ({
      name: i === 0 ? 'Knockout Playoff' : (KNOCKOUT_ROUND_NAMES[i - 1] ?? ''),
      slots,
    }));
  }

  isPlayerSlot(slot: BracketSlot): boolean { return slot.home === this.playerTeam || slot.away === this.playerTeam; }

  // ─── Shared playback ─────────────────────────────────────────────────────

  private startPlayback(match: MatchResult, returnPhase: GamePhase, totalDurationMs?: number): void {
    this.clearTimerInterval();
    this.currentMatch = match;
    this.currentEventIndex = 0;
    this.displayedEvents = [];
    this.matchPlaying = true;
    this.phase = returnPhase;

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
      }
    }, interval);
  }

  onContinueClick(): void {
    switch (this.phase) {
      case 'league_match': this.confirmMatchResult(); break;
      case 'playoff_match': this.confirmPlayoffResult(); break;
      case 'knockout_match': this.confirmKnockoutResult(); break;
      case 'playoff_shootout':
      case 'knockout_shootout': this.confirmShootoutResult(); break;
      case 'playoff_extratime':
      case 'knockout_extratime': this.confirmExtraTimeResult(); break;
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

  matchOutcomeLabel(m: MatchResult): string { return this.playerWon(m) ? 'WIN' : this.playerDrew(m) ? 'DRAW' : 'LOSS'; }

  matchOutcomeClass(m: MatchResult): string {
    return this.playerWon(m) ? 'outcome-win' : this.playerDrew(m) ? 'outcome-draw' : 'outcome-loss';
  }

  isPlayerEvent(ev: MatchEvent): boolean { return ev.team === this.playerTeam?.name; }

  resetGame(): void {
    this.clearTimerInterval();
    this.phase = 'home'; this.playerTeam = null;
    this.leagueSchedule = []; this.leagueStandings = []; this.leagueMatchday = 0;
    this.playoffPairs = []; this.currentPlayoffMatch = null;
    this.knockoutPairs = []; this.knockoutRoundIndex = 0; this.currentKnockoutMatch = null;
    this.tieTeam1 = null; this.tieTeam2 = null; this.currentTieLeg = 1; this.tieLeg1 = null;
    this.tieAggregateTeam1 = 0; this.tieAggregateTeam2 = 0; this.tiePenalties = undefined;
    this.extraTimeGoals = { team1: 0, team2: 0 }; this.tieContext = null;
    this.currentMatch = null; this.displayedEvents = []; this.roundResults = [];
    this.searchQuery = ''; this.fullBracket = []; this.finalStage = 'regulation';
    this.attackBoostsLeft = 3; this.defenseBoostsLeft = 3; this.refreshBoostsLeft = 3;
    this.matchAttackBoostUsed = false; this.matchDefenseBoostUsed = false; this.matchRefreshBoostUsed = false;
    this.awaitingKickoff = false; this.pendingHome = null; this.pendingAway = null; this.kickoffAction = null;
  }

  // ─── Utils ────────────────────────────────────────────────────────────────

  private rand(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }
  private clearTimerInterval(): void { if (this.matchInterval) { clearInterval(this.matchInterval); this.matchInterval = null; } }

  trackByName(_: number, t: Team): string { return t.name; }
  trackByIdx(i: number): number { return i; }
  trackByPot(_: number, g: { pot: number }): number { return g.pot; }
}