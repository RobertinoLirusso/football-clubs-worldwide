import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface LeaderboardEntry {
  player_name: string;
  score: number;
}

@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private privateUrl = 'https://dreamlo.com/lb/2BQlJlZlbU2pG0F4CqptAAoJc41frFeEWPRLb4Sposug';
  private publicUrl = 'https://dreamlo.com/lb/6a92143c8f40bb1350906cdc/json';

  constructor(private http: HttpClient) {}

  submitScore(playerName: string, score: number): Observable<any> {
    const encodedName = encodeURIComponent(playerName);
    return this.http.get(`${this.privateUrl}/add/${encodedName}/${score}`, { responseType: 'text' });
  }

  getTop(): Observable<LeaderboardEntry[]> {
    return this.http.get<any>(this.publicUrl).pipe(
      map(res => {
        const entries = res?.dreamlo?.leaderboard?.entry;
        if (!entries) return [];
        const list = Array.isArray(entries) ? entries : [entries];
        return list.map((e: any) => ({
          player_name: e.name,
          score: Number(e.score),
        }));
      })
    );
  }
}