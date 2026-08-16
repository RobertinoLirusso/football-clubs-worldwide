import { Component, OnInit, HostListener } from '@angular/core';
import { ClubService } from '../../services/club.service';
import { COUNTRY_FLAG_MAP } from '../../utils/country-flags';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css'],
})
export class CardComponent implements OnInit {
  clubs: any[] = [];
  selectedClub: any = null;
  searchTerm: string = '';
  visibleClubs: number = 100;

  showBackToTop: boolean = false;
  isFadingOut: boolean = false;
  isSuggestModalOpen: boolean = false;

  animatedClubsCount: number = 0;

  isCountryModalOpen: boolean = false;
  selectedCountry: string = '';
  countrySearch: string = '';
  countries: string[] = [];
  sortOption: string = 'default';
  selectedImage: any = null;
  matches: any[] = [];
  loadingMatches = true;
  isMatchesModalOpen: boolean = false;

  // Drag & Drop
  draggedIndex: number | null = null;
  dragOverIndex: number | null = null;

  isWallpaperModalOpen: boolean = false;
  wallpaperStyles: { value: string; label: string; icon: string }[] = [
    { value: 'stripes',    label: 'Ultras Stripes',  icon: '🏴' },
    { value: 'sunburst',   label: 'Sunburst',        icon: '☀️' },
    { value: 'halftone',   label: 'Halftone Fade',   icon: '⚫' },
    { value: 'chevron',    label: 'Chevron Flag',    icon: '🔻' },
    { value: 'logos',      label: 'Logo Pattern',    icon: '🔁' },
    { value: 'blackwhite', label: 'Black & White',   icon: '◐' },
    { value: 'blurred',    label: 'Soft Blur',       icon: '🌫️' },
    { value: 'spotlight',  label: 'Stadium Lights',  icon: '🏟️' },
    { value: 'wordmark',   label: 'Wordmark Pattern', icon: '🔤' },
  ];

  selectedWallpaperStyle: string = 'stripes';
  isGeneratingWallpaper: boolean = false;

  highlightedClubs: string[] = [
    'Real Madrid',
    'Inter Milan',
    'Racing Club',
    'Barcelona',
    'Chelsea',
    'Paris Saint-Germain',
    'Liverpool',
    'Tottenham Hotspur',
    'Al Nassr',
    'Manchester City',
    'Inter Miami',
    'Flamengo',
    'Arsenal',
    'AC Milan',
    'Atlético Madrid',
    'Borussia Dortmund',
    'Palmeiras',
    'Bayern Munich',
    'Manchester United',
    'Newcastle United',
    'Juventus',
    'AS Roma',
    'Napoli',
    'Bayer 04 Leverkusen',
  ];

  constructor(private clubService: ClubService) {}

  ngOnInit(): void {
    this.getClubs();
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const shouldShow = window.scrollY > 500;

    if (shouldShow && !this.showBackToTop) {
      this.isFadingOut = false;
      this.showBackToTop = true;
    } else if (!shouldShow && this.showBackToTop) {
      this.isFadingOut = true;
      setTimeout(() => {
        this.showBackToTop = false;
        this.isFadingOut = false;
      }, 400);
    }
  }

  getClubs(): void {
    this.clubService.getClubs().subscribe(data => {
      this.clubs = this.shuffleArray(data);
      this.extractCountries();
      this.animateCounter();
    });
  }

