import { Component, HostListener, Inject, OnDestroy, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit, OnDestroy {

  mapLoaded = false;
  isFullscreen = false;

  constructor(
    private seoService: SeoService,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    this.seoService.updateSeo({
      title: 'Football Stadiums Map',
      description: 'Explore football stadiums around the world using our Google Maps interactive view.',
      keywords: 'football stadiums, google maps, stadium locations, football venues',
      url: 'https://football-clubs-worldwide.vercel.app/map',
      type: 'website'
    });

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Football Stadiums Map",
      "description": "Google Maps view showing football stadiums around the world",
      "url": "https://football-clubs-worldwide.vercel.app/map",
      "applicationCategory": "SportsApplication",
      "operatingSystem": "Web Browser"
    };

    this.seoService.setStructuredData(structuredData);
    this.seoService.setMapPageSeo();
  }

  toggleFullscreen(): void {
    this.isFullscreen = !this.isFullscreen;
    this.setBodyScroll(!this.isFullscreen);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isFullscreen) this.toggleFullscreen();
  }

  ngOnDestroy(): void {
    this.setBodyScroll(true);
  }

  private setBodyScroll(enabled: boolean): void {
    const body = this.document?.body;
    if (body) body.style.overflow = enabled ? '' : 'hidden';
  }
}