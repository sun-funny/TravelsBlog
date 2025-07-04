import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  navItems = [
    { text: "ГЛАВНАЯ", width: "165px", route: "/main" },
    { text: "НАШИ ПУТЕШЕСТВИЯ", width: "390px", route: "/travels" },
    { text: "КОММЕНТАРИИ", width: "334px", route: "/comments" }
  ];

  isAuthenticated = false;
  userName = '';
  showTooltip = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.userBehavior$.subscribe(user => {
      this.isAuthenticated = !!user;
      this.userName = user?.login || '';
    });
  }
}