import { Component, OnInit, HostListener } from '@angular/core';
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
  searchTerm: string = '';
  showBackToTop: boolean = false;
  isFadingOut: boolean = false;
  selectedImage: any = null;
  selectedContinent: string = '';
  continents: string[] = [];

  constructor(private http: HttpClient, private seoService: SeoService) {}

  ngOnInit(): void {
    this.loadNationalTeams();
    this.setupSeo();
  }

  private setupSeo(): void {
    this.seoService.updateSeo({
      title: 'National Football Teams',
      description: 'Explore national football teams from around the world. Find information about countries, continents, team logos, and national squad details.',
      keywords: 'national teams, football countries, world football, national squads, football nations, team logos',
      url: 'https://football-clubs-worldwide.com/national-teams',
      type: 'website'
    });

    // Datos estructurados para la página de equipos nacionales
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "World National Football Teams",
      "description": "Complete list of national football teams organized by continents",
      "url": "https://football-clubs-worldwide.com/national-teams",
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
  }

  loadNationalTeams(): void {
    this.http.get<any[]>('assets/json/national_teams.json').subscribe({
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

  get filteredTeams(): any[] {
    let filtered = this.teams;

    // Filtrar por continente seleccionado
    if (this.selectedContinent) {
      filtered = filtered.filter(team => team.continent === this.selectedContinent);
    }

    // Filtrar por nombre
    if (this.searchTerm) {
      const searchTermLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(team =>
        team.club_name.toLowerCase().includes(searchTermLower)
      );
    }

    return filtered;
  }

  clearSearch(): void {
    this.searchTerm = '';
  }

  openModal(index: number): void {
    this.selectedTeam = this.filteredTeams[index];
  }

  closeModal(): void {
    this.selectedTeam = null;
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

  openImageModal(team: any, event: Event): void {
    event.stopPropagation();
    this.selectedImage = team.club_logo;
  }

  closeImageModal(): void {
    this.selectedImage = null;
  }

  getCountryCode(countryName: string): string {
    const country = countryName.toLowerCase();
    return COUNTRY_FLAG_MAP[country] || 'un';
  }

  clearContinentFilter(): void {
    this.selectedContinent = '';
  }

  getGoogleNewsUrl(team: any): string {
    const query = encodeURIComponent(`${team.club_name} national football team news`);
    return `https://www.google.com/search?q=${query}&tbm=nws`;
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
}
