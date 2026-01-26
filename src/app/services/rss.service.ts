import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class RssService {

  private proxy = 'https://api.allorigins.win/raw?url=';

  constructor(private http: HttpClient) {}

  loadFeed(url: string) {
    return this.http.get(this.proxy + encodeURIComponent(url), {
      responseType: 'text'
    }).pipe(
      map(xml => this.parseXML(xml))
    );
  }

  private parseXML(xml: string): any[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    const items = Array.from(doc.querySelectorAll('item'));

    return items.map(item => ({
      title: item.querySelector('title')?.textContent,
      link: item.querySelector('link')?.textContent,
      description: item.querySelector('description')?.textContent,
      pubDate: item.querySelector('pubDate')?.textContent,
    }));
  }
}
