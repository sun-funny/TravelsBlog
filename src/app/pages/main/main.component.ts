import { Component, OnDestroy, OnInit } from '@angular/core'
import { Router } from '@angular/router';
import { Observable, Subscription } from "rxjs";
import { ITravel } from 'src/app/models/travel';
import { TravelService } from 'src/app/services/travel/travel.service';
import { TeamMock } from 'src/app/shared/mock/team.mock';
import { CountryCoordinatesService } from 'src/app/services/coordinates/coordinates.sevice';
import { latLng, MapOptions, marker, Marker, tileLayer, Map, icon, featureGroup, LatLngBounds, geoJSON, } from 'leaflet';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit, OnDestroy {
  constructor(
    private travelService: TravelService,
    private countryCoordinatesService: CountryCoordinatesService,
    private router: Router
  ) {}
  
  private _destroyer: Subscription;
  travels: ITravel[] = [];
  featuredTravels: ITravel[] = [];
  teamMembers = TeamMock;

  mapOptions: MapOptions;
  mapMarkers: Marker[] = [];
  private map: Map;

  ngOnInit(): void {
    this.initializeMapOptions();
    this.initTravels();
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
          .filter(travel => travel.featured)
          .slice(0, 10);
        this.updateMapMarkers();
      },
      error: (err) => {
        console.error('Error fetching travels:', err);
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

    const newMarker = marker(coordinates, { icon: customIcon })
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

  ngOnDestroy() {
    this._destroyer?.unsubscribe();
  }
}