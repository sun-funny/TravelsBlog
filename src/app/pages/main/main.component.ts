import { Component, OnDestroy, OnInit } from '@angular/core'
import { Router } from '@angular/router';
import {Observable, Subscription} from "rxjs";
import { ITravel } from 'src/app/models/travel';
import { TravelService } from 'src/app/services/travel/travel.service';
import { TeamMock } from 'src/app/shared/mock/team.mock';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})

export class MainComponent implements OnInit, OnDestroy {
  constructor(
    private travelService: TravelService,
    private router: Router
    ){}
  private _destroyer: Subscription;
  travels: ITravel[] = [];
  featuredTravels: ITravel[] = [];
  teamMembers = TeamMock;

  public imageWidth = 1140;
  public imageHeight = 800;

  ngOnInit(): void {
    this.initTravels();
  }

  initTravels() {
    this._destroyer = this.travelService.getTravel().subscribe({
      next: (travels) => {
        this.travels = travels;
        this.featuredTravels = travels
          .filter(travel => travel.featured)
          .slice(0, 10);
      },
      error: (err) => {
        console.error('Error fetching travels:', err);
      }
    });
  }

  public containerWidth = 0;
  public containerHeight = 0;

  calculateTopPosition(index: number): number {
    const step = index / 9;
    let position = 50 + (this.containerHeight - 100) * step;
  
    const verticalOffset = this.containerHeight * 0.04;
    
    if (index % 2 === 0) { 
      position += verticalOffset;
    } else {
      position -= verticalOffset;
    }
  
    if (index === 0 || index === 1) {
      position += 40; 
    }
  
    if (index === 8 || index === 9) {
      position -= 40;
    }

    return Math.max(30, Math.min(this.containerHeight - 30, position));
  }

  calculateLeftPosition(index: number): number {
    const step = index / 9;
    const basePosition = this.containerWidth - 100 - (this.containerWidth - 200) * step;
    let offset = index % 2 === 0 ? -50 : 50;
    
    if (index === 0 || index === 1) {
      offset += -20;
    }
  
    if (index === 8 || index === 9) {
      offset += 20;
    }
    
    return Math.max(30, Math.min(this.containerWidth - 30, basePosition + offset));
  }

  ngAfterViewInit() {
    this.updateContainerSize();
    window.addEventListener('resize', this.updateContainerSize.bind(this));
  }

  updateContainerSize() {
    const container = document.querySelector('.locations-container');
    if (container) {
      this.containerWidth = container.clientWidth;
      this.containerHeight = container.clientHeight;
    }
  }

  navigateToTravels() {
    this.router.navigate(['/travels']);
  }

  navigateToCountry(countryId: string) {
    this.router.navigate(['/travels', countryId]).then(() => {
      window.scrollTo(0, 0);
    });
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.updateContainerSize.bind(this));
    this._destroyer?.unsubscribe();
  }
}