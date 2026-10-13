import { Component, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { COUNTRY_FLAG_MAP } from '../../utils/country-flags';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-national-teams',
  templateUrl: './national-teams.component.html',
  styleUrls: ['./national-teams.component.css']
})
export class NationalTeamsComponent implements OnInit {

  teams: any[] = [];
  selectedTeam: any = null;
  showBackToTop: boolean = false;
  isFadingOut: boolean = false;
  selectedImage: any = null;
  continents: string[] = [];

  private _showDefunctOnly = false;
get showDefunctOnly(): boolean { return this._showDefunctOnly; }
set showDefunctOnly(v: boolean) { this._showDefunctOnly = v; this.resetPaging(); }

// Claves en minúscula, sin "(Defunct)". Agregá acá los próximos campeones.
private readonly worldChampions: Record<string, number[]> = {
  'uruguay':      [1930, 1950],
  'italy':        [1934, 1938, 1982, 2006],
  'germany':      [1954, 1974, 1990, 2014],
  'west germany': [1954, 1974, 1990],
  'brasil':       [1958, 1962, 1970, 1994, 2002],
  'england':      [1966],
  'argentina':    [1978, 1986, 2022],
  'france':       [1998, 2018],
  'spain':        [2010, 2026],
};

  // ============================================================
  // FILTROS (con setter: cualquier cambio vuelve a la primera página)
  // ============================================================

  private _searchTerm = '';
  private _selectedContinent = '';
  private _sortOption = 'default';
  private _showFavoritesOnly = false;
  private _exactTeam: string | null = null;

  get searchTerm(): string { return this._searchTerm; }
  set searchTerm(v: string) {
    this._searchTerm = v;
    this._exactTeam = null;
    this.resetPaging();
  }

  get selectedContinent(): string { return this._selectedContinent; }
  set selectedContinent(v: string) { this._selectedContinent = v; this.resetPaging(); }

  get sortOption(): string { return this._sortOption; }
  set sortOption(v: string) { this._sortOption = v; this.resetPaging(); }

  get showFavoritesOnly(): boolean { return this._showFavoritesOnly; }
  set showFavoritesOnly(v: boolean) { this._showFavoritesOnly = v; this.resetPaging(); }

  // ============================================================
  // VISTA: SCROLL (Load More) / PÁGINAS
  // ============================================================

  viewMode: 'scroll' | 'pages' = 'scroll';
  visibleTeams: number = 100;

  pageSize = 24;
  currentPage = 0;
  slideDir: 'next' | 'prev' | '' = '';
  private touchStartX = 0;
  private touchStartY = 0;
  private slideTimer: any;

  @ViewChild('gridTop') gridTop!: ElementRef<HTMLElement>;

  // ============================================================
  // FAVORITOS Y LOGOS
  // ============================================================

  favorites = new Set<string>();
  loadedLogos = new Set<string>();
  failedLogos = new Set<string>();

  // ============================================================
  // BUSCADOR: SUGERENCIAS
  // ============================================================

  suggestions: any[] = [];
  suggestionsOpen = false;
  activeSuggestion = -1;

  constructor(private http: HttpClient, private seoService: SeoService) {}

  ngOnInit(): void {
    this.loadFavorites();
    this.loadNationalTeams();
    this.setupSeo();
  }

