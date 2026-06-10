import { Component, OnInit, OnDestroy } from '@angular/core';
import { ClubService } from '../../services/club.service';
import { SeoService } from '../../services/seo.service';

// ─── Types ────────────────────────────────────────────────────────────────────

type GamePhase =
  | 'home' | 'select'
  | 'group_match' | 'group_results' | 'group_standings'
  | 'knockout_match' | 'knockout_result'
  | 'eliminated' | 'champion';

interface Team {
  name: string; logo: string; group: string;
  ranking: number; attack: number; defense: number; continent: string;
}

interface MatchEvent {
  minute: number;
  type: 'goal' | 'yellow' | 'red' | 'save' | 'miss' | 'var' | 'foul' | 'corner' | 'offside' | 'penalty';
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

interface GroupStanding {
  team: Team; played: number; won: number; drawn: number; lost: number;
  gf: number; ga: number; gd: number; points: number;
}

// ─── 2026 World Cup Data ──────────────────────────────────────────────────────

const WC2026_GROUPS: Record<string, string[]> = {
  A: ['Mexico', 'Korea Republic', 'South Africa', 'Czech Republic'],
  B: ['Canada', 'Switzerland', 'Qatar', 'Bosnia and Herzegovina'],
  C: ['Brasil', 'Morocco', 'Scotland', 'Haiti'],
  D: ['United States', 'Australia', 'Türkiye', 'Paraguay'],
  E: ['Germany', 'Ecuador', 'Ivory Coast', 'Curaçao'],
  F: ['Netherlands', 'Japan', 'Sweden', 'Tunisia'],
  G: ['Belgium', 'Iran', 'Egypt', 'New Zealand'],
  H: ['Spain', 'Uruguay', 'Saudi Arabia', 'Cape Verde'],
  I: ['France', 'Senegal', 'Norway', 'Iraq'],
  J: ['Argentina', 'Austria', 'Algeria', 'Jordan'],
  K: ['Portugal', 'Colombia', 'Democratic Republic of the Congo', 'Uzbekistan'],
  L: ['England', 'Croatia', 'Panama', 'Ghana'],
};

// Round of 32 fixed pairings (FIFA official bracket)
// Format: [homeSlot, awaySlot] where slot = '1A','2B','3best' etc.
// We store as functions resolved after group stage
const R32_PAIRINGS: Array<[string, string]> = [
  ['2A', '2B'],   // M73
  ['1E', '3best'],// M74 - 3rd from A/B/C/D/F
  ['1F', '2C'],   // M75
  ['1C', '2F'],   // M76
  ['1I', '3best'],// M77 - 3rd from C/D/F/G/H
  ['2E', '2I'],   // M78
  ['1A', '3best'],// M79 - 3rd from C/E/F/H/I
  ['1L', '3best'],// M80 - 3rd from E/H/I/J/K
  ['1D', '3best'],// M81 - 3rd from B/E/F/I/J
  ['1G', '3best'],// M82 - 3rd from A/E/H/I/J
  ['2K', '2L'],   // M83
  ['1H', '2J'],   // M84
  ['1B', '3best'],// M85 - 3rd from E/F/G/I/J
  ['1J', '2H'],   // M86
  ['1K', '3best'],// M87 - 3rd from D/E/I/J/L
  ['2D', '2G'],   // M88
];

const TEAM_STATS: Record<string, { ranking: number; attack: number; defense: number }> = {
  'France':              { ranking: 1,  attack: 92, defense: 88 },
  'Spain':               { ranking: 2,  attack: 90, defense: 87 },
  'Argentina':           { ranking: 3,  attack: 93, defense: 84 },
  'England':             { ranking: 4,  attack: 88, defense: 85 },
  'Portugal':            { ranking: 5,  attack: 91, defense: 82 },
  'Brasil':              { ranking: 6,  attack: 89, defense: 83 },
  'Netherlands':         { ranking: 7,  attack: 86, defense: 83 },
  'Morocco':             { ranking: 8,  attack: 78, defense: 84 },
  'Belgium':             { ranking: 9,  attack: 85, defense: 80 },
  'Germany':             { ranking: 10, attack: 87, defense: 82 },
  'Croatia':             { ranking: 11, attack: 82, defense: 81 },
  'Colombia':            { ranking: 13, attack: 80, defense: 76 },
  'Senegal':             { ranking: 14, attack: 77, defense: 78 },
  'Mexico':              { ranking: 15, attack: 76, defense: 74 },
  'United States':       { ranking: 16, attack: 74, defense: 73 },
  'Uruguay':             { ranking: 17, attack: 79, defense: 77 },
  'Japan':               { ranking: 18, attack: 78, defense: 79 },
  'Switzerland':         { ranking: 19, attack: 75, defense: 78 },
  'Iran':                { ranking: 21, attack: 70, defense: 75 },
  'Austria':             { ranking: 23, attack: 74, defense: 72 },
  'Ecuador':             { ranking: 24, attack: 73, defense: 70 },
  'Australia':           { ranking: 26, attack: 70, defense: 70 },
  'Korea Republic':         { ranking: 25, attack: 72, defense: 71 },
  'Egypt':               { ranking: 29, attack: 68, defense: 72 },
  'Canada':              { ranking: 30, attack: 69, defense: 68 },
  'Ivory Coast':         { ranking: 33, attack: 72, defense: 67 },
  'Qatar':               { ranking: 35, attack: 64, defense: 66 },
  'Algeria':             { ranking: 36, attack: 68, defense: 67 },
  'Sweden':              { ranking: 39, attack: 70, defense: 71 },
  'Tunisia':             { ranking: 40, attack: 65, defense: 67 },
  'Czech Republic':             { ranking: 41, attack: 67, defense: 68 },
  'Türkiye':             { ranking: 42, attack: 70, defense: 67 },
  'Norway':              { ranking: 44, attack: 74, defense: 68 },
  'Scotland':            { ranking: 47, attack: 66, defense: 67 },
  'Democratic Republic of the Congo':            { ranking: 51, attack: 66, defense: 64 },
  'Bosnia and Herzegovina':{ ranking: 52, attack: 64, defense: 63 },
  'Panama':              { ranking: 53, attack: 60, defense: 65 },
  'Saudi Arabia':        { ranking: 57, attack: 62, defense: 63 },
  'South Africa':        { ranking: 60, attack: 61, defense: 62 },
  'Iraq':                { ranking: 61, attack: 60, defense: 61 },
  'Uzbekistan':          { ranking: 62, attack: 59, defense: 60 },
  'Paraguay':            { ranking: 64, attack: 63, defense: 62 },
  'Ghana':               { ranking: 65, attack: 62, defense: 60 },
  'Jordan':              { ranking: 68, attack: 57, defense: 60 },
  'Cape Verde':          { ranking: 70, attack: 60, defense: 59 },
  'Curaçao':             { ranking: 81, attack: 55, defense: 55 },
  'Haiti':               { ranking: 83, attack: 54, defense: 53 },
  'New Zealand':         { ranking: 95, attack: 50, defense: 52 },
};

const KNOCKOUT_ROUND_NAMES = ['Round of 32', 'Round of 16', 'Quarter-final', 'Semi-final', 'Final'];

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-world-cup',
  templateUrl: './world-cup.component.html',
  styleUrl: './world-cup.component.css',
})
export class WorldCupComponent implements OnInit, OnDestroy {
  allNationalTeams: any[] = [];
  phase: GamePhase = 'home';

