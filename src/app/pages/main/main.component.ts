import { Component, OnDestroy, OnInit } from '@angular/core'
import { Router } from '@angular/router';
import {Observable, Subscription} from "rxjs";
import { ITravel } from 'src/app/models/travel';
import { TravelService } from 'src/app/services/travel/travel.service';
import { TeamMock } from 'src/app/shared/mock/team.mock';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit, OnDestroy {
  constructor(
    private travelService: TravelService,
    private router: Router
    ){}

  private _destroyer: Subscription;
  travels: ITravel[] = [];
  featuredTravels: ITravel[] = [];
  teamMembers = TeamMock;

  private featuredCoordinates = [
    { top: "0", left: "780px" },
    { top: "397px", left: "868px" },
    { top: "432px", left: "640px" },
    { top: "404px", left: "163px" },
    { top: "231px", left: "568px" },
    { top: "338px", left: "432px" },
    { top: "548px", left: "475px" },
    { top: "578px", left: "146px" },
    { top: "704px", left: "399px" },
    { top: "505px", left: "944px" }
  ];

  ngOnInit(): void {
    this.initTravels();
  }

  ngOnDestroy() {
    this._destroyer?.unsubscribe();
  }

  initTravels() {
    this._destroyer = this.travelService.getTravel().subscribe({
      next: (travels) => {
        this.travels = travels;
        this.featuredTravels = travels
        .filter(travel => travel.featured)
        .slice(0, 10) // Take only first 10 featured travels
        .map((travel, index) => ({
          ...travel,
          top: this.featuredCoordinates[index]?.top || '',
          left: this.featuredCoordinates[index]?.left || ''
        }));
      },
      error: (err) => {
        console.error('Error fetching travels:', err);
      }
    });
  }

  navigateToTravels() {
    this.router.navigate(['/travels']);
  }

  navigateToCountry(countryId: string) {
    this.router.navigate(['/travels', countryId]).then(() => {
      window.scrollTo(0, 0);
    });
  }
}