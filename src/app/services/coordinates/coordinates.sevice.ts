import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CountryCoordinatesService {
  private countryCoordinates: { [key: string]: [number, number] } = {
    'Россия': [61.5240, 105.3188],
    'Франция': [46.6034, 1.8883],
    'Италия': [41.8719, 12.5674],
    'Испания': [40.4637, -3.7492],
    'Германия': [51.1657, 10.4515],
    'UK': [55.3781, -3.4360],
    'США': [37.0902, -95.7129],
    'Китай': [35.8617, 104.1954],
    'Япония': [36.2048, 138.2529],
    'Австралия': [-25.2744, 133.7751],
    'Бразилия': [-14.2350, -51.9253],
    'Канада': [56.1304, -106.3468],
    'Индия': [20.5937, 78.9629],
    'Мексика': [23.6345, -102.5528],
    'ЮАР': [-30.5595, 22.9375]
  };

  getCoordinates(countryName: string): [number, number] {
    if (!countryName) {
      console.warn('Country name is empty');
      return [0, 0];
    }
  
    const normalizedName = countryName.toLowerCase().trim();
  
    const exactMatch = Object.keys(this.countryCoordinates).find(key => 
      key.toLowerCase().trim() === normalizedName
    );
  
    if (exactMatch) {
      return this.countryCoordinates[exactMatch];
    }
    return [0, 0];
  }
}