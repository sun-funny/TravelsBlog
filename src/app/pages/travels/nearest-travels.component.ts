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

  constructor(
    private travelService: TravelService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.travelService.getTravel().subscribe(travels => {
      this.nearestTravels = [...travels]
        .sort((a, b) => Math.abs(a.year - this.currentYear) - Math.abs(b.year - this.currentYear))
        .slice(0, 5)
        .map(travel => ({
        ...travel,
        img: travel.img.startsWith('assets/') ? travel.img : 
            travel.img.startsWith('/assets/') ? travel.img.substring(1) :
       `assets/img_countries/${travel.img}`
        }));
    });
  }

  navigateToTravel(id: string) {
    this.router.navigate(['/travels', id]);
  }
}