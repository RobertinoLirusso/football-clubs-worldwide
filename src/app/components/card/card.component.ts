import { Component, OnInit, HostListener } from '@angular/core';
import { ClubService } from '../../services/club.service';
import { GeminiService } from '../../services/gemini.service';
import { COUNTRY_FLAG_MAP } from '../../utils/country-flags';

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

  // Chatbot variables
  isChatbotOpen: boolean = false;
  chatMessages: { text: string; isUser: boolean; timestamp: Date }[] = [];
  isChatLoading: boolean = false;
  selectedClubForChat: any = null;

  // Predefined prompts
  chatPrompts: string[] = [
    "Tell me about the club's history.",
    "What is this club's stadium?",
    "Who are the legends of this club?",
    "Tell me about this club's fanbase and supporters.",
    "Tell me interesting facts and curiosities about this club."
  ];

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
    'Palmeiras',
    'Bayern Munich',
    'Manchester United',
    'Newcastle United',
    'Juventus',
    'AS Roma',
    'Napoli',
    'Bayer 04 Leverkusen',
  ];


  constructor(
  private clubService: ClubService,
  private geminiService: GeminiService
  ) {}

  ngOnInit(): void {
    this.getClubs();
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

clearCountryFilterModal(): void {
    this.countrySearch = '';
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

  // Filtrar por país seleccionado
  if (this.selectedCountry) {
    filtered = filtered.filter(club => {
      const parts = club.city_country.split(',');
      const country = parts.length > 1 ? parts[1].trim().toLowerCase() : '';
      return country === this.selectedCountry.toLowerCase();
    });
  }

  // Filtrar por club_name o ciudad
  if (this.searchTerm) {
    const searchTermLower = this.searchTerm.toLowerCase();
    filtered = filtered.filter(club => {
      const parts = club.city_country.split(',');
      const city = parts[0].trim().toLowerCase(); // solo ciudad

      return (
        club.club_name.toLowerCase().includes(searchTermLower) ||
        city.includes(searchTermLower) // también busca en ciudad
      );
    });
  } else if (!this.selectedCountry) {
    const highlighted = filtered.filter(club =>
      this.highlightedClubs.includes(club.club_name)
    );
    const rest = filtered.filter(club =>
      !this.highlightedClubs.includes(club.club_name)
    );
    filtered = [...highlighted, ...rest];
  }

  // Ordenamiento
  if (this.sortOption === 'az') {
    filtered = [...filtered].sort((a, b) =>
      a.club_name.localeCompare(b.club_name)
    );
  } else if (this.sortOption === 'za') {
    filtered = [...filtered].sort((a, b) =>
      b.club_name.localeCompare(a.club_name)
    );
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

  openMatchesModal(): void {
    this.isMatchesModalOpen = true;
  }

  closeMatchesModal(): void {
    this.isMatchesModalOpen = false;
  }

  
  getYouTubeUrl(club: any): string {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(club.club_name)}`;
  }

  // Chatbot methods
  openChatbot(club: any, event: Event): void {
    event.stopPropagation(); // Prevent card click
    this.selectedClubForChat = club;
    this.isChatbotOpen = true;
    this.chatMessages = [];
  }

  closeChatbot(): void {
    this.isChatbotOpen = false;
    this.selectedClubForChat = null;
  }

  async sendPrompt(promptIndex: number): Promise<void> {
    if (!this.selectedClubForChat) return;

    const selectedPrompt = this.chatPrompts[promptIndex];

    // Add user prompt as message
    this.chatMessages.push({
      text: selectedPrompt,
      isUser: true,
      timestamp: new Date()
    });

    this.isChatLoading = true;

    try {
      // Create context-aware prompt
      const contextPrompt = `You are a football expert. The user is asking about the club "${this.selectedClubForChat.club_name}" from ${this.selectedClubForChat.city_country}.

User's question: "${selectedPrompt}"

Provide an informative, accurate and friendly response in English. Keep responses concise but complete.`;

      const response = await this.geminiService.generateResponse(contextPrompt);

      this.chatMessages.push({
        text: response,
        isUser: false,
        timestamp: new Date()
      });
    } catch (error) {
      this.chatMessages.push({
        text: 'Sorry, an error occurred while processing your question. Please try again.',
        isUser: false,
        timestamp: new Date()
      });
    }

    this.isChatLoading = false;

    // Auto-scroll to bottom
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }



}
