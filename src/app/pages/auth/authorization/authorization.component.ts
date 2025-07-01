import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { IUser } from "../../../models/users";
import { AuthService } from 'src/app/services/auth/auth.service';

@Component({
  selector: 'app-authorization',
  templateUrl: './authorization.component.html',
  styleUrls: ['./authorization.component.scss'],
})
export class AuthorizationComponent implements OnInit {
  login: string;
  password: string;

  constructor(
    private http: HttpClient,
    private router: Router,
    private messageService: MessageService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
  }

  onAuth(): void {
    const authUser: IUser = {
      login: this.login,
      psw: this.password,
      email: ''
    };
    console.log('login', this.login);
    this.http.post<{access_token: string, id: string, role: string}>(
      'http://localhost:3000/users/' + this.login, 
      authUser
    ).subscribe(
      (data) => {
        console.log('Response:', data);
        const token: string = data.access_token;
        const userData = {
          login: this.login,
          _id: data.id,
          role: data.role,
          access_token: token
        };
        this.authService.setUser(userData);
        this.router.navigate(['/comments']);
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