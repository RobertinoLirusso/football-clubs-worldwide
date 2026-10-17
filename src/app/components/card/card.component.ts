import { Component, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
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
  zoomedClub: any = null;
  showBackToTop: boolean = false;
  isFadingOut: boolean = false;
  isSuggestModalOpen: boolean = false;

  hoveredClub: string | null = null;
  
  animatedClubsCount: number = 0;
  modalTab: 'countries' | 'cities' = 'countries';

  suggestions: any[] = [];
  suggestionsOpen = false;
  activeSuggestion = -1;
  private _exactClub: string | null = null;

  isDownloadingLogo = false;
logoDownloadMsg = '';
private logoMsgTimer: any;

  isCountryModalOpen: boolean = false;
  featuredCities = [
    { city: 'London', country: 'England' },
    { city: 'Paris', country: 'France' },
    { city: 'Buenos Aires', country: 'Argentina' },
    { city: 'Berlin', country: 'Germany' },
    { city: 'Madrid', country: 'Spain' },
    { city: 'Prague', country: 'Czech Republic' },
    { city: 'Istanbul', country: 'Turkey' },
    { city: 'Cairo', country: 'Egypt' },
    { city: 'Montevideo', country: 'Uruguay' },
    { city: 'New York', country: 'United States' },
    { city: 'Moscow', country: 'Russia' },
  ];
  countrySearch: string = '';
  countries: string[] = [];
  selectedImage: any = null;
  matches: any[] = [];
  loadingMatches = true;
  isMatchesModalOpen: boolean = false;

  loadedLogos = new Set<string>();
  failedLogos = new Set<string>();

colorGroups = [
  { value: 'red',     label: 'Red',      hex: '#d62839' },
  { value: 'orange',  label: 'Orange',   hex: '#f28c28' },
  { value: 'yellow',  label: 'Yellow',   hex: '#f5d90a' },
  { value: 'green',   label: 'Green',    hex: '#2e9e4f' },
  { value: 'skyblue', label: 'Sky blue', hex: '#62b6e8' },
  { value: 'blue',    label: 'Blue',     hex: '#1f5fbf' },
  { value: 'purple',  label: 'Purple',   hex: '#7b3fa0' },
  { value: 'white',   label: 'White',    hex: '#ffffff' },
  { value: 'black',   label: 'Black',    hex: '#111111' },
];

clubColors: Record<string, string[]> = {};
colorMenuOpen = false;
isAnalyzingColors = false;
private failedColors = new Set<string>();
private _selectedColor = '';
private colorAnalysisId = 0;


get selectedColor(): string { return this._selectedColor; }
set selectedColor(v: string) {
  this._selectedColor = v;
  this.resetPaging();
  if (v) {
    this.analyzeColors();
  } else {
    this.cancelColorAnalysis();
  }
}

private cancelColorAnalysis(): void {
  this.colorAnalysisId++;
  this.isAnalyzingColors = false; // apaga el spinner al instante
}



private _showDefunctOnly = false;

get showDefunctOnly(): boolean { return this._showDefunctOnly; }
set showDefunctOnly(v: boolean) { this._showDefunctOnly = v; this.resetPaging(); }

  // ============================================================
  // VISTA: SCROLL (Load More) / PÁGINAS
  // ============================================================

  viewMode: 'scroll' | 'pages' = 'scroll';
  visibleClubs: number = 100;

  pageSize = 24;
  currentPage = 0;
  slideDir: 'next' | 'prev' | '' = '';
  private touchStartX = 0;
  private touchStartY = 0;
  private slideTimer: any;

  @ViewChild('gridTop') gridTop!: ElementRef<HTMLElement>;

  @HostListener('document:keydown.escape')
  onEscape(): void {
  if (this.isWallpaperModalOpen) { this.closeWallpaperModal(); return; }
  if (this.selectedImage) { this.closeImageModal(); return; }
  if (this.selectedClub) { this.closeModal(); return; }
  if (this.isCountryModalOpen) this.closeCountryModal();
  if (this.colorMenuOpen) { this.closeColorMenu(); return; }
}

  // Filtros con setter: cualquier cambio vuelve a la primera página / primeros 100
  private _searchTerm = '';
  private _sortOption = 'default';
  private _selectedCountries: string[] = [];
  private _selectedCity: { city: string; country: string } | null = null;

  get searchTerm(): string { return this._searchTerm; }

  set searchTerm(v: string) {
  this._searchTerm = v;
  this._exactClub = null;
  this.resetPaging();
}

  get sortOption(): string { return this._sortOption; }
  set sortOption(v: string) { this._sortOption = v; this.resetPaging(); }

get selectedCountries(): string[] { return this._selectedCountries; }
set selectedCountries(v: string[]) { this._selectedCountries = v; this.resetPaging(); }

  get selectedCity(): { city: string; country: string } | null { return this._selectedCity; }
  set selectedCity(v: { city: string; country: string } | null) { this._selectedCity = v; this.resetPaging(); }

  // Drag & Drop
  draggedIndex: number | null = null;
  dragOverIndex: number | null = null;

  isWallpaperModalOpen: boolean = false;
wallpaperStyles: { value: string; label: string; icon: string; description: string }[] = [
  { value: 'aurora',     label: 'Aurora',       icon: '🌌', description: 'Flowing northern-light ribbons in the crest colors.' },
  { value: 'neon',       label: 'Neon Horizon', icon: '🌆', description: 'Retro-futuristic sun over a glowing perspective grid.' },
  { value: 'glass',      label: 'Glass',        icon: '🔮', description: 'Frosted glass panes floating over luminous orbs.' },
  { value: 'silk',       label: 'Silk Waves',   icon: '🧵', description: 'Layered satin waves with soft specular edges.' },
  { value: 'flow',       label: 'Flow Field',   icon: '🌀', description: 'Generative light trails drawn by a flow field.' },
  { value: 'nightmatch', label: 'Night Match',  icon: '🏟️', description: 'Floodlight beams, haze and stadium bokeh.' },
  { value: 'editorial',  label: 'Editorial',    icon: '🔤', description: 'Oversized outline typography, magazine style.' },
  { value: 'prism',      label: 'Prism',        icon: '💎', description: 'Faceted low-poly glass in a smooth gradient.' },
  { value: 'obsidian', label: 'Obsidian', icon: '🖤', description: 'Polished black marble with glowing veins in the crest color.' },
];

selectedWallpaperStyle: string = 'aurora';

get selectedWallpaperInfo() {
  return this.wallpaperStyles.find(s => s.value === this.selectedWallpaperStyle);
}

  selectedWallpaperFormat: 'mobile' | 'desktop' = 'mobile';
  isGeneratingWallpaper: boolean = false;

  favorites = new Set<string>();
  private _showFavoritesOnly = false;

  highlightedClubs: string[] = [
    'Real Madrid',
    'Inter Milan',
    'Barcelona',
    'Chelsea',
    'Paris Saint-Germain',
    'Liverpool',
    'Tottenham Hotspur',
    'Manchester City',
    'Arsenal',
    'AC Milan',
    'Atlético Madrid',
    'Borussia Dortmund',
    'Bayern Munich',
    'Manchester United',
    'Juventus',
  ];

  constructor(private clubService: ClubService) {}

  ngOnInit(): void {
    this.loadFavorites();
    this.getClubs();
    this.loadColorCache();
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

  @HostListener('window:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent): void {
    const tag = (e.target as HTMLElement)?.tagName;
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tag)) return;
    if (
      this.viewMode !== 'pages' ||
      this.selectedClub || this.selectedImage || this.isCountryModalOpen || this.isWallpaperModalOpen
    ) return;

    if (e.key === 'ArrowRight') this.goToPage(this.currentPage + 1);
    if (e.key === 'ArrowLeft') this.goToPage(this.currentPage - 1);
  }

  @ViewChild('carouselTrack') carouselTrack!: ElementRef<HTMLDivElement>;

  slideCarousel(direction: number): void {
    const el = this.carouselTrack.nativeElement;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' });
  }

  getClubs(): void {
    this.clubService.getClubs().subscribe(data => {
      this.clubs = this.shuffleArray(data);
      this.extractCountries();
      this.animateCounter();
      if (this.selectedColor) this.analyzeColors();
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
    this.selectedClub = this.allFilteredClubs[index];
  }

  closeModal(): void {
    this.logoDownloadMsg = '';
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

isCountrySelected(country: string): boolean {
  return this._selectedCountries.includes(country);
}

toggleCountry(country: string): void {
  this.selectedCity = null;
  this.selectedCountries = this.isCountrySelected(country)
    ? this._selectedCountries.filter(c => c !== country)
    : [...this._selectedCountries, country];
}

removeCountry(country: string): void {
  this.selectedCountries = this._selectedCountries.filter(c => c !== country);
}

  selectCity(city: { city: string; country: string }): void {
    this.selectedCity = this.selectedCity?.city === city.city &&
      this.selectedCity?.country === city.country ? null : city;
    this.selectedCountries = [];
    this.isCountryModalOpen = false;
  }

  isCitySelected(city: { city: string; country: string }): boolean {
    return this.selectedCity?.city === city.city &&
      this.selectedCity?.country === city.country;
  }

  clearCountryFilterModal(): void {
    this.countrySearch = '';
  }

clearCountryFilter(): void {
  this.selectedCountries = [];
  this.selectedCity = null;
  this.isCountryModalOpen = false;
}

  filteredCountries(): string[] {
    if (!this.countrySearch) return this.countries;
    return this.countries.filter(c =>
      c.toLowerCase().includes(this.countrySearch.toLowerCase())
    );
  }

  // Todos los resultados filtrados (sin recortar)
// Todos los resultados filtrados (sin recortar)
get allFilteredClubs(): any[] {
  let filtered = this.clubs;

  if (this.showFavoritesOnly) {
    filtered = filtered.filter(club => this.favorites.has(club.club_name));
  }

  if (this.showDefunctOnly) {
  filtered = filtered.filter(club => this.isDefunct(club));
}

if (this.selectedCountries.length) {
  const wanted = new Set(this.selectedCountries.map(c => c.toLowerCase()));
  filtered = filtered.filter(club => {
    const parts = club.city_country.split(',');
    const country = parts.length > 1 ? parts[1].trim().toLowerCase() : '';
    return wanted.has(country);
  });
}

  if (this.selectedCity) {
    filtered = filtered.filter(club => {
      const [city, country] = club.city_country.split(',').map((part: string) => part.trim().toLowerCase());
      return city === this.selectedCity!.city.toLowerCase() &&
        country === this.selectedCity!.country.toLowerCase();
    });
  }

  if (this._exactClub) {
    filtered = filtered.filter(club => club.club_name === this._exactClub);
  } else if (this.searchTerm) {
    const searchTermLower = this.searchTerm.toLowerCase();
    filtered = filtered.filter(club => {
      const parts = club.city_country.split(',');
      const city = parts[0].trim().toLowerCase();
      return (
        club.club_name.toLowerCase().includes(searchTermLower) ||
        city.includes(searchTermLower)
      );
    });
} else if (!this.selectedCountries.length && !this.selectedCity) {
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

if (this.selectedColor) {
  filtered = filtered.filter(club =>
    this.clubColors[club.club_name]?.includes(this.selectedColor)
  );
}

  return filtered;
}

  // ============================================================
  // PAGINACIÓN / SCROLL
  // ============================================================

  private resetPaging(): void {
    this.currentPage = 0;
    this.visibleClubs = 100;
  }

  setViewMode(mode: 'scroll' | 'pages'): void {
    if (this.viewMode === mode) return;
    this.viewMode = mode;
    this.resetPaging();
  }

  loadMore(): void {
    this.visibleClubs += 100;
  }

  get showFavoritesOnly(): boolean { return this._showFavoritesOnly; }
  set showFavoritesOnly(v: boolean) { this._showFavoritesOnly = v; this.resetPaging(); }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.allFilteredClubs.length / this.pageSize));
  }

  // En modo scroll es 0, así los índices del template coinciden con allFilteredClubs
  get pageStart(): number {
    return this.viewMode === 'pages' ? this.currentPage * this.pageSize : 0;
  }

  get displayedClubs(): any[] {
    const all = this.allFilteredClubs;
    return this.viewMode === 'pages'
      ? all.slice(this.pageStart, this.pageStart + this.pageSize)
      : all.slice(0, this.visibleClubs);
  }

  get hasMore(): boolean {
    return this.viewMode === 'scroll' && this.visibleClubs < this.allFilteredClubs.length;
  }

  goToPage(page: number): void {
    if (this.viewMode !== 'pages') return;

    const target = Math.min(Math.max(page, 0), this.totalPages - 1);
    if (target === this.currentPage) return;

    this.slideDir = target > this.currentPage ? 'next' : 'prev';
    this.currentPage = target;

    clearTimeout(this.slideTimer);
    this.slideTimer = setTimeout(() => (this.slideDir = ''), 350);

    this.scrollToGrid();
  }

  private scrollToGrid(): void {
    const el = this.gridTop?.nativeElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < 0) {
      window.scrollTo({ top: rect.top + window.scrollY - 80, behavior: 'smooth' });
    }
  }

  onTouchStart(e: TouchEvent): void {
    this.touchStartX = e.changedTouches[0].clientX;
    this.touchStartY = e.changedTouches[0].clientY;
  }

  onTouchEnd(e: TouchEvent): void {
    if (this.viewMode !== 'pages') return;

    const dx = e.changedTouches[0].clientX - this.touchStartX;
    const dy = e.changedTouches[0].clientY - this.touchStartY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      this.goToPage(this.currentPage + (dx < 0 ? 1 : -1));
    }
  }

