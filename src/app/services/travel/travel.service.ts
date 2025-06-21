import { Injectable } from '@angular/core';
import { TravelRestService } from '../travel-rest/travel-rest.service';
import { Observable, Subject} from "rxjs";
import { ITravel } from 'src/app/models/travel';
import { TravelMock } from 'src/app/shared/mock/travel.mock';

@Injectable({
  providedIn: 'root'
})
export class TravelService {
  private travelSubject = new Subject<ITravel>()
  readonly groupTravels$ = this.travelSubject.asObservable();

  constructor(
    private travelServiceRest: TravelRestService
  ) {}

  createTravel(travel: ITravel): Observable<ITravel> {
    return this.travelServiceRest.sendTravelData(travel);
  }

  getTravel(): Observable<ITravel[]> {
    return this.travelServiceRest.getTravels();
  }

  updateTravel(travel: ITravel) {
    this.travelSubject.next(travel);
  }
  
}