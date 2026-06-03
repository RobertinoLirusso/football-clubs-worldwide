import { Component, OnInit, OnDestroy } from '@angular/core';
import { ClubService } from '../../services/club.service';
import { SeoService } from '../../services/seo.service';
 
interface Card {
  id: number;        // unique id for this card instance
  clubIndex: number; // index into the clubs array (pair key)
  club: any;
  flipped: boolean;
  matched: boolean;
}
 
@Component({
  selector: 'app-pairs',
  templateUrl: './pairs.component.html',
  styleUrl: './pairs.component.css'
})
export class PairsComponent implements OnInit, OnDestroy {
  clubs: any[] = [];
 
  readonly GRID_COLS = 6;
  readonly GRID_ROWS = 6;
  readonly TOTAL_CARDS = this.GRID_COLS * this.GRID_ROWS; // 36
  readonly TOTAL_PAIRS = this.TOTAL_CARDS / 2;            // 18
 
  readonly TIMER_SECONDS = 5 * 60; // 5 minutes
 
  cards: Card[] = [];
  flippedCards: Card[] = [];
  matchedCount = 0;
  moves = 0;
 
  gameActive = false;
  gameWon = false;
  gameLost = false;
  showEndModal = false;
  isChecking = false; // lock while evaluating a pair
 
  timeLeft = this.TIMER_SECONDS;
  private timerInterval: any = null;
 
  constructor(
    private clubService: ClubService,
    private seoService: SeoService,
  ) {}
 
  ngOnInit(): void {
    this.clubService.getClubs().subscribe((data) => {
      this.clubs = data;
    });
    this.seoService.updateSeo({
      title: 'Football Club Pairs - Memory Game',
      description:
        'Match pairs of football club logos in this memory game. Find all 18 pairs before the 5-minute timer runs out!',
      keywords:
        'football memory game, club pairs, soccer matching game, football minigame',
      url: 'https://football-clubs-worldwide.com/club-pairs',
      type: 'website',
    });
  }
 
  ngOnDestroy(): void {
    this.clearTimer();
  }
 
  // ─── Timer ───────────────────────────────────────────────────────────────
 
  get timerDisplay(): string {
    const m = Math.floor(this.timeLeft / 60);
    const s = this.timeLeft % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
 
  get timerWarning(): boolean {
    return this.timeLeft <= 60 && this.timeLeft > 0;
  }
 
  get timerProgress(): number {
    return (this.timeLeft / this.TIMER_SECONDS) * 100;
  }
 
  private startTimer(): void {
    this.clearTimer();
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.clearTimer();
        if (this.gameActive) {
          this.finishGame(false);
        }
      }
    }, 1000);
  }
 
  private clearTimer(): void {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
 
  // ─── Game logic ──────────────────────────────────────────────────────────
 
  startGame(): void {
    // Pick clubs that have a logo
    const withLogo = this.clubs.filter((c) => c.club_name && c.club_logo);
    if (withLogo.length < this.TOTAL_PAIRS) {
      return; // not enough clubs yet
    }
 
    // Shuffle and take the first TOTAL_PAIRS clubs
    const shuffledClubs = this.shuffleArray([...withLogo]).slice(0, this.TOTAL_PAIRS);
 
    // Create two cards per club and shuffle the full deck
    const deck: Card[] = [];
    shuffledClubs.forEach((club, idx) => {
      deck.push({ id: idx * 2,     clubIndex: idx, club, flipped: false, matched: false });
      deck.push({ id: idx * 2 + 1, clubIndex: idx, club, flipped: false, matched: false });
    });
    this.cards = this.shuffleArray(deck);
 
    this.flippedCards = [];
    this.matchedCount = 0;
    this.moves = 0;
    this.timeLeft = this.TIMER_SECONDS;
    this.gameActive = true;
    this.gameWon = false;
    this.gameLost = false;
    this.showEndModal = false;
    this.isChecking = false;
 
    this.startTimer();
  }
 
  flipCard(card: Card): void {
    if (!this.gameActive || this.isChecking) return;
    if (card.flipped || card.matched) return;
    if (this.flippedCards.length >= 2) return;
 
    card.flipped = true;
    this.flippedCards.push(card);
 
    if (this.flippedCards.length === 2) {
      this.moves++;
      this.checkPair();
    }
  }
 
  private checkPair(): void {
    this.isChecking = true;
    const [a, b] = this.flippedCards;
 
    if (a.clubIndex === b.clubIndex) {
      // Match!
      setTimeout(() => {
        a.matched = true;
        b.matched = true;
        this.matchedCount++;
        this.flippedCards = [];
        this.isChecking = false;
 
        if (this.matchedCount === this.TOTAL_PAIRS) {
          this.clearTimer();
          this.finishGame(true);
        }
      }, 600);
    } else {
      // No match — flip back after a short delay
      setTimeout(() => {
        a.flipped = false;
        b.flipped = false;
        this.flippedCards = [];
        this.isChecking = false;
      }, 1000);
    }
  }
 
  private finishGame(won: boolean): void {
    this.gameActive = false;
    this.gameWon = won;
    this.gameLost = !won;
    this.showEndModal = true;
  }
 
  playAgain(): void {
    this.showEndModal = false;
    this.startGame();
  }
 
  // ─── Helpers ─────────────────────────────────────────────────────────────
 
  private shuffleArray<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
 
  trackByCardId(_: number, card: Card): number {
    return card.id;
  }
 
  // Elapsed time formatted for the end modal
  get timeUsed(): string {
    const elapsed = this.TIMER_SECONDS - this.timeLeft;
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    return `${m}m ${s}s`;
  }
}
