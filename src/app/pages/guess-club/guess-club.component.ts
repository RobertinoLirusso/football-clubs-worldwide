import { Component, OnInit } from '@angular/core';
import { ClubService } from '../../services/club.service';

@Component({
  selector: 'app-guess-club',
  templateUrl: './guess-club.component.html',
  styleUrl: './guess-club.component.css'
})
export class GuessClubComponent implements OnInit {

  clubs: any[] = [];
  selectedClub: any = null;
  options: string[] = [];
  gameOver: boolean = false;
  isCorrect: boolean = false;
  streak: number = 0; // Inicializa la racha
  lastScore: number = 0; // Última cantidad de respuestas correctas antes de fallar
  totalCorrectAnswers: number = 0; // Total acumulado de respuestas correctas en todo el juego

  constructor(private clubService: ClubService) {}

  ngOnInit(): void {
    this.getClubs();
  }

  getClubs(): void {
    this.clubService.getClubs().subscribe(data => {
      this.clubs = data;
      this.startGame();
    });
  }

  startGame(): void {
    this.gameOver = false;
    
    // Seleccionar un club aleatorio como respuesta correcta
    this.selectedClub = this.clubs[Math.floor(Math.random() * this.clubs.length)];

    // Generar dos opciones falsas
    let otherClubs = this.clubs
      .filter(club => club.club_name !== this.selectedClub.club_name) // Excluir el club correcto
      .sort(() => Math.random() - 0.5) // Mezclar
      .slice(0, 2) // Tomar dos clubes falsos
    
    // Mezclar las opciones y asignarlas
    this.options = [this.selectedClub.club_name, ...otherClubs.map(club => club.club_name)]
      .sort(() => Math.random() - 0.5); // Mezclar las opciones
  }

  checkAnswer(answer: string): void {
    this.gameOver = true;
    this.isCorrect = (answer === this.selectedClub.club_name);
    
    if (this.isCorrect) {
      this.streak++; // Incrementar la racha
    } else {
      this.lastScore = this.streak; // Guardar la última racha
      this.streak = 0; // Reiniciar la racha si la respuesta es incorrecta
    }
  }
  
  

}
