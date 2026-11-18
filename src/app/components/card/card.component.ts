import { CommonModule } from '@angular/common';
import { Component, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxImageZoomModule } from 'ngx-image-zoom';
import { ClubService } from '../../services/club.service';
import { COUNTRY_FLAG_MAP } from '../../utils/country-flags';
import { ClubColorAnalysisService } from './club-color-analysis.service';
import { ClubLogoProcessingService } from './club-logo-processing.service';
import { ClubWallpaperComponent } from './club-wallpaper.component';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxImageZoomModule, ClubWallpaperComponent],
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

  // Añadir estas propiedades
filterResultCount: number | null = null;
visibleCities: { city: string; country: string }[] = [];
visibleCountries: string[] = [];

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

  constructor(
    private clubService: ClubService,
    private colorAnalysisService: ClubColorAnalysisService,
    private logoProcessingService: ClubLogoProcessingService
  ) {}

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

  openWallpaperModal(): void {
    this.isWallpaperModalOpen = true;
  }

  closeWallpaperModal(): void {
    this.isWallpaperModalOpen = false;
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
  this.countrySearch = '';
  this.updateGeoLists();
  this.updateFilterResultCount();
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
  this.updateFilterResultCount();
}

removeCountry(country: string): void {
  this.selectedCountries = this._selectedCountries.filter(c => c !== country);
}

selectCity(city: { city: string; country: string }): void {
  this.selectedCity = this.selectedCity?.city === city.city &&
    this.selectedCity?.country === city.country ? null : city;
  this.selectedCountries = [];
  this.updateFilterResultCount();
  this.isCountryModalOpen = false;
}

  isCitySelected(city: { city: string; country: string }): boolean {
    return this.selectedCity?.city === city.city &&
      this.selectedCity?.country === city.country;
  }

clearCountryFilterModal(): void {
  this.countrySearch = '';
  this.updateGeoLists();
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
    club => !this.clubColors[club.club_name] && !this.failedColors.has(club.club_name)
  );
  if (!pending.length) return;

  const jobId = ++this.colorAnalysisId;
  this.isAnalyzingColors = true;

  try {
    await this.colorAnalysisService.analyze(
      pending,
      () => jobId !== this.colorAnalysisId,
      (clubName, colors) => {
        if (!colors.length) this.failedColors.add(clubName);
        else this.clubColors[clubName] = colors;
      },
      clubName => this.failedColors.add(clubName),
      () => this.saveColorCache()
    );
  } finally {
    if (jobId === this.colorAnalysisId) {
      this.isAnalyzingColors = false;
    }
  }
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

  const size = 250;

  try {
    const { blob, result } = await this.logoProcessingService.createStickerLogo(club.club_logo);
    const name = this.displayName(club)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name}_logo_${size}.png`;
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

private showLogoMsg(msg: string): void {
  this.logoDownloadMsg = msg;
  clearTimeout(this.logoMsgTimer);
  if (msg) this.logoMsgTimer = setTimeout(() => (this.logoDownloadMsg = ''), 4000);
}

get anyModalOpen(): boolean {
  return !!(this.selectedClub || this.selectedImage || this.isCountryModalOpen || this.isWallpaperModalOpen);
}

// Nuevo método
private updateGeoLists(): void {
  const q = this.countrySearch.trim().toLowerCase();

  this.visibleCities = q
    ? this.featuredCities.filter(c =>
        c.city.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)
      )
    : [...this.featuredCities];

  this.visibleCountries = q
    ? this.countries.filter(c => c.toLowerCase().includes(q))
    : [...this.countries];
}

// Nuevo método
private updateFilterResultCount(): void {
  // Solo se calcula al abrir o al cambiar filtros dentro del modal
  this.filterResultCount = this.allFilteredClubs.length;
}

onCountrySearchChange(): void {
  this.updateGeoLists();
}

}