  shuffleArray(array: any[]): any[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  trackByClub(index: number, club: any): string {
    return club.club_name;
  }

  animateCounter(): void {
    const duration = 1500;
    const frameRate = 30;
    const totalFrames = Math.round((duration / 1000) * frameRate);
    let frame = 0;
    const total = this.clubs.length;

    const counter = setInterval(() => {
      frame++;
      this.animatedClubsCount = Math.min(
        Math.round((frame / totalFrames) * total),
        total
      );
      if (frame >= totalFrames) {
        clearInterval(counter);
      }
    }, 1000 / frameRate);
  }

  openModal(index: number): void {
    this.selectedClub = this.filteredClubs[index];
  }

  closeModal(): void {
    this.selectedClub = null;
  }

  extractCountries(): void {
    const countrySet = new Set<string>();
    this.clubs.forEach(club => {
      const parts = club.city_country.split(',');
      if (parts.length > 1) {
        countrySet.add(parts[1].trim());
      }
    });
    this.countries = Array.from(countrySet).sort();
  }

  openCountryModal(): void {
    this.isCountryModalOpen = true;
  }

  closeCountryModal(): void {
    this.isCountryModalOpen = false;
  }

  selectCountry(country: string): void {
    this.selectedCountry = country;
    this.isCountryModalOpen = false;
    this.visibleClubs = 100;
  }

  clearCountryFilterModal(): void {
    this.countrySearch = '';
  }

  clearCountryFilter(): void {
    this.selectedCountry = '';
    this.isCountryModalOpen = false;
    this.visibleClubs = 100;
  }

  filteredCountries(): string[] {
    if (!this.countrySearch) return this.countries;
    return this.countries.filter(c =>
      c.toLowerCase().includes(this.countrySearch.toLowerCase())
    );
  }

  get filteredClubs(): any[] {
    let filtered = this.clubs;

    if (this.selectedCountry) {
      filtered = filtered.filter(club => {
        const parts = club.city_country.split(',');
        const country = parts.length > 1 ? parts[1].trim().toLowerCase() : '';
        return country === this.selectedCountry.toLowerCase();
      });
    }

    if (this.searchTerm) {
      const searchTermLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(club => {
        const parts = club.city_country.split(',');
        const city = parts[0].trim().toLowerCase();
        return (
          club.club_name.toLowerCase().includes(searchTermLower) ||
          city.includes(searchTermLower)
        );
      });
    } else if (!this.selectedCountry) {
      const highlighted = filtered.filter(club =>
        this.highlightedClubs.includes(club.club_name)
      );
      const rest = filtered.filter(club =>
        !this.highlightedClubs.includes(club.club_name)
      );
      filtered = [...highlighted, ...rest];
    }

    if (this.sortOption === 'az') {
      filtered = [...filtered].sort((a, b) =>
        a.club_name.localeCompare(b.club_name)
      );
    } else if (this.sortOption === 'za') {
      filtered = [...filtered].sort((a, b) =>
        b.club_name.localeCompare(a.club_name)
      );
    } else if (this.sortOption === 'default') {
      const highlighted = filtered.filter(club =>
        this.highlightedClubs.includes(club.club_name)
      );
      const rest = filtered.filter(club =>
        !this.highlightedClubs.includes(club.club_name)
      );
      filtered = [...highlighted, ...rest];
    }

    return filtered.slice(0, this.visibleClubs);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.visibleClubs = 100;
  }

  loadMore(): void {
    this.visibleClubs += 100;
  }

  scrollToTop(): void {
    window.scroll({
      top: 0,
      behavior: 'smooth'
    });
  }

  selectRandomClub(): void {
    const pool = this.selectedCountry
      ? this.clubs.filter(club => {
          const parts = club.city_country.split(',');
          const country = parts.length > 1 ? parts[1].trim().toLowerCase() : '';
          return country === this.selectedCountry.toLowerCase();
        })
      : this.clubs;

    if (pool.length > 0) {
      const randomIndex = Math.floor(Math.random() * pool.length);
      this.searchTerm = pool[randomIndex].club_name;
    }
  }

  getTwitterShareUrl(club: any): string {
    const text = `Check out ${club.club_name} from ${club.city_country}! ⚽\n`;
    const url = `https://football-clubs-worldwide.vercel.app/`;
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  }

  get totalFilteredCount(): number {
    return this.clubs.filter(club => {
      const matchesCountry = !this.selectedCountry ||
        (club.city_country.split(',')[1]?.trim().toLowerCase() === this.selectedCountry.toLowerCase());
      const matchesName = !this.searchTerm ||
        club.club_name.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchesCountry && matchesName;
    }).length;
  }

  getGoogleNewsUrl(club: any): string {
    return `https://www.google.com/search?q=${encodeURIComponent(club.club_name)}`;
  }

  get totalClubs(): number {
    return this.clubs.length;
  }

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

  openImageModal(club: any, event: Event) {
    event.stopPropagation();
    this.selectedImage = club.club_logo;
  }

  closeImageModal() {
    this.selectedImage = null;
  }

  openMatchesModal(): void {
    this.isMatchesModalOpen = true;
  }

  closeMatchesModal(): void {
    this.isMatchesModalOpen = false;
  }

  getYouTubeUrl(club: any): string {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(club.club_name)}`;
  }

  // ============================================================
  // DRAG & DROP
  // ============================================================

  onDragStart(event: DragEvent, index: number): void {
    this.draggedIndex = index;
    setTimeout(() => {
      (event.target as HTMLElement).classList.add('is-dragging');
    }, 0);
  }

  onDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    this.dragOverIndex = index;
  }

  onDragLeave(event: DragEvent): void {
    const related = event.relatedTarget as HTMLElement;
    if (!related || !(event.currentTarget as HTMLElement).contains(related)) {
      this.dragOverIndex = null;
    }
  }

  onDrop(event: DragEvent, dropIndex: number): void {
    event.preventDefault();

    if (this.draggedIndex === null || this.draggedIndex === dropIndex) {
      this.draggedIndex = null;
      this.dragOverIndex = null;
      return;
    }

    const visibleClubs = this.filteredClubs;
    const clubA = visibleClubs[this.draggedIndex];
    const clubB = visibleClubs[dropIndex];

    const realIndexA = this.clubs.findIndex(c => c.club_name === clubA.club_name);
    const realIndexB = this.clubs.findIndex(c => c.club_name === clubB.club_name);

    if (realIndexA !== -1 && realIndexB !== -1) {
      [this.clubs[realIndexA], this.clubs[realIndexB]] =
        [this.clubs[realIndexB], this.clubs[realIndexA]];
    }

    this.draggedIndex = null;
    this.dragOverIndex = null;
  }

  onDragEnd(event: DragEvent): void {
    (event.target as HTMLElement).classList.remove('is-dragging');
    this.draggedIndex = null;
    this.dragOverIndex = null;
  }

  // ============================================================
  // WALLPAPER GENERATOR
  // ============================================================

  private buildProxiedUrl(url: string): string {
    const clean = url.replace(/^https?:\/\//, '');
    return `https://wsrv.nl/?url=${encodeURIComponent(clean)}&output=png`;
  }

