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
        // Ordenar de A a Z por el campo "name"
        this.teams = data.sort((a, b) => a.name.localeCompare(b.club_name));
      },
      error: (err) => {
        console.error('Error loading national teams:', err);
      }
    });
  }
}
