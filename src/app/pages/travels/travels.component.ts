import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription } from "rxjs";
import { ITravel } from 'src/app/models/travel';
import { TravelService } from 'src/app/services/travel/travel.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-travels',
  templateUrl: './travels.component.html',
  styleUrls: ['./travels.component.scss']
})
export class TravelsComponent implements OnInit, OnDestroy {
  travels: ITravel[] = [];
  filteredTravels: ITravel[] = [];
  showAllCountries = false;
  showAside = false;
  buttonText = 'Показать все страны';
  isTravelsPage = true;
  private _destroyer: Subscription;

  constructor(
    private travelService: TravelService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkIfTravelsPage();
    
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkIfTravelsPage();
    });
  }

  private checkIfTravelsPage(): void {
    this.isTravelsPage = this.router.url.includes('/travels');
  }

  filterByYear(year: number | null): void {
    if (year === null) {
      this.filteredTravels = [...this.travels];
    } else {
      this.filteredTravels = this.travels.filter(travel => travel.year === year);
    }
  }

  ngOnDestroy() {
    this._destroyer?.unsubscribe();
  }

  toggleCountries() {
    this.showAllCountries = !this.showAllCountries;
    this.showAside = this.showAllCountries;
    this.buttonText = this.showAllCountries ? 'Скрыть страны' : 'Показать все страны';
    
    if (this.showAllCountries && this.travels.length === 0) {
      this._destroyer = this.travelService.getTravel().subscribe({
        next: (travels) => {
          this.travels = travels;
          this.filteredTravels = [...travels];
        },
        error: (err) => {
          console.error('Error fetching travels:', err);
        }
      });
    }
  }

  openCountry(travelId: string): void {
    this.router.navigate(['/travels', travelId]);
  }

  getImageUrl(path: string): string {

    if (!path) return '';
  if (path.startsWith('http')) {
    return path;
  }

  if (path.startsWith('/')) {
    return `${environment.apiUrl}${path}`;
  }
  return `${environment.apiUrl}/uploads/${path}`;
}

}
