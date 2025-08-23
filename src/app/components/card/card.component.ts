import { Component, OnInit, HostListener } from '@angular/core';
import { ClubService } from '../../services/club.service';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css']
})
export class CardComponent implements OnInit {
  clubs: any[] = [];
  selectedClub: any = null;
  searchTerm: string = '';
  visibleClubs: number = 100;

  showBackToTop: boolean = false;
  isFadingOut: boolean = false;

  animatedClubsCount: number = 0;

  isCountryModalOpen: boolean = false;
  selectedCountry: string = '';
  countrySearch: string = '';
  countries: string[] = [];

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
    'Borussia Dortmund'
  ];

  // 🚩 Mapeo de países a código ISO Alpha-2 (para banderas)
  countryFlagMap: { [key: string]: string } = {
    'peru': 'pe',
    'italy': 'it',
    'england': 'gb-eng',
    'spain': 'es',
    'germany': 'de',
    'france': 'fr',
    'argentina': 'ar',
    'brazil': 'br',
    'uruguay': 'uy',
    'chile': 'cl',
    'portugal': 'pt',
    'mexico': 'mx',
    'usa': 'us',
    'japan': 'jp',
    'china': 'cn',
    'colombia': 'co',
    'paraguay': 'py',
    'ecuador': 'ec',
    'venezuela': 've'
    // agrega más según tu JSON
  };

  constructor(private clubService: ClubService) {}

  ngOnInit(): void {
    this.getClubs();
  }

  // Detectar scroll con HostListener
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
  }

  clearCountryFilter(): void {
    this.selectedCountry = '';
    this.isCountryModalOpen = false;
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
      filtered = filtered.filter(club =>
        club.club_name.toLowerCase().includes(searchTermLower) ||
        club.city_country.toLowerCase().includes(searchTermLower)
      );
    } else if (!this.selectedCountry) {
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
    if (this.clubs.length > 0) {
      const randomIndex = Math.floor(Math.random() * this.clubs.length);
      this.searchTerm = this.clubs[randomIndex].club_name;
    }
  }

  getTwitterShareUrl(club: any): string {
    const text = `Check out ${club.club_name} from ${club.city_country}! ⚽\n`;
    const url = `https://football-clubs-worldwide.vercel.app/`;
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  }

  get totalFilteredCount(): number {
    return this.selectedCountry || this.searchTerm
      ? this.clubs.filter(club => {
          const parts = club.city_country.split(',');
          const country = parts.length > 1 ? parts[1].trim().toLowerCase() : '';
          return (
            (!this.selectedCountry || country === this.selectedCountry.toLowerCase()) &&
            (!this.searchTerm ||
              club.club_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
              club.city_country.toLowerCase().includes(this.searchTerm.toLowerCase()))
          );
        }).length
      : this.clubs.length;
  }

  getGoogleNewsUrl(club: any): string {
    return `https://www.google.com/search?q=${encodeURIComponent(club.club_name)}`;
  }

  get totalClubs(): number {
    return this.clubs.length;
  }

getCountryCode(value: string): string {
  // Puede venir "City, Country" o solo "Country"
  let country = value;
  if (value.includes(',')) {
    const parts = value.split(',');
    country = parts.length > 1 ? parts[1].trim().toLowerCase() : '';
  } else {
    country = value.trim().toLowerCase();
  }
  return this.countryFlagMap[country] || 'un'; // 'un' = Naciones Unidas por defecto
}

}
