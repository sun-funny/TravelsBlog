import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription } from "rxjs";
import { ITravel } from 'src/app/models/travel';
import { TravelService } from 'src/app/services/travel/travel.service';

@Component({
  selector: 'app-travels',
  templateUrl: './travels.component.html',
  styleUrls: ['./travels.component.scss']
})
export class TravelsComponent implements OnInit, OnDestroy {
  travels: ITravel[] = [];
  showAllCountries = false;
  buttonText = 'Показать все страны';
  private _destroyer: Subscription;

  constructor(private travelService: TravelService) {}

  ngOnInit(): void {
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