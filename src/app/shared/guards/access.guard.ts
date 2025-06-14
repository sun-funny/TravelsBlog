import { Injectable } from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, CanActivateChild, RouterStateSnapshot, UrlTree} from '@angular/router';
import { Observable } from 'rxjs';
import {UserAccessService} from "../../services/user-access/user-access.service";

@Injectable({
  providedIn: 'root'
})
export class AccessGuard implements CanActivateChild {

  constructor(private accessService: UserAccessService) {
  }
  canActivateChild (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    console.log('route', route, 'state', state)
    const routerFullPath = state.url;
    return this.accessService.canRead(routerFullPath);
  }

}