  // Team selection
  allTeams: Team[] = [];
  playerTeam: Team | null = null;
  searchQuery = '';

  // Group stage
  groups: Record<string, Team[]> = {};
  playerGroup = '';
  groupRound = 0;
  groupSchedule: MatchResult[][] = [];
  groupStandings: Record<string, GroupStanding[]> = {};

  // Match playback — completely fresh each time
  currentMatch: MatchResult | null = null;
  currentEventIndex = 0;
  displayedEvents: MatchEvent[] = [];
  matchPlaying = false;
  private matchInterval: any = null;

  // Group results
  roundResults: MatchResult[] = [];

  // Knockout
  readonly KNOCKOUT_ROUND_NAMES = KNOCKOUT_ROUND_NAMES;
  knockoutRoundIndex = 0;
  knockoutPairs: Array<[Team, Team]> = [];   // all R32 pairs
  currentKnockoutMatch: MatchResult | null = null;
  knockoutSurvivors: Team[] = [];            // winners of current round

  constructor(private clubService: ClubService, private seoService: SeoService) {}

  ngOnInit(): void {
    this.clubService.getNationalTeams().subscribe(data => {
      this.allNationalTeams = data;
      this.buildTeams();
    });
    this.seoService.updateSeo({
      title: 'World Cup 2026 Simulator',
      description: 'Choose your national team and simulate the 2026 FIFA World Cup!',
      keywords: 'world cup 2026, football simulator, national teams, soccer game',
      url: 'https://football-clubs-worldwide.com/world-cup',
      type: 'website',
    });
  }

