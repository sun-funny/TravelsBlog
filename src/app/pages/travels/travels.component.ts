import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription } from "rxjs";
import { ITravel } from 'src/app/models/travel';
import { TravelService } from 'src/app/services/travel/travel.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/services/auth/auth.service';

@Component({
  selector: 'app-travels',
  templateUrl: './travels.component.html',
  styleUrls: ['./travels.component.scss']
})
export class TravelsComponent implements OnInit, OnDestroy {
  travels: ITravel[] = [];
  filteredTravels: ITravel[] = [];
  showAside = true;
  isTravelsPage = true;
  isAdmin = false;
  selectedYear: number | null = null;
  searchQuery: string = '';
  private _destroyer: Subscription;

  constructor(
    private travelService: TravelService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.checkIfTravelsPage();
    
    this.authService.userBehavior$.subscribe(user => {
      this.isAdmin = user?.login === 'admin';
    });
    
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkIfTravelsPage();
    });

    // Автоматически загружаем данные при инициализации
    this.loadTravels();
  }

  private checkIfTravelsPage(): void {
    this.isTravelsPage = this.router.url.includes('/travels');
  }

  private loadTravels(): void {
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

  filterTravels(): void {
    this.filteredTravels = this.travels.filter(travel => {
      const matchesYear = this.selectedYear ? travel.year === this.selectedYear : true;
      const matchesName = this.searchQuery ? 
        travel.country.toLowerCase().includes(this.searchQuery.toLowerCase()) : true;
      return matchesYear && matchesName;
    });
  }

  ngOnDestroy() {
    this._destroyer?.unsubscribe();
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