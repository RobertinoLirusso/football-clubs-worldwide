import { Component, OnInit } from '@angular/core';
import { ClubService } from '../../services/club.service';



@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrl: './card.component.css'
})
export class CardComponent implements OnInit {
  
  clubs: any[] = [];
  selectedClub: any = null;
  searchTerm: string = '';
  visibleClubs: number = 100; // Mostrar inicialmente 100 clubes

  highlightedClubs: string[] = [
    'Real Madrid',
    'Inter Milan',
    'Racing Club',
    'Barcelona',
    'Chelsea',
    'Paris Saint-Germain',
    'Liverpool',
    'Tottenham Hotspur'
  ];
  
  
  constructor(private clubService: ClubService) {}

  ngOnInit(): void {
    this.getClubs();
  }

  getClubs(): void {
    this.clubService.getClubs().subscribe(data => {
      this.clubs = this.shuffleArray(data);
    });
  }

  shuffleArray(array: any[]): any[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]; 
    }
    return array;
  }

  openModal(index: number) {
    this.selectedClub = this.filteredClubs[index];    
  }

  closeModal() {
    this.selectedClub = null;
  }

get filteredClubs(): any[] {
  if (!this.searchTerm) {
    // Separar los destacados
    const highlighted = this.clubs.filter(club => this.highlightedClubs.includes(club.club_name));
    const rest = this.clubs.filter(club => !this.highlightedClubs.includes(club.club_name));
    const result = [...highlighted, ...rest].slice(0, this.visibleClubs);
    return result;
  }

  const searchTermLower = this.searchTerm.toLowerCase();

  const filtered = this.clubs.filter(club =>
    club.club_name.toLowerCase().includes(searchTermLower) ||
    club.city_country.toLowerCase().includes(searchTermLower)
  );

  return filtered.slice(0, this.visibleClubs);
 }
  clearSearch() {
    this.searchTerm = '';
  }

  loadMore() {
    this.visibleClubs += 100; // Cargar 100 clubes adicionales
  }

  selectRandomClub() {
    if (this.clubs.length > 0) {
      const randomIndex = Math.floor(Math.random() * this.clubs.length);
      this.searchTerm = this.clubs[randomIndex].club_name; // Establece la búsqueda con el nombre del club aleatorio
    }
  }

  
  getTwitterShareUrl(club: any): string {
    const text = `Check out ${club.club_name} from ${club.city_country}! ⚽\n`;
    const url = `https://footballclubsworldwide.vercel.app/`;
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  }






   
}
