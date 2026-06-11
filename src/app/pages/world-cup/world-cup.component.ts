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
  ranking: number; attack: number; defense: number;
  stamina: number;   // affects late-game performance
  morale: number;    // random boost/penalty each match
  continent: string;
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

interface GroupStanding {
  team: Team; played: number; won: number; drawn: number; lost: number;
  gf: number; ga: number; gd: number; points: number;
}

interface BracketSlot {
  home: Team | null;
  away: Team | null;
  winner: Team | null;
  matchIndex: number;
}

// ─── 2026 World Cup Groups (official draw Dec 5 2025) ─────────────────────────

const WC2026_GROUPS: Record<string, string[]> = {
  A: ['Mexico', 'South Africa', 'Korea Republic', 'Czech Republic'],
  B: ['Canada', 'Bosnia and Herzegovina', 'Qatar', 'Switzerland'],
  C: ['Brasil', 'Morocco', 'Haiti', 'Scotland'],
  D: ['United States', 'Paraguay', 'Australia', 'Türkiye'],
  E: ['Germany', 'Curaçao', 'Ivory Coast', 'Ecuador'],
  F: ['Netherlands', 'Japan', 'Sweden', 'Tunisia'],
  G: ['Belgium', 'Iran', 'Egypt', 'New Zealand'],
  H: ['Spain', 'Uruguay', 'Saudi Arabia', 'Cape Verde'],
  I: ['France', 'Senegal', 'Norway', 'Iraq'],
  J: ['Argentina', 'Austria', 'Algeria', 'Jordan'],
  K: ['Portugal', 'Democratic Republic of the Congo', 'Uzbekistan', 'Colombia'],
  L: ['England', 'Croatia', 'Panama', 'Ghana'],
};

// Official group-stage fixture (jornada order: round 1=J1, round 2=J2, round 3=J3)
// Each round: [[home_idx, away_idx], [home_idx, away_idx]] — indices into group array
const GROUP_FIXTURE: Array<[[number,number],[number,number]]> = [
  [[0,1],[2,3]], // Round 1: A vs B, C vs D
  [[0,2],[1,3]], // Round 2: A vs C, B vs D
  [[3,0],[1,2]], // Round 3: D vs A, B vs C  (both simultaneous)
];

// ─── Official R32 pairings (FIFA regulation bracket) ─────────────────────────
// slot: '1X' = winner group X, '2X' = runner-up group X, '3' = best 3rd (assigned dynamically)
const R32_PAIRINGS_RAW: Array<[string, string, string]> = [
  // [home, away, match_id]
  ['2A', '2B', 'M73'],
  ['1E', '3',  'M74'],  // 3rd best A/B/C/D/F
  ['1F', '2C', 'M75'],
  ['1C', '2F', 'M76'],
  ['1I', '3',  'M77'],  // 3rd best C/D/F/G/H
  ['2E', '2I', 'M78'],
  ['1A', '3',  'M79'],  // 3rd best C/E/F/H/I
  ['1L', '3',  'M80'],  // 3rd best E/H/I/J/K
  ['1D', '3',  'M81'],  // 3rd best B/E/F/I/J
  ['1G', '3',  'M82'],  // 3rd best A/E/H/I/J
  ['2K', '2L', 'M83'],
  ['1H', '2J', 'M84'],
  ['1B', '3',  'M85'],  // 3rd best E/F/G/I/J
  ['1J', '2H', 'M86'],
  ['1K', '3',  'M87'],  // 3rd best D/E/I/J/L
  ['2D', '2G', 'M88'],
];

// R16 pairings: winners of R32 matches in pairs
// W73vsW74, W75vsW76, W77vsW78, W79vsW80, W81vsW82, W83vsW84, W85vsW86, W87vsW88
const R16_PAIRS: Array<[number, number]> = [
  [0,1],[2,3],[4,5],[6,7],[8,9],[10,11],[12,13],[14,15]
];
// QF: W(R16_0)vsW(R16_1), etc.
const QF_PAIRS: Array<[number, number]> = [[0,1],[2,3],[4,5],[6,7]];
// SF: W(QF_0)vsW(QF_1), W(QF_2)vsW(QF_3)
const SF_PAIRS: Array<[number, number]> = [[0,1],[2,3]];

