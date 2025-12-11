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
  selectedStadiums: any[] = [];
  distanceResult: string = '';

  // Propiedades para el modal de ruta
  showRouteModal: boolean = false;
  routeInfo: any = null;
  routeLine: any = null;

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
        html: `<i class="fas fa-futbol" style="color: ${iconColor}; font-size: 20px;"></i>`,
        className: 'custom-stadium-icon',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const marker = L.marker([stadium.lat, stadium.lon], { icon: stadiumIcon })
        .addTo(this.map)
        .bindPopup(`
          <b>${stadium.stadium_name}</b><br>
          ${stadium.team}<br>
          <button onclick="window.selectStadium('${stadium.stadium_name}')" style="margin-top: 5px; padding: 5px 10px; background: #000; color: #e1b661; border: none; cursor: pointer;">
            Select for distance
          </button>
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

  // Calcular distancia entre dos puntos usando fórmula de Haversine
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Redondear a 2 decimales
  }

  toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  selectStadiumForDistance(stadium: any): void {
    if (this.selectedStadiums.length < 2) {
      this.selectedStadiums.push(stadium);

      if (this.selectedStadiums.length === 2) {
        const distance = this.calculateDistance(
          this.selectedStadiums[0].lat, this.selectedStadiums[0].lon,
          this.selectedStadiums[1].lat, this.selectedStadiums[1].lon
        );
        this.distanceResult = `Distance between ${this.selectedStadiums[0].stadium_name} and ${this.selectedStadiums[1].stadium_name}: ${distance} km`;

        // Mostrar modal de ruta
        this.showRouteModal = true;
        this.calculateRoute();

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

  // Calcular y mostrar ruta entre dos estadios
  calculateRoute(): void {
    if (this.selectedStadiums.length !== 2 || !this.map) return;

    const stadium1 = this.selectedStadiums[0];
    const stadium2 = this.selectedStadiums[1];
    const distance = this.calculateDistance(stadium1.lat, stadium1.lon, stadium2.lat, stadium2.lon);

    // Calcular tiempo estimado (asumiendo velocidad promedio de avión de 800 km/h para distancias largas)
    // Para distancias cortas, usar velocidad de auto (100 km/h)
    const estimatedTime = distance > 1000 ?
      Math.round((distance / 800) * 60) : // tiempo en minutos para avión
      Math.round((distance / 100) * 60); // tiempo en minutos para auto

    this.routeInfo = {
      from: stadium1,
      to: stadium2,
      distance: distance,
      estimatedTime: estimatedTime,
      transportMode: distance > 1000 ? 'airplane' : 'car'
    };

    // Dibujar línea de ruta en el mapa
    this.drawRouteLine();
  }

  // Dibujar línea de ruta en el mapa
  drawRouteLine(): void {
    if (!this.map || !this.L || this.selectedStadiums.length !== 2) return;

    // Remover línea anterior si existe
    if (this.routeLine) {
      this.map.removeLayer(this.routeLine);
    }

    const stadium1 = this.selectedStadiums[0];
    const stadium2 = this.selectedStadiums[1];

    // Crear línea recta entre los dos puntos
    const latlngs = [
      [stadium1.lat, stadium1.lon],
      [stadium2.lat, stadium2.lon]
    ];

    this.routeLine = this.L.polyline(latlngs, {
      color: '#e1b661',
      weight: 3,
      opacity: 0.8,
      dashArray: '10, 10'
    }).addTo(this.map);

    // Ajustar vista para mostrar ambos puntos
    const bounds = this.L.latLngBounds(latlngs);
    this.map.fitBounds(bounds, { padding: [20, 20] });
  }

  // Cerrar modal de ruta
  closeRouteModal(): void {
    this.showRouteModal = false;
    this.routeInfo = null;

    // Remover línea de ruta
    if (this.routeLine && this.map) {
      this.map.removeLayer(this.routeLine);
      this.routeLine = null;
    }

    // Resetear vista del mapa
    this.resetMapView();
  }

  // Limpiar distancia y selección
  clearDistance(): void {
    this.selectedStadiums = [];
    this.distanceResult = '';
    this.showRouteModal = false;
    this.routeInfo = null;

    // Remover línea de ruta
    if (this.routeLine && this.map) {
      this.map.removeLayer(this.routeLine);
      this.routeLine = null;
    }

    // Resetear vista del mapa
    this.resetMapView();

    // Actualizar iconos
    this.updateStadiumIcons();
  }

}
