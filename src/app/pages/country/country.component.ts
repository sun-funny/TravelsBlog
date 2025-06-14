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
  country: ITravel;
  points: IPoint[] = [];
  isNotFound: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private travelService: TravelService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.country = TravelMock.find(travel => travel.id === id);
      
      if (!this.country) {
        this.isNotFound = true;
        return;
      }
      this.points = PointMock.filter(point => point.id_country === id);
    }
  }
}
