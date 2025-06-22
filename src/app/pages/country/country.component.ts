import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from "@angular/router";
import { ITravel } from 'src/app/models/travel';
import { IPoint } from 'src/app/models/point';
import { TravelService } from 'src/app/services/travel/travel.service';
import { PointRestService } from 'src/app/services/point-rest/point-rest.service';
import { PointMock } from 'src/app/shared/mock/point.mock';
import { TravelMock } from 'src/app/shared/mock/travel.mock';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-country',
  templateUrl: './country.component.html',
  styleUrls: ['./country.component.scss']
})
export class CountryComponent implements OnInit {
  country: ITravel | null = null;
  points: IPoint[] = [];
  isNotFound: boolean = false;
  isLoading: boolean = true;
  displayModal: boolean = false;
  selectedImage: string | null = null;
  currentPoint: IPoint | null = null;
  showAddPointForm: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private travelService: TravelService,
    private pointRestService: PointRestService
  ) {}

  ngOnInit(): void {
    console.log('CountryComponent initialized');
    this.loadData();
  }

  private loadData(): void {
    const id = this.route.snapshot.paramMap.get('id');
    console.log('Route ID:', id);
    
    if (!id) {
      console.log('No ID found in route');
      this.isNotFound = true;
      this.isLoading = false;
      return;
    }

    this.travelService.getTravel().subscribe(travels => {
      console.log('Received travels:', travels);
      this.country = travels.find(travel => travel.id === id) || null;
      console.log('Found country:', this.country);

      if (!this.country) {
        console.log('Country not found in travels');
        this.isNotFound = true;
        this.isLoading = false;
        return;
      }
      
      this.pointRestService.getPointsByCountry(id).subscribe({
        next: (points) => {
          console.log('Received points:', points);
          this.points = points;
          this.isLoading = false;
          console.log('Country ID:', this.country?.id);
        },
        error: (err) => {
          console.error('Error fetching points:', err);
          this.points = PointMock.filter(point => point.id_country === id);
          this.isLoading = false;
        }
      });
    });
  }

  onPointAdded(newPoint: IPoint): void {
    this.points = [...this.points, newPoint];
    this.showAddPointForm = false;
  }

  openImageModal(image: string, point?: IPoint): void {
    this.selectedImage = image;
    this.currentPoint = point || null;
    this.displayModal = true;
  }

  onModalHide(): void {
    this.selectedImage = null;
    this.currentPoint = null;
  }

  formatDescription(description: string): string {
    if (!description) return '';
    return description.split('\n\n')
      .map(para => para.trim())
      .filter(para => para.length > 0)
      .map(para => `<p class="indented-paragraph">${para}</p>`)
      .join('');
  }

  getImageUrl(path: string): string {
    // Если путь уже полный (http://), возвращаем как есть
    if (path.startsWith('http')) return path;
  
    // Иначе формируем URL относительно API
    return `${environment.apiUrl}/uploads/${path.replace('assets/uploads/', '')}`;
  }
}