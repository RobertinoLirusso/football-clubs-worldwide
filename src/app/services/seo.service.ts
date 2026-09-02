import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

export interface SeoData {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  author?: string;
  published?: string;
  modified?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {

  private defaultTitle =
    'Football Clubs Worldwide - Discover Football Teams Around the Globe';

  private defaultDescription =
    'Explore thousands of football clubs from around the world. Find information about teams, stadiums, national teams, and interactive maps of football worldwide.';

  private defaultKeywords =
    'football, soccer, clubs, teams, stadiums, national teams, world football, leagues';

  private baseUrl = 'https://football-clubs-worldwide.vercel.app';

  constructor(
    private meta: Meta,
    private title: Title,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  /* ===========================
     SEO BASE
  ============================ */

  updateSeo(data: SeoData) {
    const title =
      data.title ? `${data.title} | Football Clubs Worldwide` : this.defaultTitle;

    this.title.setTitle(title);

    const description = data.description || this.defaultDescription;
    const keywords = data.keywords || this.defaultKeywords;

    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'keywords', content: keywords });

    /* Open Graph */
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({
      property: 'og:image',
      content: data.image || `${this.baseUrl}/assets/images/og-image.jpg`
    });
    this.meta.updateTag({
      property: 'og:url',
      content: data.url || this.baseUrl
    });
    this.meta.updateTag({
      property: 'og:type',
      content: data.type || 'website'
    });
    this.meta.updateTag({
      property: 'og:site_name',
      content: 'Football Clubs Worldwide'
    });

    /* Twitter */
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({
      name: 'twitter:description',
      content: description
    });
    this.meta.updateTag({
      name: 'twitter:image',
      content: data.image || `${this.baseUrl}/assets/images/twitter-image.jpg`
    });

    /* Article */
    if (data.type === 'article') {
      if (data.author) {
        this.meta.updateTag({
          property: 'article:author',
          content: data.author
        });
      }
      if (data.published) {
        this.meta.updateTag({
          property: 'article:published_time',
          content: data.published
        });
      }
      if (data.modified) {
        this.meta.updateTag({
          property: 'article:modified_time',
          content: data.modified
        });
      }
    }

    this.setCanonicalUrl(data.url || this.baseUrl);
  }

  /* ===========================
     CANONICAL
  ============================ */