  ngOnDestroy(): void { this.clearInterval(); }

  // ─── Build teams ──────────────────────────────────────────────────────────

  private buildTeams(): void {
    this.allTeams = [];
    for (const [group, names] of Object.entries(WC2026_GROUPS)) {
      for (const name of names) {
        const stats = TEAM_STATS[name] ?? { ranking: 99, attack: 50, defense: 50 };
        const json = this.allNationalTeams.find(t => t.club_name?.toLowerCase() === name.toLowerCase());
        this.allTeams.push({ name, logo: json?.club_logo ?? '', group,
          ranking: stats.ranking, attack: stats.attack, defense: stats.defense,
          continent: json?.continent ?? '' });
      }
    }
  }

  // ─── Selection ────────────────────────────────────────────────────────────

  get filteredTeams(): Team[] {
    const q = this.searchQuery.toLowerCase();
    return q ? this.allTeams.filter(t => t.name.toLowerCase().includes(q)) : this.allTeams;
  }

  teamsByGroup(): { group: string; teams: Team[] }[] {
    return Object.keys(WC2026_GROUPS).map(g => ({
      group: g, teams: this.allTeams.filter(t => t.group === g),
    }));
  }

  selectTeam(team: Team): void { this.playerTeam = team; }

  confirmSelection(): void {
    if (!this.playerTeam) return;
    this.initTournament();
    this.phase = 'group_match';
    this.playNextGroupMatch();
  }

  // ─── Init ─────────────────────────────────────────────────────────────────

  private initTournament(): void {
    this.groups = {};
    for (const [g, names] of Object.entries(WC2026_GROUPS)) {
      this.groups[g] = names.map(n => this.allTeams.find(t => t.name === n)!);
    }
    this.playerGroup = this.playerTeam!.group;

    for (const [g, teams] of Object.entries(this.groups)) {
      this.groupStandings[g] = teams.map(t => ({
        team: t, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0,
      }));
    }

    // Build group schedules (simulate all matches fresh — events ONLY generated for player matches)
    this.groupSchedule = [[], [], []];
    const pairs: Array<[number, number]> = [[0,1],[2,3],[0,2],[1,3],[0,3],[1,2]];
    for (const [g, teams] of Object.entries(this.groups)) {
      for (let r = 0; r < 3; r++) {
        const [ai, bi] = pairs[r * 2];
        const [ci, di] = pairs[r * 2 + 1];
        this.groupSchedule[r].push(
          this.buildMatch(teams[ai], teams[bi]),
          this.buildMatch(teams[ci], teams[di]),
        );
      }
    }
    this.groupRound = 0;
  }

  private buildMatch(home: Team, away: Team): MatchResult {
    const isPlayer = home === this.playerTeam || away === this.playerTeam;
    const { homeGoals, awayGoals, events } = this.simulateMatch(home, away, isPlayer);
    return { home, away, homeGoals, awayGoals, events, isPlayerMatch: isPlayer };
  }

  // ─── Simulation ───────────────────────────────────────────────────────────

