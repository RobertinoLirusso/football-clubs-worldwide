import { Component, AfterViewInit, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ClubService } from '../../services/club.service';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements AfterViewInit, OnInit {

  private map: any;
  private L: any;

  stadiums: any[] = [];
  searchTerm: string = '';
  suggestions: any[] = [];
  selectedStadiums: any[] = [];
  distanceResult: string = '';
  distanceLine: any = null;

  // Configuración de vista global centrada en Europa
  // Aproximadamente centro de Europa central: [lat, lon] = [54, 15], zoom = 4
  private defaultCenter: [number, number] = [54, 15];
  private defaultZoom: number = 4;
  private stadiumZoom: number = 16; // zoom profundo para estadio

  constructor(
    private clubService: ClubService,
    private seoService: SeoService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.seoService.updateSeo({
      title: 'Football Stadiums Map',
      description: 'Explore football stadiums around the world with our interactive map. Find stadium locations, calculate distances between teams, and discover football venues globally.',
      keywords: 'football stadiums, interactive map, stadium locations, football venues, distance calculator, world football map',
      url: 'https://football-clubs-worldwide.com/map',
      type: 'website'
    });

    // Datos estructurados para el mapa interactivo
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Football Stadiums Interactive Map",
      "description": "Interactive map showing football stadiums worldwide with distance calculation features",
      "url": "https://football-clubs-worldwide.com/map",
      "applicationCategory": "SportsApplication",
      "operatingSystem": "Web Browser",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "featureList": [
        "Interactive world map",
        "Stadium location search",
        "Distance calculation between stadiums",
        "Football venue information"
      ]
    };

    this.seoService.setStructuredData(structuredData);
  }

  async ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
  
    const leaflet = await import('leaflet');
    this.L = (leaflet as any).default || leaflet;
  
    setTimeout(() => {
      this.initMap();
      this.loadStadiums();
    }, 300);

    // Hacer la función selectStadium global para que pueda ser llamada desde el popup
    (window as any).selectStadium = (stadiumName: string) => {
      const stadium = this.stadiums.find(s => s.stadium_name === stadiumName);
      if (stadium) {
        this.selectStadiumForDistance(stadium);
      }
    };
  }
  
  initMap() {
    if (!this.L || !this.L.map) {
      console.error('Leaflet no cargó correctamente', this.L);
      return;
    }
  
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

    this.addStadiumMarkers();
  }

  addStadiumMarkers(): void {
    const L = this.L;

    this.stadiums.forEach(stadium => {
      if (!stadium.lat || !stadium.lon) return;

      // Verificar si el estadio está seleccionado
      const isSelected = this.selectedStadiums.some(s => s.stadium_name === stadium.stadium_name);
      const isFirstSelected = this.selectedStadiums[0]?.stadium_name === stadium.stadium_name;
      const isSecondSelected = this.selectedStadiums[1]?.stadium_name === stadium.stadium_name;

      // Color del icono basado en estado de selección
      let iconColor = '#000000'; // Negro por defecto
      if (isFirstSelected) iconColor = '#ff4444'; // Rojo para primero seleccionado
      if (isSecondSelected) iconColor = '#44ff44'; // Verde para segundo seleccionado

      // Crear icono personalizado de estadio
      const stadiumIcon = L.divIcon({
        html: `<i class="fas fa-futbol" style="color: ${iconColor}; font-size: 16px;"></i>`,
        className: 'custom-stadium-icon',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      const marker = L.marker([stadium.lat, stadium.lon], { icon: stadiumIcon })
        .addTo(this.map)
        .bindPopup(`
          <div style="text-align: center; cursor: pointer;" onclick="window.selectStadium('${stadium.stadium_name}')">
            <b>${stadium.stadium_name}</b><br>
            ${stadium.team}<br>
            <span style="color: #e1b661; font-size: 12px; margin-top: 5px; display: inline-block;">
              Select stadium
            </span>
          </div>
        `);

      // Mostrar popup al pasar el mouse sobre el marker
      marker.on('mouseover', () => {
        marker.openPopup();
      });

      // Ocultar popup al quitar el mouse del marker
      marker.on('mouseout', () => {
        marker.closePopup();
      });

      // Hacer que el clic en el marker también seleccione para distancia
      marker.on('click', () => {
        this.selectStadiumForDistance(stadium);
      });
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

  clearSearch(): void {
    this.searchTerm = '';
    this.suggestions = [];
    this.resetMapView();
  }

  // Calcular distancia simulando rutas reales (como Google Maps)
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Distancia geodésica base usando fórmula de Haversine
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const geodesicDistance = R * c;

    // Factores para simular rutas reales (como Google Maps)
    let routeMultiplier = 1.0;

    // Si están en el mismo continente, aplicar factor de carreteras
    if (this.areSameContinent(lat1, lon1, lat2, lon2)) {
      // Para distancias cortas (< 500km), las rutas son más eficientes
      if (geodesicDistance < 500) {
        routeMultiplier = 1.15; // Carreteras locales, autopistas
      } else if (geodesicDistance < 2000) {
        routeMultiplier = 1.25; // Carreteras nacionales, algunas desviaciones
      } else {
        routeMultiplier = 1.35; // Rutas interestatales, evitando obstáculos
      }
    } else {
      // Rutas intercontinentales
      routeMultiplier = 1.45; // Factores como océanos, aduanas, rutas comerciales
    }

    // Ajuste adicional basado en coordenadas (evitando rutas problemáticas)
    const latitudeAdjustment = Math.abs(lat1 - lat2) > 30 ? 1.1 : 1.0;
    const longitudeAdjustment = Math.abs(lon1 - lon2) > 30 ? 1.05 : 1.0;

    const finalMultiplier = routeMultiplier * latitudeAdjustment * longitudeAdjustment;
    const routeDistance = geodesicDistance * finalMultiplier;

    return Math.round(routeDistance * 100) / 100; // Redondear a 2 decimales
  }

  // Determinar si dos puntos están en el mismo continente (aproximado)
  areSameContinent(lat1: number, lon1: number, lat2: number, lon2: number): boolean {
    // Simplificación: dividir por hemisferios y continentes principales
    const getContinent = (lat: number, lon: number) => {
      // América del Norte
      if (lat > 15 && lat < 75 && lon > -170 && lon < -50) return 'NA';
      // América del Sur
      if (lat > -60 && lat < 15 && lon > -90 && lon < -30) return 'SA';
      // Europa
      if (lat > 35 && lat < 75 && lon > -15 && lon < 70) return 'EU';
      // Asia
      if (lat > 0 && lat < 80 && lon > 70 && lon < 180) return 'AS';
      // África
      if (lat > -40 && lat < 40 && lon > -20 && lon < 55) return 'AF';
      // Oceanía
      if (lat > -50 && lat < 0 && lon > 110 && lon < 180) return 'OC';
      return 'UNK'; // Desconocido
    };

    return getContinent(lat1, lon1) === getContinent(lat2, lon2);
  }

  toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  selectStadiumForDistance(stadium: any): void {
    if (this.selectedStadiums.length < 2) {
      this.selectedStadiums.push(stadium);

      if (this.selectedStadiums.length === 2) {
        const distanceKm = this.calculateDistance(
          this.selectedStadiums[0].lat, this.selectedStadiums[0].lon,
          this.selectedStadiums[1].lat, this.selectedStadiums[1].lon
        );
        const distanceMiles = Math.round(distanceKm * 0.621371 * 100) / 100; // Convertir km a millas

        this.distanceResult = `Distance between ${this.selectedStadiums[0].stadium_name} and ${this.selectedStadiums[1].stadium_name}: ${distanceKm} km (${distanceMiles} miles)`;

        // Dibujar línea entre los estadios
        this.drawDistanceLine();

        this.updateStadiumIcons();
      } else {
        this.updateStadiumIcons();
      }
    }
  }

  updateStadiumIcons(): void {
    // Clear existing markers and re-add them with updated selection state
    if (this.map) {
      this.map.eachLayer((layer: any) => {
        if (layer instanceof this.L.Marker) {
          this.map.removeLayer(layer);
        }
      });
      this.addStadiumMarkers();
    }
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

  // Dibujar línea de distancia entre estadios seleccionados
  drawDistanceLine(): void {
    if (!this.map || !this.L || this.selectedStadiums.length !== 2) return;

    // Remover línea anterior si existe
    if (this.distanceLine) {
      this.map.removeLayer(this.distanceLine);
    }

    const stadium1 = this.selectedStadiums[0];
    const stadium2 = this.selectedStadiums[1];

    // Crear línea punteada entre los dos puntos
    const latlngs = [
      [stadium1.lat, stadium1.lon],
      [stadium2.lat, stadium2.lon]
    ];

    this.distanceLine = this.L.polyline(latlngs, {
      color: '#f39c12',
      weight: 2,
      opacity: 0.8,
      dashArray: '10, 10'
    }).addTo(this.map);

    // Ajustar vista para mostrar ambos puntos
    const bounds = this.L.latLngBounds(latlngs);
    this.map.fitBounds(bounds, { padding: [50, 50] });
  }

  // Limpiar distancia y selección
  clearDistance(): void {
    this.selectedStadiums = [];
    this.distanceResult = '';

    // Remover línea de distancia
    if (this.distanceLine && this.map) {
      this.map.removeLayer(this.distanceLine);
      this.distanceLine = null;
    }

    // Resetear vista del mapa
    this.resetMapView();

    // Actualizar iconos
    this.updateStadiumIcons();
  }

}
