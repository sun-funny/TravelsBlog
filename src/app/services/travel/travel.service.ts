import { Injectable } from '@angular/core';
import { TravelRestService } from '../travel-rest/travel-rest.service';
import { map, Observable, Subject} from "rxjs";
import { ITravel } from 'src/app/models/travel';

@Injectable({
  providedIn: 'root'
})
export class TravelService {
  private travelSubject = new Subject<ITravel>()
  readonly groupTravels$ = this.travelSubject.asObservable();

  constructor(private travelServiceRest: TravelRestService) {
  }

  getTravel(): Observable<ITravel[]> {
    return this.travelServiceRest.getTravels().pipe(map((items) => {
      return items.concat(items);
    }));
  }

  updateTravel() {
    this.travelSubject.next;
  }

  sendTourData(data: any) {
    return this.travelServiceRest.sendTravelData(data)
  }
}