  private simulateMatch(home: Team, away: Team, detailed: boolean) {
    const homeStr = home.attack * 0.6 + (100 - away.defense) * 0.4 + 8 + this.rand(-12, 12);
    const awayStr = away.attack * 0.6 + (100 - home.defense) * 0.4 + this.rand(-12, 12);
    const homeGoals = this.goalsFromStrength(homeStr);
    const awayGoals = this.goalsFromStrength(awayStr);
    const events: MatchEvent[] = detailed ? this.generateEvents(home, away, homeGoals, awayGoals) : [];
    return { homeGoals, awayGoals, events };
  }

  private goalsFromStrength(str: number): number {
    const avg = Math.max(0, (str - 42) / 17);
    const r = Math.random();
    const p0 = Math.exp(-avg);
    const p1 = p0 * avg;
    const p2 = p1 * avg / 2;
    const p3 = p2 * avg / 3;
    if (r < p0) return 0;
    if (r < p0 + p1) return 1;
    if (r < p0 + p1 + p2) return 2;
    if (r < p0 + p1 + p2 + p3) return 3;
    if (r < 0.97) return 4;
    return 5;
  }

  private generateEvents(home: Team, away: Team, homeGoals: number, awayGoals: number): MatchEvent[] {
    const events: MatchEvent[] = [];
    const usedMins = new Set<number>();

    const randMin = (from = 1, to = 90) => {
      let m: number;
      let tries = 0;
      do { m = this.rand(from, to); tries++; } while (usedMins.has(m) && tries < 30);
      usedMins.add(m);
      return m;
    };

    // Goals
    for (let i = 0; i < homeGoals; i++) {
      const min = randMin();
      const ispen = Math.random() < 0.12;
      events.push({ minute: min, type: 'goal', team: home.name,
        description: ispen
          ? `⚽ PENALTY! ${home.name} converts from the spot!`
          : this.goalDesc(home.name, min) });
    }
    for (let i = 0; i < awayGoals; i++) {
      const min = randMin();
      const ispen = Math.random() < 0.12;
      events.push({ minute: min, type: 'goal', team: away.name,
        description: ispen
          ? `⚽ PENALTY! ${away.name} converts from the spot!`
          : this.goalDesc(away.name, min) });
    }

    // Extra events — more events for longer narration
    const extraCount = this.rand(10, 16);
    const extraTypes = ['save', 'miss', 'yellow', 'foul', 'corner', 'offside', 'var'] as const;
    type ExtraType = typeof extraTypes[number];

    const descMap: Record<ExtraType, (t: string) => string> = {
      save:    t => `🧤 Brilliant save! The ${t} goalkeeper denies a sure goal!`,
      miss:    t => `😬 ${t} hits the woodwork! Agonizingly close!`,
      yellow:  t => `🟨 Yellow card shown to a ${t} player. Referee stepping in.`,
      foul:    t => `🦵 Foul by ${t}. Free kick in a dangerous position.`,
      corner:  t => `🚩 Corner kick for ${t}. Danger in the box!`,
      offside: t => `🚫 Offside! ${t}'s attack breaks down.`,
      var:     _t => `📺 VAR is reviewing the incident… The referee checks the monitor.`,
    };

    for (let i = 0; i < extraCount; i++) {
      const t: ExtraType = extraTypes[Math.floor(Math.random() * extraTypes.length)];
      const team = Math.random() < 0.5 ? home : away;
      const min = randMin();
      events.push({ minute: min, type: t, team: team.name, description: descMap[t](team.name) });
    }

    // Kickoff + HT + FT
    events.push({ minute: 0,  type: 'foul', team: '', description: `🏟️ Kick-off! The match is underway.` });
    events.push({ minute: 45, type: 'foul', team: '', description: `⏸️ Half-time. The teams head to the dressing rooms.` });
    events.push({ minute: 91, type: 'foul', team: '', description: `🏁 Full time! The referee blows the final whistle.` });

    return events.sort((a, b) => a.minute - b.minute);
  }

