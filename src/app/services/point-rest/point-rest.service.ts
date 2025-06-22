import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IPoint } from 'src/app/models/point';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PointRestService {
  private apiUrl = `${environment.apiUrl}/points`;

  constructor(private http: HttpClient) { }

  createPoint(point: IPoint): Observable<IPoint> {
  return this.http.post<IPoint>(this.apiUrl, point);
  }

  getPointsByCountry(countryId: string): Observable<IPoint[]> {
  return this.http.get<IPoint[]>(`${this.apiUrl}/${countryId}`);
  }

  updatePoint(id: string, point: IPoint): Observable<IPoint> {
    return this.http.put<IPoint>(`${this.apiUrl}/${id}`, point);
  }

  deletePoint(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}