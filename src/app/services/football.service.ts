import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FootballService {
  private apiUrl = 'https://api.football-data.org/v4/matches';
  private apiKey = 'bcc5c22aca0745fdb83102f55548ee82'; 

  constructor(private http: HttpClient) {}

  getTodayMatches(): Observable<any> {
    const headers = new HttpHeaders({
      'X-Auth-Token': this.apiKey
    });

    return this.http.get<any>(this.apiUrl, { headers });
  }
}