  private goalDesc(team: string, min: number): string {
    const descs = [
      `⚽ GOAL! ${team} breaks the deadlock in the ${min}th minute!`,
      `⚽ GOAL! Stunning finish from ${team}! The crowd erupts!`,
      `⚽ GOAL! ${team} doubles their lead! What a strike!`,
      `⚽ GOAL! ${team} scores after a brilliant team move!`,
      `⚽ GOAL! Header from the corner! ${team} takes the lead!`,
      `⚽ GOAL! ${team} scores from outside the box! Unstoppable shot!`,
      `⚽ GOAL! ${team} capitalizes on a defensive error!`,
    ];
    return descs[Math.floor(Math.random() * descs.length)];
  }

  // ─── Group stage flow ─────────────────────────────────────────────────────

  playNextGroupMatch(): void {
    if (this.groupRound >= 3) {
      this.computeFinalStandings();
      this.phase = 'group_standings';
      return;
    }

    const playerMatch = this.groupSchedule[this.groupRound].find(m => m.isPlayerMatch)!;
    this.roundResults = this.groupSchedule[this.groupRound];

    // Apply all non-player matches to standings
    for (const m of this.roundResults) {
      if (!m.isPlayerMatch) this.applyToStandings(m);
    }

    this.startMatchPlayback(playerMatch, 'group_match');
  }

  private startMatchPlayback(match: MatchResult, returnPhase: GamePhase): void {
    // ── CRITICAL: reset playback state fresh every time ──
    this.clearInterval();
    this.currentMatch = match;
    this.currentEventIndex = 0;
    this.displayedEvents = [];
    this.matchPlaying = true;
    this.phase = returnPhase;

    this.matchInterval = setInterval(() => {
      if (this.currentEventIndex < this.currentMatch!.events.length) {
        this.displayedEvents.push(this.currentMatch!.events[this.currentEventIndex]);
        this.currentEventIndex++;
      } else {
        this.clearInterval();
        this.matchPlaying = false;
      }
    }, 700);
  }

  confirmMatchResult(): void {
    this.clearInterval();
    this.matchPlaying = false;
    if (this.currentMatch) this.applyToStandings(this.currentMatch);
    this.groupRound++;
    this.phase = 'group_results';
  }

  continueAfterRound(): void {
    if (this.groupRound >= 3) {
      this.computeFinalStandings();
      this.phase = 'group_standings';
    } else {
      this.playNextGroupMatch();
    }
  }

  private applyToStandings(m: MatchResult): void {
    const g = m.home.group;
    const st = this.groupStandings[g];
    if (!st) return;
    const hs = st.find(s => s.team === m.home);
    const as_ = st.find(s => s.team === m.away);
    if (!hs || !as_) return;

    hs.played++; as_.played++;
    hs.gf += m.homeGoals; hs.ga += m.awayGoals; hs.gd += m.homeGoals - m.awayGoals;
    as_.gf += m.awayGoals; as_.ga += m.homeGoals; as_.gd += m.awayGoals - m.homeGoals;

    if (m.homeGoals > m.awayGoals) {
      hs.won++; hs.points += 3; as_.lost++;
    } else if (m.homeGoals === m.awayGoals) {
      hs.drawn++; hs.points++; as_.drawn++; as_.points++;
    } else {
      as_.won++; as_.points += 3; hs.lost++;
    }
  }

  private computeFinalStandings(): void {
    for (const g of Object.keys(this.groupStandings)) {
      this.groupStandings[g].sort((a, b) =>
        b.points - a.points || b.gd - a.gd || b.gf - a.gf
      );
    }
  }

  // ─── Group standings helpers ──────────────────────────────────────────────

  get playerGroupStandings(): GroupStanding[] {
    return this.groupStandings[this.playerGroup] ?? [];
  }

  get allGroupStandings(): { group: string; standings: GroupStanding[] }[] {
    return Object.keys(this.groupStandings).map(g => ({
      group: g, standings: this.groupStandings[g],
    }));
  }

  get playerAdvances(): boolean {
    if (!this.playerTeam) return false;
    const st = this.groupStandings[this.playerGroup];
    if (!st) return false;
    const pos = st.findIndex(s => s.team === this.playerTeam);
    if (pos <= 1) return true;
    if (pos === 2) return this.playerIsAmong8BestThird();
    return false;
  }

