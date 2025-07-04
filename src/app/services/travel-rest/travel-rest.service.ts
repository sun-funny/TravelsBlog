import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ITravel } from 'src/app/models/travel';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { TravelMock } from 'src/app/shared/mock/travel.mock';

@Injectable({
  providedIn: 'root'
})
export class TravelRestService {
  private apiUrl = `${environment.apiUrl}/travels`;

  constructor(private http: HttpClient) {}

  getTravels(): Observable<ITravel[]> {
    return this.http.get<ITravel[]>(this.apiUrl).pipe(
      catchError(error => {
        console.error('Error fetching travels:', error);
        return of(TravelMock);
      })
    );
  }

  createTravel(data: ITravel): Observable<ITravel> {
    return this.http.post<ITravel>(this.apiUrl, data);
  }

  sendTravelData(data: ITravel): Observable<ITravel> {
    return this.http.post<ITravel>(this.apiUrl, data);
  }

  updateTravel(id: string, data: ITravel): Observable<ITravel> {
    return this.http.put<ITravel>(`${this.apiUrl}/${id}`, data);
  }

  deleteTravel(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}