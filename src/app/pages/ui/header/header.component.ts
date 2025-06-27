import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  navItems = [
    { text: "ГЛАВНАЯ", width: "165px", route: "/main" },
    { text: "НАШИ ПУТЕШЕСТВИЯ", width: "390px", route: "/travels" },
    { text: "ОТЗЫВЫ", width: "334px", route: "/faq" },
  ];
}