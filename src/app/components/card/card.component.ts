import { Component, OnInit } from '@angular/core';
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

  animatedClubsCount: number = 0;  // <--- contador animado

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
    'Manchester City'
  ];

  constructor(private clubService: ClubService) {}

  ngOnInit(): void {
    this.getClubs();
  }

  getClubs(): void {
    this.clubService.getClubs().subscribe(data => {
      this.clubs = this.shuffleArray(data);
      this.animateCounter();   // <-- inicio animación cuando cargan clubes
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
    const duration = 1500; // duración animación en ms
    const frameRate = 30;  // frames por segundo
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

  get filteredClubs(): any[] {
    let filtered: any[] = [];

    if (!this.searchTerm) {
      const highlighted = this.clubs.filter(club => this.highlightedClubs.includes(club.club_name));
      const rest = this.clubs.filter(club => !this.highlightedClubs.includes(club.club_name));
      filtered = [...highlighted, ...rest];
    } else {
      const searchTermLower = this.searchTerm.toLowerCase();
      filtered = this.clubs.filter(club =>
        club.club_name.toLowerCase().includes(searchTermLower) ||
        club.city_country.toLowerCase().includes(searchTermLower)
      );
    }

    return filtered.slice(0, this.visibleClubs);
  }

  clearSearch(): void {
    this.searchTerm = '';
  }

  loadMore(): void {
    this.visibleClubs += 100;
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
    if (!this.searchTerm) {
      return this.clubs.length;
    }
    const searchTermLower = this.searchTerm.toLowerCase();
    return this.clubs.filter(club =>
      club.club_name.toLowerCase().includes(searchTermLower) ||
      club.city_country.toLowerCase().includes(searchTermLower)
    ).length;
  }

  getGoogleNewsUrl(club: any): string {
    return `https://www.google.com/search?q=${encodeURIComponent(club.club_name)}`
  }

  get totalClubs(): number {
    return this.clubs.length;
  }
}
