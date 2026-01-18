import { Component, OnInit } from '@angular/core';
import { ClubService } from '../../services/club.service';
import { SeoService } from '../../services/seo.service';
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
  lives: number = 3;
  maxLives: number = 3;
  showExtraLifeMessage: boolean = false;
  maxHelpTime: number = 20;
  timeHelpUsed: boolean = false;
  blurHelpUsed: boolean = false;
  blurHelpActive: boolean = false; 
  consecutiveCorrect: number = 0;
  extraLifeGranted: boolean = false;


  constructor(private clubService: ClubService, private seoService: SeoService) {}

  ngOnInit(): void {
    this.getClubs();
    this.setupSeo();
  }

  private setupSeo(): void {
    this.seoService.updateSeo({
      title: 'Guess the Football Club - Football Quiz Game',
      description: 'Test your football knowledge with our interactive quiz game! Guess football clubs from around the world. Challenge yourself and see how many you can get right in a row.',
      keywords: 'football quiz, guess the club, football game, soccer quiz, football knowledge test, interactive game',
      url: 'https://football-clubs-worldwide.com/guess-club',
      type: 'website'
    });

    // Datos estructurados para el juego
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Guess the Football Club Quiz",
      "description": "Interactive football quiz game to test your knowledge of football clubs worldwide",
      "url": "https://football-clubs-worldwide.com/guess-club",
      "applicationCategory": "GameApplication",
      "operatingSystem": "Web Browser",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "featureList": [
        "Football club identification quiz",
        "Timed questions",
        "Streak tracking",
        "Social sharing"
      ],
      "genre": "Sports Quiz"
    };

    this.seoService.setStructuredData(structuredData);
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
  
    // Reset SOLO cuando se inicia una nueva partida
    if (!this.selectedClub || this.lives === 0) {
      this.lives = this.maxLives;
      this.streak = 0;
      this.lastScore = 0;
      this.consecutiveCorrect = 0;
      this.extraLifeGranted = false;
      this.timeHelpUsed = false;
      this.blurHelpUsed = false;
    }
  
// Definir cantidad de opciones según la racha
const optionsCount = this.streak >= 15 ? 4 : 3;

// Seleccionar club correcto
this.selectedClub = this.clubs[Math.floor(Math.random() * this.clubs.length)];

// Obtener opciones incorrectas
let otherClubs = this.clubs
  .filter(club => club.club_name !== this.selectedClub.club_name)
  .sort(() => Math.random() - 0.5)
  .slice(0, optionsCount - 1);

// Armar opciones finales
this.options = [
  this.selectedClub.club_name,
  ...otherClubs.map(c => c.club_name)
].sort(() => Math.random() - 0.5);
  
    this.startTimer();
    this.blurHelpActive = false;


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

  this.timeOut = (answer === null);
  this.isCorrect = (answer === this.selectedClub.club_name);

  if (this.isCorrect) {
    this.streak++;
    this.totalCorrectAnswers++;
    this.consecutiveCorrect++;
  
    // 🎁 Vida extra SOLO si fueron 10 seguidas SIN fallar
    if (
      this.consecutiveCorrect === 10 &&
      !this.extraLifeGranted &&
      this.lives < this.maxLives
    ) {
      this.lives++;
      this.extraLifeGranted = true;
      this.showExtraLifeMessage = true;
  
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.4 }
      });
  
      setTimeout(() => {
        this.showExtraLifeMessage = false;
      }, 5000);
    } else {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  
    this.gameOver = true;
  } else {
    this.lives--;
    this.consecutiveCorrect = 0; 
    this.extraLifeGranted = false;
  
    if (this.lives === 0) {
      this.lastScore = this.streak;
      this.streak = 0;
    }
  
    this.gameOver = true;
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

getBlurClass(): string {
  // Si se usó ayuda de blur → siempre blur leve
  if (this.blurHelpActive) {
    return 'blur-light';
  }

  if (this.streak >= 5) {
    return 'blur-hard';
  } else if (this.streak >= 3) {
    return 'blur-medium';
  } else {
    return 'blur-light';
  }
}



shareResult(): void {
  const text = `I just got a streak of ${this.lastScore} correct answers in Guess the Club! ⚽🔥 Can you beat my score?\nPlay now: https://football-clubs-worldwide.vercel.app/game`;
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

useTimeHelp(): void {
  if (this.timeHelpUsed || this.gameOver) return;

  this.timeHelpUsed = true;
  this.timeLeft = this.maxHelpTime;
}

useBlurHelp(): void {
  if (this.blurHelpUsed || this.gameOver) return;

  this.blurHelpUsed = true;    // bloquea el botón
  this.blurHelpActive = true; // reduce blur SOLO ahora
}

}
