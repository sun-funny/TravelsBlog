import { Injectable } from '@angular/core';
import { AuthService } from "../auth/auth.service";
import { HttpEvent, HttpHandler, HttpRequest, HttpInterceptor } from "@angular/common/http";
import { Observable, throwError, from } from "rxjs";
import { catchError, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.authService.isAuthenticated) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${this.authService.user.access_token}`
        }
      });
    }

    return next.handle(req).pipe(
      catchError((err: any) => {
        if (err.status === 401) {
          return from(this.authService.refreshToken()).pipe(
            switchMap((success: boolean) => {
              if (success) {
                const authReq = req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${this.authService.user?.access_token}`
                  }
                });
                return next.handle(authReq);
              } else {
                this.router.navigate(['/auth']);
                return throwError(err);
              }
            })
          );
        }
        return throwError(err);
      })
    );
  }
}