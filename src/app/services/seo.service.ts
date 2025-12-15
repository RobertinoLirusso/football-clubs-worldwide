import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

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
  private defaultTitle = 'Football Clubs Worldwide - Discover Football Teams Around the Globe';
  private defaultDescription = 'Explore thousands of football clubs from around the world. Find information about teams, stadiums, national teams, and interactive maps of football worldwide.';
  private defaultKeywords = 'football, soccer, clubs, teams, stadiums, national teams, world football, leagues';
  private baseUrl = 'https://football-clubs-worldwide.vercel.app/'; // Cambia esto por tu dominio real

  constructor(private meta: Meta, private title: Title) {}

  updateSeo(data: SeoData) {
    // Actualizar título
    const title = data.title ? `${data.title} | Football Clubs Worldwide` : this.defaultTitle;
    this.title.setTitle(title);

    // Actualizar meta description
    const description = data.description || this.defaultDescription;
    this.meta.updateTag({ name: 'description', content: description });

    // Actualizar keywords
    const keywords = data.keywords || this.defaultKeywords;
    this.meta.updateTag({ name: 'keywords', content: keywords });

    // Open Graph tags
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:image', content: data.image || `${this.baseUrl}/assets/images/og-image.jpg` });
    this.meta.updateTag({ property: 'og:url', content: data.url || this.baseUrl });
    this.meta.updateTag({ property: 'og:type', content: data.type || 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: 'Football Clubs Worldwide' });

    // Twitter Card tags
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: data.image || `${this.baseUrl}/assets/images/twitter-image.jpg` });

    // Article specific tags (si es un artículo)
    if (data.type === 'article') {
      if (data.author) {
        this.meta.updateTag({ property: 'article:author', content: data.author });
      }
      if (data.published) {
        this.meta.updateTag({ property: 'article:published_time', content: data.published });
      }
      if (data.modified) {
        this.meta.updateTag({ property: 'article:modified_time', content: data.modified });
      }
    }

    // Canonical URL
    const canonicalUrl = data.url || this.baseUrl;
    this.meta.updateTag({ rel: 'canonical', href: canonicalUrl });
  }

  setStructuredData(data: any) {
    // Remover datos estructurados anteriores
    this.removeStructuredData();

    // Agregar nuevos datos estructurados
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    script.id = 'structured-data';
    document.head.appendChild(script);
  }

  removeStructuredData() {
    const existingScript = document.getElementById('structured-data');
    if (existingScript) {
      existingScript.remove();
    }
  }

  setDefaultSeo() {
    this.updateSeo({});
  }

  setHomePageSeo() {
    this.updateSeo({
      title: 'Home',
      description: 'Welcome to Football Clubs Worldwide. Explore football teams, stadiums, and national teams from around the globe with our interactive maps and comprehensive database.',
      keywords: 'football clubs worldwide, soccer teams, stadiums, national teams, football database, interactive maps',
      url: this.baseUrl,
      type: 'website'
    });

    // Datos estructurados para la página principal
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Football Clubs Worldwide",
      "description": "Comprehensive database of football clubs, stadiums, and national teams from around the world",
      "url": this.baseUrl,
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${this.baseUrl}/search?q={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Football Clubs Worldwide",
        "url": this.baseUrl
      }
    };

    this.setStructuredData(structuredData);
  }

  setClubPageSeo(clubName: string, country: string, stadium?: string) {
    this.updateSeo({
      title: `${clubName} - ${country} Football Club`,
      description: `Learn about ${clubName}, a football club from ${country}. ${stadium ? `Home stadium: ${stadium}. ` : ''}Find information about players, matches, and club history.`,
      keywords: `${clubName}, ${country} football, soccer club, ${stadium}, football teams`,
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
}