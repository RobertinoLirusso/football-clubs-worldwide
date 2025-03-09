import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClubService {

  private jsonUrl = '/assets/json/clubs.json';

  constructor(private http: HttpClient) { }

  getClubs(): Observable<any[]> {
    return this.http.get<any[]>(this.jsonUrl); 
  }
}