  private playerIsAmong8BestThird(): boolean {
    const thirds: GroupStanding[] = [];
    for (const g of Object.keys(this.groupStandings)) {
      thirds.push(this.groupStandings[g][2]);
    }
    thirds.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
    const best8 = thirds.slice(0, 8);
    return best8.some(s => s.team === this.playerTeam);
  }

  // ─── Build R32 bracket ────────────────────────────────────────────────────

  proceedToKnockouts(): void {
    if (!this.playerAdvances) { this.phase = 'eliminated'; return; }
    this.buildR32Bracket();
    this.knockoutRoundIndex = 0;
    this.playKnockoutMatch();
  }

  private getSlotTeam(slot: string): Team {
    // slot = '1A', '2B', '3best'
    const pos = parseInt(slot[0]);
    const grp = slot[1];
    const st = this.groupStandings[grp];
    return st[pos - 1].team;
  }

  private buildR32Bracket(): void {
    // Get best 8 third-place teams
    const thirds: { team: Team; standing: GroupStanding }[] = [];
    for (const g of Object.keys(this.groupStandings)) {
      thirds.push({ team: this.groupStandings[g][2].team, standing: this.groupStandings[g][2] });
    }
    thirds.sort((a, b) =>
      b.standing.points - a.standing.points ||
      b.standing.gd - a.standing.gd ||
      b.standing.gf - a.standing.gf
    );
    const best8Third = thirds.slice(0, 8).map(x => x.team);
    let thirdIdx = 0;

    this.knockoutPairs = R32_PAIRINGS.map(([h, a]) => {
      const homeTeam = h === '3best' ? best8Third[thirdIdx++] : this.getSlotTeam(h);
      const awayTeam = a === '3best' ? best8Third[thirdIdx++] : this.getSlotTeam(a);
      return [homeTeam, awayTeam] as [Team, Team];
    });
  }

  // ─── Knockout flow ────────────────────────────────────────────────────────

  private playKnockoutMatch(): void {
    const playerPair = this.knockoutPairs.find(
      ([h, a]) => h === this.playerTeam || a === this.playerTeam
    );

    if (!playerPair) { this.phase = 'eliminated'; return; }

    const [home, away] = playerPair;
    const { homeGoals, awayGoals, events } = this.simulateMatch(home, away, true);

    let finalHome = homeGoals;
    let finalAway = awayGoals;
    let penalties: { homeScore: number; awayScore: number } | undefined;

    if (homeGoals === awayGoals) {
      // Extra time still draws → penalties
      const homePens = this.rand(3, 5);
      const awayPens = this.rand(3, 5);
      const tie = homePens === awayPens;
      finalHome = homeGoals + (tie ? 1 : Math.max(homePens, awayPens) === homePens ? 1 : 0);
      finalAway = awayGoals + (tie ? 0 : Math.max(homePens, awayPens) === awayPens ? 1 : 0);
      penalties = { homeScore: homePens, awayScore: tie ? homePens - 1 : awayPens };
      events.push({ minute: 120, type: 'var', team: '',
        description: `🎯 Full time after extra time: still level! It goes to a PENALTY SHOOTOUT!` });
      events.sort((a, b) => a.minute - b.minute);
    }

    // ── Fresh match object — new reference, new events array ──
    this.currentKnockoutMatch = {
      home, away,
      homeGoals: finalHome, awayGoals: finalAway,
      events: [...events],
      isPlayerMatch: true,
      penalties,
    };

    this.startMatchPlayback(this.currentKnockoutMatch, 'knockout_match');
  }

