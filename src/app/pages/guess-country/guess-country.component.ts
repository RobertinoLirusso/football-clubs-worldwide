import { Component, OnInit, OnDestroy } from '@angular/core';
import { ClubService } from '../../services/club.service';
import { SeoService } from '../../services/seo.service';
import { COUNTRY_FLAG_MAP } from '../../utils/country-flags';

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'home' | 'group' | 'playoff' | 'knockout' | 'champion' | 'eliminated';
type KnockoutRound = 'Round of 16' | 'Quarter-final' | 'Semi-final' | 'Final';

interface Question {
  club: any;
  correctCountry: string;
  correctCode: string;
  options: { country: string; code: string }[];
}

interface GroupResult {
  correct: boolean;
  club: any;
  correctCountry: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const KNOCKOUT_ROUNDS: KnockoutRound[] = ['Round of 16', 'Quarter-final', 'Semi-final', 'Final'];
const TIMER_SECONDS = 10;

@Component({
  selector: 'app-guess-country',
  templateUrl: './guess-country.component.html',
  styleUrl: './guess-country.component.css',
})
export class GuessCountryComponent implements OnInit, OnDestroy {
  clubs: any[] = [];

  // ── Phase state
  phase: Phase = 'home';

  // ── Current question
  question: Question | null = null;
  selectedCode: string | null = null;
  answered = false;
  timeLeft = TIMER_SECONDS;
  timerProgress = 100;
  private timerInterval: any = null;

  // ── Group phase (3 questions)
  groupQuestions: Question[] = [];
  groupIndex = 0;
  groupResults: GroupResult[] = [];

  // ── Playoff phase (2 questions, need ≥1)
  playoffQuestions: Question[] = [];
  playoffIndex = 0;
  playoffCorrect = 0;

  // ── Knockout phase
  knockoutRoundIndex = 0;
  knockoutCorrect = 0; // correct in current round (need 1)

  // ── Used club ids to avoid repeats in a session
  private usedClubIds = new Set<number>();

  // ── Expose to template
  readonly KNOCKOUT_ROUNDS = KNOCKOUT_ROUNDS;
  readonly TIMER_SECONDS = TIMER_SECONDS;

  constructor(
    private clubService: ClubService,
    private seoService: SeoService,
  ) {}

