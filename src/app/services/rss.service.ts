import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, catchError, retry } from 'rxjs/operators';
import { of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class RssService {

  private proxy = 'https://api.allorigins.win/get?url=';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  loadFeed(url: string) {
    // Si no estamos en el navegador, retorna vacío
    if (!isPlatformBrowser(this.platformId)) {
      return of([]);
    }

    return this.http.get(this.proxy + encodeURIComponent(url), {
      responseType: 'json'
    }).pipe(
      retry(2),
      map((response: any) => this.parseXML(response.contents)),
      catchError(error => {
        console.warn(`Failed to load feed from ${url}:`, error.message);
        return of([]);
      })
    );
  }

  private parseXML(xml: string): any[] {
    // Doble verificación por si acaso
    if (!isPlatformBrowser(this.platformId)) {
      return [];
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'text/xml');
      const items = Array.from(doc.querySelectorAll('item'));

      return items.map(item => ({
        title: item.querySelector('title')?.textContent,
        link: item.querySelector('link')?.textContent,
        description: item.querySelector('description')?.textContent,
        pubDate: item.querySelector('pubDate')?.textContent,
      }));
    } catch (error) {
      console.error('Error parsing XML:', error);
      return [];
    }
  }
}