  private setupSeo(): void {
    this.seoService.updateSeo({
      title: 'National Football Teams',
      description: 'Explore national football teams from around the world. Find information about countries, continents, team logos, and national squad details.',
      keywords: 'national teams, football countries, world football, national squads, football nations, team logos',
      url: 'https://football-clubs-worldwide.vercel.app/national-teams',
      type: 'website'
    });

    // Datos estructurados para la página de equipos nacionales
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "World National Football Teams",
      "description": "Complete list of national football teams organized by continents",
      "url": "https://football-clubs-worldwide.vercel.app/national-teams",
      "numberOfItems": "200+",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "item": {
            "@type": "SportsTeam",
            "@id": "#national-teams-collection",
            "name": "National Football Teams Collection",
            "sport": "Soccer"
          }
        }
      ]
    };

    this.seoService.setStructuredData(structuredData);
    this.seoService.setNationalTeamsPageSeo();
  }

  loadNationalTeams(): void {
    this.http.get<any[]>('/assets/json/national_teams.json').subscribe({
      next: (data) => {
        // Ordenar de A a Z por el campo "club_name"
        this.teams = data.sort((a, b) => a.club_name.localeCompare(b.club_name));
        // Extraer continentes únicos
        this.extractContinents();
      },
      error: (err) => {
        console.error('Error loading national teams:', err);
      }
    });
  }

  extractContinents(): void {
    const continentSet = new Set<string>();
    this.teams.forEach(team => {
      if (team.continent) {
        continentSet.add(team.continent);
      }
    });
    this.continents = Array.from(continentSet).sort();
  }

  // Todos los resultados filtrados (sin recortar)
  get allFilteredTeams(): any[] {
    let filtered = this.teams;

    if (this.showFavoritesOnly) {
      filtered = filtered.filter(team => this.favorites.has(team.club_name));
    }

    if (this.showDefunctOnly) {
  filtered = filtered.filter(team => this.isDefunct(team));
}

    if (this.selectedContinent) {
      filtered = filtered.filter(team => team.continent === this.selectedContinent);
    }

    if (this._exactTeam) {
      filtered = filtered.filter(team => team.club_name === this._exactTeam);
    } else if (this.searchTerm) {
      const searchTermLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(team =>
        team.club_name.toLowerCase().includes(searchTermLower)
      );
    }

    if (this.sortOption === 'za') {
      filtered = [...filtered].sort((a, b) => b.club_name.localeCompare(a.club_name));
    } else if (this.sortOption === 'az') {
      filtered = [...filtered].sort((a, b) => a.club_name.localeCompare(b.club_name));
    }

    return filtered;
  }

  // ============================================================
  // PAGINACIÓN / SCROLL
  // ============================================================

  private resetPaging(): void {
    this.currentPage = 0;
    this.visibleTeams = 100;
  }

  setViewMode(mode: 'scroll' | 'pages'): void {
    if (this.viewMode === mode) return;
    this.viewMode = mode;
    this.resetPaging();
  }

  loadMore(): void {
    this.visibleTeams += 100;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.allFilteredTeams.length / this.pageSize));
  }

  // En modo scroll es 0, así los índices del template coinciden con allFilteredTeams
  get pageStart(): number {
    return this.viewMode === 'pages' ? this.currentPage * this.pageSize : 0;
  }

  get displayedTeams(): any[] {
    const all = this.allFilteredTeams;
    return this.viewMode === 'pages'
      ? all.slice(this.pageStart, this.pageStart + this.pageSize)
      : all.slice(0, this.visibleTeams);
  }

  get hasMore(): boolean {
    return this.viewMode === 'scroll' && this.visibleTeams < this.allFilteredTeams.length;
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

  // ============================================================
  // BUSCADOR
  // ============================================================

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

    for (const team of this.teams) {
      const name = team.club_name.toLowerCase();
      if (name.startsWith(q)) starts.push(team);
      else if (name.includes(q)) contains.push(team);
      if (starts.length >= 8) break;
    }

    this.suggestions = [...starts, ...contains].slice(0, 8);
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

  // Primero el texto (que limpia la selección) y después la selección exacta
  selectSuggestion(team: any): void {
    this.selectedContinent = '';
    this.searchTerm = team.club_name;
    this._exactTeam = team.club_name;
    this.closeSuggestions();
  }

  closeSuggestions(): void {
    this.suggestionsOpen = false;
    this.activeSuggestion = -1;
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.suggestions = [];
    this.closeSuggestions();
  }

  clearContinentFilter(): void {
    this.selectedContinent = '';
  }

  // ============================================================
  // FAVORITOS
  // ============================================================

  private loadFavorites(): void {
    try {
      const raw = localStorage.getItem('favoriteTeams');
      this.favorites = new Set<string>(raw ? JSON.parse(raw) : []);
    } catch {
      this.favorites = new Set<string>();
    }
  }

  private saveFavorites(): void {
    try {
      localStorage.setItem('favoriteTeams', JSON.stringify([...this.favorites]));
    } catch {
      // storage lleno o bloqueado: seguimos solo en memoria
    }
  }

  isFavorite(team: any): boolean {
    return this.favorites.has(team.club_name);
  }

  toggleFavorite(team: any, event: Event): void {
    event.stopPropagation();
    if (this.favorites.has(team.club_name)) this.favorites.delete(team.club_name);
    else this.favorites.add(team.club_name);
    this.saveFavorites();
    this.resetPaging();
  }

  // ============================================================
  // LOGOS
  // ============================================================

  onLogoLoad(team: any): void {
    this.loadedLogos.add(team.club_name);
  }

  onLogoError(team: any): void {
    this.failedLogos.add(team.club_name);
  }

  trackByTeam(index: number, team: any): string {
    return team.club_name;
  }

  // ============================================================
  // MODALES
  // ============================================================

  openModal(index: number): void {
    this.selectedTeam = this.allFilteredTeams[index];
  }

  closeModal(): void {
    this.selectedTeam = null;
  }

  openImageModal(team: any, event: Event): void {
    event.stopPropagation();
    this.selectedImage = team.club_logo;
  }

  closeImageModal(): void {
    this.selectedImage = null;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.selectedImage) { this.closeImageModal(); return; }
    if (this.selectedTeam) this.closeModal();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent): void {
    const tag = (e.target as HTMLElement)?.tagName;
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tag)) return;
    if (this.viewMode !== 'pages' || this.selectedTeam || this.selectedImage) return;

    if (e.key === 'ArrowRight') this.goToPage(this.currentPage + 1);
    if (e.key === 'ArrowLeft') this.goToPage(this.currentPage - 1);
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

  scrollToTop(): void {
    window.scroll({
      top: 0,
      behavior: 'smooth'
    });
  }

  // ============================================================
  // UTILIDADES
  // ============================================================

  getCountryCode(countryName: string): string {
    const country = countryName.toLowerCase();
    return COUNTRY_FLAG_MAP[country] || 'xx';
  }

  getGoogleNewsUrl(team: any): string {
    const query = encodeURIComponent(`${team.club_name} national football team`);
    return `https://www.google.com/search?q=${query}`;
  }

  getYouTubeUrl(team: any): string {
    const query = encodeURIComponent(`${team.club_name} national football team`);
    return `https://www.youtube.com/results?search_query=${query}`;
  }

  getTwitterShareUrl(team: any): string {
    const text = encodeURIComponent(`Check out ${team.club_name} national team! ⚽\n`);
    const url = encodeURIComponent(window.location.href);
    return `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
  }


  isDefunct(team: any): boolean {
  return /defunct/i.test(team.club_name);
}

displayName(team: any): string {
  return team.club_name
    .replace(/\s*\(defunct\)\s*/gi, '')
    .replace(/\s*-\s*defunct\s*/gi, '')
    .trim();
}

championYears(team: any): number[] {
  return this.worldChampions[this.displayName(team).toLowerCase()] ?? [];
}

isChampion(team: any): boolean {
  return this.championYears(team).length > 0;
}
}