import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClubService {

  private clubsUrl = '/assets/json/clubs.json';
  private nationalTeamsUrl = '/assets/json/national_teams.json';

  constructor(private http: HttpClient) { }

  getClubs(): Observable<any[]> {
    return this.http.get<any[]>(this.clubsUrl);
  }

  getNationalTeams(): Observable<any[]> {
    return this.http.get<any[]>(this.nationalTeamsUrl);
  }
}