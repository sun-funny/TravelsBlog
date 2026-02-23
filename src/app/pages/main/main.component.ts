import { Component, OnDestroy, OnInit } from '@angular/core'
import { Router } from '@angular/router';
import { Observable, Subscription } from "rxjs";
import { ITravel } from 'src/app/models/travel';
import { TravelService } from 'src/app/services/travel/travel.service';
import { ITeam } from 'src/app/models/team';
import { TeamService } from 'src/app/services/team/team.service';
import { CountryCoordinatesService } from 'src/app/services/coordinates/coordinates.sevice';
import * as L from 'leaflet'; // Импортируйте всё как L
import { AuthService } from 'src/app/services/auth/auth.service';
import { environment } from 'src/environments/environment';

// Исправьте типы, используя L вместо отдельных импортов
@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit, OnDestroy {
  constructor(
    private travelService: TravelService,
    private teamService: TeamService,
    private countryCoordinatesService: CountryCoordinatesService,
    private authService: AuthService,
    private router: Router
  ) {}
  
  private _destroyer: Subscription;
  private _teamDestroyer: Subscription;
  travels: ITravel[] = [];
  featuredTravels: ITravel[] = [];
  teamMembers: ITeam[] = [];
  isAdmin: boolean = false;

  // Используйте правильные типы из L
  mapOptions: L.MapOptions;
  mapMarkers: L.Marker[] = [];
  private map: L.Map;

  ngOnInit(): void {
    this.initializeMapOptions();
    this.initTravels();
    this.initTeam();
    this.checkAdminStatus();
  }

  private checkAdminStatus(): void {
    this.authService.userBehavior$.subscribe(user => {
      this.isAdmin = user?.login === 'admin';
    });
    
    const user = this.authService.getCurrentUser();
    if (user) {
      this.isAdmin = user.login === 'admin';
    }
  }

  initializeMapOptions(): void {
    this.mapOptions = {
      layers: [
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: ''
        })
      ],
      zoom: 2,
      center: L.latLng(20, 0),
      zoomControl: true,
      attributionControl: false
    };
  }

  initTravels() {
    this._destroyer = this.travelService.getTravel().subscribe({
      next: (travels) => {
        this.travels = travels;
        this.featuredTravels = travels
          .slice(0, 10);
        this.updateMapMarkers();
      },
      error: (err) => {
        console.error('Error fetching travels:', err);
      }
    });
  }

  initTeam() {
    this._teamDestroyer = this.teamService.getTeamMembers().subscribe({
      next: (teamMembers) => {
        this.teamMembers = teamMembers;
      },
      error: (err) => {
        console.error('Error fetching team members:', err);
      }
    });
  }

  // ИСПРАВЛЕНО: Тип параметра - L.Map, а не Map
  onMapReady(map: L.Map): void {
    this.map = map;

    // Загрузить GeoJSON с странами
    fetch('assets/world.geojson')
      .then(res => res.json())
      .then(data => {
        L.geoJSON(data, {
          style: {
            color: '#1e3a5c',
            weight: 1,
            fillColor: '#0a1f2d',
            fillOpacity: 0.8
          }
        }).addTo(this.map);
      });

    if (this.featuredTravels.length > 0) {
      this.updateMapMarkers();
    }
  }

  updateMapMarkers(): void {
    if (!this.map) {
      console.error('Map not initialized');
      return;
    }

    // Очищаем старые маркеры
    this.mapMarkers.forEach(marker => {
      this.map.removeLayer(marker);
    });
    this.mapMarkers = [];

    // Создаем кастомную иконку
    const customIcon = L.icon({
      iconUrl: 'assets/icons/marker.svg',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34]
    });

    // Загружаем координаты для всех стран
    this.countryCoordinatesService.getAllCoordinates().subscribe(allCoordinates => {
      const coordinatesMap = new Map(
        allCoordinates.map(coord => [coord.country, [coord.latitude, coord.longitude]])
      );

      this.featuredTravels.forEach(travel => {
        const coordinates = coordinatesMap.get(travel.country) || [0, 0];

        if (coordinates[0] === 0 && coordinates[1] === 0) {
          console.warn(`Skipping marker for country: ${travel.country} - coordinates not found`);
          return;
        }

        // Создаем текст для тултипа
        const tooltipContent = `
          <div style="
            font-family: 'Montserrat', Helvetica, sans-serif;
            text-align: center;
            min-width: 120px;
            padding: 4px 0;
          ">
            <div style="
              color: #0a1f2d;
              font-size: 14px;
              font-weight: 700;
              margin-bottom: 2px;
              text-shadow: 0 1px 1px rgba(255, 255, 255, 0.5);
            ">${travel.country}</div>
            ${travel.city ? `
            <div style="
              color: #000000;
              font-size: 12px;
              font-weight: 500;
              margin-bottom: 2px;
            ">${travel.city}</div>
            ` : ''}
            <div style="
              color: #8B0000;
              font-size: 11px;
              font-weight: 600;
            ">${travel.year}</div>
          </div>
        `;

        const newMarker = L.marker(coordinates as L.LatLngTuple, { icon: customIcon })
          .bindTooltip(tooltipContent, {
            permanent: false,
            direction: 'top',
            offset: [0, -25],
            opacity: 1,
            className: 'custom-tooltip'
          })      
          .bindPopup(`
            <div style="text-align: center; min-width: 200px;">
              <h3 style="margin: 0 0 10px 0; color: #87ceeb;">${travel.country}</h3>
              ${travel.city ? `<p style="margin: 5px 0; font-weight: bold;">${travel.city}</p>` : ''}
              <p style="margin: 5px 0;"><strong>Год: ${travel.year}</strong></p>
              <button id="travel-btn-${travel.id}" 
                      style="background: linear-gradient(135deg, #87ceeb, #4682b4); color: #0a1f2d; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-top: 10px; font-weight: 600;">
                Подробнее
              </button>
            </div>
          `)
          .on('click', () => {
            this.navigateToCountry(travel.id);
          });

        this.mapMarkers.push(newMarker);
        newMarker.addTo(this.map);

        newMarker.on('popupopen', () => {
          const button = document.getElementById(`travel-btn-${travel.id}`);
          if (button) {
            button.onclick = (e) => {
              e.stopPropagation();
              this.navigateToCountry(travel.id);
            };
          }
        });
      });

      // Фокусируем карту по маркерам
      if (this.mapMarkers.length > 0) {
        const group = L.featureGroup(this.mapMarkers);
        this.map.fitBounds(group.getBounds().pad(0.1));
      }
    });
  }

  navigateToCountry(countryId: string) {
    this.router.navigate(['/travels', countryId]).then(() => {
      window.scrollTo(0, 0);
    });
  }

  editTeamMember(id: string): void {
    this.router.navigate(['/team/edit', id]);
  }

  addTeamMember(): void {
    this.router.navigate(['/team/add']);
  }

  getImageUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) {
      return path;
    }
    if (path.startsWith('/')) {
      return `${environment.apiUrl}${path}`;
    }
    return `${environment.apiUrl}/uploads/${path}`;
  }

  ngOnDestroy() {
    this._destroyer?.unsubscribe();
    this._teamDestroyer?.unsubscribe();
  }
}