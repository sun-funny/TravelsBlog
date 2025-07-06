import { Component, OnInit } from '@angular/core';
import { ITravel } from 'src/app/models/travel';
import { TravelService } from 'src/app/services/travel/travel.service';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

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
          .slice(0, 5);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching travels:', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  navigateToTravel(id: string) {
    this.router.navigate(['/travels', id]);
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
}