clearSearch(): void {
  this.searchTerm = '';
  this.suggestions = [];
  this.closeSuggestions();
}

  scrollToTop(): void {
    window.scroll({
      top: 0,
      behavior: 'smooth'
    });
  }

  selectRandomClub(): void {
    const pool = this.clubs.filter(club => {
      const [city, country] = club.city_country.split(',').map((part: string) => part.trim().toLowerCase());
      if (this.selectedCity) {
        return city === this.selectedCity.city.toLowerCase() &&
          country === this.selectedCity.country.toLowerCase();
      }
      return !this.selectedCountries.length || this.selectedCountries.includes(country);
    });

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

  getCountryCount(country: string): number {
    return this.clubs.filter(club => {
      const parts = club.city_country.split(',');
      const c = parts.length > 1 ? parts[1].trim().toLowerCase() : '';
      return c === country.toLowerCase();
    }).length;
  }

openImageModal(club: any, event: Event) {
  event.stopPropagation();
  this.zoomedClub = club;
  this.selectedImage = club.club_logo;
}

closeImageModal() {
  this.selectedImage = null;
  this.zoomedClub = null;
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

    const visibleClubs = this.allFilteredClubs;
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
    await document.fonts.load('700 72px "Oswald"');
    await document.fonts.load('600 40px "Oswald"');
    await document.fonts.load('500 30px "Inter"');
    await document.fonts.ready;
  } catch {
    // fallback silencioso
  }
}

// ============================================================
// UTILIDADES DE WALLPAPER
// ============================================================

private rng: () => number = Math.random;

private hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

private makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Ruido suave (value noise) con 3 octavas, valores 0..1
private makeNoise(): (x: number, y: number) => number {
  const grid = new Float32Array(256 * 256);
  for (let i = 0; i < grid.length; i++) grid[i] = this.rng();
  const fade = (t: number) => t * t * (3 - 2 * t);
  const at = (xi: number, yi: number) => grid[((yi & 255) << 8) | (xi & 255)];
  const base = (x: number, y: number) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = fade(x - xi), yf = fade(y - yi);
    const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1);
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
  };
  return (x, y) => base(x, y) * 0.55 + base(x * 2.1, y * 2.1) * 0.3 + base(x * 4.3, y * 4.3) * 0.15;
}

private hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return this.rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

private mixColor(a: string, b: string, t: number): string {
  const A = this.hexToRgb(a), B = this.hexToRgb(b);
  return this.rgbToHex(A.r + (B.r - A.r) * t, A.g + (B.g - A.g) * t, A.b + (B.b - A.b) * t);
}

// Paleta armada a partir del color dominante del escudo
private makePalette(base: string) {
  const { r, g, b } = this.hexToRgb(base);
  const { h, s, l } = this.rgbToHsl(r, g, b);
  const sat = Math.max(0.55, Math.min(0.95, s));
  return {
    main:   this.hslToHex(h, sat, Math.min(0.58, Math.max(0.42, l))),
    warm:   this.hslToHex(h + 38, sat, 0.58),
    cool:   this.hslToHex(h - 38, sat, 0.55),
    accent: this.hslToHex(h + 150, Math.min(1, sat + 0.1), 0.62),
    light:  this.hslToHex(h, sat * 0.8, 0.82),
    deep:   this.hslToHex(h, Math.min(sat, 0.6), 0.1),
    ink:    this.hslToHex(h, 0.35, 0.045),
    hue: h,
  };
}

// Resplandor suave sin usar ctx.filter (funciona en todos los navegadores)
private glow(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, alpha: number): void {
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, this.hexToRgbaString(color, alpha));
  g.addColorStop(0.4, this.hexToRgbaString(color, alpha * 0.45));
  g.addColorStop(1, this.hexToRgbaString(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

// Destello de cuatro puntas
private drawSparkle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha: number): void {
  const k = r * 0.12;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.quadraticCurveTo(k, -k, r, 0);
  ctx.quadraticCurveTo(k, k, 0, r);
  ctx.quadraticCurveTo(-k, k, -r, 0);
  ctx.quadraticCurveTo(-k, -k, 0, -r);
  ctx.fill();
  ctx.restore();
}

// Viñeta + grano de película sobre el fondo terminado
private finishBackground(ctx: CanvasRenderingContext2D, w: number, h: number, grain = 0.14, vignette = 0.5): void {
  const v = ctx.createRadialGradient(w / 2, h * 0.45, Math.min(w, h) * 0.3, w / 2, h * 0.45, Math.max(w, h) * 0.78);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, `rgba(0,0,0,${vignette})`);
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);

  const tile = document.createElement('canvas');
  tile.width = tile.height = 200;
  const t = tile.getContext('2d')!;
  const img = t.createImageData(200, 200);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = this.rng() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = n;
    img.data[i + 3] = 255;
  }
  t.putImageData(img, 0, 0);
  const pattern = ctx.createPattern(tile, 'repeat');
  if (!pattern) return;
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = grain;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
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

      const { width, height } = this.selectedWallpaperFormat === 'desktop'
        ? { width: 1920, height: 1080 }
        : { width: 1080, height: 1920 };
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;

