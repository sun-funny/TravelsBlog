import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router'; // Добавляем Router
import { IUser } from "../../../models/users";
import { ServerError } from 'src/app/models/error';
import { AuthService } from 'src/app/services/auth/auth.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss']
})
export class RegistrationComponent implements OnInit {
  login: string;
  password: string;
  repeatPassword: string;
  email: string;

  constructor(
    private http: HttpClient,
    private router: Router, // Добавляем Router
    private messageService: MessageService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Сохраняем текущий URL при загрузке компонента регистрации
    const currentUrl = this.router.url;
    if (currentUrl !== '/auth') {
      this.authService.saveReturnUrl(currentUrl);
    }
  }

  onAuth(): void {
    if (this.password !== this.repeatPassword) {
      this.messageService.add({severity: 'error', summary: 'Passwords are not the same'});
      return;
    }

    const userObj: IUser = {
      login: this.login,
      psw: this.password,
      email: this.email,
      id: ''
    };

    this.http.post(`${environment.apiUrl}/users/`, userObj).subscribe(
      (data: any) => {
        this.messageService.add({severity:'success', summary:'Регистрация прошла успешно'});
        
        // После успешной регистрации сразу авторизуем пользователя
        const authUser: IUser = {
          login: this.login,
          psw: this.password,
          email: this.email,
          _id: data.id || '',
          role: data.role || 'user',
          access_token: data.access_token || '',
          refresh_token: data.refresh_token || ''
        };
        
        // Авторизуем и делаем редирект на сохраненный URL
        this.authService.setUser(authUser, false);
        const returnUrl = this.authService.getStoredReturnUrl();
        this.authService.clearStoredReturnUrl();
        this.router.navigateByUrl(returnUrl);
      },
      (error: HttpErrorResponse) => {
        console.log('error', error);
        const serverError = <ServerError>error.error;
        this.messageService.add({
          severity:'warn', 
          summary: serverError.errorText
        });
      }
    );    
  }
}