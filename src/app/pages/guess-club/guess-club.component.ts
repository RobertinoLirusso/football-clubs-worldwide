import { Component, OnInit } from '@angular/core';
import { ClubService } from '../../services/club.service';
import confetti from 'canvas-confetti';


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
  timer: any;
  timeLeft: number = 20; // Segundos disponibles por pregunta 
  maxTime: number = 20;  // Para calcular la barra de progreso
  timeOut: boolean = false; // Saber si se terminó el tiempo


  constructor(private clubService: ClubService) {}

  ngOnInit(): void {
    this.getClubs();
  }

  getClubs(): void {
    this.clubService.getClubs().subscribe(data => {
      this.clubs = data;
    });
  }

startGame(): void {
    this.gameOver = false;
    this.timeOut = false;
    this.timeLeft = this.maxTime;


    this.totalCorrectAnswers = 0;
    
  // Seleccionar un club aleatorio como respuesta correcta
  this.selectedClub = this.clubs[Math.floor(Math.random() * this.clubs.length)];

  // Generar dos opciones falsas
  let otherClubs = this.clubs
    .filter(club => club.club_name !== this.selectedClub.club_name)
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);

  // Mezclar las opciones y asignarlas
  this.options = [this.selectedClub.club_name, ...otherClubs.map(club => club.club_name)]
    .sort(() => Math.random() - 0.5);

  this.startTimer();
}

startTimer(): void {
  this.timer = setInterval(() => {
    this.timeLeft--;
    if (this.timeLeft === 0) {
      clearInterval(this.timer);
      this.checkAnswer(null); // Tiempo agotado, respuesta incorrecta
    }
  }, 1000);
}

checkAnswer(answer: string | null): void {
  clearInterval(this.timer);
  this.gameOver = true;

  this.timeOut = (answer === null);
  this.isCorrect = (answer === this.selectedClub.club_name);

  if (this.isCorrect) {
    this.streak++;
    this.totalCorrectAnswers++;
    
    // 🎉 Lanzar confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  } else {
    this.lastScore = this.streak;
    this.streak = 0;
  }
}

// Nueva función para devolver el mensaje según el total
getPlayerLevel(): string {
  const score = this.lastScore; // usa la racha de la última partida
  if (score <= 10) {
    return 'You are a beginner 🟢';
  } else if (score <= 20 ) {
    return 'You are average ⚽⚽';
  } else if (score <= 30) {
    return 'You know football ⚽⚽⚽';
  } else {
    return 'You are an football expert 🔥🔥🔥';
  }
}


shareResult(): void {
  const text = `I just got a streak of ${this.streak} correct answers in Guess the Club! ⚽ Try to beat me!`;
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

  
  

}
