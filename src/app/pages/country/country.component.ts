import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from "@angular/router";
import { ITravel } from 'src/app/models/travel';
import { IPoint } from 'src/app/models/point';
import { TravelService } from 'src/app/services/travel/travel.service';
import { PointMock } from 'src/app/shared/mock/point.mock';
import { TravelMock } from 'src/app/shared/mock/travel.mock';

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

  constructor(
    private route: ActivatedRoute,
    private travelService: TravelService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (!id) {
      this.isNotFound = true;
      this.isLoading = false;
      return;
    }
    setTimeout(() => {
      this.country = TravelMock.find(travel => travel.id === id) || null;
      
      if (!this.country) {
        this.isNotFound = true;
        this.isLoading = false;
        return;
      }
      
      this.points = PointMock.filter(point => point.id_country === id);
      this.isLoading = false;
    }, 300);
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
}
