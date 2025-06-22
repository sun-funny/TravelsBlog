import { Component, OnInit } from '@angular/core';
import { ITravel } from 'src/app/models/travel';
import { TravelService } from 'src/app/services/travel/travel.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nearest-travels',
  templateUrl: './nearest-travels.component.html',
  styleUrls: ['./nearest-travels.component.scss']
})
export class NearestTravelsComponent implements OnInit {
  nearestTravels: ITravel[] = [];
  currentYear = new Date().getFullYear();
  loading = true;
  error = false;

  constructor(
    private travelService: TravelService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadNearestTravels();
  }

  loadNearestTravels(): void {
    this.loading = true;
    this.error = false;
    
    this.travelService.getTravel().subscribe({
      next: (travels) => {
        this.nearestTravels = [...travels]
          .sort((a, b) => Math.abs(a.year - this.currentYear) - Math.abs(b.year - this.currentYear))
          .slice(0, 5)
          .map(travel => ({
            ...travel,
            img: this.processImagePath(travel.img)
          }));
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching travels:', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  private processImagePath(imgPath: string): string {
    if (imgPath.startsWith('assets/')) {
      return imgPath;
    }
    if (imgPath.startsWith('/assets/')) {
      return imgPath.substring(1);
    }
    return `assets/img_countries/${imgPath}`;
  }

  navigateToTravel(id: string) {
    this.router.navigate(['/travels', id]);
  }
}