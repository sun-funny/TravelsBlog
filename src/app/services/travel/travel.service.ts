import { Injectable } from '@angular/core';
import { TravelRestService } from '../travel-rest/travel-rest.service';
import { map, Observable, Subject} from "rxjs";
import { ITravel } from 'src/app/models/travel';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TravelService {
  private travelSubject = new Subject<ITravel>()
  private apiUrl = `${environment.apiUrl}/travels`;
  readonly groupTravels$ = this.travelSubject.asObservable();

  constructor(
    private travelServiceRest: TravelRestService,
    private http: HttpClient
  ) {
  }

  createTravel(travel: ITravel): Observable<ITravel> {
    return this.http.post<ITravel>(this.apiUrl, travel);
  }

  getTravel(): Observable<ITravel[]> {
    return this.travelServiceRest.getTravels().pipe(
      map((items) => {
        return items;
      })
    );
  }

  updateTravel() {
    this.travelSubject.next;
  }
  
  sendTravelData(data: ITravel): Observable<any> {
    return this.http.post('/travels', data);
  }
}
