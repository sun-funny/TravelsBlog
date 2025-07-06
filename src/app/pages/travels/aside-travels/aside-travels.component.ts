import { Component, EventEmitter, Output } from '@angular/core';
import { ITravel } from 'src/app/models/travel';
import { TravelService } from 'src/app/services/travel/travel.service';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth/auth.service';

@Component({
  selector: 'app-aside-travels',
  templateUrl: './aside-travels.component.html',
  styleUrls: ['./aside-travels.component.scss']
})
export class AsideTravelsComponent {
  @Output() yearFilterChange = new EventEmitter<number | null>();
  travels: ITravel[] = [];
  years: number[] = [];
  selectedYear: number | null = null;
  isAdmin: boolean = false;
  private _destroyer: Subscription;

  constructor(private travelService: TravelService,
              private authService: AuthService) {}

  ngOnInit(): void {
    this._destroyer = this.travelService.getTravel().subscribe({
      next: (travels) => {
        this.travels = travels;
        this.extractUniqueYears();
      },
      error: (err) => {
        console.error('Error fetching travels:', err);
      }
    });

    this.authService.userBehavior$.subscribe((user) => {
      this.isAdmin = user?.login === 'admin';
    });
    
  }

  private extractUniqueYears(): void {
    this.years = [...new Set(this.travels.map(travel => travel.year))].sort((a, b) => b - a);
  }

  onYearChange(): void {
    this.yearFilterChange.emit(this.selectedYear);
  }

  resetFilter(): void {
    this.selectedYear = null;
    this.yearFilterChange.emit(null);
  }

  ngOnDestroy(): void {
    this._destroyer?.unsubscribe();
  }
}