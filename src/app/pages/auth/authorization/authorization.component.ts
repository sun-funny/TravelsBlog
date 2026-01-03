import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { IUser } from "../../../models/users";
import { AuthService } from 'src/app/services/auth/auth.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-authorization',
  templateUrl: './authorization.component.html',
  styleUrls: ['./authorization.component.scss'],
})
export class AuthorizationComponent implements OnInit {
  login: string;
  password: string;
  rememberMe: boolean = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private messageService: MessageService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Сохраняем текущий URL при загрузке компонента авторизации
    const currentUrl = this.router.url;
    if (currentUrl !== '/auth') {
      this.authService.saveReturnUrl(currentUrl);
    }
  }

  onAuth(): void {
    const authUser: IUser = {
      login: this.login,
      psw: this.password,
      email: ''
    };
    
    this.http.post<{access_token: string, refresh_token: string, id: string, role: string}>(
      `${environment.apiUrl}/users/${this.login}`,
      authUser
    ).subscribe(
      (data) => {
        const userData = {
          login: this.login,
          _id: data.id,
          role: data.role,
          access_token: data.access_token,
          refresh_token: data.refresh_token
        };
        this.authService.setUser(userData, this.rememberMe);
        
        // После успешной авторизации делаем редирект на сохраненный URL
        const returnUrl = this.authService.getStoredReturnUrl();
        this.authService.clearStoredReturnUrl();
        this.router.navigateByUrl(returnUrl);
      },
      (error) => {
        console.error('Error:', error);
        if (error.status === 401) {
          this.messageService.add({severity:'error', summary:'Неверный пароль'});
        } else if (error.status === 404) {
          const serverMessage = error.error?.message || 'Пользователь не найден';
          this.messageService.add({severity:'warn', summary: serverMessage});
        } else {
          this.messageService.add({severity:'warn', summary:'Ошибка авторизации'});
        }
      }
    );
  }
}