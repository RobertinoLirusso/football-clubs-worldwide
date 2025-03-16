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
      return this.clubs.slice(0, this.visibleClubs); // Solo mostrar hasta visibleClubs
    }

    const searchTermLower = this.searchTerm.toLowerCase();
  
    return this.clubs.filter(club => 
      club.club_name.toLowerCase().includes(searchTermLower) ||
      club.city_country.toLowerCase().includes(searchTermLower)
    ).slice(0, this.visibleClubs); // Aplicar límite después de filtrar
  }

  clearSearch() {
    this.searchTerm = '';
  }

  loadMore() {
    this.visibleClubs += 100; // Cargar 100 clubes adicionales
  }
    
    
}