  private setCanonicalUrl(url: string) {
    if (!isPlatformBrowser(this.platformId)) return;

    let link = this.document.querySelector("link[rel='canonical']");
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  /* ===========================
     STRUCTURED DATA (JSON-LD)
  ============================ */

  setStructuredData(data: any) {
    if (!isPlatformBrowser(this.platformId)) return;

    this.removeStructuredData();

    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    script.id = 'structured-data';

    this.document.head.appendChild(script);
  }

  removeStructuredData() {
    if (!isPlatformBrowser(this.platformId)) return;

    const existingScript =
      this.document.getElementById('structured-data');

    if (existingScript) {
      existingScript.remove();
    }
  }

  /* ===========================
     PRESETS
  ============================ */

  setDefaultSeo() {
    this.updateSeo({});
  }

  setHomePageSeo() {
    this.updateSeo({
      title: 'Home',
      description:
        'Welcome to Football Clubs Worldwide. Explore football teams, stadiums, and national teams from around the globe with our interactive maps and comprehensive database.',
      keywords:
        'football clubs worldwide, soccer teams, stadiums, national teams, football database, interactive maps',
      url: this.baseUrl,
      type: 'website'
    });

    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Football Clubs Worldwide',
      description:
        'Comprehensive database of football clubs, stadiums, and national teams from around the world',
      url: this.baseUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${this.baseUrl}/search?q={search_term_string}`
        },
        'query-input': 'required name=search_term_string'
      },
      publisher: {
        '@type': 'Organization',
        name: 'Football Clubs Worldwide',
        url: this.baseUrl
      }
    };

    this.setStructuredData(structuredData);
  }

  setClubPageSeo(clubName: string, country: string, stadium?: string) {
    this.updateSeo({
      title: `${clubName} - ${country} Football Club`,
      description: `Learn about ${clubName}, a football club from ${country}. ${
        stadium ? `Home stadium: ${stadium}. ` : ''
      }Find information about players, matches, and club history.`,
      keywords: `${clubName}, ${country} football, soccer club, ${stadium}`,
      type: 'article'
    });
  }


  setNationalTeamPageSeo(country: string) {
    this.updateSeo({
      title: `${country} National Football Team`,
      description: `Complete information about the ${country} national football team. Players, coaches, match results, and team statistics.`,
      keywords: `${country} national team, football, soccer, national squad`,
      type: 'article'
    });
  }

  setNationalTeamsPageSeo() {
    this.updateSeo({
      title: 'National Teams',
      description:
        'Browse national football teams from countries around the world. Explore squads, stadiums, and international football history.',
      keywords:
        'national football teams, international soccer, country teams, national squads',
      url: `${this.baseUrl}/national-teams`,
      type: 'website'
    });
  }

  setGuessClubGameSeo() {
    this.updateSeo({
      title: 'Guess the Club Game',
      description:
        'Test your football knowledge with our Guess the Club game. Identify clubs from around the world and challenge yourself with each round.',
      keywords:
        'guess the club, football quiz, soccer game, club logo quiz',
      url: `${this.baseUrl}/game`,
      type: 'website'
    });
  }

  setMapPageSeo() {
    this.updateSeo({
      title: 'Interactive Football Map',
      description:
        'Explore an interactive map of football clubs and stadiums from around the world. Discover teams by country and region.',
      keywords:
        'football map, interactive soccer map, club locations, stadium map',
      url: `${this.baseUrl}/map`,
      type: 'website'
    });
  }

  setClubSearchPageSeo() {
    this.updateSeo({
      title: 'Club Search',
      description:
        'Search thousands of football clubs worldwide by name, country, or league. Find detailed club information instantly.',
      keywords:
        'club search, find football club, soccer team search, club database',
      url: `${this.baseUrl}/club-search`,
      type: 'website'
    });
  }

  setHangmanPageSeo() {
    this.updateSeo({
      title: 'Football Hangman',
      description:
        'Play football-themed hangman and guess club and player names letter by letter in this fun word game.',
      keywords:
        'football hangman, soccer word game, guess the name, football games',
      url: `${this.baseUrl}/hangman`,
      type: 'website'
    });
  }

  setPairsPageSeo() {
    this.updateSeo({
      title: 'Football Pairs Memory Game',
      description:
        'Match pairs of football club logos in this memory game. Sharpen your recall while testing your knowledge of clubs worldwide.',
      keywords:
        'football pairs game, memory game, match logos, soccer memory challenge',
      url: `${this.baseUrl}/pairs`,
      type: 'website'
    });
  }

  setGuessCountryPageSeo() {
    this.updateSeo({
      title: 'Guess the Country',
      description:
        'Guess which country a football club or national team belongs to in this geography-meets-football challenge.',
      keywords:
        'guess the country, football geography game, soccer trivia, country quiz',
      url: `${this.baseUrl}/guess-country`,
      type: 'website'
    });
  }

  setLogoShufflePageSeo() {
    this.updateSeo({
      title: 'Logo Shuffle',
      description:
        'Unscramble shuffled football club logos and see how fast you can identify the correct club in this fast-paced game.',
      keywords:
        'logo shuffle, football logo game, guess the badge, soccer logo quiz',
      url: `${this.baseUrl}/logo-shuffle`,
      type: 'website'
    });
  }

  setWorldCupPageSeo() {
    this.updateSeo({
      title: 'World Cup',
      description:
        'Explore World Cup history, teams, and tournaments. Dive into stats and facts from football\'s biggest international competition.',
      keywords:
        'world cup, fifa world cup, international football, world cup history',
      url: `${this.baseUrl}/world-cup`,
      type: 'website'
    });
  }

  setChampionsLeaguePageSeo() {
    this.updateSeo({
      title: 'Champions League',
      description:
        'Explore UEFA Champions League clubs, history, and tournament information. Follow Europe\'s premier club competition.',
      keywords:
        'champions league, uefa champions league, european football, ucl clubs',
      url: `${this.baseUrl}/champions-league`,
      type: 'website'
    });
  }
}
