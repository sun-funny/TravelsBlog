import { Component, OnDestroy, OnInit, HostListener } from '@angular/core'
import { Router } from '@angular/router';
import { Subscription } from "rxjs";
import { ITravel } from 'src/app/models/travel';
import { TravelService } from 'src/app/services/travel/travel.service';
import { ITeam } from 'src/app/models/team';
import { TeamService } from 'src/app/services/team/team.service';
import { CountryCoordinatesService } from 'src/app/services/coordinates/coordinates.sevice';
import * as L from 'leaflet';
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
  isMobile: boolean = false;

  mapOptions: L.MapOptions;
  mapMarkers: L.Marker[] = [];
  private map: L.Map;
  private resizeObserver: ResizeObserver;
  private markersReady: boolean = false;

  ngOnInit(): void {
    this.checkIsMobile();
    this.initializeMapOptions();
    this.initTravels();
    this.initTeam();
    this.checkAdminStatus();
  }

  private checkIsMobile(): void {
    this.isMobile = window.innerWidth <= 768;
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    const wasMobile = this.isMobile;
    this.checkIsMobile();
    
    if (wasMobile !== this.isMobile) {
      this.updateMapForDevice();
    } else {
      setTimeout(() => {
        this.fitMapToContainer();
      }, 200);
    }
  }

  private updateMapForDevice(): void {
    if (!this.map) return;
    
    if (this.isMobile) {
      this.map.options.maxBoundsViscosity = 0.8;
      this.map.zoomControl.setPosition('bottomright');
    } else {
      this.map.options.maxBoundsViscosity = 1.0;
      this.map.zoomControl.setPosition('topright');
    }
    
    setTimeout(() => {
      this.fitMapToContainer();
    }, 100);
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
    // Для мобильных устройств устанавливаем минимальный зум, чтобы показать всю карту
    const minZoom = this.isMobile ? 1 : 2;
    
    this.mapOptions = {
      layers: [
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '',
          minZoom: minZoom,
          maxZoom: 18
        })
      ],
      zoom: this.isMobile ? 1 : 2,
      minZoom: minZoom,
      maxZoom: 18,
      center: L.latLng(20, 0),
      zoomControl: true,
      attributionControl: false,
      maxBounds: L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180)),
      maxBoundsViscosity: this.isMobile ? 0.8 : 1.0,
      worldCopyJump: false
    };
  }

  initTravels() {
    this._destroyer = this.travelService.getTravel().subscribe({
      next: (travels) => {
        this.travels = travels;
        this.featuredTravels = travels;
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

  onMapReady(map: L.Map): void {
    this.map = map;
    
    if (this.isMobile) {
      this.map.zoomControl.setPosition('bottomright');
    }

    this.resizeObserver = new ResizeObserver(() => {
      this.fitMapToContainer();
    });
    
    const container = this.map.getContainer();
    this.resizeObserver.observe(container);

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
        
        if (this.markersReady) {
          setTimeout(() => this.fitMapToContainer(), 100);
        }
      });

    if (this.featuredTravels.length > 0) {
      this.updateMapMarkers();
    }
  }

  private fitMapToContainer(): void {
    if (!this.map) return;

    // Принудительно обновляем размер контейнера
    this.map.invalidateSize();

    setTimeout(() => {
      if (!this.map) return;
      
      // Для мобильных устройств показываем полную карту мира
      if (this.isMobile) {
        // Устанавливаем границы, охватывающие весь мир
        const worldBounds = L.latLngBounds(
          L.latLng(-60, -140), 
          L.latLng(85, 180)
        );
        
        // Подгоняем карту под весь мир с минимальным отступом
        this.map.fitBounds(worldBounds, {
          padding: [10, 10] as L.PointExpression,
          maxZoom: 2 // Ограничиваем максимальный зум, чтобы не увеличивало слишком сильно
        });
        
        // Устанавливаем минимально возможный зум для полного обзора
        if (this.map.getZoom() > 2) {
          this.map.setZoom(2);
        }
        
        // Дополнительная проверка: если зум все еще больше 2, уменьшаем
        setTimeout(() => {
          if (this.map && this.map.getZoom() > 2) {
            this.map.setZoom(2);
          }
        }, 100);
      } else {
        // Для десктопной версии показываем все маркеры
        if (this.mapMarkers.length === 0) {
          const bounds = L.latLngBounds(L.latLng(-60, -140), L.latLng(85, 180));
          this.map.fitBounds(bounds, {
            padding: [20, 20] as L.PointExpression,
            maxZoom: 4
          });
          return;
        }

        const group = L.featureGroup(this.mapMarkers);
        const bounds = group.getBounds();
        
        if (bounds.isValid()) {
          this.map.fitBounds(bounds, {
            padding: [20, 20] as L.PointExpression,
            maxZoom: 6
          });
        }
      }
    }, 50);
  }

  updateMapMarkers(): void {
    if (!this.map) return;

    this.markersReady = false;

    this.mapMarkers.forEach(marker => {
      this.map.removeLayer(marker);
    });
    this.mapMarkers = [];

    // Размер иконок для мобильной версии
    const iconSize: L.PointExpression = this.isMobile ? [20, 32] : [25, 41];
    const iconAnchor: L.PointExpression = this.isMobile ? [10, 32] : [12, 41];
    const popupAnchor: L.PointExpression = this.isMobile ? [1, -28] : [1, -34];
    
    const customIcon = L.icon({
      iconUrl: 'assets/icons/marker.svg',
      iconSize: iconSize,
      iconAnchor: iconAnchor,
      popupAnchor: popupAnchor
    });

    this.countryCoordinatesService.getAllCoordinates().subscribe(allCoordinates => {
      const coordinatesMap = new Map(
        allCoordinates.map(coord => [coord.country, [coord.latitude, coord.longitude] as [number, number]])
      );

      this.featuredTravels.forEach(travel => {
        const coordinates = coordinatesMap.get(travel.country);
        
        if (!coordinates || (coordinates[0] === 0 && coordinates[1] === 0)) {
          console.warn(`Skipping marker for country: ${travel.country} - coordinates not found`);
          return;
        }

        const tooltipFontSize = this.isMobile ? '12px' : '14px';
        const tooltipContent = `
          <div style="font-family: 'Montserrat', Helvetica, sans-serif; text-align: center; min-width: ${this.isMobile ? '100px' : '120px'}; padding: ${this.isMobile ? '2px 0' : '4px 0'};">
            <div style="color: #0a1f2d; font-size: ${tooltipFontSize}; font-weight: 700; margin-bottom: 2px; text-shadow: 0 1px 1px rgba(255, 255, 255, 0.5);">${travel.country}</div>
            ${travel.city ? `<div style="color: #000000; font-size: ${this.isMobile ? '10px' : '12px'}; font-weight: 500; margin-bottom: 2px;">${travel.city}</div>` : ''}
            <div style="color: #8B0000; font-size: ${this.isMobile ? '9px' : '11px'}; font-weight: 600;">${travel.year}</div>
          </div>
        `;

        const newMarker = L.marker(coordinates, { icon: customIcon })
          .bindTooltip(tooltipContent, {
            permanent: false,
            direction: 'top',
            offset: [0, this.isMobile ? -20 : -25] as L.PointExpression,
            opacity: 1,
            className: 'custom-tooltip'
          })      
          .bindPopup(`
            <div style="text-align: center; min-width: ${this.isMobile ? '180px' : '200px'};">
              <h3 style="margin: 0 0 8px 0; color: #87ceeb; font-size: ${this.isMobile ? '14px' : '16px'};">${travel.country}</h3>
              ${travel.city ? `<p style="margin: 5px 0; font-weight: bold; font-size: ${this.isMobile ? '12px' : '14px'};">${travel.city}</p>` : ''}
              <p style="margin: 5px 0; font-size: ${this.isMobile ? '12px' : '14px'};"><strong>Год: ${travel.year}</strong></p>
              <button id="travel-btn-${travel.id}" style="background: linear-gradient(135deg, #87ceeb, #4682b4); color: #0a1f2d; border: none; padding: ${this.isMobile ? '6px 12px' : '8px 16px'}; border-radius: 6px; cursor: pointer; margin-top: 8px; font-weight: 600; font-size: ${this.isMobile ? '12px' : '14px'};">
                Подробнее
              </button>
            </div>
          `)
          .on('click', () => this.navigateToCountry(travel.id));

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

      this.markersReady = true;
      
      // Подгоняем карту под нужный вид
      setTimeout(() => this.fitMapToContainer(), 100);
      setTimeout(() => this.fitMapToContainer(), 300);
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
    if (path.startsWith('http')) return path;
    if (path.startsWith('/')) return `${environment.apiUrl}${path}`;
    return `${environment.apiUrl}/uploads/${path}`;
  }

  ngOnDestroy() {
    this._destroyer?.unsubscribe();
    this._teamDestroyer?.unsubscribe();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
}