  confirmKnockoutResult(): void {
    if (!this.currentKnockoutMatch || !this.playerTeam) return;
    this.clearInterval();
    this.matchPlaying = false;

    const m = this.currentKnockoutMatch;
    const playerIsHome = m.home === this.playerTeam;
    const playerGoals = playerIsHome ? m.homeGoals : m.awayGoals;
    const oppGoals    = playerIsHome ? m.awayGoals : m.homeGoals;

    if (playerGoals < oppGoals) { this.phase = 'eliminated'; return; }

    // Simulate all other matches in this round
    const winners: Team[] = [];
    for (const [h, a] of this.knockoutPairs) {
      if (h === this.playerTeam || a === this.playerTeam) {
        winners.push(this.playerTeam);
        continue;
      }
      const { homeGoals: hg, awayGoals: ag } = this.simulateMatch(h, a, false);
      if (hg > ag) winners.push(h);
      else if (ag > hg) winners.push(a);
      else winners.push(Math.random() < 0.5 ? h : a);
    }

    this.knockoutSurvivors = winners;
    this.knockoutRoundIndex++;

    if (this.knockoutRoundIndex >= KNOCKOUT_ROUND_NAMES.length) {
      this.phase = 'champion';
    } else {
      // Build next round pairs from survivors
      this.knockoutPairs = [];
      for (let i = 0; i < winners.length; i += 2) {
        if (winners[i + 1]) {
          this.knockoutPairs.push([winners[i], winners[i + 1]]);
        }
      }
      this.phase = 'knockout_result';
    }
  }

  continueKnockout(): void { this.playKnockoutMatch(); }

  get currentKnockoutRoundName(): string {
    return KNOCKOUT_ROUND_NAMES[this.knockoutRoundIndex] ?? 'Final';
  }

  // ─── Live score from displayed events ────────────────────────────────────

  liveScore(teamName: string): number {
    return this.displayedEvents.filter(e => e.type === 'goal' && e.team === teamName).length;
  }

  // ─── Template helpers ─────────────────────────────────────────────────────

  get nonPlayerGroupResults(): MatchResult[] {
    return (this.roundResults ?? []).filter(m => !m.isPlayerMatch);
  }

  nonPlayerResultsByGroup(): { group: string; matches: MatchResult[] }[] {
    const map = new Map<string, MatchResult[]>();
    for (const m of this.nonPlayerGroupResults) {
      const g = m.home.group;
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(m);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([group, matches]) => ({ group, matches }));
  }

  scoreLabel(m: MatchResult): string { return `${m.homeGoals} – ${m.awayGoals}`; }

  playerWon(m: MatchResult | null): boolean {
    if (!m || !this.playerTeam) return false;
    return m.home === this.playerTeam ? m.homeGoals > m.awayGoals : m.awayGoals > m.homeGoals;
  }

  playerDrew(m: MatchResult | null): boolean { return !!m && m.homeGoals === m.awayGoals; }

  matchOutcomeLabel(m: MatchResult): string {
    if (this.playerWon(m)) return 'WIN';
    if (this.playerDrew(m)) return 'DRAW';
    return 'LOSS';
  }

  matchOutcomeClass(m: MatchResult): string {
    if (this.playerWon(m)) return 'outcome-win';
    if (this.playerDrew(m)) return 'outcome-draw';
    return 'outcome-loss';
  }

  isPlayerEvent(ev: MatchEvent): boolean { return ev.team === this.playerTeam?.name; }

  get knockoutBracketDisplay(): { round: string; pairs: Array<{ home: Team; away: Team }> } {
    return {
      round: KNOCKOUT_ROUND_NAMES[this.knockoutRoundIndex] ?? '',
      pairs: this.knockoutPairs.map(([h, a]) => ({ home: h, away: a })),
    };
  }

  resetGame(): void {
    this.clearInterval();
    this.phase = 'home';
    this.playerTeam = null;
    this.groups = {};
    this.groupSchedule = [];
    this.groupStandings = {};
    this.knockoutPairs = [];
    this.knockoutSurvivors = [];
    this.knockoutRoundIndex = 0;
    this.currentMatch = null;
    this.currentKnockoutMatch = null;
    this.displayedEvents = [];
    this.roundResults = [];
    this.groupRound = 0;
    this.searchQuery = '';
  }

  // ─── Utils ────────────────────────────────────────────────────────────────

  private rand(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private clearInterval(): void {
    if (this.matchInterval) { clearInterval(this.matchInterval); this.matchInterval = null; }
  }

  trackByName(_: number, team: Team): string { return team.name; }
  trackByIdx(i: number): number { return i; }
}