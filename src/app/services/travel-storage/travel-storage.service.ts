import { Injectable } from '@angular/core';
import { ITravel } from 'src/app/models/travel';
import {TravelService} from "../travel/travel.service";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class TravelStorageService {
  private travelStorage: ITravel[] = [];
  constructor(private travelService: TravelService) { }

  get travels () {
    return this.travelStorage;
  }

  getTravel(id: string) {
    return this.travelStorage.find((e) => e.id === id);
  }

  fetchTravels (force?: boolean) {
    if (this.travelStorage.length && !force) {
      return new Observable<ITravel[]>((subscriber) => {
        subscriber.next(this.travelStorage);
        subscriber.complete();
      });
    }
    const observ = this.travelService.getTravel()
    observ.subscribe(
      (data) => {
        this.travelStorage = data;
      }
    )

    return observ;
  }

  setStorage(data: ITravel[]): void {
  }
  getStorage(): ITravel[] {
    return []
  }
}