// ─── Team stats ───────────────────────────────────────────────────────────────

const TEAM_STATS: Record<string, { ranking: number; attack: number; defense: number; stamina: number }> = {
  'France':                       { ranking: 1,  attack: 93, defense: 89, stamina: 90 },
  'Spain':                        { ranking: 2,  attack: 91, defense: 88, stamina: 92 },
  'Argentina':                    { ranking: 3,  attack: 94, defense: 85, stamina: 88 },
  'England':                      { ranking: 4,  attack: 89, defense: 86, stamina: 87 },
  'Portugal':                     { ranking: 5,  attack: 92, defense: 83, stamina: 85 },
  'Brasil':                       { ranking: 6,  attack: 90, defense: 84, stamina: 89 },
  'Netherlands':                  { ranking: 7,  attack: 87, defense: 84, stamina: 86 },
  'Morocco':                      { ranking: 8,  attack: 79, defense: 85, stamina: 88 },
  'Belgium':                      { ranking: 9,  attack: 86, defense: 81, stamina: 82 },
  'Germany':                      { ranking: 10, attack: 88, defense: 83, stamina: 87 },
  'Croatia':                      { ranking: 11, attack: 83, defense: 82, stamina: 84 },
  'Colombia':                     { ranking: 13, attack: 81, defense: 77, stamina: 83 },
  'Senegal':                      { ranking: 14, attack: 78, defense: 79, stamina: 85 },
  'Mexico':                       { ranking: 15, attack: 77, defense: 75, stamina: 80 },
  'United States':                { ranking: 16, attack: 75, defense: 74, stamina: 82 },
  'Uruguay':                      { ranking: 17, attack: 80, defense: 78, stamina: 83 },
  'Japan':                        { ranking: 18, attack: 79, defense: 80, stamina: 86 },
  'Switzerland':                  { ranking: 19, attack: 76, defense: 79, stamina: 84 },
  'Iran':                         { ranking: 21, attack: 71, defense: 76, stamina: 80 },
  'Austria':                      { ranking: 23, attack: 75, defense: 73, stamina: 81 },
  'Ecuador':                      { ranking: 24, attack: 74, defense: 71, stamina: 79 },
  'Australia':                    { ranking: 26, attack: 71, defense: 71, stamina: 78 },
  'Korea Republic':               { ranking: 25, attack: 73, defense: 72, stamina: 82 },
  'Egypt':                        { ranking: 29, attack: 69, defense: 73, stamina: 78 },
  'Canada':                       { ranking: 30, attack: 70, defense: 69, stamina: 80 },
  'Ivory Coast':                  { ranking: 33, attack: 73, defense: 68, stamina: 79 },
  'Qatar':                        { ranking: 35, attack: 65, defense: 67, stamina: 75 },
  'Algeria':                      { ranking: 36, attack: 69, defense: 68, stamina: 77 },
  'Sweden':                       { ranking: 39, attack: 71, defense: 72, stamina: 81 },
  'Tunisia':                      { ranking: 40, attack: 66, defense: 68, stamina: 76 },
  'Czech Republic':               { ranking: 41, attack: 68, defense: 69, stamina: 78 },
  'Türkiye':                      { ranking: 42, attack: 71, defense: 68, stamina: 79 },
  'Norway':                       { ranking: 44, attack: 75, defense: 69, stamina: 80 },
  'Scotland':                     { ranking: 47, attack: 67, defense: 68, stamina: 77 },
  'Democratic Republic of the Congo': { ranking: 51, attack: 67, defense: 65, stamina: 76 },
  'Bosnia and Herzegovina':       { ranking: 52, attack: 65, defense: 64, stamina: 75 },
  'Panama':                       { ranking: 53, attack: 61, defense: 66, stamina: 74 },
  'Saudi Arabia':                 { ranking: 57, attack: 63, defense: 64, stamina: 73 },
  'South Africa':                 { ranking: 60, attack: 62, defense: 63, stamina: 72 },
  'Iraq':                         { ranking: 61, attack: 61, defense: 62, stamina: 71 },
  'Uzbekistan':                   { ranking: 62, attack: 60, defense: 61, stamina: 72 },
  'Paraguay':                     { ranking: 64, attack: 64, defense: 63, stamina: 74 },
  'Ghana':                        { ranking: 65, attack: 63, defense: 61, stamina: 73 },
  'Jordan':                       { ranking: 68, attack: 58, defense: 61, stamina: 70 },
  'Cape Verde':                   { ranking: 70, attack: 61, defense: 60, stamina: 72 },
  'Curaçao':                      { ranking: 81, attack: 56, defense: 56, stamina: 68 },
  'Haiti':                        { ranking: 83, attack: 55, defense: 54, stamina: 67 },
  'New Zealand':                  { ranking: 95, attack: 51, defense: 53, stamina: 65 },
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

  allTeams: Team[] = [];
  playerTeam: Team | null = null;
  searchQuery = '';

  groups: Record<string, Team[]> = {};
  playerGroup = '';
  groupRound = 0;
  groupSchedule: MatchResult[][] = [];
  groupStandings: Record<string, GroupStanding[]> = {};

  currentMatch: MatchResult | null = null;
  currentEventIndex = 0;
  displayedEvents: MatchEvent[] = [];
  matchPlaying = false;
  private matchInterval: any = null;

  roundResults: MatchResult[] = [];

  readonly KNOCKOUT_ROUND_NAMES = KNOCKOUT_ROUND_NAMES;
  knockoutRoundIndex = 0;
  knockoutPairs: Array<[Team, Team]> = [];
  currentKnockoutMatch: MatchResult | null = null;

  // Full bracket: rounds x matches
  fullBracket: BracketSlot[][] = [];

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

  ngOnDestroy(): void { this.clearTimerInterval(); }

  // ─── Build teams ──────────────────────────────────────────────────────────

  private buildTeams(): void {
    this.allTeams = [];
    for (const [group, names] of Object.entries(WC2026_GROUPS)) {
      for (const name of names) {
        const stats = TEAM_STATS[name] ?? { ranking: 99, attack: 52, defense: 52, stamina: 70 };
        const json = this.allNationalTeams.find(t =>
          t.club_name?.toLowerCase() === name.toLowerCase()
        );
        this.allTeams.push({
          name, group,
          logo: json?.club_logo ?? '',
          continent: json?.continent ?? '',
          ranking: stats.ranking,
          attack: stats.attack,
          defense: stats.defense,
          stamina: stats.stamina,
          morale: 80,
        });
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
        team: t, played: 0, won: 0, drawn: 0, lost: 0,
        gf: 0, ga: 0, gd: 0, points: 0,
      }));
    }

    // Build schedule using official fixture order
    this.groupSchedule = [[], [], []];
    for (const [g, teams] of Object.entries(this.groups)) {
      for (let r = 0; r < 3; r++) {
        const [[ai, bi], [ci, di]] = GROUP_FIXTURE[r];
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

  // ─── Simulation engine ────────────────────────────────────────────────────

  private simulateMatch(home: Team, away: Team, detailed: boolean) {
    // ── Ranking factor: better ranked team gets a multiplier bonus ──
    const rankDiff = away.ranking - home.ranking; // positive = home is better
    const rankBonus = Math.max(-15, Math.min(15, rankDiff * 0.25));

    // ── Home advantage ──
    const homeAdvantage = 6;

    // ── Morale variation (±10) ──
    const homeMorale = this.rand(-10, 10);
    const awayMorale = this.rand(-10, 10);

    // ── Attack vs defense weighted formula ──
    // attack (60%) + opponent weakness (40%) + ranking bonus + home + morale
    const homeStr = home.attack * 0.55 + (100 - away.defense) * 0.35
                  + home.stamina * 0.1 + homeAdvantage + rankBonus + homeMorale;
    const awayStr = away.attack * 0.55 + (100 - home.defense) * 0.35
                  + away.stamina * 0.1 - rankBonus + awayMorale;

    const homeGoals = this.goalsFromStrength(homeStr);
    const awayGoals = this.goalsFromStrength(awayStr);
    const events: MatchEvent[] = detailed
      ? this.generateEvents(home, away, homeGoals, awayGoals, homeStr, awayStr)
      : [];
    return { homeGoals, awayGoals, events };
  }

  private goalsFromStrength(str: number): number {
    // Calibrated Poisson: avg goals ~1.3 at str=60, ~2.5 at str=80, ~3.5 at str=95
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

  private factorial(n: number): number {
    return n <= 1 ? 1 : n * this.factorial(n - 1);
  }

  // ─── Event generation ─────────────────────────────────────────────────────

  private generateEvents(
    home: Team, away: Team,
    homeGoals: number, awayGoals: number,
    homeStr: number, awayStr: number
  ): MatchEvent[] {
    const events: MatchEvent[] = [];
    const usedMins = new Set<number>([0, 45, 91]);

    const randMin = (from = 1, to = 90): number => {
      let m: number, tries = 0;
      do { m = this.rand(from, to); tries++; } while (usedMins.has(m) && tries < 40);
      usedMins.add(m);
      return m;
    };

    // ── Goals ──
    for (let i = 0; i < homeGoals; i++) {
      const min = randMin();
      events.push({ minute: min, type: 'goal', team: home.name,
        description: Math.random() < 0.13
          ? `⚽ PENALTY GOAL! ${home.name} steps up and converts coolly!`
          : this.pickGoalDesc(home.name, min) });
    }
    for (let i = 0; i < awayGoals; i++) {
      const min = randMin();
      events.push({ minute: min, type: 'goal', team: away.name,
        description: Math.random() < 0.13
          ? `⚽ PENALTY GOAL! ${away.name} doesn't miss from the spot!`
          : this.pickGoalDesc(away.name, min) });
    }

    // ── Tactical events based on strength differential ──
    const dominantTeam = homeStr >= awayStr ? home : away;
    const weakerTeam   = homeStr >= awayStr ? away : home;
    const diff = Math.abs(homeStr - awayStr);

    const extraCount = this.rand(12, 20);
    const pool = ['save','miss','yellow','foul','corner','offside','var','counter'] as const;
    type PoolType = typeof pool[number];

    const descMap: Record<PoolType, (t: Team, d: Team) => string> = {
      save:    (t, _d) => `🧤 Fantastic save! The ${t.name} goalkeeper pulls off a stunning stop!`,
      miss:    (t, _d) => `😬 ${t.name} hits the post! So close to making it count!`,
      yellow:  (t, _d) => `🟨 Yellow card for ${t.name}. The referee has seen enough.`,
      foul:    (t, _d) => `🦵 Foul by ${t.name}. Free kick awarded in a dangerous area.`,
      corner:  (t, _d) => `🚩 Corner for ${t.name}! Set-piece opportunity in the box.`,
      offside: (t, _d) => `🚫 Offside flag! ${t.name}'s attack is halted.`,
      var:     (_t, _d) => `📺 VAR is checking the play… The on-field decision is under review.`,
      counter: (t, d) => diff > 12
        ? `⚡ Counter-attack! ${d.name} breaks forward against the high line of ${t.name}!`
        : `⚡ ${t.name} transitions quickly and catches ${d.name} off guard!`,
    };

    for (let i = 0; i < extraCount; i++) {
      const type: PoolType = pool[Math.floor(Math.random() * pool.length)];
      // Dominant team gets more saves/corners, weaker team more fouls
      const useWeak = (type === 'foul' || type === 'yellow') && Math.random() < 0.65;
      const team = useWeak ? weakerTeam : (Math.random() < 0.55 ? dominantTeam : weakerTeam);
      events.push({
        minute: randMin(), type: type === 'counter' ? 'foul' : type as any,
        team: team.name, description: descMap[type](team, team === dominantTeam ? weakerTeam : dominantTeam),
      });
    }

    // ── Stamina events in 2nd half ──
    if (homeGoals + awayGoals >= 2) {
      events.push({ minute: randMin(70, 88), type: 'info' as any, team: '',
        description: `💪 Both teams showing signs of fatigue in the final stages.` });
    }

    // ── Fixed structural events ──
    // HT score: count only goals with minute < 45
    const htHome = events.filter(e => e.type === 'goal' && e.team === home.name && e.minute < 45).length;
    const htAway = events.filter(e => e.type === 'goal' && e.team === away.name && e.minute < 45).length;

    events.push({ minute: 0,  type: 'info' as any, team: '',
      description: `🏟️ Kick-off! ${home.name} vs ${away.name} gets underway!` });
    events.push({ minute: 45, type: 'info' as any, team: '',
      description: `⏸️ Half-time! ${home.name} ${htHome}–${htAway} ${away.name} after 45 minutes.` });
    events.push({ minute: 91, type: 'info' as any, team: '',
      description: `🏁 Full time! Final score: ${home.name} ${homeGoals}–${awayGoals} ${away.name}.` });

    return events.sort((a, b) => a.minute - b.minute || (a.type === 'info' ? -1 : 1));
  }

  private pickGoalDesc(team: string, min: number): string {
    const pool = [
      `⚽ GOAL! ${team} breaks the deadlock in minute ${min}!`,
      `⚽ GOAL! Brilliant finish from ${team}! The crowd goes wild!`,
      `⚽ GOAL! Header from the corner — ${team} takes the lead!`,
      `⚽ GOAL! ${team} scores from outside the box! Unstoppable!`,
      `⚽ GOAL! ${team} capitalises on a defensive mistake!`,
      `⚽ GOAL! Low cross, tap-in — ${team} makes it look easy!`,
      `⚽ GOAL! Long-range effort from ${team} — the goalkeeper had no chance!`,
      `⚽ GOAL! One-on-one, and ${team} slots it home coolly!`,
      `⚽ GOAL! ${team} doubles their advantage — this is looking comfortable!`,
      `⚽ GOAL! A stunning free kick from ${team}! World Cup magic!`,
    ];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // ─── Group stage flow ─────────────────────────────────────────────────────

  playNextGroupMatch(): void {
    if (this.groupRound >= 3) {
      this.computeFinalStandings();
      this.phase = 'group_standings';
      return;
    }
    const playerMatch = this.groupSchedule[this.groupRound].find(m => m.isPlayerMatch)!;
    this.roundResults  = this.groupSchedule[this.groupRound];
    for (const m of this.roundResults) {
      if (!m.isPlayerMatch) this.applyToStandings(m);
    }
    this.startPlayback(playerMatch, 'group_match');
  }

  private startPlayback(match: MatchResult, returnPhase: GamePhase): void {
    this.clearTimerInterval();
    this.currentMatch       = match;
    this.currentEventIndex  = 0;
    this.displayedEvents    = [];
    this.matchPlaying       = true;
    this.phase              = returnPhase;

    this.matchInterval = setInterval(() => {
      if (!this.currentMatch) return;
      if (this.currentEventIndex < this.currentMatch.events.length) {
        this.displayedEvents = [...this.displayedEvents,
          this.currentMatch.events[this.currentEventIndex]];
        this.currentEventIndex++;
      } else {
        this.clearTimerInterval();
        this.matchPlaying = false;
      }
    }, 650);
  }

  confirmMatchResult(): void {
    this.clearTimerInterval();
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
    const st = this.groupStandings[m.home.group];
    if (!st) return;
    const hs  = st.find(s => s.team === m.home);
    const as_ = st.find(s => s.team === m.away);
    if (!hs || !as_) return;
    hs.played++; as_.played++;
    hs.gf += m.homeGoals; hs.ga += m.awayGoals; hs.gd += m.homeGoals - m.awayGoals;
    as_.gf += m.awayGoals; as_.ga += m.homeGoals; as_.gd += m.awayGoals - m.homeGoals;
    if (m.homeGoals > m.awayGoals)       { hs.won++;   hs.points  += 3; as_.lost++;  }
    else if (m.homeGoals === m.awayGoals) { hs.drawn++; hs.points++;    as_.drawn++; as_.points++; }
    else                                  { as_.won++;  as_.points += 3; hs.lost++;  }
    // Sort after every update so intermediate standings are correct
    this.groupStandings[m.home.group].sort((a, b) =>
      b.points - a.points || b.gd - a.gd || b.gf - a.gf
    );
  }

  private computeFinalStandings(): void {
    for (const g of Object.keys(this.groupStandings)) {
      this.groupStandings[g].sort((a, b) =>
        b.points - a.points || b.gd - a.gd || b.gf - a.gf
      );
    }
  }

  // ─── Standings helpers ────────────────────────────────────────────────────

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
    const st  = this.groupStandings[this.playerGroup];
    if (!st)  return false;
    const pos = st.findIndex(s => s.team === this.playerTeam);
    if (pos <= 1) return true;
    if (pos === 2) return this.playerIsAmong8BestThird();
    return false;
  }

  private playerIsAmong8BestThird(): boolean {
    const thirds = Object.keys(this.groupStandings)
      .map(g => this.groupStandings[g][2])
      .sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
    return thirds.slice(0, 8).some(s => s.team === this.playerTeam);
  }

  // ─── Build R32 bracket ────────────────────────────────────────────────────

  proceedToKnockouts(): void {
    if (!this.playerAdvances) { this.phase = 'eliminated'; return; }
    this.buildR32Bracket();
    this.knockoutRoundIndex = 0;
    this.playKnockoutMatch();
  }

  private slotToTeam(slot: string): Team {
    const pos = parseInt(slot[0], 10);
    const grp = slot[1];
    return this.groupStandings[grp][pos - 1].team;
  }

  private buildR32Bracket(): void {
    const thirds = Object.keys(this.groupStandings)
      .map(g => ({ team: this.groupStandings[g][2].team, st: this.groupStandings[g][2] }))
      .sort((a, b) => b.st.points - a.st.points || b.st.gd - a.st.gd || b.st.gf - a.st.gf);
    const best8 = thirds.slice(0, 8).map(x => x.team);
    let thirdIdx = 0;

    this.knockoutPairs = R32_PAIRINGS_RAW.map(([h, a]) => {
      const home = h === '3' ? best8[thirdIdx++] : this.slotToTeam(h);
      const away = a === '3' ? best8[thirdIdx++] : this.slotToTeam(a);
      return [home, away] as [Team, Team];
    });

    // Build initial full bracket display — index 0 = R32 (16 pairs)
    this.fullBracket = [];
    this.fullBracket[0] = this.knockoutPairs.map(([h, a], i) => ({
      home: h, away: a, winner: null, matchIndex: i,
    }));
    // Placeholder rounds for R16 (8), QF (4), SF (2), Final (1)
    const sizes = [8, 4, 2, 1];
    for (let r = 0; r < sizes.length; r++) {
      this.fullBracket[r + 1] = Array.from({ length: sizes[r] }, (_, i) => ({
        home: null, away: null, winner: null, matchIndex: i,
      }));
    }
  }

  // ─── Knockout flow ────────────────────────────────────────────────────────

  private playKnockoutMatch(): void {
    const pair = this.knockoutPairs.find(([h, a]) =>
      h === this.playerTeam || a === this.playerTeam
    );
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
        description: `🎯 PENALTY SHOOTOUT! After extra time it remains level — spot kicks decide!` });
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

    const m           = this.currentKnockoutMatch;
    const playerHome  = m.home === this.playerTeam;
    const playerGoals = playerHome ? m.homeGoals : m.awayGoals;
    const oppGoals    = playerHome ? m.awayGoals : m.homeGoals;

    if (playerGoals < oppGoals) { this.phase = 'eliminated'; return; }

    // Simulate all other round matches
    const winners: Team[] = [];
    for (const [h, a] of this.knockoutPairs) {
      if (h === this.playerTeam || a === this.playerTeam) {
        winners.push(this.playerTeam);
        continue;
      }
      const { homeGoals: hg, awayGoals: ag } = this.simulateMatch(h, a, false);
      winners.push(hg > ag ? h : ag > hg ? a : Math.random() < 0.5 ? h : a);
    }

    // Update bracket display for this round
    if (this.fullBracket[this.knockoutRoundIndex]) {
      this.fullBracket[this.knockoutRoundIndex].forEach((slot, i) => {
        if (i < this.knockoutPairs.length) slot.winner = winners[i];
      });
    }

    this.knockoutRoundIndex++;
    if (this.knockoutRoundIndex >= KNOCKOUT_ROUND_NAMES.length) {
      this.phase = 'champion';
      return;
    }

    // Build next round pairs
    this.knockoutPairs = [];
    for (let i = 0; i < winners.length; i += 2) {
      if (winners[i + 1]) this.knockoutPairs.push([winners[i], winners[i + 1]]);
    }

    // Update next bracket round display
    if (this.fullBracket[this.knockoutRoundIndex]) {
      this.fullBracket[this.knockoutRoundIndex] = this.knockoutPairs.map(([h, a], i) => ({
        home: h, away: a, winner: null, matchIndex: i,
      }));
    }

    this.phase = 'knockout_result';
  }

  continueKnockout(): void { this.playKnockoutMatch(); }

  get currentKnockoutRoundName(): string {
    return KNOCKOUT_ROUND_NAMES[this.knockoutRoundIndex] ?? 'Final';
  }

  // ─── Live score ───────────────────────────────────────────────────────────

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
      if (!map.has(m.home.group)) map.set(m.home.group, []);
      map.get(m.home.group)!.push(m);
    }
    return Array.from(map.entries()).sort(([a],[b]) => a.localeCompare(b))
      .map(([group, matches]) => ({ group, matches }));
  }

  scoreLabel(m: MatchResult): string { return `${m.homeGoals} – ${m.awayGoals}`; }

  playerWon(m: MatchResult | null): boolean {
    if (!m || !this.playerTeam) return false;
    return m.home === this.playerTeam ? m.homeGoals > m.awayGoals : m.awayGoals > m.homeGoals;
  }

  playerDrew(m: MatchResult | null): boolean { return !!m && m.homeGoals === m.awayGoals; }

  matchOutcomeLabel(m: MatchResult): string {
    return this.playerWon(m) ? 'WIN' : this.playerDrew(m) ? 'DRAW' : 'LOSS';
  }

  matchOutcomeClass(m: MatchResult): string {
    return this.playerWon(m) ? 'outcome-win' : this.playerDrew(m) ? 'outcome-draw' : 'outcome-loss';
  }

  isPlayerEvent(ev: MatchEvent): boolean { return ev.team === this.playerTeam?.name; }

  get currentBracketRound(): BracketSlot[] {
    return this.fullBracket[this.knockoutRoundIndex] ?? [];
  }

  // Full bracket display — all rounds including past
  get bracketRounds(): { name: string; slots: BracketSlot[] }[] {
    return this.fullBracket.map((slots, i) => ({
      name: KNOCKOUT_ROUND_NAMES[i] ?? '',
      slots,
    }));
  }

  isPlayerSlot(slot: BracketSlot): boolean {
    return slot.home === this.playerTeam || slot.away === this.playerTeam;
  }

  resetGame(): void {
    this.clearTimerInterval();
    this.phase = 'home'; this.playerTeam = null;
    this.groups = {}; this.groupSchedule = [];
    this.groupStandings = {}; this.knockoutPairs = [];
    this.knockoutRoundIndex = 0;
    this.currentMatch = null; this.currentKnockoutMatch = null;
    this.displayedEvents = []; this.roundResults = [];
    this.groupRound = 0; this.searchQuery = '';
    this.fullBracket = [];
  }

  // ─── Utils ────────────────────────────────────────────────────────────────

  private rand(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private clearTimerInterval(): void {
    if (this.matchInterval) { clearInterval(this.matchInterval); this.matchInterval = null; }
  }

  trackByName(_: number, t: Team): string { return t.name; }
  trackByIdx(i: number): number { return i; }
  trackByGroup(_: number, g: { group: string }): string { return g.group; }
}