this.rng = this.makeRng(this.hashString(club.club_name + this.selectedWallpaperStyle));

switch (this.selectedWallpaperStyle) {
  case 'neon':       this.drawNeonBackground(ctx, width, height, baseColor); break;
  case 'glass':      this.drawGlassBackground(ctx, width, height, baseColor); break;
  case 'silk':       this.drawSilkBackground(ctx, width, height, baseColor); break;
  case 'flow':       this.drawFlowBackground(ctx, width, height, baseColor); break;
  case 'nightmatch': this.drawNightMatchBackground(ctx, width, height, baseColor); break;
  case 'editorial':  this.drawEditorialBackground(ctx, width, height, baseColor, wallpaperClub); break;
  case 'prism':      this.drawPrismBackground(ctx, width, height, baseColor); break;
  case 'obsidian':   this.drawObsidianBackground(ctx, width, height, baseColor); break;
  default:           this.drawAuroraBackground(ctx, width, height, baseColor);
}

this.finishBackground(ctx, width, height);

      this.drawCrestBadge(ctx, logo, width / 2, height * 0.42, 460, baseColor);
      this.drawClubText(ctx, width, height, wallpaperClub, baseColor, this.selectedWallpaperStyle);

      const link = document.createElement('a');
      link.download = `${wallpaperClub.club_name.replace(/\s+/g, '_').toLowerCase()}_${this.selectedWallpaperFormat}_wallpaper.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      this.closeWallpaperModal();
    } catch (err) {
      console.error('Error generando el wallpaper:', err);
    } finally {
      this.isGeneratingWallpaper = false;
    }
  }

  // ============================================================
// TEXTO DEL WALLPAPER (un estilo por fondo)
// ============================================================

private setSpacing(ctx: CanvasRenderingContext2D, px: number): void {
  (ctx as any).letterSpacing = `${px}px`;
}

private breakLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Achica la fuente hasta que el texto entre en `maxLines` líneas
private fitName(
  ctx: CanvasRenderingContext2D, text: string, family: string, weight: number,
  maxWidth: number, maxLines: number, maxSize: number, minSize: number, spacingEm = 0
): { size: number; lh: number; lines: string[]; width: number } {
  let size = maxSize;
  let lines: string[] = [];
  for (; size >= minSize; size -= 2) {
    ctx.font = `${weight} ${size}px ${family}`;
    this.setSpacing(ctx, size * spacingEm);
    lines = this.breakLines(ctx, text, maxWidth);
    if (lines.length <= maxLines && lines.every(l => ctx.measureText(l).width <= maxWidth)) break;
  }
  size = Math.max(size, minSize);
  ctx.font = `${weight} ${size}px ${family}`;
  this.setSpacing(ctx, size * spacingEm);
  lines = this.breakLines(ctx, text, maxWidth).slice(0, maxLines);
  const width = Math.max(...lines.map(l => ctx.measureText(l).width), 1);
  return { size, lh: Math.round(size * 1.08), lines, width };
}

private drawClubText(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  club: any, color: string, style: string
): void {
  const p = this.makePalette(color);
  const [city, country] = (club.city_country || '').split(',').map((s: string) => s.trim());
  const t = {
    w, h, p,
    cx: w / 2,
    top: Math.max(h * 0.42 + 270 + 50, h * 0.7),
    maxW: Math.min(w - 160, 1300),
    name: club.club_name as string,
    place: club.city_country as string,
    sub: [city, country].filter(Boolean).join(' · ').toUpperCase(),
  };

  ctx.save();

  // Degradado oscuro suave abajo, para que el texto se lea sin cortar el fondo
  const scrim = ctx.createLinearGradient(0, t.top - 160, 0, h);
  scrim.addColorStop(0, 'rgba(0,0,0,0)');
  scrim.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, t.top - 160, w, h - t.top + 160);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  switch (style) {
    case 'neon':       this.textNeon(ctx, t); break;
    case 'glass':      this.textGlass(ctx, t); break;
    case 'silk':       this.textSilk(ctx, t); break;
    case 'flow':       this.textFlow(ctx, t); break;
    case 'nightmatch': this.textNightMatch(ctx, t); break;
    case 'editorial':  this.textEditorial(ctx, t); break;
    case 'prism':      this.textPrism(ctx, t); break;
   case 'obsidian':   this.textObsidian(ctx, t); break;
    default:           this.textAurora(ctx, t);
  }

  this.setSpacing(ctx, 0);
  ctx.restore();
}

// 1) AURORA
private textAurora(ctx: CanvasRenderingContext2D, t: any): void {
  const f = this.fitName(ctx, t.name.toUpperCase(), '"Oswald", sans-serif', 600, t.maxW, 2, 100, 54, 0.05);
  const y0 = t.top + f.size;

  ctx.fillStyle = '#fff';
  ctx.shadowColor = t.p.light;
  ctx.shadowBlur = 36;
  f.lines.forEach((l, i) => ctx.fillText(l, t.cx, y0 + i * f.lh));
  ctx.shadowBlur = 0;

  const yLine = y0 + (f.lines.length - 1) * f.lh + 38;
  const g = ctx.createLinearGradient(t.cx - 240, 0, t.cx + 240, 0);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.5, t.p.light);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(t.cx - 240, yLine, 480, 3);

  ctx.font = '500 30px "Inter", sans-serif';
  this.setSpacing(ctx, 9);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText(t.sub, t.cx, yLine + 58);
}

// 2) NEON HORIZON: cartel de neón
private textNeon(ctx: CanvasRenderingContext2D, t: any): void {
  const f = this.fitName(ctx, t.name.toUpperCase(), '"Oswald", sans-serif', 700, t.maxW, 2, 96, 52, 0.06);
  const y0 = t.top + f.size;
  ctx.lineJoin = 'round';

  for (const blur of [54, 28, 12]) {
    ctx.shadowColor = t.p.accent;
    ctx.shadowBlur = blur;
    ctx.strokeStyle = t.p.accent;
    ctx.lineWidth = 4;
    f.lines.forEach((l, i) => ctx.strokeText(l, t.cx, y0 + i * f.lh));
  }
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fff';
  f.lines.forEach((l, i) => ctx.fillText(l, t.cx, y0 + i * f.lh));

  ctx.font = '600 30px "Inter", sans-serif';
  this.setSpacing(ctx, 10);
  ctx.fillStyle = t.p.cool;
  ctx.shadowColor = t.p.cool;
  ctx.shadowBlur = 20;
  ctx.fillText(`—  ${t.sub}  —`, t.cx, y0 + (f.lines.length - 1) * f.lh + 66);
  ctx.shadowBlur = 0;
}

// 3) GLASS: panel de vidrio
private textGlass(ctx: CanvasRenderingContext2D, t: any): void {
  const f = this.fitName(ctx, t.name.toUpperCase(), '"Oswald", sans-serif', 600, t.maxW - 140, 2, 84, 48, 0.04);
  const ph = f.lines.length * f.lh + 150;
  const pw = Math.min(t.maxW, f.width + 170);
  const cy = t.top + ph / 2;

  this.glassPane(ctx, t.cx, cy, pw, ph, 0, 1);

  const y0 = cy - ph / 2 + 58 + f.size * 0.8;
  ctx.font = `600 ${f.size}px "Oswald", sans-serif`;
  this.setSpacing(ctx, f.size * 0.04);
  ctx.fillStyle = '#fff';
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 16;
  f.lines.forEach((l, i) => ctx.fillText(l, t.cx, y0 + i * f.lh));
  ctx.shadowBlur = 0;

  ctx.font = '500 26px "Inter", sans-serif';
  this.setSpacing(ctx, 8);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillText(t.sub, t.cx, cy + ph / 2 - 34);
}

// 4) SILK: mayúsculas finas y satinadas
private textSilk(ctx: CanvasRenderingContext2D, t: any): void {
  const f = this.fitName(ctx, t.name.toUpperCase(), '"Oswald", sans-serif', 500, t.maxW, 2, 78, 40, 0.2);
  const y0 = t.top + f.size;

  const g = ctx.createLinearGradient(0, t.top, 0, y0 + f.lines.length * f.lh);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, t.p.light);
  ctx.fillStyle = g;
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 14;
  f.lines.forEach((l, i) => ctx.fillText(l, t.cx, y0 + i * f.lh));
  ctx.shadowBlur = 0;

  const ySub = y0 + (f.lines.length - 1) * f.lh + 66;
  ctx.font = '500 26px "Inter", sans-serif';
  this.setSpacing(ctx, 9);
  const sw = ctx.measureText(t.sub).width;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText(t.sub, t.cx, ySub);

  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillRect(t.cx - sw / 2 - 150, ySub - 10, 110, 2);
  ctx.fillRect(t.cx + sw / 2 + 40, ySub - 10, 110, 2);
}

// 5) FLOW: moderno y minimalista
private textFlow(ctx: CanvasRenderingContext2D, t: any): void {
  const f = this.fitName(ctx, t.name, '"Inter", sans-serif', 700, t.maxW, 2, 92, 46, -0.02);
  const y0 = t.top + 30 + f.size;

  ctx.fillStyle = t.p.accent;
  ctx.fillRect(t.cx - 36, t.top, 72, 6);

  ctx.fillStyle = '#fff';
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 20;
  f.lines.forEach((l, i) => ctx.fillText(l, t.cx, y0 + i * f.lh));
  ctx.shadowBlur = 0;

  ctx.font = '500 32px "Inter", sans-serif';
  this.setSpacing(ctx, 1);
  ctx.fillStyle = t.p.light;
  ctx.fillText(t.place, t.cx, y0 + (f.lines.length - 1) * f.lh + 58);
}

// 6) NIGHT MATCH: gráfico de transmisión
private textNightMatch(ctx: CanvasRenderingContext2D, t: any): void {
  const f = this.fitName(ctx, t.name.toUpperCase(), '"Oswald", sans-serif', 700, t.maxW - 140, 2, 84, 46, 0.03);
  const bw = Math.min(t.maxW, f.width + 150);
  const bh = f.lines.length * f.lh + 52;
  const bx = t.cx - bw / 2;

  ctx.fillStyle = 'rgba(5, 8, 12, 0.78)';
  ctx.fillRect(bx, t.top, bw, bh);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 2;
  ctx.strokeRect(bx, t.top, bw, bh);
  ctx.fillStyle = t.p.main;
  ctx.fillRect(bx, t.top, 16, bh);

  ctx.font = `700 ${f.size}px "Oswald", sans-serif`;
  this.setSpacing(ctx, f.size * 0.03);
  ctx.fillStyle = '#fff';
  const y0 = t.top + 26 + f.size * 0.82;
  f.lines.forEach((l, i) => ctx.fillText(l, t.cx + 8, y0 + i * f.lh));

  // Pestaña inferior con la ubicación
  ctx.font = '600 26px "Inter", sans-serif';
  this.setSpacing(ctx, 6);
  const sw = ctx.measureText(t.sub).width + 64;
  ctx.fillStyle = t.p.main;
  ctx.fillRect(bx, t.top + bh, sw, 54);
  ctx.fillStyle = this.getContrastColor(t.p.main);
  ctx.textAlign = 'left';
  ctx.fillText(t.sub, bx + 32, t.top + bh + 36);
  ctx.textAlign = 'center';
}

// 7) EDITORIAL: bloques sólidos tipo póster
private textEditorial(ctx: CanvasRenderingContext2D, t: any): void {
  const f = this.fitName(ctx, t.name.toUpperCase(), '"Oswald", sans-serif', 700, t.maxW - 60, 2, 90, 48, 0.02);
  const pad = 26;

  f.lines.forEach((l, i) => {
    const base = t.top + f.size + i * f.lh;
    const lw = ctx.measureText(l).width;
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(t.cx - lw / 2 - pad, base - f.size * 0.88, lw + pad * 2, f.size * 1.02);
    ctx.fillStyle = '#fff';
    ctx.fillText(l, t.cx, base);
  });

  ctx.font = '700 26px "Inter", sans-serif';
  this.setSpacing(ctx, 8);
  const sw = ctx.measureText(t.sub).width;
  const ySub = t.top + f.size + (f.lines.length - 1) * f.lh + 76;
  ctx.fillStyle = '#fff';
  ctx.fillRect(t.cx - sw / 2 - 28, ySub - 34, sw + 56, 50);
  ctx.fillStyle = '#0a0a0a';
  ctx.fillText(t.sub, t.cx, ySub);
}

// 8) PRISM: panel anguloso
private textPrism(ctx: CanvasRenderingContext2D, t: any): void {
  const f = this.fitName(ctx, t.name.toUpperCase(), '"Oswald", sans-serif', 700, t.maxW - 200, 2, 82, 46, 0.04);
  const ph = f.lines.length * f.lh + 150;
  const pw = Math.min(t.maxW, f.width + 220);
  const x0 = t.cx - pw / 2, x1 = t.cx + pw / 2;
  const y0p = t.top, y1p = t.top + ph;
  const skew = 42;

  ctx.beginPath();
  ctx.moveTo(x0 + skew, y0p);
  ctx.lineTo(x1 + skew, y0p);
  ctx.lineTo(x1 - skew, y1p);
  ctx.lineTo(x0 - skew, y1p);
  ctx.closePath();
  const g = ctx.createLinearGradient(x0, y0p, x1, y1p);
  g.addColorStop(0, this.hexToRgbaString(t.p.main, 0.9));
  g.addColorStop(1, this.hexToRgbaString(t.p.cool, 0.9));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = `700 ${f.size}px "Oswald", sans-serif`;
  this.setSpacing(ctx, f.size * 0.04);
  ctx.fillStyle = '#fff';
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 12;
  const yText = y0p + 52 + f.size * 0.82;
  f.lines.forEach((l, i) => ctx.fillText(l, t.cx, yText + i * f.lh));
  ctx.shadowBlur = 0;

  const yRule = y1p - 62;
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillRect(t.cx - 90, yRule, 180, 2);
  ctx.font = '600 26px "Inter", sans-serif';
  this.setSpacing(ctx, 8);
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fillText(t.sub, t.cx, yRule + 38);
}

// 9) HOLO: texto iridiscente
private textHolo(ctx: CanvasRenderingContext2D, t: any): void {
  const f = this.fitName(ctx, t.name.toUpperCase(), '"Oswald", sans-serif', 700, t.maxW, 2, 96, 52, 0.05);
  const y0 = t.top + f.size;

  const g = ctx.createLinearGradient(t.cx - f.width / 2, 0, t.cx + f.width / 2, 0);
  for (let i = 0; i <= 6; i++) g.addColorStop(i / 6, this.hslToHex(t.p.hue + i * 55, 0.9, 0.74));

  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 3;
  ctx.shadowColor = this.hslToHex(t.p.hue + 120, 0.9, 0.7);
  ctx.shadowBlur = 30;
  f.lines.forEach((l, i) => ctx.strokeText(l, t.cx, y0 + i * f.lh));
  ctx.shadowBlur = 0;
  ctx.fillStyle = g;
  f.lines.forEach((l, i) => ctx.fillText(l, t.cx, y0 + i * f.lh));

  const midY = t.top + (f.lines.length * f.lh) / 2;
  this.drawSparkle(ctx, t.cx - f.width / 2 - 56, midY - 10, 22, 0.95);
  this.drawSparkle(ctx, t.cx + f.width / 2 + 56, midY + 6, 28, 0.95);
  this.drawSparkle(ctx, t.cx + f.width / 2 + 100, midY - 34, 12, 0.7);

  ctx.font = '500 30px "Inter", sans-serif';
  this.setSpacing(ctx, 9);
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.fillText(t.sub, t.cx, y0 + (f.lines.length - 1) * f.lh + 64);
}

  // ============================================================
// ESTILOS DE FONDO
// ============================================================

// 1) AURORA: cintas de luz que fluyen
private drawAuroraBackground(ctx: CanvasRenderingContext2D, w: number, h: number, color: string): void {
  const p = this.makePalette(color);
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, p.deep);
  bg.addColorStop(1, p.ink);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const R = Math.max(w, h);
  ctx.globalCompositeOperation = 'screen';

  const ribbons = [
    { c: p.main, y: 0.26 }, { c: p.cool, y: 0.44 },
    { c: p.warm, y: 0.62 }, { c: p.accent, y: 0.80 },
  ];
  ribbons.forEach((rb, i) => {
    const phase = this.rng() * Math.PI * 2;
    for (let k = 0; k <= 28; k++) {
      const t = k / 28;
      const x = w * (-0.1 + t * 1.2);
      const y = h * rb.y + Math.sin(t * Math.PI * (1.6 + i * 0.4) + phase) * h * 0.1;
      this.glow(ctx, x, y, R * 0.2, rb.c, 0.17);
    }
  });

  // Cortinas verticales de luz
  for (let i = 0; i < 26; i++) {
    const x = this.rng() * w;
    const top = h * (0.15 + this.rng() * 0.3);
    const g = ctx.createLinearGradient(0, top, 0, top + h * 0.45);
    g.addColorStop(0, this.hexToRgbaString(p.light, 0.1));
    g.addColorStop(1, this.hexToRgbaString(p.light, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x, top, 2 + this.rng() * 5, h * 0.45);
  }

  // Estrellas
  for (let i = 0; i < 160; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.2 + this.rng() * 0.6})`;
    ctx.beginPath();
    ctx.arc(this.rng() * w, this.rng() * h, 0.6 + this.rng() * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
}

