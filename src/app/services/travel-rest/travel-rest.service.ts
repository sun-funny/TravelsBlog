import { Injectable } from '@angular/core';
import { Observable } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { ITravel } from 'src/app/models/travel';

@Injectable({
  providedIn: 'root'
})
export class TravelRestService {

  constructor(private http: HttpClient) {
  }

  getTravels(): Observable<ITravel[]> {
    return this.http.get<ITravel[]>('https://62b9e756ff109cd1dc9dae16.mockapi.io/apiv/v1/tours/');
  }

  sendTravelData(data: any) {
    return this.http.post(`/`, data)
  }
}
