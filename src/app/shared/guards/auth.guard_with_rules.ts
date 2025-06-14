import { Injectable } from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {delay, Observable, of, switchMap} from 'rxjs';
import {AuthService} from "../../services/auth/auth.service";
import {UserAccessService} from "../../services/user-access/user-access.service";
import {IUserRules} from "../mock/rules";

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router, private accessService: UserAccessService) {
  }
  
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/auth']);
      return false;
    } else {
      return this.accessService.getUserRules().pipe(
        delay(200),
        switchMap((roles) => {
          if (Array.isArray(roles) && roles.length > 0) {
            this.accessService.initAccess(roles);
            return of(true);
          } else {
            return of (false);
          }
        })
      );
    }
  }

}
