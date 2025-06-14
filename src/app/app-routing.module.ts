import {inject, NgModule} from '@angular/core';
import {CanActivateFn, PreloadAllModules, Router, RouterModule, Routes} from '@angular/router';
import {AuthService} from "./services/auth/auth.service";
import {AuthGuard} from "./shared/guards/auth.guard";

const authGuardFunc: CanActivateFn = (activeRoute, activeRouter) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  if (!authService.isAuthenticated) {
    router.navigate(['auth']);
  }
  return true;
}

const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./pages/auth/auth.module').then(m => m.AuthModule),
  },
  {
    path: 'main',
    loadChildren: () => import('./pages/main/main.module').then(m => {
      console.log('Main Module is loading...');
      return m.MainModule;
    }
    ),
  },
  {
    path: '**',
    redirectTo: 'main'
  }
];


@NgModule({
  imports: [RouterModule.forRoot(routes, {
    preloadingStrategy: PreloadAllModules
  })],
  exports: [RouterModule]
})
export class AppRoutingModule {
}