import { Component, OnInit, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-national-teams',
  templateUrl: './national-teams.component.html',
  styleUrls: ['./national-teams.component.css']
})
export class NationalTeamsComponent implements OnInit {

  teams: any[] = [];
  showBackToTop: boolean = false;
  isFadingOut: boolean = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadNationalTeams();
  }

  loadNationalTeams(): void {
    this.http.get<any[]>('assets/json/national_teams.json').subscribe({
      next: (data) => {
        // Ordenar de A a Z por el campo "club_name"
        this.teams = data.sort((a, b) => a.club_name.localeCompare(b.club_name));
      },
      error: (err) => {
        console.error('Error loading national teams:', err);
      }
    });
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

  scrollToTop(): void {
    window.scroll({
      top: 0,
      behavior: 'smooth'
    });
  }
}
