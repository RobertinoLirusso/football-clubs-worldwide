import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {

  constructor(private seoService: SeoService) {}

  ngOnInit(): void {
    this.seoService.updateSeo({
      title: 'Football Stadiums Map',
      description: 'Explore football stadiums around the world using our Google Maps interactive view.',
      keywords: 'football stadiums, google maps, stadium locations, football venues',
      url: 'https://football-clubs-worldwide.com/map',
      type: 'website'
    });

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Football Stadiums Map",
      "description": "Google Maps view showing football stadiums around the world",
      "url": "https://football-clubs-worldwide.com/map",
      "applicationCategory": "SportsApplication",
      "operatingSystem": "Web Browser"
    };

    this.seoService.setStructuredData(structuredData);
  }

}
