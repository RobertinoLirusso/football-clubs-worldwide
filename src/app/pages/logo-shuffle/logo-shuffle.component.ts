import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ClubService } from '../../services/club.service';
import { SeoService } from '../../services/seo.service';
import { forkJoin } from 'rxjs';

// ─── Types ────────────────────────────────────────────────────────────────────

type Difficulty = 'easy' | 'medium' | 'hard';
type GameState = 'home' | 'playing' | 'solved';

interface DifficultyConfig {
  label: string;
  cols: number;
  rows: number;
  pieces: number;
}

interface Piece {
  id: number;          // original position index (0-based, row-major)
  currentIndex: number; // current slot index in the board
  bgX: number;         // background-position-x percentage
  bgY: number;         // background-position-y percentage
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy:   { label: 'Easy',   cols: 3, rows: 4, pieces: 12 },
  medium: { label: 'Medium', cols: 4, rows: 5, pieces: 20 },
  hard:   { label: 'Hard',   cols: 5, rows: 6, pieces: 30 },
};

@Component({
  selector: 'app-logo-shuffle',
  templateUrl: './logo-shuffle.component.html',
  styleUrl: './logo-shuffle.component.css',
})
export class LogoShuffleComponent implements OnInit, OnDestroy {
  clubs: any[] = [];

  // ── Game state
  gameState: GameState = 'home';
  selectedDifficulty: Difficulty = 'easy';
  currentClub: any = null;

  // ── Board
  pieces: Piece[] = [];          // ordered by currentIndex (slot position)
  dragSourceIndex: number | null = null;
  dragOverIndex:   number | null = null;

  // ── Stats
  moves = 0;

  // ── Expose to template
  readonly DIFFICULTIES = DIFFICULTIES;
  readonly DIFFICULTY_KEYS: Difficulty[] = ['easy', 'medium', 'hard'];

  constructor(
    private clubService: ClubService,
    private seoService: SeoService,
  ) {}

  ngOnInit(): void {
    forkJoin([
      this.clubService.getClubs(),
      this.clubService.getNationalTeams(),
    ]).subscribe(([clubs, nationals]) => {
      this.clubs = [...clubs, ...nationals];
    });
    this.seoService.updateSeo({
      title: 'Logo Shuffle - Football Puzzle',
      description: 'Rearrange the scrambled football club logo pieces to solve the puzzle!',
      keywords: 'football logo puzzle, club logo shuffle, soccer puzzle game',
      url: 'https://football-clubs-worldwide.com/logo-shuffle',
      type: 'website',
    });
  }

  ngOnDestroy(): void {}

  // ─── Getters ──────────────────────────────────────────────────────────────

  get config(): DifficultyConfig {
    return DIFFICULTIES[this.selectedDifficulty];
  }

  get isSolved(): boolean {
    return this.pieces.every(p => p.id === p.currentIndex);
  }

  // ─── Game flow ────────────────────────────────────────────────────────────

  startGame(difficulty: Difficulty): void {
    const pool = this.clubs.filter(c => c.club_logo && c.club_name);
    if (!pool.length) return;

    this.selectedDifficulty = difficulty;
    this.currentClub = pool[Math.floor(Math.random() * pool.length)];
    this.moves = 0;
    this.dragSourceIndex = null;
    this.dragOverIndex = null;

    this.buildBoard();
    this.gameState = 'playing';
  }

  playAgain(): void {
    this.gameState = 'home';
    this.pieces = [];
    this.currentClub = null;
  }

  retryDifficulty(): void {
    this.startGame(this.selectedDifficulty);
  }

  // ─── Board builder ────────────────────────────────────────────────────────

  private buildBoard(): void {
    const { pieces: total } = this.config;
    const { cols, rows } = this.config;

    // Create pieces with correct bg positions
    const ordered: Piece[] = Array.from({ length: total }, (_, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      return {
        id: i,
        currentIndex: i,
        bgX: cols === 1 ? 0 : (col / (cols - 1)) * 100,
        bgY: rows === 1 ? 0 : (row / (rows - 1)) * 100,
      };
    });

    // Shuffle until not already solved
    let shuffled: Piece[];
    do {
      shuffled = this.shuffleArray(ordered).map((p, idx) => ({ ...p, currentIndex: idx }));
    } while (shuffled.every((p, idx) => p.id === idx));

    this.pieces = shuffled;
  }

  // ─── Drag & drop ─────────────────────────────────────────────────────────

  onDragStart(index: number, event: DragEvent): void {
    this.dragSourceIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index));
    }
  }

  onDragOver(index: number, event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    this.dragOverIndex = index;
  }

  onDragLeave(): void {
    this.dragOverIndex = null;
  }

  onDrop(targetIndex: number, event: DragEvent): void {
    event.preventDefault();
    this.dragOverIndex = null;

    if (this.dragSourceIndex === null || this.dragSourceIndex === targetIndex) {
      this.dragSourceIndex = null;
      return;
    }

    this.swapPieces(this.dragSourceIndex, targetIndex);
    this.dragSourceIndex = null;
    this.moves++;

    if (this.isSolved) {
      setTimeout(() => { this.gameState = 'solved'; }, 400);
    }
  }

  onDragEnd(): void {
    this.dragSourceIndex = null;
    this.dragOverIndex = null;
  }

  // Touch support
  private touchStartIndex: number | null = null;

  onTouchStart(index: number): void {
    this.touchStartIndex = index;
  }

  onTouchEnd(index: number): void {
    if (this.touchStartIndex === null || this.touchStartIndex === index) {
      this.touchStartIndex = null;
      return;
    }
    this.swapPieces(this.touchStartIndex, index);
    this.touchStartIndex = null;
    this.moves++;

    if (this.isSolved) {
      setTimeout(() => { this.gameState = 'solved'; }, 400);
    }
  }

  private swapPieces(a: number, b: number): void {
    const newPieces = [...this.pieces];
    [newPieces[a], newPieces[b]] = [newPieces[b], newPieces[a]];
    newPieces[a] = { ...newPieces[a], currentIndex: a };
    newPieces[b] = { ...newPieces[b], currentIndex: b };
    this.pieces = newPieces;
  }

  // ─── Piece style ──────────────────────────────────────────────────────────

  pieceStyle(piece: Piece): { [key: string]: string } {
    const { cols, rows } = this.config;
    return {
      'background-image':    `url(${this.currentClub.club_logo})`,
      'background-size':     `${cols * 100}% ${rows * 100}%`,
      'background-position': `${piece.bgX}% ${piece.bgY}%`,
      'background-repeat':   'no-repeat',
    };
  }

  pieceClass(index: number): string {
    const classes: string[] = ['ls-piece'];
    if (this.dragSourceIndex === index) classes.push('dragging');
    if (this.dragOverIndex === index)   classes.push('drag-over');
    if (this.pieces[index]?.id === index) classes.push('in-place');
    return classes.join(' ');
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

  trackByIndex(index: number): number {
    return index;
  }
}