// 2) NEON HORIZON: sol retro y grilla en perspectiva
private drawNeonBackground(ctx: CanvasRenderingContext2D, w: number, h: number, color: string): void {
  const p = this.makePalette(color);
  const horizon = h * 0.66;

  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, p.ink);
  sky.addColorStop(0.55, p.deep);
  sky.addColorStop(1, this.shadeColor(p.warm, -30));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, horizon);

  for (let i = 0; i < 120; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.15 + this.rng() * 0.6})`;
    ctx.fillRect(this.rng() * w, this.rng() * horizon * 0.8, 2, 2);
  }

  // Sol con franjas (se arma aparte para poder "recortarlo")
  const r = Math.min(w, h) * 0.34, sx = w / 2, sy = h * 0.42;
  const sunCanvas = document.createElement('canvas');
  sunCanvas.width = w;
  sunCanvas.height = h;
  const s = sunCanvas.getContext('2d')!;
  const sg = s.createLinearGradient(0, sy - r, 0, sy + r);
  sg.addColorStop(0, p.accent);
  sg.addColorStop(0.5, p.warm);
  sg.addColorStop(1, p.cool);
  s.fillStyle = sg;
  s.beginPath();
  s.arc(sx, sy, r, 0, Math.PI * 2);
  s.fill();
  s.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 9; i++) {
    const t = i / 9;
    s.fillRect(sx - r, sy + r * 0.05 + t * r * 0.95, r * 2, 3 + t * r * 0.075);
  }

  ctx.globalCompositeOperation = 'screen';
  this.glow(ctx, sx, sy, r * 2.2, p.warm, 0.4);
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(sunCanvas, 0, 0);

  // Suelo
  const floor = ctx.createLinearGradient(0, horizon, 0, h);
  floor.addColorStop(0, p.deep);
  floor.addColorStop(1, p.ink);
  ctx.fillStyle = floor;
  ctx.fillRect(0, horizon, w, h - horizon);

  // Grilla neón
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, horizon, w, h - horizon);
  ctx.clip();
  ctx.strokeStyle = this.hexToRgbaString(p.cool, 0.9);
  ctx.shadowColor = p.cool;
  ctx.shadowBlur = 14;
  ctx.lineWidth = 2;
  for (let i = -16; i <= 16; i++) {
    ctx.beginPath();
    ctx.moveTo(w / 2, horizon);
    ctx.lineTo(w / 2 + i * w * 0.12, h);
    ctx.stroke();
  }
  const rows = 16;
  for (let k = 1; k <= rows; k++) {
    const t = k / rows;
    ctx.lineWidth = 1 + t * 3;
    ctx.beginPath();
    ctx.moveTo(0, horizon + (h - horizon) * Math.pow(t, 2.4));
    ctx.lineTo(w, horizon + (h - horizon) * Math.pow(t, 2.4));
    ctx.stroke();
  }
  ctx.restore();

  // Niebla en el horizonte y línea de luz
  const fog = ctx.createLinearGradient(0, horizon, 0, horizon + (h - horizon) * 0.35);
  fog.addColorStop(0, this.hexToRgbaString(p.deep, 1));
  fog.addColorStop(1, this.hexToRgbaString(p.deep, 0));
  ctx.fillStyle = fog;
  ctx.fillRect(0, horizon, w, (h - horizon) * 0.35);

  ctx.save();
  ctx.strokeStyle = p.accent;
  ctx.shadowColor = p.accent;
  ctx.shadowBlur = 30;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, horizon);
  ctx.lineTo(w, horizon);
  ctx.stroke();
  ctx.restore();
}

// 3) GLASS: paneles de vidrio sobre orbes
private drawGlassBackground(ctx: CanvasRenderingContext2D, w: number, h: number, color: string): void {
  const p = this.makePalette(color);
  const m = Math.min(w, h);
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, p.deep);
  bg.addColorStop(1, p.ink);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const orb = (x: number, y: number, r: number, c1: string, c2: string) => {
    ctx.globalCompositeOperation = 'screen';
    this.glow(ctx, x, y, r * 2.2, c1, 0.35);
    ctx.globalCompositeOperation = 'source-over';
    const g = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
    g.addColorStop(0, c1);
    g.addColorStop(1, c2);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    // brillo especular de la esfera
    const hl = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, 0, x - r * 0.35, y - r * 0.4, r * 0.8);
    hl.addColorStop(0, 'rgba(255,255,255,0.45)');
    hl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hl;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };

  orb(w * 0.18, h * 0.2, m * 0.26, p.main, p.accent);
  orb(w * 0.86, h * 0.66, m * 0.3, p.warm, p.cool);
  orb(w * 0.72, h * 0.1, m * 0.1, p.accent, p.main);
  orb(w * 0.1, h * 0.86, m * 0.14, p.cool, p.main);

  this.glassPane(ctx, w * 0.5, h * 0.42, w * 0.82, Math.min(h * 0.5, w * 0.95), -0.12, 1);
  this.glassPane(ctx, w * 0.2, h * 0.12, w * 0.4, h * 0.14, 0.2, 0.7);
  this.glassPane(ctx, w * 0.82, h * 0.88, w * 0.46, h * 0.16, -0.18, 0.7);
}

private glassPane(ctx: CanvasRenderingContext2D, x: number, y: number, pw: number, ph: number, angle: number, alpha: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  const fill = ctx.createLinearGradient(-pw / 2, -ph / 2, pw / 2, ph / 2);
  fill.addColorStop(0, `rgba(255,255,255,${0.2 * alpha})`);
  fill.addColorStop(1, `rgba(255,255,255,${0.04 * alpha})`);
  ctx.fillStyle = fill;
  ctx.fillRect(-pw / 2, -ph / 2, pw, ph);

  // Reflejo diagonal dentro del panel
  ctx.save();
  ctx.beginPath();
  ctx.rect(-pw / 2, -ph / 2, pw, ph);
  ctx.clip();
  ctx.transform(1, 0, -0.5, 1, 0, 0);
  const sheen = ctx.createLinearGradient(-pw * 0.2, 0, pw * 0.05, 0);
  sheen.addColorStop(0, 'rgba(255,255,255,0)');
  sheen.addColorStop(0.5, `rgba(255,255,255,${0.16 * alpha})`);
  sheen.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(-pw * 0.2, -ph, pw * 0.25, ph * 2);
  ctx.restore();

  const edge = ctx.createLinearGradient(-pw / 2, -ph / 2, pw / 2, ph / 2);
  edge.addColorStop(0, `rgba(255,255,255,${0.75 * alpha})`);
  edge.addColorStop(0.5, `rgba(255,255,255,${0.08 * alpha})`);
  edge.addColorStop(1, `rgba(255,255,255,${0.45 * alpha})`);
  ctx.strokeStyle = edge;
  ctx.lineWidth = 2;
  ctx.strokeRect(-pw / 2, -ph / 2, pw, ph);
  ctx.restore();
}

// 4) SILK WAVES: capas de seda
private drawSilkBackground(ctx: CanvasRenderingContext2D, w: number, h: number, color: string): void {
  const p = this.makePalette(color);
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, p.deep);
  bg.addColorStop(1, p.ink);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const layers = 16;
  for (let l = 0; l < layers; l++) {
    const t = l / (layers - 1);
    const baseY = h * (0.12 + t * 0.82);
    const amp = h * (0.05 + 0.03 * Math.sin(l * 1.3));
    const freq = 1.1 + (l % 4) * 0.22;
    const phase = l * 0.7 + this.rng() * 0.6;
    const wave = (x: number) =>
      baseY +
      Math.sin((x / w) * Math.PI * 2 * freq + phase) * amp +
      Math.sin((x / w) * Math.PI * 4 * freq + phase * 1.7) * amp * 0.35;

    ctx.beginPath();
    ctx.moveTo(-10, h + 10);
    for (let x = -10; x <= w + 10; x += 12) ctx.lineTo(x, wave(x));
    ctx.lineTo(w + 10, h + 10);
    ctx.closePath();

    const tone = this.mixColor(p.deep, l % 2 ? p.main : p.cool, 0.25 + 0.5 * t);
    const g = ctx.createLinearGradient(0, baseY - amp, 0, baseY + amp * 3.5);
    g.addColorStop(0, this.hexToRgbaString(tone, 0.95));
    g.addColorStop(1, this.hexToRgbaString(p.ink, 0.95));
    ctx.fillStyle = g;
    ctx.fill();

    // Filo de luz en el borde superior
    ctx.beginPath();
    for (let x = -10; x <= w + 10; x += 12) {
      if (x === -10) ctx.moveTo(x, wave(x));
      else ctx.lineTo(x, wave(x));
    }
    ctx.strokeStyle = this.hexToRgbaString(p.light, 0.1 + 0.25 * t);
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.globalCompositeOperation = 'screen';
  this.glow(ctx, w * 0.5, h * 0.42, Math.max(w, h) * 0.45, p.warm, 0.22);
  ctx.globalCompositeOperation = 'source-over';
}

// 5) FLOW FIELD: arte generativo
private drawFlowBackground(ctx: CanvasRenderingContext2D, w: number, h: number, color: string): void {
  const p = this.makePalette(color);
  const noise = this.makeNoise();
  const bg = ctx.createRadialGradient(w / 2, h * 0.42, 0, w / 2, h * 0.42, Math.max(w, h) * 0.8);
  bg.addColorStop(0, p.deep);
  bg.addColorStop(1, p.ink);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  ctx.globalCompositeOperation = 'screen';
  this.glow(ctx, w / 2, h * 0.42, Math.max(w, h) * 0.5, p.main, 0.25);

  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  const palette = [p.main, p.cool, p.warm, p.light, p.accent];
  const scale = 0.0019;

  for (let i = 0; i < 2400; i++) {
    let x = this.rng() * w, y = this.rng() * h;
    ctx.strokeStyle = this.hexToRgbaString(palette[Math.floor(this.rng() * palette.length)], 0.07 + this.rng() * 0.1);
    ctx.lineWidth = 0.8 + this.rng() * 1.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let s = 0; s < 110; s++) {
      const a = noise(x * scale + 3.1, y * scale + 7.7) * Math.PI * 5;
      x += Math.cos(a) * 5;
      y += Math.sin(a) * 5;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';
}

// 6) NIGHT MATCH: reflectores, neblina y bokeh
private drawNightMatchBackground(ctx: CanvasRenderingContext2D, w: number, h: number, color: string): void {
  const p = this.makePalette(color);
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, p.ink);
  bg.addColorStop(0.5, p.deep);
  bg.addColorStop(1, p.ink);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  ctx.globalCompositeOperation = 'screen';

  // Haces volumétricos
  const targets = [-2, -1, 0, 1, 2];
  targets.forEach((k, i) => {
    const sx = w * (0.1 + i * 0.2);
    const tx = w / 2 + k * w * 0.2;
    const ty = h * 0.78;
    const g = ctx.createLinearGradient(sx, 0, tx, ty);
    g.addColorStop(0, this.hexToRgbaString(p.light, 0.34));
    g.addColorStop(1, this.hexToRgbaString(p.light, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(sx - 20, -10);
    ctx.lineTo(sx + 20, -10);
    ctx.lineTo(tx + 190, ty);
    ctx.lineTo(tx - 190, ty);
    ctx.closePath();
    ctx.fill();
  });

  this.glow(ctx, w / 2, h * 0.42, Math.max(w, h) * 0.45, p.main, 0.3);
  this.glow(ctx, w / 2, -h * 0.05, Math.max(w, h) * 0.6, p.light, 0.22);

  // Bokeh
  const tones = [p.light, p.main, p.warm, p.accent, '#ffffff'];
  for (let i = 0; i < 70; i++) {
    const x = this.rng() * w;
    const y = h * Math.pow(this.rng(), 1.5) * 0.92;
    const r = 14 + Math.pow(this.rng(), 2) * 70;
    const c = tones[Math.floor(this.rng() * tones.length)];
    ctx.fillStyle = this.hexToRgbaString(c, 0.04 + this.rng() * 0.1);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = this.hexToRgbaString(c, 0.14 + this.rng() * 0.2);
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Destellos de cámaras
  for (let i = 0; i < 26; i++) {
    this.drawSparkle(ctx, this.rng() * w, this.rng() * h * 0.6, 6 + this.rng() * 16, 0.35 + this.rng() * 0.5);
  }
  ctx.globalCompositeOperation = 'source-over';
}

// 7) EDITORIAL: tipografía gigante tipo póster
private drawEditorialBackground(ctx: CanvasRenderingContext2D, w: number, h: number, color: string, club: any): void {
  const p = this.makePalette(color);
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, this.shadeColor(p.main, -22));
  bg.addColorStop(1, p.deep);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const name = club.club_name.toUpperCase();
  const fs = Math.round(Math.min(w, h) * 0.2);
  ctx.font = `700 ${fs}px "Oswald", sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.lineJoin = 'round';

  const unit = `${name}  `;
  const unitW = Math.max(40, ctx.measureText(unit).width);
  const rowH = fs * 0.9;
  const rows = Math.ceil(h / rowH) + 2;

  for (let r = 0; r < rows; r++) {
    const y = r * rowH - rowH * 0.5;
    const offset = -((r * unitW * 0.27) % unitW) - unitW;
    const mode = r % 3;
    for (let x = offset; x < w + unitW; x += unitW) {
      if (mode === 0) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255,255,255,0.28)';
        ctx.strokeText(unit, x, y);
      } else if (mode === 1) {
        ctx.fillStyle = 'rgba(255,255,255,0.09)';
        ctx.fillText(unit, x, y);
      } else {
        ctx.fillStyle = this.hexToRgbaString(p.accent, 0.2);
        ctx.fillText(unit, x, y);
      }
    }
  }

  // Desvanecido arriba y abajo
  const fade = ctx.createLinearGradient(0, 0, 0, h);
  fade.addColorStop(0, this.hexToRgbaString(p.ink, 0.9));
  fade.addColorStop(0.25, this.hexToRgbaString(p.ink, 0));
  fade.addColorStop(0.7, this.hexToRgbaString(p.ink, 0));
  fade.addColorStop(1, this.hexToRgbaString(p.ink, 0.92));
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, w, h);

  // Marco y datos editoriales
  const inset = Math.round(Math.min(w, h) * 0.04);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);

  const spaced = (s: string) => s.toUpperCase().split('').join('\u200A');
  ctx.font = '600 28px "Inter", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'right';
  ctx.fillText(spaced(club.city_country || ''), w - inset - 28, inset + 52);
}

