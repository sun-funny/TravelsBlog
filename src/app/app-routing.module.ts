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
      return m.MainModule;
    }
    ),
  },
  {
  path: 'travels',
  children: [
      { path: '', loadChildren: () => import('./pages/travels/travels.module').then(m => m.TravelsModule) },
      { path: ':id', loadChildren: () => import('./pages/country/country.module').then(m => m.CountryModule) }
    ]
  },
  {
    path: 'faq',
    loadChildren: () => import('./pages/faq/faq.module').then(m => m.FaqModule),
    //canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: 'main'
  },
  { path: '', 
    redirectTo: 'main', 
    pathMatch: 'full' 
  },
];


@NgModule({
  imports: [RouterModule.forRoot(routes, {
    preloadingStrategy: PreloadAllModules
  })],
  exports: [RouterModule]
})
export class AppRoutingModule {
}