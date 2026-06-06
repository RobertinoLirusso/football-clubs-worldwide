import { Component, OnInit } from '@angular/core';
import { ClubService } from '../../services/club.service';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-hangman',
  templateUrl: './hangman.component.html',
  styleUrl: './hangman.component.css',
})
export class HangmanComponent implements OnInit {
  clubs: any[] = [];
  selectedClub: any = null;

  readonly maxLives = 5;
  lives = this.maxLives;

  /** Normalized lowercase letters (no accents) already guessed */
  guessedNormalized = new Set<string>();

  readonly alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  gameActive = false;
  gameWon = false;
  showEndModal = false;

  constructor(
    private clubService: ClubService,
    private seoService: SeoService,
  ) {}

  ngOnInit(): void {
    this.clubService.getClubs().subscribe((data) => {
      this.clubs = data;
    });
    this.seoService.updateSeo({
      title: 'Football Club Hangman - Minigame',
      description:
        'Guess the football club name letter by letter. You have five lives. Hints: city and country.',
      keywords:
        'football hangman, club quiz, soccer word game, football minigame',
      url: 'https://football-clubs-worldwide.com/hangman',
      type: 'website',
    });
  }

  get wrongCount(): number {
    return this.maxLives - this.lives;
  }

  getHintCity(club: any): string {
    if (!club?.city_country) {
      return '—';
    }
    const parts = club.city_country.split(',').map((p: string) => p.trim());
    if (parts.length <= 1) {
      return parts[0] || '—';
    }
    return parts.slice(0, -1).join(', ');
  }

  getHintCountry(club: any): string {
    if (!club?.city_country) {
      return '—';
    }
    const parts = club.city_country.split(',').map((p: string) => p.trim());
    if (parts.length <= 1) {
      return '—';
    }
    return parts[parts.length - 1];
  }

  private normalizeLetter(char: string): string {
    return char
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase();
  }

  private isLetter(char: string): boolean {
    return /\p{L}/u.test(char);
  }

  private letterCountInName(name: string): number {
    let n = 0;
    for (const ch of name) {
      if (this.isLetter(ch)) {
        n++;
      }
    }
    return n;
  }

  private normalizedLettersInName(name: string): Set<string> {
    const s = new Set<string>();
    for (const ch of name) {
      if (this.isLetter(ch)) {
        s.add(this.normalizeLetter(ch));
      }
    }
    return s;
  }

  letterUsed(letter: string): boolean {
    return this.guessedNormalized.has(letter.toLowerCase());
  }

  isSlotRevealed(raw: string): boolean {
    if (!this.isLetter(raw)) {
      return true;
    }
    return this.guessedNormalized.has(this.normalizeLetter(raw));
  }

  /** Letter shown in the word row (underscore for hidden letters). */
  letterHint(ch: string): string {
    if (ch === ' ') {
      return '';
    }
    if (!this.isLetter(ch)) {
      return ch;
    }
    return this.isSlotRevealed(ch) ? ch : '_';
  }

  nameChars(): string[] {
    return this.selectedClub ? [...this.selectedClub.club_name] : [];
  }

  isWordComplete(): boolean {
    if (!this.selectedClub) {
      return false;
    }
    const needed = this.normalizedLettersInName(this.selectedClub.club_name);
    for (const n of needed) {
      if (!this.guessedNormalized.has(n)) {
        return false;
      }
    }
    return true;
  }

  startGame(): void {
    const withLogo = this.clubs.filter(
      (c) =>
        c.club_name &&
        c.club_logo &&
        !c.club_name.includes('(Defunct)') &&
        this.letterCountInName(c.club_name) >= 3,
    );
    const pool = withLogo.length > 0
      ? withLogo
      : this.clubs.filter(
          (c) =>
            c.club_name &&
            !c.club_name.includes('(Defunct)') &&
            this.letterCountInName(c.club_name) >= 3,
        );
    if (!pool.length) {
      return;
    }
    this.selectedClub = pool[Math.floor(Math.random() * pool.length)];
    this.lives = this.maxLives;
    this.guessedNormalized.clear();
    this.gameActive = true;
    this.gameWon = false;
    this.showEndModal = false;
  }

  guessLetter(letter: string): void {
    if (!this.gameActive || !this.selectedClub) {
      return;
    }
    const norm = letter.toLowerCase();
    if (this.guessedNormalized.has(norm)) {
      return;
    }

    const inWord = this.normalizedLettersInName(
      this.selectedClub.club_name,
    ).has(norm);
    this.guessedNormalized.add(norm);

    if (!inWord) {
      this.lives--;
      if (this.lives <= 0) {
        this.finishGame(false);
      }
    } else if (this.isWordComplete()) {
      this.finishGame(true);
    }
  }

  private finishGame(won: boolean): void {
    this.gameActive = false;
    this.gameWon = won;
    this.showEndModal = true;
  }

  playAgainFromModal(): void {
    this.showEndModal = false;
    this.startGame();
  }
}