// 8) PRISM: facetas low-poly
private drawPrismBackground(ctx: CanvasRenderingContext2D, w: number, h: number, color: string): void {
  const p = this.makePalette(color);
  const noise = this.makeNoise();

  const cols = 9;
  const cell = w / cols;
  const rows = Math.ceil(h / cell) + 1;
  const pts: { x: number; y: number }[][] = [];
  for (let r = 0; r <= rows + 1; r++) {
    const row: { x: number; y: number }[] = [];
    for (let c = 0; c <= cols + 1; c++) {
      row.push({
        x: (c - 0.5) * cell + (this.rng() - 0.5) * cell * 0.6,
        y: (r - 0.5) * cell + (this.rng() - 0.5) * cell * 0.6,
      });
    }
    pts.push(row);
  }

  const value = (x: number, y: number) => {
    const n = noise(x * 0.0016 + 2.3, y * 0.0016 + 9.1);
    const diag = (x / w) * 0.45 + (y / h) * 0.55;
    return Math.min(1, Math.max(0, n * 0.55 + diag * 0.45 + (this.rng() - 0.5) * 0.12));
  };
  const colorAt = (v: number) =>
    v < 0.5
      ? this.mixColor(p.deep, p.main, (v / 0.5) * 0.95)
      : this.mixColor(p.main, p.light, ((v - 0.5) / 0.5) * 0.65);

  const tri = (a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }) => {
    const cx = (a.x + b.x + c.x) / 3, cy = (a.y + b.y + c.y) / 3;
    const fill = colorAt(value(cx, cy));
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(c.x, c.y);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = fill;      // evita costuras entre facetas
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.stroke();
  };

  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= cols; c++) {
      const a = pts[r][c], b = pts[r][c + 1], d = pts[r + 1][c], e = pts[r + 1][c + 1];
      tri(a, b, d);
      tri(b, e, d);
    }
  }

  ctx.globalCompositeOperation = 'screen';
  this.glow(ctx, w / 2, h * 0.42, Math.max(w, h) * 0.4, p.light, 0.22);
  ctx.globalCompositeOperation = 'source-over';
}

