import { Component, OnDestroy, OnInit } from '@angular/core'
import { Router } from '@angular/router';
import {Observable, Subscription} from "rxjs";
import { TreeNode } from "primeng/api";
import { ITravel } from 'src/app/models/travel';
import { TravelService } from 'src/app/services/travel/travel.service';
import { TeamMock } from 'src/app/shared/mock/team.mock';
import { TravelMock } from 'src/app/shared/mock/travel.mock';

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
  travelsData$: Observable<ITravel[]>;

  locations = TravelMock;
  teamMembers = TeamMock;

  ngOnInit(): void {
    this.initTravels();
    this._destroyer = this.travelService.groupTravels$.subscribe((data) => {
      this.initTravels()
    })
  }

    ngOnDestroy() {
    this._destroyer.unsubscribe()
  }

  initTravels() {
    this.travelsData$ = this.travelService.getTravel();
  }

  navigateToTravels() {
    this.router.navigate(['/travels']);
  }
}