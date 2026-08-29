import { Component, OnInit, OnDestroy } from '@angular/core';
import { ClubService } from '../../services/club.service';
import { SeoService } from '../../services/seo.service';
import { CL2026_TEAMS, CL2026_FIXTURES, CL2026_AWAY, FINAL_INFO } from './cl-teams-data';

// ─── Types ────────────────────────────────────────────────────────────────

type GamePhase =
  | 'home' | 'select'
  | 'league_match' | 'league_result' | 'league_standings'
  | 'playoff_match' | 'playoff_result'
  | 'knockout_match' | 'knockout_result'
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

  // Knockout (R16 → Final)
  knockoutRoundIndex = 0;
  knockoutPairs: Array<[Team, Team]> = [];
  currentKnockoutMatch: MatchResult | null = null;
  fullBracket: BracketSlot[][] = [];

  // Shared playback state
  currentMatch: MatchResult | null = null;
  currentEventIndex = 0;
  displayedEvents: MatchEvent[] = [];
  matchPlaying = false;
  private matchInterval: any = null;

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

  // ─── League phase schedule (Swiss-style, round-robin circle method) ──────

  private initTournament(): void {
    this.leagueStandings = this.allTeams.map(t => ({
      team: t, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0,
    }));
    this.buildLeagueSchedule();
    this.leagueMatchday = 0;
    this.roundResults = [];
  }

  private buildLeagueSchedule(): void {
    // Real fixtures from the 27 Aug 2026 draw. UEFA hasn't published which
    // matchday each fixture falls on yet (due 29 Aug), so we distribute the
    // 144 fixed fixtures into 8 matchdays by extracting a perfect matching
    // (18 pairs covering all 36 teams) per round via backtracking.
    const byName = new Map(this.allTeams.map(t => [t.name, t]));
    const adjMaster = new Map<string, Set<string>>();
    for (const t of this.allTeams) adjMaster.set(t.name, new Set());

    const addEdge = (a: string, b: string) => {
      if (!adjMaster.has(a) || !adjMaster.has(b)) return;
      adjMaster.get(a)!.add(b);
      adjMaster.get(b)!.add(a);
    };
    for (const [homeName, awayNames] of Object.entries(CL2026_FIXTURES)) {
      for (const awayName of awayNames) addEdge(homeName, awayName);
    }
    for (const [teamName, oppNames] of Object.entries(CL2026_AWAY)) {
      for (const oppName of oppNames) addEdge(teamName, oppName);
    }

    let rounds: Array<Array<[Team, Team]>> = [];
    for (let attempt = 0; attempt < 40 && rounds.length < 8; attempt++) {
      const adj = new Map<string, Set<string>>();
      for (const [k, v] of adjMaster) adj.set(k, new Set(v));

      const tryRounds: Array<Array<[Team, Team]>> = [];
      let success = true;
      for (let r = 0; r < 8; r++) {
        const matching = this.findPerfectMatching(this.allTeams, adj);
        if (!matching) { success = false; break; }
        for (const [a, b] of matching) {
          adj.get(a.name)!.delete(b.name);
          adj.get(b.name)!.delete(a.name);
        }
        tryRounds.push(matching);
      }
      if (success) rounds = tryRounds;
    }

    this.leagueSchedule = rounds.map(pairs => pairs.map(([t1, t2]) => {
      const t1DeclaredHome = CL2026_FIXTURES[t1.name]?.includes(t2.name);
      const t2DeclaredHome = CL2026_FIXTURES[t2.name]?.includes(t1.name);
      let home: Team, away: Team;
      if (t1DeclaredHome) { home = t1; away = t2; }
      else if (t2DeclaredHome) { home = t2; away = t1; }
      else { [home, away] = t1.name < t2.name ? [t1, t2] : [t2, t1]; } // rare source conflict — deterministic fallback
      return this.buildMatch(home, away);
    }));

    if (this.leagueSchedule.length < 8) {
      console.error('Could not build a valid 8-matchday league schedule from the fixed fixtures.');
    }
  }

  // Backtracking perfect matching with minimum-remaining-options heuristic —
  // reliable on graphs this small (36 nodes) even as degree shrinks each round.
  private findPerfectMatching(nodes: Team[], adj: Map<string, Set<string>>): Array<[Team, Team]> | null {
    const nodeByName = new Map(nodes.map(t => [t.name, t]));
    const remaining = new Set(nodes.map(t => t.name));
    const result: Array<[Team, Team]> = [];

    const backtrack = (): boolean => {
      if (remaining.size === 0) return true;

      let bestNode: string | null = null;
      let bestOptions: string[] = [];
      for (const n of remaining) {
        const opts = [...(adj.get(n) ?? [])].filter(o => remaining.has(o));
        if (bestNode === null || opts.length < bestOptions.length) {
          bestNode = n; bestOptions = opts;
          if (opts.length === 0) break;
        }
      }
      if (bestNode === null) return true;
      if (bestOptions.length === 0) return false;

      for (const opt of this.shuffle(bestOptions)) {
        remaining.delete(bestNode); remaining.delete(opt);
        result.push([nodeByName.get(bestNode)!, nodeByName.get(opt)!]);
        if (backtrack()) return true;
        result.pop();
        remaining.add(bestNode); remaining.add(opt);
      }
      return false;
    };

    return backtrack() ? result : null;
  }

  private shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  private buildMatch(home: Team, away: Team): MatchResult {
    const isPlayer = home === this.playerTeam || away === this.playerTeam;
    const { homeGoals, awayGoals, events } = this.simulateMatch(home, away, isPlayer);
    return { home, away, homeGoals, awayGoals, events, isPlayerMatch: isPlayer };
  }

  // ─── Simulation engine ────────────────────────────────────────────────────

  private simulateMatch(home: Team, away: Team, detailed: boolean) {
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
      ? this.generateEvents(home, away, homeGoals, awayGoals, homeStr, awayStr)
      : [];
    return { homeGoals, awayGoals, events };
  }

  private goalsFromStrength(str: number): number {
    const avg = Math.max(0.1, (str - 38) / 20);
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
    home: Team, away: Team, homeGoals: number, awayGoals: number, homeStr: number, awayStr: number
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
    const extraCount = this.rand(10, 16);
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

  // ─── League phase flow ──────────────────────────────────────────────────

  playNextLeagueMatchday(): void {
    if (this.leagueMatchday >= 8) {
      this.sortStandings();
      this.phase = 'league_standings';
      return;
    }
    const playerMatch = this.leagueSchedule[this.leagueMatchday].find(m => m.isPlayerMatch)!;
    this.roundResults = this.leagueSchedule[this.leagueMatchday];
    for (const m of this.roundResults) {
      if (!m.isPlayerMatch) this.applyToLeagueStandings(m);
    }
    this.startPlayback(playerMatch, 'league_match');
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
      this.phase = 'league_standings';
    } else {
      this.playNextLeagueMatchday();
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

  // ─── Transition: league → playoff / direct bye → knockout ──────────────

  proceedFromLeague(): void {
    const status = this.playerQualStatus;
    if (status === 'out') { this.phase = 'eliminated'; return; }

    this.playoffPairs = this.buildPlayoffPairs();

    if (status === 'direct') {
      // Player has a bye — resolve the entire playoff round automatically
      const winners = this.playoffPairs.map(pair => this.resolvePlayoffTie(pair));
      this.finishPlayoffsAndBuildKnockout(winners);
      this.knockoutRoundIndex = 0;
      this.playKnockoutMatch();
    } else {
      this.playPlayoffMatch();
    }
  }

  private buildPlayoffPairs(): Array<[Team, Team]> {
    const seeded = this.leagueStandings.slice(8, 16).map(s => s.team);   // 9th-16th
    const unseeded = this.leagueStandings.slice(16, 24).map(s => s.team).reverse(); // 24th-17th
    return seeded.map((t, i) => [t, unseeded[i]] as [Team, Team]);
  }

  private resolvePlayoffTie(pair: [Team, Team]): Team {
    const [home, away] = pair;
    const { homeGoals, awayGoals } = this.simulateMatch(home, away, false);
    if (homeGoals === awayGoals) return Math.random() < 0.5 ? home : away;
    return homeGoals > awayGoals ? home : away;
  }

  playPlayoffMatch(): void {
    const pair = this.playoffPairs.find(([h, a]) => h === this.playerTeam || a === this.playerTeam)!;
    const [home, away] = pair;
    const { homeGoals, awayGoals, events } = this.simulateMatch(home, away, true);
    let finalHome = homeGoals, finalAway = awayGoals;
    let penalties: { homeScore: number; awayScore: number } | undefined;

    if (homeGoals === awayGoals) {
      let hp = this.rand(3, 5), ap = this.rand(3, 5);
      while (hp === ap) ap = this.rand(3, 5);
      finalHome = homeGoals + (hp > ap ? 1 : 0);
      finalAway = awayGoals + (ap > hp ? 1 : 0);
      penalties = { homeScore: hp, awayScore: ap };
      events.push({ minute: 120, type: 'info' as any, team: '',
        description: `🎯 PENALTY SHOOTOUT! Level on aggregate — spot kicks decide the tie!` });
      events.sort((a, b) => a.minute - b.minute);
    }

    this.currentPlayoffMatch = { home, away, homeGoals: finalHome, awayGoals: finalAway,
      events: [...events], isPlayerMatch: true, penalties };
    this.startPlayback(this.currentPlayoffMatch, 'playoff_match');
  }

  confirmPlayoffResult(): void {
    if (!this.currentPlayoffMatch || !this.playerTeam) return;
    this.clearTimerInterval();
    this.matchPlaying = false;

    const m = this.currentPlayoffMatch;
    const playerHome = m.home === this.playerTeam;
    const playerGoals = playerHome ? m.homeGoals : m.awayGoals;
    const oppGoals = playerHome ? m.awayGoals : m.homeGoals;
    if (playerGoals < oppGoals) { this.phase = 'eliminated'; return; }

    const winners = this.playoffPairs.map(pair =>
      (pair[0] === this.playerTeam || pair[1] === this.playerTeam) ? this.playerTeam! : this.resolvePlayoffTie(pair)
    );
    this.finishPlayoffsAndBuildKnockout(winners);
    this.phase = 'playoff_result';
  }

  private finishPlayoffsAndBuildKnockout(playoffWinners: Team[]): void {
    const top8 = this.leagueStandings.slice(0, 8).map(s => s.team);
    this.knockoutPairs = top8.map((t, i) => [t, playoffWinners[7 - i]] as [Team, Team]);

    this.fullBracket = [];
    this.fullBracket[0] = this.knockoutPairs.map(([h, a], i) => ({ home: h, away: a, winner: null, matchIndex: i }));
    const sizes = [4, 2, 1];
    for (let r = 0; r < sizes.length; r++) {
      this.fullBracket[r + 1] = Array.from({ length: sizes[r] }, (_, i) => ({ home: null, away: null, winner: null, matchIndex: i }));
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

    const [home, away] = pair;
    const { homeGoals, awayGoals, events } = this.simulateMatch(home, away, true);
    let finalHome = homeGoals, finalAway = awayGoals;
    let penalties: { homeScore: number; awayScore: number } | undefined;

    if (homeGoals === awayGoals) {
      let hp = this.rand(3, 5), ap = this.rand(3, 5);
      while (hp === ap) ap = this.rand(3, 5);
      finalHome = homeGoals + (hp > ap ? 1 : 0);
      finalAway = awayGoals + (ap > hp ? 1 : 0);
      penalties = { homeScore: hp, awayScore: ap };
      events.push({ minute: 120, type: 'info' as any, team: '',
        description: `🎯 PENALTY SHOOTOUT! Level after extra time — spot kicks decide!` });
      events.sort((a, b) => a.minute - b.minute);
    }

    this.currentKnockoutMatch = { home, away, homeGoals: finalHome, awayGoals: finalAway,
      events: [...events], isPlayerMatch: true, penalties };
    this.startPlayback(this.currentKnockoutMatch, 'knockout_match');
  }

  confirmKnockoutResult(): void {
    if (!this.currentKnockoutMatch || !this.playerTeam) return;
    this.clearTimerInterval();
    this.matchPlaying = false;

    const m = this.currentKnockoutMatch;
    const playerHome = m.home === this.playerTeam;
    const playerGoals = playerHome ? m.homeGoals : m.awayGoals;
    const oppGoals = playerHome ? m.awayGoals : m.homeGoals;
    if (playerGoals < oppGoals) { this.phase = 'eliminated'; return; }

    const winners: Team[] = [];
    for (const [h, a] of this.knockoutPairs) {
      if (h === this.playerTeam || a === this.playerTeam) { winners.push(this.playerTeam); continue; }
      const { homeGoals: hg, awayGoals: ag } = this.simulateMatch(h, a, false);
      winners.push(hg > ag ? h : ag > hg ? a : Math.random() < 0.5 ? h : a);
    }

    if (this.fullBracket[this.knockoutRoundIndex]) {
      this.fullBracket[this.knockoutRoundIndex].forEach((slot, i) => { if (i < this.knockoutPairs.length) slot.winner = winners[i]; });
    }

    this.knockoutRoundIndex++;
    if (this.knockoutRoundIndex >= KNOCKOUT_ROUND_NAMES.length) { this.phase = 'champion'; return; }

    this.knockoutPairs = [];
    for (let i = 0; i < winners.length; i += 2) if (winners[i + 1]) this.knockoutPairs.push([winners[i], winners[i + 1]]);

    if (this.fullBracket[this.knockoutRoundIndex]) {
      this.fullBracket[this.knockoutRoundIndex] = this.knockoutPairs.map(([h, a], i) => ({ home: h, away: a, winner: null, matchIndex: i }));
    }
    this.phase = 'knockout_result';
  }

  continueKnockout(): void { this.playKnockoutMatch(); }

  get currentKnockoutRoundName(): string { return KNOCKOUT_ROUND_NAMES[this.knockoutRoundIndex] ?? 'Final'; }

  get bracketRounds(): { name: string; slots: BracketSlot[] }[] {
    return this.fullBracket.map((slots, i) => ({ name: KNOCKOUT_ROUND_NAMES[i] ?? '', slots }));
  }

  isPlayerSlot(slot: BracketSlot): boolean { return slot.home === this.playerTeam || slot.away === this.playerTeam; }

  // ─── Shared playback ─────────────────────────────────────────────────────

  private startPlayback(match: MatchResult, returnPhase: GamePhase): void {
    this.clearTimerInterval();
    this.currentMatch = match;
    this.currentEventIndex = 0;
    this.displayedEvents = [];
    this.matchPlaying = true;
    this.phase = returnPhase;

    this.matchInterval = setInterval(() => {
      if (!this.currentMatch) return;
      if (this.currentEventIndex < this.currentMatch.events.length) {
        this.displayedEvents = [...this.displayedEvents, this.currentMatch.events[this.currentEventIndex]];
        this.currentEventIndex++;
      } else {
        this.clearTimerInterval();
        this.matchPlaying = false;
      }
    }, 650);
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
    this.currentMatch = null; this.displayedEvents = []; this.roundResults = [];
    this.searchQuery = ''; this.fullBracket = [];
  }

  // ─── Utils ────────────────────────────────────────────────────────────────

  private rand(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }
  private clearTimerInterval(): void { if (this.matchInterval) { clearInterval(this.matchInterval); this.matchInterval = null; } }

  trackByName(_: number, t: Team): string { return t.name; }
  trackByIdx(i: number): number { return i; }
  trackByPot(_: number, g: { pot: number }): number { return g.pot; }
}