// 9) OBSIDIAN: mármol negro con vetas luminosas
private drawObsidianBackground(ctx: CanvasRenderingContext2D, w: number, h: number, color: string): void {
  const p = this.makePalette(color);
  const noise = this.makeNoise();

  // La textura se calcula a 1/4 de resolución y se amplía: más rápido y las vetas quedan suaves
  const sw = Math.ceil(w / 4), sh = Math.ceil(h / 4);
  const small = document.createElement('canvas');
  small.width = sw;
  small.height = sh;
  const sctx = small.getContext('2d')!;
  const img = sctx.createImageData(sw, sh);

  const ink = this.hexToRgb(p.ink);
  const deep = this.hexToRgb(p.deep);
  const main = this.hexToRgb(p.main);
  const light = this.hexToRgb(p.light);

  const S = 3 / Math.max(sw, sh);
  const ox = this.rng() * 50, oy = this.rng() * 50;

  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const u = x * S + ox, v = y * S + oy;

      // Deformación del dominio: vetas que serpentean
      const warp = noise(u * 0.9, v * 0.9);
      const u2 = u + warp * 1.4, v2 = v + warp * 1.1;

      const ridge = 1 - Math.abs(2 * noise(u2 * 1.1 + 7, v2 * 1.1 + 3) - 1);
      const vein = Math.pow(ridge, 14);
      const fine = Math.pow(1 - Math.abs(2 * noise(u2 * 2.6 + 13, v2 * 2.6 + 5) - 1), 24) * 0.5;
      const a = Math.min(1, vein + fine);

      // Fondo nublado oscuro
      const cloud = noise(u * 0.7 + 20, v * 0.7 + 11);
      let r = ink.r + (deep.r - ink.r) * cloud;
      let g = ink.g + (deep.g - ink.g) * cloud;
      let b = ink.b + (deep.b - ink.b) * cloud;

      // Veta: del color del escudo al más claro en el centro
      const t = Math.min(1, vein * 1.2);
      const vr = main.r + (light.r - main.r) * t;
      const vg = main.g + (light.g - main.g) * t;
      const vb = main.b + (light.b - main.b) * t;

      const i = (y * sw + x) * 4;
      img.data[i]     = r + (vr - r) * a;
      img.data[i + 1] = g + (vg - g) * a;
      img.data[i + 2] = b + (vb - b) * a;
      img.data[i + 3] = 255;
    }
  }
  sctx.putImageData(img, 0, 0);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(small, 0, 0, w, h);

  // Brillo extra sobre las vetas
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.3;
  ctx.drawImage(small, 0, 0, w, h);
  ctx.restore();

  // Reflejo de piedra pulida
  const gloss = ctx.createLinearGradient(0, 0, w, h);
  gloss.addColorStop(0, 'rgba(255,255,255,0.14)');
  gloss.addColorStop(0.32, 'rgba(255,255,255,0)');
  gloss.addColorStop(0.62, 'rgba(255,255,255,0)');
  gloss.addColorStop(0.78, 'rgba(255,255,255,0.05)');
  gloss.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gloss;
  ctx.fillRect(0, 0, w, h);

  // Luz detrás del escudo y polvo brillante
  ctx.globalCompositeOperation = 'screen';
  this.glow(ctx, w / 2, h * 0.42, Math.max(w, h) * 0.4, p.main, 0.2);
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.15 + this.rng() * 0.5})`;
    ctx.beginPath();
    ctx.arc(this.rng() * w, this.rng() * h, 0.6 + this.rng() * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
}

// Línea fina con rombo central
private ornament(ctx: CanvasRenderingContext2D, cx: number, y: number, color: string, half = 200): void {
  const g = ctx.createLinearGradient(cx - half, 0, cx + half, 0);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.5, color);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(cx - half, y, half * 2, 2);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, y - 9);
  ctx.lineTo(cx + 9, y + 1);
  ctx.lineTo(cx, y + 11);
  ctx.lineTo(cx - 9, y + 1);
  ctx.closePath();
  ctx.fill();
}

// Texto OBSIDIAN: placa grabada con degradado metálico
private textObsidian(ctx: CanvasRenderingContext2D, t: any): void {
  const f = this.fitName(ctx, t.name.toUpperCase(), '"Oswald", sans-serif', 600, t.maxW, 2, 92, 50, 0.08);
  const y0 = t.top + 40 + f.size;
  const yEnd = y0 + (f.lines.length - 1) * f.lh;

  this.ornament(ctx, t.cx, t.top + 6, t.p.light);

  // Sombra de relieve
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  f.lines.forEach((l, i) => ctx.fillText(l, t.cx, y0 + i * f.lh + 4));

  // Relleno metálico
  const metal = ctx.createLinearGradient(0, y0 - f.size, 0, yEnd + 8);
  metal.addColorStop(0, '#ffffff');
  metal.addColorStop(0.55, t.p.light);
  metal.addColorStop(1, this.mixColor(t.p.main, t.p.light, 0.4));
  ctx.fillStyle = metal;
  f.lines.forEach((l, i) => ctx.fillText(l, t.cx, y0 + i * f.lh));

  this.ornament(ctx, t.cx, yEnd + 40, t.p.light);

  ctx.font = '500 28px "Inter", sans-serif';
  this.setSpacing(ctx, 10);
  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  ctx.fillText(t.sub, t.cx, yEnd + 98);
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
  ctx.globalCompositeOperation = 'screen';
  this.glow(ctx, cx, cy, radius * 2.1, this.makePalette(color).light, 0.35);
  ctx.restore();

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

  ctx.beginPath();
  ctx.arc(cx, cy, radius + 26, 0, Math.PI * 2);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
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
    ctx.font = '700 80px "Oswald", sans-serif';
    this.wrapText(ctx, club.club_name.toUpperCase(), w / 2, bannerY + bannerHeight * 0.42, w - 120, 86);

ctx.font = '500 38px "Inter", sans-serif';
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

  private loadFavorites(): void {
  try {
    const raw = localStorage.getItem('favoriteClubs');
    this.favorites = new Set<string>(raw ? JSON.parse(raw) : []);
  } catch {
    this.favorites = new Set<string>();
  }
}

selectColor(color: string): void {
  this.selectedColor = this.selectedColor === color ? '' : color;
}

private loadColorCache(): void {
  try {
    localStorage.removeItem('clubColors');
    localStorage.removeItem('clubColors_v3'); // limpia cache anterior
    this.clubColors = JSON.parse(localStorage.getItem('clubColors_v4') || '{}');
  } catch {
    this.clubColors = {};
  }
}

private saveColorCache(): void {
  try {
    localStorage.setItem('clubColors_v4', JSON.stringify(this.clubColors));
  } catch {}
}


private async analyzeColors(): Promise<void> {
  if (this.isAnalyzingColors) return;

  const pending = this.clubs.filter(
    c => !this.clubColors[c.club_name] && !this.failedColors.has(c.club_name)
  );
  if (!pending.length) return;

  const jobId = ++this.colorAnalysisId;
  this.isAnalyzingColors = true;
  const batchSize = 8;

  try {
    for (let i = 0; i < pending.length; i += batchSize) {
      if (jobId !== this.colorAnalysisId) return; // cancelado

      await Promise.all(
        pending.slice(i, i + batchSize).map(async club => {
          try {
            const img = await this.loadImageForCanvas(club.club_logo);
            const color = this.classifyColor(img);
            if (!color.length) this.failedColors.add(club.club_name);
            else this.clubColors[club.club_name] = color;
          } catch {
            this.failedColors.add(club.club_name);
          }
        })
      );
      this.saveColorCache();
    }
  } finally {
    // solo el job vigente apaga el flag
    if (jobId === this.colorAnalysisId) {
      this.isAnalyzingColors = false;
    }
  }
}

private classifyColor(img: HTMLImageElement): string[] {
  const size = 48;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, size, size);

  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, size, size).data;
  } catch {
    throw new Error('canvas-blocked');
  }

  const counts: Record<string, number> = {};
  this.colorGroups.forEach(c => (counts[c.value] = 0));
  let total = 0;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 200) continue;
    total++;
    const { h, s, l } = this.rgbToHsl(data[i], data[i + 1], data[i + 2]);
    const bucket = this.bucketColor(h, s, l);
    if (bucket) counts[bucket]++;
  }

  if (!total) return [];

  // Negro/blanco necesitan más presencia real (contornos no cuentan tanto)
  const minRatio = (name: string) =>
    name === 'black' || name === 'white' ? 0.22 : 0.14;

  return Object.entries(counts)
    .filter(([name, n]) => n / total >= minRatio(name))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);
}

private bucketColor(h: number, s: number, l: number): string | null {
  // Negro: solo oscuro Y poco saturado.
  // Navy (azul oscuro saturado) NO debe ser negro.
  if (l < 0.10) return 'black';
  if (l < 0.18 && s < 0.22) return 'black';

  // Blanco
  if (l > 0.92 || (l > 0.85 && s < 0.18)) return 'white';

  // Gris neutro → ignorar
  if (s < 0.16) {
    if (l < 0.22) return 'black';
    if (l > 0.80) return 'white';
    return null;
  }

  // --- Croma por matiz ---
  if (h < 12 || h >= 348) return 'red';
  if (h < 40) return 'orange';
  if (h < 68) return 'yellow';
  if (h < 160) return 'green';

  // Celeste: cian / azul claro (≈ 160–205), luminosidad media-alta
  // Azul: azul medio-profundo (≈ 205–255), luminosidad media-baja
  if (h < 205) {
    // zona cian–celeste
    if (l < 0.28) return 'blue'; // cian muy oscuro → azul
    return 'skyblue';
  }

  if (h < 255) {
    // zona azul
    if (l > 0.60) return 'skyblue'; // azul muy claro → celeste
    return 'blue';
  }

  if (h < 330) return 'purple';
  return 'red';
}

colorLabel(value: string): string {
  return this.colorGroups.find(c => c.value === value)?.label ?? value;
}

colorHex(value: string): string {
  return this.colorGroups.find(c => c.value === value)?.hex ?? '#cccccc';
}

toggleColorMenu(event: Event): void {
  event.stopPropagation();
  this.colorMenuOpen = !this.colorMenuOpen;
}

closeColorMenu(): void {
  this.colorMenuOpen = false;
}

@HostListener('document:click')
onDocumentClick(): void {
  this.colorMenuOpen = false;
}

private saveFavorites(): void {
  try {
    localStorage.setItem('favoriteClubs', JSON.stringify([...this.favorites]));
  } catch {
    // storage lleno o bloqueado: seguimos solo en memoria
  }
}

isFavorite(club: any): boolean {
  return this.favorites.has(club.club_name);
}

toggleFavorite(club: any, event: Event): void {
  event.stopPropagation();
  if (this.favorites.has(club.club_name)) this.favorites.delete(club.club_name);
  else this.favorites.add(club.club_name);
  this.saveFavorites();
  this.resetPaging();
}

setModalTab(tab: 'countries' | 'cities'): void {
  this.modalTab = tab;
  this.countrySearch = '';
}

filteredCities(): { city: string; country: string }[] {
  const q = this.countrySearch.toLowerCase();
  if (!q) return this.featuredCities;
  return this.featuredCities.filter(c =>
    c.city.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)
  );
}

getCityCount(city: { city: string; country: string }): number {
  return this.clubs.filter(club => {
    const [c, co] = club.city_country.split(',').map((p: string) => p.trim().toLowerCase());
    return c === city.city.toLowerCase() && co === city.country.toLowerCase();
  }).length;
}

onLogoLoad(club: any): void {
  this.loadedLogos.add(club.club_name);
}

onLogoError(club: any): void {
  this.failedLogos.add(club.club_name);
}

isLegend(club: any): boolean {
  return this.highlightedClubs.includes(club.club_name);
}

isDefunct(club: any): boolean {
  return /defunct/i.test(club.club_name);
}

displayName(club: any): string {
  return club.club_name
    .replace(/\s*\(defunct\)\s*/gi, '')
    .replace(/\s*-\s*defunct\s*/gi, '')
    .trim();
}


onSearchInput(event: Event): void {
  const q = (event.target as HTMLInputElement).value.trim().toLowerCase();
  this.activeSuggestion = -1;

  if (!q) {
    this.suggestions = [];
    this.suggestionsOpen = false;
    return;
  }

  const starts: any[] = [];
  const contains: any[] = [];
  const byCity: any[] = [];

  for (const club of this.clubs) {
    const name = club.club_name.toLowerCase();
    const city = club.city_country.split(',')[0].trim().toLowerCase();
    if (name.startsWith(q)) starts.push(club);
    else if (name.includes(q)) contains.push(club);
    else if (city.includes(q)) byCity.push(club);
    if (starts.length >= 8) break;
  }

  this.suggestions = [...starts, ...contains, ...byCity].slice(0, 8);
  this.suggestionsOpen = this.suggestions.length > 0;
}

onSearchKeydown(e: KeyboardEvent): void {
  const len = this.suggestions.length;

  if (e.key === 'ArrowDown' && len) {
    e.preventDefault();
    this.suggestionsOpen = true;
    this.activeSuggestion = (this.activeSuggestion + 1) % len;
  } else if (e.key === 'ArrowUp' && len) {
    e.preventDefault();
    this.suggestionsOpen = true;
    this.activeSuggestion = this.activeSuggestion <= 0 ? len - 1 : this.activeSuggestion - 1;
  } else if (e.key === 'Enter') {
    if (this.suggestionsOpen && this.activeSuggestion >= 0) {
      e.preventDefault();
      this.selectSuggestion(this.suggestions[this.activeSuggestion]);
    } else {
      this.closeSuggestions();
    }
  } else if (e.key === 'Escape') {
    this.closeSuggestions();
  }
}

onSearchFocus(): void {
  if (this.searchTerm && this.suggestions.length) this.suggestionsOpen = true;
}

selectSuggestion(club: any): void {
  this.searchTerm = club.club_name;
  this._exactClub = club.club_name;
  this.closeSuggestions();
}

closeSuggestions(): void {
  this.suggestionsOpen = false;
  this.activeSuggestion = -1;
}
get activeFilterCount(): number {
  return this.selectedCountries.length +
    [this.selectedCity, this.selectedColor, this.showFavoritesOnly, this.showDefunctOnly]
      .filter(Boolean).length;
}

get hasActiveFilters(): boolean {
  return this.activeFilterCount > 0;
}


clearAllFilters(): void {
  this.selectedCountries = [];
  this.selectedCity = null;
  this.selectedColor = '';
  this.showFavoritesOnly = false;
  this.showDefunctOnly = false;
  this.isCountryModalOpen = false;
}

onCrestMove(e: PointerEvent): void {
  if (e.pointerType !== 'mouse') return;
  const el = e.currentTarget as HTMLElement;
  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width;
  const y = (e.clientY - r.top) / r.height;

  el.style.setProperty('--ry', `${(x - 0.5) * 18}deg`);
  el.style.setProperty('--rx', `${(0.5 - y) * 18}deg`);
  el.style.setProperty('--mx', `${x * 100}%`);
  el.style.setProperty('--my', `${y * 100}%`);
}

onCrestLeave(e: PointerEvent): void {
  const el = e.currentTarget as HTMLElement;
  el.style.setProperty('--rx', '0deg');
  el.style.setProperty('--ry', '0deg');
}

async downloadLogoPng(club: any): Promise<void> {
  if (!club || this.isDownloadingLogo) return;
  this.isDownloadingLogo = true;
  this.showLogoMsg('');

  const SIZE = 250;     // lado del PNG final
  const STICKER = 3;    // grosor del borde blanco (px)
  const PAD = 14;       // margen para que el borde y la sombra no se recorten

  try {
    const img = await this.loadImageForCanvas(club.club_logo);
    const nw = img.naturalWidth || SIZE;
    const nh = img.naturalHeight || SIZE;

    // 1) Logo escalado para entrar en el lienzo manteniendo proporción
    const inner = SIZE - PAD * 2;
    const ratio = Math.min(inner / nw, inner / nh);
    const w = Math.max(1, Math.round(nw * ratio));
    const h = Math.max(1, Math.round(nh * ratio));

    const logoCanvas = document.createElement('canvas');
    logoCanvas.width = w;
    logoCanvas.height = h;
    const logoCtx = logoCanvas.getContext('2d')!;
    logoCtx.imageSmoothingEnabled = true;
    logoCtx.imageSmoothingQuality = 'high';
    logoCtx.drawImage(img, 0, 0, w, h);

    // 2) Quitar el fondo (siempre)
    const result = this.removeUniformBackground(logoCtx, w, h);
    if (result === 'blocked') throw new Error('blocked');

    // 3) Contorno tipo sticker alrededor de la silueta
    const ox = Math.round((SIZE - w) / 2);
    const oy = Math.round((SIZE - h) / 2);

    const outline = document.createElement('canvas');
    outline.width = SIZE;
    outline.height = SIZE;
    const outlineCtx = outline.getContext('2d')!;
    this.dilateInto(outlineCtx, this.tintSilhouette(logoCanvas, '#aeb6c2'), ox, oy, STICKER + 1); // filo gris
    this.dilateInto(outlineCtx, this.tintSilhouette(logoCanvas, '#ffffff'), ox, oy, STICKER);     // borde blanco

    // 4) Composición final: sombra + borde + logo
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d')!;

    ctx.save();
    ctx.shadowColor = 'rgba(80, 90, 110, 0.35)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    ctx.drawImage(outline, 0, 0);
    ctx.restore();

    ctx.drawImage(logoCanvas, ox, oy);

    const blob: Blob = await new Promise((resolve, reject) =>
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('empty'))), 'image/png')
    );

    const name = this.displayName(club)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name}_logo_${SIZE}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    this.showLogoMsg({
      removed: 'Background removed',
      already: 'Logo already had a transparent background',
      complex: 'Background is not plain: border follows the original shape',
    }[result]);
  } catch {
    this.showLogoMsg('Could not process this logo');
  } finally {
    this.isDownloadingLogo = false;
  }
}

// Copia del logo pintada de un solo color, conservando su silueta
private tintSilhouette(src: HTMLCanvasElement, color: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  const x = c.getContext('2d')!;
  x.drawImage(src, 0, 0);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = color;
  x.fillRect(0, 0, c.width, c.height);
  return c;
}

// Engorda la silueta dibujándola desplazada alrededor de un círculo
private dilateInto(
  ctx: CanvasRenderingContext2D, silhouette: HTMLCanvasElement,
  x: number, y: number, radius: number
): void {
  const steps = 32;
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    ctx.drawImage(silhouette, x + Math.cos(a) * radius, y + Math.sin(a) * radius);
  }
  ctx.drawImage(silhouette, x, y);
}


private showLogoMsg(msg: string): void {
  this.logoDownloadMsg = msg;
  clearTimeout(this.logoMsgTimer);
  if (msg) this.logoMsgTimer = setTimeout(() => (this.logoDownloadMsg = ''), 4000);
}

// Borra un fondo liso conectado a los bordes. Devuelve qué pasó.
private removeUniformBackground(
  ctx: CanvasRenderingContext2D, w: number, h: number, tolerance = 28
): 'removed' | 'already' | 'complex' | 'blocked' {
  let image: ImageData;
  try {
    image = ctx.getImageData(0, 0, w, h);
  } catch {
    return 'blocked';
  }
  const d = image.data;

  // Si alguna esquina ya es transparente, el logo no tiene fondo que borrar
  const corners = [0, (w - 1) * 4, (h - 1) * w * 4, ((h - 1) * w + w - 1) * 4];
  if (corners.some(c => d[c + 3] < 250)) return 'already';

  // Color de fondo = promedio de las 4 esquinas; si no coinciden, no es liso
  const bg = [0, 1, 2].map(k => Math.round(corners.reduce((s, c) => s + d[c + k], 0) / 4));
  const dist = (i: number) =>
    Math.max(Math.abs(d[i] - bg[0]), Math.abs(d[i + 1] - bg[1]), Math.abs(d[i + 2] - bg[2]));
  if (!corners.every(c => dist(c) <= tolerance)) return 'complex';

  // Relleno desde los bordes: el blanco interior del escudo queda intacto
  const seen = new Uint8Array(w * h);
  const stack: number[] = [];
  const push = (x: number, y: number) => {
    const p = y * w + x;
    if (!seen[p] && dist(p * 4) <= tolerance) { seen[p] = 1; stack.push(p); }
  };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  while (stack.length) {
    const p = stack.pop()!;
    const x = p % w, y = (p - x) / w;
    d[p * 4 + 3] = 0;
    if (x > 0) push(x - 1, y);
    if (x < w - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < h - 1) push(x, y + 1);
  }

  // Suavizado: los píxeles del borde que parecen fondo quedan semitransparentes
  const soft = tolerance * 2.2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if (seen[p]) continue;
      const touchesBg =
        (x > 0 && seen[p - 1]) || (x < w - 1 && seen[p + 1]) ||
        (y > 0 && seen[p - w]) || (y < h - 1 && seen[p + w]);
      if (!touchesBg) continue;
      const dd = dist(p * 4);
      if (dd < soft) {
        d[p * 4 + 3] = Math.round(255 * Math.max(0, (dd - tolerance) / (soft - tolerance)));
      }
    }
  }

  ctx.putImageData(image, 0, 0);
  return 'removed';
}

}