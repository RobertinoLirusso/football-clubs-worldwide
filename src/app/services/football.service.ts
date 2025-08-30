import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FootballService {
  private apiUrl = 'https://api.football-data.org/v4/matches';
  private apiKey = environment.footballApiKey; 

  constructor(private http: HttpClient) {}

  getTodayMatches(): Observable<any> {
    const headers = new HttpHeaders({
      'X-Auth-Token': this.apiKey
    });

    return this.http.get<any>(this.apiUrl, { headers });
  }
}
