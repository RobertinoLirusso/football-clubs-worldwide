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
    
  
    constructor(private clubService: ClubService) {}
  
    ngOnInit(): void {
      this.getClubs();
    }
  
    getClubs(): void {
      this.clubService.getClubs().subscribe(data => {
        this.clubs = data;
        this.clubs = this.shuffleArray(data); 
      });
    }

    shuffleArray(array: any[]): any[] {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Intercambia elementos
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
      const filtered = this.clubs.filter(club => 
        club.club_name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
      return filtered.length ? filtered : [];
    }

    clearSearch()  {
      this.searchTerm = '';
    }
    
}
