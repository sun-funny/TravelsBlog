import { Component, OnInit } from '@angular/core';
import { ITravel } from 'src/app/models/travel';
import { TravelMock } from 'src/app/shared/mock/travel.mock';
import { TravelService } from 'src/app/services/travel/travel.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-travels',
  templateUrl: './travels.component.html',
  styleUrls: ['./travels.component.scss']
})
export class TravelsComponent implements OnInit {
  travels: ITravel[] = TravelMock;
  travelsData$: Observable<ITravel[]>;
  showAllCountries = false;
  buttonText = 'Показать все страны';
  
  constructor(private travelService: TravelService) { }

  ngOnInit(): void {
    this.initTravels();
  }

  initTravels() {
    this.travelsData$ = this.travelService.getTravel();
  }

  toggleCountries() {
    this.showAllCountries = !this.showAllCountries;
    this.buttonText = this.showAllCountries ? 'Скрыть' : 'Показать все страны';
  }
}