import { Component, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ClubService } from '../../services/club.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements AfterViewInit {

  private map: any;
  private L: any;

  stadiums: any[] = [];
  searchTerm: string = '';
  suggestions: any[] = [];

  // Configuración de vista global
  private defaultCenter: [number, number] = [20, 0];
  private defaultZoom: number = 2;
  private stadiumZoom: number = 16; // zoom profundo para estadio

  constructor(
    private clubService: ClubService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  async ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
  
    const leaflet = await import('leaflet');
    this.L = leaflet;
  
    setTimeout(() => {
      this.initMap();
      this.loadStadiums();
    }, 300);
  }
  
  initMap() {
    const L = this.L;
  
    const mapDiv = document.getElementById('stadium-map');
    if (!mapDiv) return;
  
    this.map = L.map(mapDiv, {
      center: this.defaultCenter,
      zoom: this.defaultZoom
    });
  
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18
    }).addTo(this.map);
  
    setTimeout(() => {
      this.map.invalidateSize();
    }, 200);
  }
  

  loadStadiums() {
    this.clubService.getStadiums().subscribe(stadiums => {
      this.stadiums = stadiums;
      this.addMarkers();
    });
  }

  addMarkers() {
    if (!this.map || !this.L) return;
  
    const L = this.L;
  
    this.stadiums.forEach(stadium => {
      if (!stadium.lat || !stadium.lon) return;
  
      L.marker([stadium.lat, stadium.lon])
        .addTo(this.map)
        .bindPopup(`
          <b>${stadium.stadium_name}</b><br>
          ${stadium.team}<br>
        `);
    });
  }
  

  /* AUTOCOMPLETE */
  updateSuggestions() {
    const term = this.searchTerm.trim().toLowerCase();

    // Si se borra el input → vuelve a vista global
    if (!term) {
      this.suggestions = [];
      this.resetMapView();
      return;
    }

    if (term.length < 2) {
      this.suggestions = [];
      return;
    }

    this.suggestions = this.stadiums.filter(s =>
      s.stadium_name.toLowerCase().includes(term)
    );
  }

  selectSuggestion(stadium: any) {
    this.searchTerm = stadium.stadium_name;
    this.suggestions = [];
    this.goToStadium(stadium);
  }

  /* COINCIDENCIA EXACTA */
  onExactSearch() {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.resetMapView();
      return;
    }

    const exact = this.stadiums.find(s =>
      s.stadium_name.toLowerCase() === term
    );

    if (exact) {
      this.suggestions = [];
      this.goToStadium(exact);
    }
  }

  goToStadium(stadium: any) {
    if (!this.map) return;
  
    this.map.flyTo([stadium.lat, stadium.lon], this.stadiumZoom, { animate: true, duration: 1.2 });
  
    this.L.popup()
      .setLatLng([stadium.lat, stadium.lon])
      .setContent(`
        <b>${stadium.stadium_name}</b><br>
        ${stadium.team}<br>
      `)
      .openOn(this.map);
  }
  
  resetMapView() {
    if (!this.map) return;
  
    this.map.flyTo(this.defaultCenter, this.defaultZoom, { animate: true, duration: 1.2 });
  }
  
}