  ngOnInit(): void {
    this.clubService.getClubs().subscribe((data) => {
      this.clubs = data;
    });
    this.seoService.updateSeo({
      title: 'Guess the Country - Football Quiz',
      description: 'See the club logo and guess the country. Group stage, playoffs and knockout rounds!',
      keywords: 'football country quiz, club logo quiz, football flags, soccer trivia',
      url: 'https://football-clubs-worldwide.com/guess-country',
      type: 'website',
    });
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  // ─── Public getters ───────────────────────────────────────────────────────

  get currentKnockoutRound(): KnockoutRound {
    return KNOCKOUT_ROUNDS[this.knockoutRoundIndex];
  }

  get groupScore(): number {
    return this.groupResults.filter(r => r.correct).length;
  }

  get timerWarning(): boolean {
    return this.timeLeft <= 4;
  }

  // ─── Flag helpers ─────────────────────────────────────────────────────────

  getCountryCode(value: string): string {
    let country = value;
    if (value.includes(',')) {
      const parts = value.split(',');
      country = parts.length > 1 ? parts[1].trim().toLowerCase() : '';
    } else {
      country = value.trim().toLowerCase();
    }
    return COUNTRY_FLAG_MAP[country] || 'un';
  }

  // ─── Game flow ────────────────────────────────────────────────────────────

  startGame(): void {
    this.usedClubIds.clear();
    this.groupResults = [];
    this.groupIndex = 0;
    this.knockoutRoundIndex = 0;

    this.groupQuestions = this.buildQuestions(3);
    this.phase = 'group';
    this.loadQuestion(this.groupQuestions[0]);
  }

  private loadQuestion(q: Question): void {
    this.question = q;
    this.selectedCode = null;
    this.answered = false;
    this.timeLeft = TIMER_SECONDS;
    this.timerProgress = 100;
    this.startTimer();
  }

  selectAnswer(code: string): void {
    if (this.answered) return;
    this.clearTimer();
    this.selectedCode = code;
    this.answered = true;
    this.processAnswer(code === this.question!.correctCode);
  }

  private onTimeout(): void {
    if (this.answered) return;
    this.clearTimer();
    this.selectedCode = null;
    this.answered = true;
    this.processAnswer(false);
  }

  private processAnswer(correct: boolean): void {
    if (this.phase === 'group') {
      this.groupResults.push({
        correct,
        club: this.question!.club,
        correctCountry: this.question!.correctCountry,
      });

      // Auto-advance after 1.4s
      setTimeout(() => this.advanceGroup(), 1400);

    } else if (this.phase === 'playoff') {
      if (correct) this.playoffCorrect++;
      setTimeout(() => this.advancePlayoff(), 1400);

    } else if (this.phase === 'knockout') {
      if (correct) {
        setTimeout(() => this.advanceKnockout(), 1400);
      } else {
        setTimeout(() => { this.phase = 'eliminated'; }, 1400);
      }
    }
  }

  private advanceGroup(): void {
    this.groupIndex++;

    if (this.groupIndex < 3) {
      this.loadQuestion(this.groupQuestions[this.groupIndex]);
      return;
    }

    // Group phase finished
    const score = this.groupScore;
    if (score === 3) {
      // Direct to knockout
      this.knockoutRoundIndex = 0;
      this.startKnockoutRound();
    } else if (score === 2) {
      // Playoff
      this.playoffQuestions = this.buildQuestions(2);
      this.playoffIndex = 0;
      this.playoffCorrect = 0;
      this.phase = 'playoff';
      this.loadQuestion(this.playoffQuestions[0]);
    } else {
      this.phase = 'eliminated';
    }
  }

  private advancePlayoff(): void {
    this.playoffIndex++;

    if (this.playoffIndex < 2) {
      this.loadQuestion(this.playoffQuestions[this.playoffIndex]);
      return;
    }

    // Playoff finished
    if (this.playoffCorrect >= 1) {
      this.knockoutRoundIndex = 0;
      this.startKnockoutRound();
    } else {
      this.phase = 'eliminated';
    }
  }

  private startKnockoutRound(): void {
    this.phase = 'knockout';
    const q = this.buildQuestions(1)[0];
    this.loadQuestion(q);
  }

  private advanceKnockout(): void {
    if (this.knockoutRoundIndex >= KNOCKOUT_ROUNDS.length - 1) {
      this.phase = 'champion';
    } else {
      this.knockoutRoundIndex++;
      this.startKnockoutRound();
    }
  }

  playAgain(): void {
    this.phase = 'home';
    this.question = null;
  }

  // ─── Question builder ─────────────────────────────────────────────────────

  private buildQuestions(count: number): Question[] {
    const pool = this.clubs.filter(c =>
      c.club_logo && c.city_country && this.getCountryCode(c.city_country) !== 'un'
    );

    const picked = this.pickUnique(pool, count);
    return picked.map(club => this.buildQuestion(club, pool));
  }

  private buildQuestion(club: any, pool: any[]): Question {
    this.usedClubIds.add(club.id ?? club.club_name);

    const correctCountry = this.extractCountry(club.city_country);
    const correctCode = this.getCountryCode(club.city_country);

    // Build 3 wrong options from distinct countries
    const wrongPool = pool.filter(c => {
      const code = this.getCountryCode(c.city_country);
      return code !== correctCode && code !== 'un';
    });

    const wrongClubs = this.pickUnique(wrongPool, 3);
    const wrongOptions = wrongClubs.map(c => ({
      country: this.extractCountry(c.city_country),
      code: this.getCountryCode(c.city_country),
    }));

    // Deduplicate by code
    const seen = new Set<string>([correctCode]);
    const uniqueWrong = wrongOptions.filter(o => {
      if (seen.has(o.code)) return false;
      seen.add(o.code);
      return true;
    }).slice(0, 3);

    const options = this.shuffleArray([
      { country: correctCountry, code: correctCode },
      ...uniqueWrong,
    ]);

    return { club, correctCountry, correctCode, options };
  }

  private extractCountry(cityCountry: string): string {
    if (!cityCountry) return '—';
    const parts = cityCountry.split(',');
    return parts.length > 1 ? parts[parts.length - 1].trim() : cityCountry.trim();
  }

  // ─── Timer ────────────────────────────────────────────────────────────────

  private startTimer(): void {
    this.clearTimer();
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      this.timerProgress = (this.timeLeft / TIMER_SECONDS) * 100;
      if (this.timeLeft <= 0) {
        this.clearTimer();
        this.onTimeout();
      }
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private pickUnique<T>(arr: T[], count: number): T[] {
    const shuffled = this.shuffleArray([...arr]);
    return shuffled.slice(0, count);
  }

  private shuffleArray<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  optionClass(code: string): string {
    if (!this.answered) return '';
    if (code === this.question!.correctCode) return 'correct';
    if (code === this.selectedCode) return 'wrong';
    return 'dimmed';
  }
}