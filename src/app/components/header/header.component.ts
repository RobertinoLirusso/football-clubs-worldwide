import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  constructor(private router: Router) {}

  isPlayGameActive(): boolean {
    const url = this.router.url;
    return url === '/game' || url === '/club-search' || url === '/hangman' || url === '/pairs'  || url === '/guess-country' || url === ' /logo-shuffle';
  }
}
