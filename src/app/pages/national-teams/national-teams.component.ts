import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-national-teams',
  templateUrl: './national-teams.component.html',
  styleUrls: ['./national-teams.component.css']
})
export class NationalTeamsComponent implements OnInit {

  teams: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadNationalTeams();
  }

  loadNationalTeams(): void {
    this.http.get<any[]>('assets/json/national_teams.json').subscribe({
      next: (data) => {
        this.teams = this.shuffleArray(data);
      },
      error: (err) => {
        console.error('Error loading national teams:', err);
      }
    });
  }

  shuffleArray(array: any[]): any[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
