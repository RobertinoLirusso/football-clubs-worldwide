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
  zoomedTeam: any = null;
  continents: string[] = [];
  hoveredTeam: string | null = null;

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
  private _showDefunctOnly = false;
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

  get showDefunctOnly(): boolean { return this._showDefunctOnly; }
  set showDefunctOnly(v: boolean) { this._showDefunctOnly = v; this.resetPaging(); }

  get activeFilterCount(): number {
    return [this.selectedContinent, this.showFavoritesOnly, this.showDefunctOnly].filter(Boolean).length;
  }

  get hasActiveFilters(): boolean {
    return this.activeFilterCount > 0;
  }

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
  // DESCARGA DEL LOGO
  // ============================================================

  isDownloadingLogo = false;
  logoDownloadMsg = '';
  private logoMsgTimer: any;

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

  selectRandomTeam(): void {
    const pool = this.teams.filter(t => !this.selectedContinent || t.continent === this.selectedContinent);
    if (!pool.length) return;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    this.searchTerm = picked.club_name;
    this._exactTeam = picked.club_name;
  }

  // ============================================================
  // FILTROS: ACCIONES
  // ============================================================

  selectContinent(continent: string): void {
    this.selectedContinent = this.selectedContinent === continent ? '' : continent;
  }

  clearContinentFilter(): void {
    this.selectedContinent = '';
  }

  clearAllFilters(): void {
    this.selectedContinent = '';
    this.showFavoritesOnly = false;
    this.showDefunctOnly = false;
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
    this.logoDownloadMsg = '';
  }

  openImageModal(team: any, event: Event): void {
    event.stopPropagation();
    this.zoomedTeam = team;
    this.selectedImage = team.club_logo;
  }

  closeImageModal(): void {
    this.selectedImage = null;
    this.zoomedTeam = null;
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
  // ESCUDO DEL MODAL: INCLINACIÓN 3D
  // ============================================================

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

  // ============================================================
  // DEFUNCT Y CAMPEONES
  // ============================================================

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

  // ============================================================
  // DESCARGA DEL LOGO (PNG sin fondo + borde sticker)
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
    const isLocal = url.startsWith('/');
    const firstAttempt = (isWikimedia || isLocal) ? url : this.buildProxiedUrl(url);

    return tryLoad(firstAttempt).catch(() => {
      const fallback = (isWikimedia || isLocal) ? this.buildProxiedUrl(url) : url;
      return tryLoad(fallback).catch(() => {
        throw new Error('No se pudo cargar el logo (ni directo ni vía proxy)');
      });
    });
  }

  async downloadLogoPng(team: any): Promise<void> {
    if (!team || this.isDownloadingLogo) return;
    this.isDownloadingLogo = true;
    this.showLogoMsg('');

    const SIZE = 250;     // lado del PNG final
    const STICKER = 3;    // grosor del borde blanco (px)
    const PAD = 14;       // margen para que el borde y la sombra no se recorten

    try {
      const img = await this.loadImageForCanvas(team.club_logo);
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
      this.dilateInto(outlineCtx, this.tintSilhouette(logoCanvas, '#aeb6c2'), ox, oy, STICKER + 1);
      this.dilateInto(outlineCtx, this.tintSilhouette(logoCanvas, '#ffffff'), ox, oy, STICKER);

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

      const name = this.displayName(team)
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

  private showLogoMsg(msg: string): void {
    this.logoDownloadMsg = msg;
    clearTimeout(this.logoMsgTimer);
    if (msg) this.logoMsgTimer = setTimeout(() => (this.logoDownloadMsg = ''), 4000);
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

  get anyModalOpen(): boolean {
  return !!(this.selectedTeam || this.selectedImage);
}
}