  private loadImageForCanvas(url: string): Promise<HTMLImageElement> {
    const tryLoad = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('load-failed'));
        img.src = src;
      });
    };

    const isWikimedia = url.includes('upload.wikimedia.org');
    const firstAttempt = isWikimedia ? url : this.buildProxiedUrl(url);

    return tryLoad(firstAttempt).catch(() => {
      const fallback = isWikimedia ? this.buildProxiedUrl(url) : url;
      return tryLoad(fallback).catch(() => {
        throw new Error('No se pudo cargar el logo (ni directo ni vía proxy)');
      });
    });
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const bigint = parseInt(hex.replace('#', ''), 16);
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b]
      .map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
      .join('');
  }

  private shadeColor(hex: string, percent: number): string {
    const { r, g, b } = this.hexToRgb(hex);
    const amt = Math.round(2.55 * percent);
    return this.rgbToHex(r + amt, g + amt, b + amt);
  }

  private rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    const d = max - min;
    if (d !== 0) {
      s = d / (1 - Math.abs(2 * l - 1));
      switch (max) {
        case r: h = ((g - b) / d) % 6; break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h *= 60;
      if (h < 0) h += 360;
    }
    return { h, s, l };
  }

  private extractDominantColor(img: HTMLImageElement): string {
    const size = 60;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, size, size);

    let data: Uint8ClampedArray;
    try {
      data = ctx.getImageData(0, 0, size, size).data;
    } catch {
      return '#1e3a5f';
    }

    const counts = new Map<string, { count: number; r: number; g: number; b: number }>();

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a < 200) continue;

      const { s, l } = this.rgbToHsl(r, g, b);
      if (l > 0.92 || l < 0.08 || s < 0.15) continue;

      const key = `${Math.round(r / 24)}-${Math.round(g / 24)}-${Math.round(b / 24)}`;
      const bucket = counts.get(key);
      if (bucket) bucket.count++;
      else counts.set(key, { count: 1, r, g, b });
    }

    if (counts.size === 0) return '#1e3a5f';

    let best = { count: 0, r: 30, g: 58, b: 95 };
    counts.forEach(bucket => { if (bucket.count > best.count) best = bucket; });

    return this.rgbToHex(best.r, best.g, best.b);
  }

  private getContrastColor(hex: string): string {
    const { r, g, b } = this.hexToRgb(hex);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? '#111111' : '#ffffff';
  }

  private async ensureFontLoaded(): Promise<void> {
    try {
      await document.fonts.load('bold 72px "Podkova"');
      await document.fonts.load('40px "Podkova"');
      await document.fonts.ready;
    } catch {
      // fallback silencioso a serif
    }
  }

  async downloadClubWallpaper(club: any): Promise<void> {
    if (!club || this.isGeneratingWallpaper) return;
    this.isGeneratingWallpaper = true;
  
    try {
      await this.ensureFontLoaded();
      const logo = await this.loadImageForCanvas(club.club_logo);
      const baseColor = this.extractDominantColor(logo);
  
      // Club "limpio" solo para lo que se dibuja en el wallpaper (no afecta el resto de la app)
      const wallpaperClub = {
        ...club,
        club_name: this.cleanClubNameForWallpaper(club.club_name),
      };
  
      const width = 1080, height = 1920;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
  
      switch (this.selectedWallpaperStyle) {
        case 'sunburst':   this.drawSunburstBackground(ctx, width, height, baseColor); break;
        case 'halftone':   this.drawHalftoneBackground(ctx, width, height, baseColor); break;
        case 'chevron':    this.drawChevronBackground(ctx, width, height, baseColor); break;
        case 'logos':      this.drawLogoPatternBackground(ctx, width, height, baseColor, logo); break;
        case 'blackwhite': this.drawBlackWhiteBackground(ctx, width, height, baseColor); break;
        case 'blurred':    this.drawBlurredBackground(ctx, width, height, baseColor); break;
        case 'spotlight':  this.drawSpotlightBackground(ctx, width, height, baseColor); break;
        case 'wordmark':   this.drawWordmarkBackground(ctx, width, height, baseColor, wallpaperClub); break;
        default:           this.drawStripesBackground(ctx, width, height, baseColor);
      }
  
      this.drawCrestBadge(ctx, logo, width / 2, height * 0.42, 460, baseColor);
      this.drawClubBanner(ctx, width, height, wallpaperClub, baseColor);
  
      const link = document.createElement('a');
      link.download = `${wallpaperClub.club_name.replace(/\s+/g, '_').toLowerCase()}_wallpaper.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
  
      this.closeWallpaperModal();
    } catch (err) {
      console.error('Error generando el wallpaper:', err);
    } finally {
      this.isGeneratingWallpaper = false;
    }
  }

  // --- Estilos de fondo ---

  private drawStripesBackground(ctx: CanvasRenderingContext2D, w: number, h: number, color: string): void {
    const dark = this.shadeColor(color, -35);
    const light = this.shadeColor(color, 15);

    ctx.fillStyle = dark;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-18 * Math.PI / 180);
    ctx.translate(-w / 2, -h / 2);

    const stripeWidth = 130;
    let toggle = false;
    for (let x = -h; x < w + h; x += stripeWidth) {
      ctx.fillStyle = toggle ? color : light;
      ctx.fillRect(x, -h, stripeWidth, h * 3);
      toggle = !toggle;
    }
    ctx.restore();

    const vignette = ctx.createRadialGradient(w / 2, h / 2, h / 4, w / 2, h / 2, h);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  }

  private drawSunburstBackground(ctx: CanvasRenderingContext2D, w: number, h: number, color: string): void {
    const dark = this.shadeColor(color, -40);
    const light = this.shadeColor(color, 20);
    const cx = w / 2, cy = h * 0.42;

    ctx.fillStyle = dark;
    ctx.fillRect(0, 0, w, h);

    const rays = 28;
    const maxRadius = Math.hypot(w, h);
    for (let i = 0; i < rays; i++) {
      ctx.fillStyle = i % 2 === 0 ? color : light;
      const a1 = (i / rays) * Math.PI * 2;
      const a2 = ((i + 1) / rays) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a1) * maxRadius, cy + Math.sin(a1) * maxRadius);
      ctx.lineTo(cx + Math.cos(a2) * maxRadius, cy + Math.sin(a2) * maxRadius);
      ctx.closePath();
      ctx.fill();
    }

    const vignette = ctx.createRadialGradient(cx, cy, h * 0.15, cx, cy, h * 0.75);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  }

  private drawHalftoneBackground(ctx: CanvasRenderingContext2D, w: number, h: number, color: string): void {
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, this.shadeColor(color, -10));
    gradient.addColorStop(1, this.shadeColor(color, -45));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    const spacing = 46;
    ctx.fillStyle = this.shadeColor(color, 25);
    for (let y = 0; y < h; y += spacing) {
      for (let x = 0; x < w; x += spacing) {
        const dist = Math.hypot(x - w / 2, y - h * 0.42) / (h * 0.75);
        const radius = Math.max(0, 1 - dist) * (spacing * 0.42);
        if (radius < 1) continue;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  private drawChevronBackground(ctx: CanvasRenderingContext2D, w: number, h: number, color: string): void {
    const dark = this.shadeColor(color, -35);
    const light = this.shadeColor(color, 15);

    ctx.fillStyle = dark;
    ctx.fillRect(0, 0, w, h);

    const bandHeight = 90, chevronDepth = 55;
    let toggle = false;
    for (let y = -bandHeight; y < h + bandHeight; y += bandHeight) {
      ctx.fillStyle = toggle ? color : light;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w / 2, y + chevronDepth);
      ctx.lineTo(w, y);
      ctx.lineTo(w, y + bandHeight);
      ctx.lineTo(w / 2, y + bandHeight + chevronDepth);
      ctx.lineTo(0, y + bandHeight);
      ctx.closePath();
      ctx.fill();
      toggle = !toggle;
    }

    const vignette = ctx.createRadialGradient(w / 2, h / 2, h / 4, w / 2, h / 2, h);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  }

  private drawLogoPatternBackground(
    ctx: CanvasRenderingContext2D, w: number, h: number, color: string, logo: HTMLImageElement
  ): void {
    const dark = this.shadeColor(color, -45);

    ctx.fillStyle = dark;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-14 * Math.PI / 180);
    ctx.translate(-w / 2, -h / 2);

    const tileSize = 260, gap = 300;
    const ratio = Math.min(tileSize / logo.width, tileSize / logo.height);
    const drawW = logo.width * ratio, drawH = logo.height * ratio;

    for (let y = -h; y < h * 2; y += gap) {
      for (let x = -w; x < w * 2; x += gap) {
        ctx.drawImage(logo, x, y, drawW, drawH);
      }
    }
    ctx.restore();

    const overlay = ctx.createLinearGradient(0, 0, 0, h);
    overlay.addColorStop(0, 'rgba(0,0,0,0.35)');
    overlay.addColorStop(0.5, 'rgba(0,0,0,0.55)');
    overlay.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, w, h);
  }

  private drawBlackWhiteBackground(ctx: CanvasRenderingContext2D, w: number, h: number, color: string): void {
    const black = '#0a0a0a';
    const white = '#f2f2f2';
    const gray = '#4d4d4d';

    ctx.fillStyle = black;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-18 * Math.PI / 180);
    ctx.translate(-w / 2, -h / 2);

    const stripeWidth = 130;
    const palette = [black, white, gray];
    let idx = 0;
    for (let x = -h; x < w + h; x += stripeWidth) {
      ctx.fillStyle = palette[idx % palette.length];
      ctx.fillRect(x, -h, stripeWidth, h * 3);
      idx++;
    }
    ctx.restore();

    const vignette = ctx.createRadialGradient(w / 2, h / 2, h / 4, w / 2, h / 2, h);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  }

  // Fondo difuminado tipo "glow" — manchas de color suaves desenfocadas con canvas filter blur
  private drawBlurredBackground(ctx: CanvasRenderingContext2D, w: number, h: number, color: string): void {
    const dark = this.shadeColor(color, -50);
    const mid = this.shadeColor(color, -10);
    const light = this.shadeColor(color, 30);

    const base = ctx.createLinearGradient(0, 0, 0, h);
    base.addColorStop(0, dark);
    base.addColorStop(1, this.shadeColor(color, -60));
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.filter = 'blur(90px)';

    const blobs = [
      { x: w * 0.25, y: h * 0.22, r: 380, c: light },
      { x: w * 0.8,  y: h * 0.35, r: 320, c: mid },
      { x: w * 0.3,  y: h * 0.68, r: 360, c: color },
      { x: w * 0.75, y: h * 0.78, r: 300, c: light },
      { x: w * 0.5,  y: h * 0.5,  r: 420, c: mid },
    ];

    blobs.forEach(blob => {
      ctx.beginPath();
      ctx.fillStyle = blob.c;
      ctx.globalAlpha = 0.75;
      ctx.arc(blob.x, blob.y, blob.r, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
    ctx.globalAlpha = 1;

    // Grano/textura suave encima para que no se vea "plano"
    const vignette = ctx.createRadialGradient(w / 2, h / 2, h / 3, w / 2, h / 2, h);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  }

  // Reflectores de estadio de noche — haces de luz convergiendo desde arriba
  private drawSpotlightBackground(ctx: CanvasRenderingContext2D, w: number, h: number, color: string): void {
    ctx.fillStyle = '#050608';
    ctx.fillRect(0, 0, w, h);

    const beamSources = [
      { x: -w * 0.1, angle: 24 },
      { x: w * 0.35, angle: 8 },
      { x: w * 0.65, angle: -8 },
      { x: w * 1.1,  angle: -24 },
    ];

    ctx.save();
    beamSources.forEach(src => {
      const beamWidthTop = 70;
      const beamWidthBottom = 420;
      const rad = (src.angle * Math.PI) / 180;
      const dx = Math.sin(rad) * h;

      const grad = ctx.createLinearGradient(src.x, 0, src.x, h);
      grad.addColorStop(0, this.hexToRgbaString(color, 0.55));
      grad.addColorStop(1, this.hexToRgbaString(color, 0));

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(src.x - beamWidthTop / 2, 0);
      ctx.lineTo(src.x + beamWidthTop / 2, 0);
      ctx.lineTo(src.x + dx + beamWidthBottom / 2, h);
      ctx.lineTo(src.x + dx - beamWidthBottom / 2, h);
      ctx.closePath();
      ctx.fill();
    });
    ctx.restore();

    // Brillo central donde convergen los haces
    const glow = ctx.createRadialGradient(w / 2, h * 0.4, 40, w / 2, h * 0.4, h * 0.5);
    glow.addColorStop(0, this.hexToRgbaString(color, 0.35));
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // Puntos de "estrellas/flashes" tipo cámaras de fotos en la tribuna
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h * 0.5;
      const r = Math.random() * 1.6 + 0.4;
      ctx.globalAlpha = Math.random() * 0.6 + 0.2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    const vignette = ctx.createRadialGradient(w / 2, h / 2, h / 4, w / 2, h / 2, h);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  }

// Fondo de texto repetido: nombre, ciudad y país en mosaico rotado (mismo espíritu que logos)
private drawWordmarkBackground(
  ctx: CanvasRenderingContext2D, w: number, h: number, color: string, club: any
): void {
  const dark = this.shadeColor(color, -45);

  ctx.fillStyle = dark;
  ctx.fillRect(0, 0, w, h);

  const parts = club.city_country.split(',');
  const city = (parts[0] || '').trim();
  const country = (parts[1] || '').trim();

  const words = [club.club_name.toUpperCase(), city.toUpperCase(), country.toUpperCase()]
    .filter(Boolean);
  const line = words.join('   •   ');

  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-14 * Math.PI / 180);
  ctx.translate(-w / 2, -h / 2);

  ctx.font = 'bold 46px "Podkova", serif';
  ctx.textBaseline = 'middle';

  const rowHeight = 90;
  const textWidth = ctx.measureText(line + '   •   ').width;
  let toggle = false;

  for (let y = -h; y < h * 2; y += rowHeight) {
    ctx.fillStyle = toggle ? color : this.shadeColor(color, 25);
    let x = -w;
    // repetimos el bloque de texto hasta cubrir todo el ancho rotado
    while (x < w * 2) {
      ctx.fillText(line + '   •   ', x, y);
      x += textWidth;
    }
    toggle = !toggle;
  }

  ctx.restore();
  ctx.globalAlpha = 1;

  const overlay = ctx.createLinearGradient(0, 0, 0, h);
  overlay.addColorStop(0, 'rgba(0,0,0,0.4)');
  overlay.addColorStop(0.5, 'rgba(0,0,0,0.6)');
  overlay.addColorStop(1, 'rgba(0,0,0,0.8)');
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, w, h);
}

// Quita sufijos tipo "(Defunct)", "(defunct)", " - Defunct" del nombre para el wallpaper
private cleanClubNameForWallpaper(name: string): string {
  return name
    .replace(/\s*\(defunct\)\s*/gi, '')
    .replace(/\s*-\s*defunct\s*/gi, '')
    .trim();
}

  private hexToRgbaString(hex: string, alpha: number): string {
    const { r, g, b } = this.hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  private drawCrestBadge(
    ctx: CanvasRenderingContext2D, logo: HTMLImageElement,
    cx: number, cy: number, size: number, color: string
  ): void {
    const radius = size / 2 + 40;

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 60;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.97)';
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.lineWidth = 14;
    ctx.strokeStyle = color;
    ctx.stroke();

    const ratio = Math.min(size / logo.width, size / logo.height);
    const drawW = logo.width * ratio, drawH = logo.height * ratio;
    ctx.drawImage(logo, cx - drawW / 2, cy - drawH / 2, drawW, drawH);
  }

  private drawClubBanner(ctx: CanvasRenderingContext2D, w: number, h: number, club: any, color: string): void {
    const bannerY = h * 0.72, bannerHeight = h * 0.16;
    const textColor = this.getContrastColor(this.shadeColor(color, -40));

    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, bannerY, w, bannerHeight);
    ctx.fillStyle = color;
    ctx.fillRect(0, bannerY, w, 8);

    ctx.textAlign = 'center';
    ctx.fillStyle = textColor;
    ctx.font = 'bold 68px "Podkova", serif';
    this.wrapText(ctx, club.club_name.toUpperCase(), w / 2, bannerY + bannerHeight * 0.42, w - 120, 74);

    ctx.font = '40px "Podkova", serif';
    ctx.globalAlpha = 0.85;
    ctx.fillText(club.city_country, w / 2, bannerY + bannerHeight * 0.85);
    ctx.globalAlpha = 1;
  }

  private wrapText(
    ctx: CanvasRenderingContext2D, text: string,
    x: number, y: number, maxWidth: number, lineHeight: number
  ): void {
    const words = text.split(' ');
    let line = '';
    const lines: string[] = [];

    for (const word of words) {
      const testLine = line + word + ' ';
      if (ctx.measureText(testLine).width > maxWidth && line !== '') {
        lines.push(line.trim());
        line = word + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line.trim());

    const startY = y - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
  }

  openWallpaperModal(): void {
    this.isWallpaperModalOpen = true;
  }

  closeWallpaperModal(): void {
    this.isWallpaperModalOpen = false;
  }
}