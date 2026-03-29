import { Component, OnInit, HostListener } from '@angular/core';
import { AuthService } from 'src/app/services/auth/auth.service';
import { Router } from '@angular/router';

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
  mobileMenuOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.userBehavior$.subscribe(user => {
      this.isAuthenticated = !!user;
      this.userName = user?.login || '';
    });
  }

  onAuthClick(): void {
    if (!this.isAuthenticated) {
      const currentUrl = this.router.url;
      this.authService.saveReturnUrl(currentUrl || '/main');
      this.router.navigate(['/auth']);
    }
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    // Блокируем скролл body при открытом меню
    if (this.mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
    document.body.style.overflow = '';
  }

  // Закрываем меню при изменении размера окна (если стало десктопным)
  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    if (window.innerWidth > 768 && this.mobileMenuOpen) {
      this.closeMobileMenu();
    }
  }
}