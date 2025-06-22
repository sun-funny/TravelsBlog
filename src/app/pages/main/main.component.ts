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
  teamMembers = TeamMock;

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
        // Transform the travels data to match your location format if needed
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