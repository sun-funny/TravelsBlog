import {Injectable} from '@angular/core';
import {IUser} from "../../models/users";
import {Router} from "@angular/router";
import {UserAccessService} from "../user-access/user-access.service";
import {UserRules} from "../../shared/mock/rules";
import {BehaviorSubject, Subject} from "rxjs";
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

export const LOCAL_STORAGE_NAME = 'currentUser';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject = new Subject();
  user$ = this.userSubject.asObservable();

  private userBehaviorSubject = new BehaviorSubject(null);
  userBehavior$ = this.userBehaviorSubject.asObservable();
  private userStorage: IUser[] = [];
  private currentUser: IUser | null = null;

  private userBasketSubject = new Subject();
  basket$ = this.userBasketSubject.asObservable();

  constructor(
    private router: Router,
    private accessService: UserAccessService,
    private http: HttpClient
  ) {

    const storedUser: IUser | null = JSON.parse(localStorage.getItem(LOCAL_STORAGE_NAME) || 'null');
    if (storedUser) {
     this.auth(storedUser)
    }
  }

  private getUser(login: string): IUser | null {
    return this.userStorage.find((user) => login === user.login) || null;
  }

  private auth(user: IUser, isRememberMe?: boolean) {
    this.currentUser = user;
    this.accessService.initAccess(UserRules);
  
    if (isRememberMe) {
      localStorage.setItem(LOCAL_STORAGE_NAME, JSON.stringify(user));
    } else {
      sessionStorage.setItem(LOCAL_STORAGE_NAME, JSON.stringify(user));
    }
  
    this.userSubject.next(this.currentUser);
  }

  async refreshToken(): Promise<boolean> {
    const storedUser: IUser | null = JSON.parse(localStorage.getItem(LOCAL_STORAGE_NAME) || 'null');
    if (storedUser) {
      this.auth(storedUser)
    }
  
    try {
      const response = await this.http.post<{access_token: string}>(
        `${environment.apiUrl}/users/refresh`,
        { refresh_token: storedUser.refresh_token }
      ).toPromise();
      
      storedUser.access_token = response.access_token;
      if (localStorage.getItem(LOCAL_STORAGE_NAME)) {
        localStorage.setItem(LOCAL_STORAGE_NAME, JSON.stringify(storedUser));
      } else {
        sessionStorage.setItem(LOCAL_STORAGE_NAME, JSON.stringify(storedUser));
      }
      return true;
    } catch (e) {
      this.logout();
      return false;
    }
  }

  initUserToSubject(): void {
    this.userSubject.next(this.currentUser);
    this.userBehaviorSubject.next(this.currentUser);
  }

  setUser(user: any, rememberMe: boolean = false): void {
    this.currentUser = user;
    if (rememberMe) {
      localStorage.setItem(LOCAL_STORAGE_NAME, JSON.stringify(user));
    } else {
      sessionStorage.setItem(LOCAL_STORAGE_NAME, JSON.stringify(user));
    }
    this.userSubject.next(this.currentUser);
    this.userBehaviorSubject.next(this.currentUser);
  }

  private authAndRedirect(user: IUser, isRememberMe?: boolean) {
    this.auth(user, isRememberMe);
    const returnUrl = this.router.parseUrl(this.router.url).queryParams['returnUrl'] || 'faq';
    this.router.navigateByUrl(returnUrl);
  }

  get isAuthenticated(): boolean  {
    return !!this.currentUser || !!localStorage.getItem(LOCAL_STORAGE_NAME);
  }
  get isUserInStore(): boolean  {
    return !!localStorage.getItem(LOCAL_STORAGE_NAME);
  }


  get user(): IUser | null {
    return this.currentUser;
  }

  get token(): string | null {
    return this.isAuthenticated ? 'my-token' : null;
  }

  authUser(login: string, psw: string, isRememberMe: boolean): true | string {
    const user = this.getUser(login);
    if (!user) {
      return 'Пользователь не найден';
    }
    if (user.psw !== psw) {
      return 'Неверный пароль';
    }
    this.authAndRedirect(user, isRememberMe)
    return true;
  }

  addUser(user: IUser, isRememberMe?: boolean): true | string {
    if (this.getUser(user.login)) {
      return 'User already exists';
    }
    this.userStorage.push(user);
    this.authAndRedirect(user, isRememberMe)
    return true;
  }

  logout() {
    this.userStorage = this.userStorage.filter(({login}) => login === this.currentUser?.login);
    this.currentUser = null;
    localStorage.removeItem(LOCAL_STORAGE_NAME);
    sessionStorage.removeItem(LOCAL_STORAGE_NAME);
    this.userBehaviorSubject.next(null);
    this.router.navigate(['auth']);
  }

  changePassword(psw: string) {
    if (!this.currentUser) {
      return
    }
    this.currentUser.psw = psw;
    const dbUser = this.userStorage.find(({login}) => login === this.currentUser?.login)!;
    dbUser.psw = psw
  }

  getUserId(): string {
    return this.user?._id || '';
  }

  getUserName(): string {
    return this.user?.login || '';
  }
  
  private getStoredUser(): IUser | null {
  try {
    const user = JSON.parse(localStorage.getItem(LOCAL_STORAGE_NAME) || sessionStorage.getItem(LOCAL_STORAGE_NAME) || 'null');
    return user && user.login && (user.access_token || user.psw) ? user : null;
  } catch {
    return null;
  }
}
}
