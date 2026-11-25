import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  PLATFORM_ID,
  SimpleChanges,
  signal,
} from '@angular/core';
import confetti from 'canvas-confetti';
import { COUNTRY_FLAG_MAP } from '../../utils/country-flags';

export type RouletteState = 'IDLE' | 'SPINNING' | 'RESULT';

interface WheelSlice {
  index: number;
  path: string;
  centerDeg: number;
  badgeLeftPct: number;
  badgeTopPct: number;
  variant: 'a' | 'b';
  iconClass: string;
}

interface RimStud {
  cx: number;
  cy: number;
}

const WHEEL_SLICE_COUNT = 12;
const SPIN_DURATION_MS = 3800;
const GENERIC_SLICE_ICONS = [
  'fa-solid fa-shield-halved',
  'fa-solid fa-futbol',
  'fa-solid fa-trophy',
  'fa-solid fa-star',
];

@Component({
  selector: 'app-club-roulette',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './club-roulette.component.html',
  styleUrls: ['./club-roulette.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClubRouletteComponent implements OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Input() pool: any[] = [];
  @Input() fallbackPool: any[] = [];
  @Input() favorites: Set<string> = new Set<string>();
  @Input() highlightedClubs: string[] = [];
  @Input() filterLabel = '';

  @Output() closed = new EventEmitter<void>();
  @Output() openClubDetails = new EventEmitter<any>();
  @Output() filterToClub = new EventEmitter<any>();
  @Output() toggleFavoriteClub = new EventEmitter<any>();

  readonly state = signal<RouletteState>('IDLE');
  readonly slices = signal<WheelSlice[]>(this.buildGenericSlices());
  readonly rotationDeg = signal<number>(0);
  readonly pointerIndex = signal<number>(0);
  readonly currentTickerClub = signal<any | null>(null);
  readonly winner = signal<any | null>(null);
  readonly soundEnabled = signal<boolean>(true);
  readonly clackerKicked = signal<boolean>(false);
  readonly usingFallback = signal<boolean>(false);
  readonly effectiveCount = signal<number>(0);
  readonly failedBadges = signal<Set<string>>(new Set<string>());
  readonly spinCount = signal<number>(0);

  readonly rimStuds: RimStud[] = Array.from({ length: 24 }, (_, idx) => {
    const rad = ((idx * 15 - 90) * Math.PI) / 180;
    return {
      cx: +(200 + 189 * Math.cos(rad)).toFixed(2),
      cy: +(200 + 189 * Math.sin(rad)).toFixed(2),
    };
  });

  private isBrowser: boolean;
  private rafId: number | null = null;
  private clackerTimer: ReturnType<typeof setTimeout> | null = null;
  private audioCtx: AudioContext | null = null;
  private lastTickTime = 0;
  private lastTickIdx = -1;
  private wasOpen = false;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (this.isOpen && !this.wasOpen) {
        this.wasOpen = true;
        this.prepareWheel();
      } else if (!this.isOpen && this.wasOpen) {
        this.wasOpen = false;
        this.stopAnimations();
      }
    }
  }

  ngOnDestroy(): void {
    this.stopAnimations();
    this.closeAudioContext();
  }

  close(): void {
    this.stopAnimations();
    this.wasOpen = false;
    this.closed.emit();
  }

  toggleSound(): void {
    this.soundEnabled.update(enabled => !enabled);
  }

  prepareWheel(): void {
    this.stopAnimations();

    const activePool = this.pool.length > 0 ? this.pool : this.fallbackPool;
    this.usingFallback.set(this.pool.length === 0 && this.fallbackPool.length > 0);
    this.effectiveCount.set(activePool.length);
    this.winner.set(null);
    this.currentTickerClub.set(null);
    this.rotationDeg.set(0);
    this.pointerIndex.set(0);
    this.state.set('IDLE');
  }

  spin(): void {
    if (this.state() === 'SPINNING') return;
    this.stopAnimations();

    const activePool = this.pool.length > 0 ? this.pool : this.fallbackPool;
    this.usingFallback.set(this.pool.length === 0 && this.fallbackPool.length > 0);
    this.effectiveCount.set(activePool.length);

    if (activePool.length === 0) {
      this.winner.set(null);
      this.currentTickerClub.set(null);
      this.state.set('IDLE');
      return;
    }

    const winningClub = activePool[Math.floor(Math.random() * activePool.length)];
    const totalSlices = this.slices().length;
    const winningSliceIdx = Math.floor(Math.random() * totalSlices);

    if (activePool.length === 1 || !this.isBrowser || this.prefersReducedMotion()) {
      const sliceAngle = 360 / totalSlices;
      const targetLocalAngle = (winningSliceIdx + 0.5) * sliceAngle;
      this.rotationDeg.set((360 - targetLocalAngle) % 360);
      this.pointerIndex.set(winningSliceIdx);
      this.currentTickerClub.set(winningClub);
      this.winner.set(winningClub);
      this.state.set('RESULT');
      this.spinCount.update(c => c + 1);
      this.celebrateWinner();
      return;
    }

    const sliceAngle = 360 / totalSlices;
    const jitter = (Math.random() - 0.5) * 0.54;
    const targetLocalAngle = (winningSliceIdx + 0.5 + jitter) * sliceAngle;
    const desiredMod = ((360 - (targetLocalAngle % 360)) + 360) % 360;

    const startRotation = this.rotationDeg();
    const currentMod = ((startRotation % 360) + 360) % 360;
    const deltaMod = ((desiredMod - currentMod) + 360) % 360;
    const extraTurns = (4 + Math.floor(Math.random() * 2)) * 360;
    const targetRotation = startRotation + extraTurns + deltaMod;

    this.winner.set(null);
    this.state.set('SPINNING');
    this.lastTickIdx = this.computeSliceUnderPointer(startRotation, totalSlices);
    this.currentTickerClub.set(activePool[Math.floor(Math.random() * activePool.length)]);
    this.lastTickTime = 0;

    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / SPIN_DURATION_MS);
      const eased = 1 - Math.pow(1 - t, 4.15);
      const angle = startRotation + (targetRotation - startRotation) * eased;

      this.rotationDeg.set(angle);

      const idxUnderPointer = this.computeSliceUnderPointer(angle, totalSlices);
      if (idxUnderPointer !== this.lastTickIdx) {
        this.lastTickIdx = idxUnderPointer;
        this.pointerIndex.set(idxUnderPointer);
        this.currentTickerClub.set(activePool[Math.floor(Math.random() * activePool.length)]);
        this.triggerClackerKick();
        this.playTickSound(now, 1 - t);
      }

      if (t < 1) {
        this.rafId = requestAnimationFrame(step);
      } else {
        this.rafId = null;
        this.rotationDeg.set(targetRotation);
        this.pointerIndex.set(winningSliceIdx);
        this.currentTickerClub.set(winningClub);
        this.winner.set(winningClub);
        this.state.set('RESULT');
        this.spinCount.update(c => c + 1);
        this.celebrateWinner();
      }
    };

    this.rafId = requestAnimationFrame(step);
  }

  onViewDetails(): void {
    const club = this.winner();
    if (!club) return;
    this.stopAnimations();
    this.wasOpen = false;
    this.openClubDetails.emit(club);
  }

  onFilterInGrid(): void {
    const club = this.winner();
    if (!club) return;
    this.stopAnimations();
    this.wasOpen = false;
    this.filterToClub.emit(club);
  }

  onToggleFavorite(event: Event): void {
    event.stopPropagation();
    const club = this.winner();
    if (!club) return;
    this.toggleFavoriteClub.emit(club);
  }

  onBadgeError(clubName: string): void {
    this.failedBadges.update(set => {
      const next = new Set(set);
      next.add(clubName);
      return next;
    });
  }

  hasBadgeFailed(clubName: string): boolean {
    return this.failedBadges().has(clubName);
  }

  isFavorite(club: any): boolean {
    return !!club && this.favorites.has(club.club_name);
  }

  isLegend(club: any): boolean {
    return !!club && this.highlightedClubs.includes(club.club_name);
  }

  isDefunct(club: any): boolean {
    return !!club && /defunct/i.test(club.club_name);
  }

  displayName(club: any): string {
    if (!club?.club_name) return '';
    return club.club_name
      .replace(/\s*\(defunct\)\s*/gi, '')
      .replace(/\s*-\s*defunct\s*/gi, '')
      .trim();
  }

  getCountryCode(value: string): string {
    if (!value) return 'un';
    let country = value;
    if (value.includes(',')) {
      const parts = value.split(',');
      country = parts.length > 1 ? parts[1].trim().toLowerCase() : '';
    } else {
      country = value.trim().toLowerCase();
    }
    return COUNTRY_FLAG_MAP[country] || 'un';
  }

  trackBySlice(_index: number, slice: WheelSlice): number {
    return slice.index;
  }

  private buildGenericSlices(): WheelSlice[] {
    const sliceAngle = 360 / WHEEL_SLICE_COUNT;
    const radius = 178;
    const badgeRadiusPct = 33.5;

    return Array.from({ length: WHEEL_SLICE_COUNT }, (_, index) => {
      const startDeg = index * sliceAngle;
      const endDeg = (index + 1) * sliceAngle;
      const centerDeg = (startDeg + endDeg) / 2;

      const startRad = ((startDeg - 90) * Math.PI) / 180;
      const endRad = ((endDeg - 90) * Math.PI) / 180;
      const centerRad = ((centerDeg - 90) * Math.PI) / 180;

      const x1 = 200 + radius * Math.cos(startRad);
      const y1 = 200 + radius * Math.sin(startRad);
      const x2 = 200 + radius * Math.cos(endRad);
      const y2 = 200 + radius * Math.sin(endRad);

      const path = `M 200 200 L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius} ${radius} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;

      const badgeLeftPct = 50 + badgeRadiusPct * Math.cos(centerRad);
      const badgeTopPct = 50 + badgeRadiusPct * Math.sin(centerRad);

      return {
        index,
        path,
        centerDeg,
        badgeLeftPct: +badgeLeftPct.toFixed(2),
        badgeTopPct: +badgeTopPct.toFixed(2),
        variant: index % 2 === 0 ? 'a' : 'b',
        iconClass: GENERIC_SLICE_ICONS[index % GENERIC_SLICE_ICONS.length],
      };
    });
  }

  private computeSliceUnderPointer(wheelRotationDeg: number, totalSlices: number): number {
    const sliceAngle = 360 / totalSlices;
    const mod = ((wheelRotationDeg % 360) + 360) % 360;
    const localAngle = ((360 - mod) + 360) % 360;
    return Math.floor(localAngle / sliceAngle) % totalSlices;
  }

  private triggerClackerKick(): void {
    this.clackerKicked.set(true);
    if (this.clackerTimer) clearTimeout(this.clackerTimer);
    this.clackerTimer = setTimeout(() => {
      this.clackerKicked.set(false);
    }, 75);
  }

  private celebrateWinner(): void {
    this.playWinChime();
    if (!this.isBrowser || this.prefersReducedMotion()) return;

    try {
      confetti({
        particleCount: 55,
        spread: 68,
        startVelocity: 28,
        origin: { y: 0.56 },
        zIndex: 1200,
        colors: ['#f3f4f6', '#bfc3ca', '#27ae60', '#f5c542', '#62b6e8'],
      });
    } catch {
      // Ignore confetti errors in constrained headless environments
    }
  }

  private getAudioContext(): AudioContext | null {
    if (!this.isBrowser || !this.soundEnabled()) return null;
    try {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      if (!this.audioCtx) {
        this.audioCtx = new Ctor();
      }
      if (this.audioCtx.state === 'suspended') {
        void this.audioCtx.resume();
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  private playTickSound(nowMs: number, remainingRatio: number): void {
    if (!this.soundEnabled() || nowMs - this.lastTickTime < 28) return;
    this.lastTickTime = nowMs;

    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime;

      osc.type = 'triangle';
      const baseFreq = 460 + remainingRatio * 180;
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(160, t + 0.025);

      gain.gain.setValueAtTime(0.055, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.028);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.03);
    } catch {
      // Ignore Web Audio errors
    }
  }

  private playWinChime(): void {
    if (!this.soundEnabled()) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99];
      const baseTime = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = baseTime + idx * 0.075;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.065, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.3);
      });
    } catch {
      // Ignore Web Audio errors
    }
  }

  private prefersReducedMotion(): boolean {
    if (!this.isBrowser || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private stopAnimations(): void {
    if (this.rafId !== null && this.isBrowser) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.clackerTimer) {
      clearTimeout(this.clackerTimer);
      this.clackerTimer = null;
    }
    this.clackerKicked.set(false);
  }

  private closeAudioContext(): void {
    if (this.audioCtx) {
      try {
        void this.audioCtx.close();
      } catch {
        // Ignore close errors
      }
      this.audioCtx = null;
    }
  }
}
