import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { SeoService } from './seo.service';

describe('SeoService', () => {
  let service: SeoService;
  let testDocument: Document;

  beforeEach(() => {
    testDocument = document.implementation.createHTMLDocument();
    TestBed.configureTestingModule({
      providers: [
        SeoService,
        Meta,
        Title,
        { provide: DOCUMENT, useValue: testDocument },
        { provide: Router, useValue: { url: '/game?ref=home#quiz' } },
      ],
    });

    service = TestBed.inject(SeoService);
  });

  it('uses the current route for canonical and social URLs without query or fragment', () => {
    service.updateSeo({ title: 'Guess the Club Quiz' });

    expect(testDocument.querySelector("link[rel='canonical']")?.getAttribute('href'))
      .toBe('https://football-clubs-worldwide.vercel.app/game');
    expect(testDocument.querySelector('meta[property="og:url"]')?.getAttribute('content'))
      .toBe('https://football-clubs-worldwide.vercel.app/game');
    expect(testDocument.querySelector('meta[name="twitter:url"]')?.getAttribute('content'))
      .toBe('https://football-clubs-worldwide.vercel.app/game');
  });

  it('clears metadata from the previous page and applies robots directives', () => {
    service.setStructuredData({ '@type': 'WebSite' });
    service.updateSeo({
      title: 'Article',
      type: 'article',
      author: 'Football Clubs Worldwide',
    });
    service.updateSeo({ title: 'Not Found', robots: 'noindex, nofollow' });

    expect(testDocument.getElementById('structured-data')).toBeNull();
    expect(testDocument.querySelector('meta[property="article:author"]')).toBeNull();
    expect(testDocument.querySelector('meta[name="robots"]')?.getAttribute('content'))
      .toBe('noindex, nofollow');
  });

  it('resolves social images and publishes accessible image descriptions', () => {
    service.updateSeo({
      image: '/assets/images/club.jpg',
      imageAlt: 'A football club badge',
    });

    expect(testDocument.querySelector('meta[property="og:image"]')?.getAttribute('content'))
      .toBe('https://football-clubs-worldwide.vercel.app/assets/images/club.jpg');
    expect(testDocument.querySelector('meta[name="twitter:image:alt"]')?.getAttribute('content'))
      .toBe('A football club badge');
  });
});
