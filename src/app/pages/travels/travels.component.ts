import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription } from "rxjs";
import { ITravel } from 'src/app/models/travel';
import { TravelService } from 'src/app/services/travel/travel.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-travels',
  templateUrl: './travels.component.html',
  styleUrls: ['./travels.component.scss']
})
export class TravelsComponent implements OnInit, OnDestroy {
  travels: ITravel[] = [];
  showAllCountries = false;
  buttonText = 'Показать все страны';
  isTravelsPage = true;
  private _destroyer: Subscription;

  constructor(
    private travelService: TravelService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkIfTravelsPage();
    
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkIfTravelsPage();
    });
  }

  private checkIfTravelsPage(): void {
    this.isTravelsPage = this.router.url.includes('/travels');
  }

  ngOnDestroy() {
    this._destroyer?.unsubscribe();
  }

  toggleCountries() {
    this.showAllCountries = !this.showAllCountries;
    this.buttonText = this.showAllCountries ? 'Скрыть страны' : 'Показать все страны';
    
    if (this.showAllCountries && this.travels.length === 0) {
      this._destroyer = this.travelService.getTravel().subscribe({
        next: (travels) => {
          this.travels = travels;
        },
        error: (err) => {
          console.error('Error fetching travels:', err);
        }
      });
    }
  }
}

    /*this._destroyer = this.travelService.getTravel().subscribe({
      next: (travels) => {
        this.travels = travels;
      },
      error: (err) => {
        console.error('Error fetching travels:', err);
      }
    });*/