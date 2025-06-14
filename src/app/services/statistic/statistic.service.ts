import {Injectable} from '@angular/core';
import {StatisticRestService} from "../statistic-rest/statistic-rest.service";
import {map, Observable} from "rxjs";
import {ICustomStatisticUser} from "../../models/users";

@Injectable({
  providedIn: 'root'
})
export class StatisticService {

  constructor(
    private statisticRestService: StatisticRestService
  ) {
  }

  getUserStatistic(): Observable<ICustomStatisticUser[]> {
    return this.statisticRestService.getUserStatistic().pipe(
      map((data) => {
        return data.map((e) => ({
          id: e.id,
          name: e.name,
          city: e.address.city,
          company: e.company.name,
          phone: e.phone,
          street: e.address.street,
        } as ICustomStatisticUser))
      })
    )
  }
}
