import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { IUser } from "../../../models/users";
import { ConfigService } from "../../../services/config/config.service";
import { ServerError } from 'src/app/models/error';
import { AuthService } from 'src/app/services/auth/auth.service';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss']
})
export class RegistrationComponent implements OnInit {
  login: string;
  password: string;
  repeatPassword: string;
  cardNumber: string = '';
  email: string;
  isRemember: boolean;
  isShowCardNumber: boolean;

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.isShowCardNumber = ConfigService.config.useUserCard;
  }

  onAuth(): void {
    if (this.password !== this.repeatPassword) {
      this.messageService.add({severity: 'error', summary: 'Passwords are not the same'});
      return;
    }

    const userObj: IUser = {
      login: this.login,
      cardNumber: this.cardNumber,
      psw: this.password,
      email: this.email,
      id: ''
    };

    this.http.post('http://localhost:3000/users/', userObj).subscribe(
  (data: Object) => {
    this.messageService.add({severity:'success', summary:'Регистрация прошла успешно'});
    if (this.isRemember) {
      const objUserJsonStr = JSON.stringify(userObj);
      window.localStorage.setItem('user_'+userObj.login, objUserJsonStr);
    }
  },
  (error: HttpErrorResponse) => {
    console.log('error', error);
     const serverError = <ServerError>error.error;
      this.messageService.add({
        severity:'warn', 
        summary: serverError.errorText
      });
  });    
  }
}
