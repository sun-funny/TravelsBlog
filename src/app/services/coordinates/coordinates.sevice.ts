import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface ICoordinates {
  country: string;
  latitude: number;
  longitude: number;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class CountryCoordinatesService {
  private apiUrl = `${environment.apiUrl}/coordinates`;

  constructor(private http: HttpClient) {}

  // Получить все координаты
  getAllCoordinates(): Observable<ICoordinates[]> {
    return this.http.get<ICoordinates[]>(this.apiUrl);
  }

  // Получить координаты по стране (возвращает объект)
  getCoordinatesByCountry(countryName: string): Observable<ICoordinates | null> {
    const encodedCountry = encodeURIComponent(countryName);
    return this.http.get<ICoordinates>(`${this.apiUrl}/${encodedCountry}`).pipe(
      map(coord => coord || null)
    );
  }

  // Получить координаты как массив [lat, lng] (для обратной совместимости)
  getCoordinates(countryName: string): Observable<[number, number]> {
    const encodedCountry = encodeURIComponent(countryName);
    return this.http.get<ICoordinates>(`${this.apiUrl}/${encodedCountry}`).pipe(
      map(coord => coord ? [coord.latitude, coord.longitude] : [0, 0])
    );
  }

  // Создать координаты
  createCoordinates(coordinates: ICoordinates): Observable<ICoordinates> {
    return this.http.post<ICoordinates>(this.apiUrl, coordinates);
  }

  // Обновить координаты
  updateCoordinates(country: string, coordinates: ICoordinates): Observable<ICoordinates> {
    const encodedCountry = encodeURIComponent(country);
    return this.http.put<ICoordinates>(`${this.apiUrl}/${encodedCountry}`, coordinates);
  }

  // Удалить координаты
  deleteCoordinates(country: string): Observable<any> {
    const encodedCountry = encodeURIComponent(country);
    return this.http.delete(`${this.apiUrl}/${encodedCountry}`);
  }

  // Проверить существование координат
  checkCoordinatesExist(country: string): Observable<boolean> {
    return this.getCoordinatesByCountry(country).pipe(
      map(coord => !!coord && coord.latitude !== 0 && coord.longitude !== 0)
    );
  }

  // Инициализировать координаты (админская функция)
  initializeDefaultCoordinates(): Observable<any> {
    return this.http.post(`${this.apiUrl}/initialize`, {});
  }
}