import { Injectable } from '@angular/core';
import { Observable, of } from "rxjs";
import { ITravel } from 'src/app/models/travel';
import { TravelMock } from 'src/app/shared/mock/travel.mock';

@Injectable({
  providedIn: 'root'
})
export class TravelRestService {

  constructor() {}

  getTravels(): Observable<ITravel[]> {
    return of(TravelMock);
  }

  sendTravelData(data: any) {
    return of(data);
  }
}
