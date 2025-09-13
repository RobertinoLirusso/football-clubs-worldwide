import { Component, OnInit, HostListener } from '@angular/core';
import { ClubService } from '../../services/club.service';
import { COUNTRY_FLAG_MAP } from '../../utils/country-flags';
import { FootballService } from '../../services/football.service';

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
    'Palmeiras'
  ];


  constructor(
  private clubService: ClubService,
  private footballService: FootballService,
  ) {}

  ngOnInit(): void {
    this.getClubs();
    this.getTodayMatches();
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
  this.visibleClubs = 100; // reset
}

clearCountryFilter(): void {
  this.selectedCountry = '';
  this.isCountryModalOpen = false;
  this.visibleClubs = 100; // reset
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
      club.club_name.toLowerCase().includes(searchTermLower));
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
  filtered = [...filtered].sort((a, b) => a.club_name.localeCompare(b.club_name));
} else if (this.sortOption === 'za') {
  filtered = [...filtered].sort((a, b) => b.club_name.localeCompare(a.club_name));
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
  this.visibleClubs = 100; // reset
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
  event.stopPropagation(); // Evita que se active click de la card
  this.selectedImage = club.club_logo; // O todo el club si quieres info extra
}
closeImageModal() {
  this.selectedImage = null;
}
  
getTodayMatches(): void {
   this.loadingMatches = true; 
    this.footballService.getTodayMatches().subscribe({
      next: (res) => {
        this.matches = res.matches || [];
        this.loadingMatches = false;
      },
      error: (err) => {
        console.error('Error al cargar partidos', err);
        this.matches = [];
        this.loadingMatches = false;
      }
    });
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

}
