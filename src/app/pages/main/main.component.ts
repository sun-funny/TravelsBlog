import { Component, OnDestroy, OnInit } from '@angular/core'
import { Router } from '@angular/router';
import { Observable, Subscription } from "rxjs";
import { ITravel } from 'src/app/models/travel';
import { TravelService } from 'src/app/services/travel/travel.service';
//import { TeamMock } from 'src/app/shared/mock/team.mock';
import { ITeam } from 'src/app/models/team';
import { TeamService } from 'src/app/services/team/team.service';
import { CountryCoordinatesService } from 'src/app/services/coordinates/coordinates.sevice';
import { latLng, MapOptions, marker, Marker, tileLayer, Map, icon, featureGroup, LatLngBounds, geoJSON, tooltip} from 'leaflet';
import { AuthService } from 'src/app/services/auth/auth.service';
import { environment } from 'src/environments/environment';

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

  mapOptions: MapOptions;
  mapMarkers: Marker[] = [];
  private map: Map;

  ngOnInit(): void {
    this.initializeMapOptions();
    this.initTravels();
    this.initTeam();
    this.checkAdminStatus();
  }

  private checkAdminStatus(): void {
    // Проверяем через AuthService
    this.authService.userBehavior$.subscribe(user => {
      this.isAdmin = user?.login === 'admin';
    });
    
    // Также можно проверить текущее состояние
    const user = this.authService.getCurrentUser();
    if (user) {
      this.isAdmin = user.login === 'admin';
    }
  }

  initializeMapOptions(): void {
    this.mapOptions = {
      layers: [
        tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: ''
        })
      ],
      zoom: 2,
      center: latLng(20, 0),
      zoomControl: true,
      attributionControl: false
    };
  }

  initTravels() {
    this._destroyer = this.travelService.getTravel().subscribe({
      next: (travels) => {
        this.travels = travels;
        this.featuredTravels = travels
          //.filter(travel => travel.featured)
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

  onMapReady(map: Map): void {
    this.map = map;

    // Загрузить GeoJSON с странами
    fetch('assets/world.geojson')
      .then(res => res.json())
      .then(data => {
        geoJSON(data, {
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

  this.mapMarkers.forEach(marker => {
    this.map.removeLayer(marker);
  });
  this.mapMarkers = [];

  const customIcon = icon({
    iconUrl: 'assets/icons/marker.svg',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
  });

  this.featuredTravels.forEach(travel => {
    const coordinates = this.countryCoordinatesService.getCoordinates(travel.country);

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

    const newMarker = marker(coordinates, { icon: customIcon })
      .bindTooltip(tooltipContent, {
          permanent: false,      // Показывать только при наведении
          direction: 'top',      // Направление тултипа
          offset: [0, -25],      // Смещение относительно маркера
          opacity: 1,          // Прозрачность
          className: 'custom-tooltip' // Класс для кастомных стилей
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

  // сфокусировать карту по маркерам
  if (this.mapMarkers.length > 0) {
    const group = featureGroup(this.mapMarkers);
    this.map.fitBounds(group.getBounds().pad(0.1) as LatLngBounds);
  }
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