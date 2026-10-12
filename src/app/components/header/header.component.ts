import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
    menuOpen = false;
    gamesOpen = false;

  constructor(private router: Router) {}

  isPlayGameActive(): boolean {
    const url = this.router.url;
    return url === '/game' || 
    url === '/club-search' || 
    url === '/hangman' || 
    url === '/pairs'  || 
    url === '/guess-country' || 
    url === ' /logo-shuffle' ||
    url === '/world-cup' ||
    url === '/champions-league' ||
    url === '/europa-league';
  }


toggleMenu(): void {
  this.menuOpen = !this.menuOpen;
  if (!this.menuOpen) this.gamesOpen = false;
}

toggleGames(event: Event): void {
  event.stopPropagation();
  this.gamesOpen = !this.gamesOpen;
}

closeMenus(): void {
  this.menuOpen = false;
  this.gamesOpen = false;
}

onNavClick(event: Event): void {
  if ((event.target as HTMLElement).closest('a')) this.closeMenus();
}

@HostListener('document:click')
onDocumentClick(): void {
  this.gamesOpen = false;
}

@HostListener('document:keydown.escape')
onEscape(): void {
  this.closeMenus();
}
}
