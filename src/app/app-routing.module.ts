import {inject, NgModule} from '@angular/core';
import {CanActivateFn, PreloadAllModules, Router, RouterModule, Routes} from '@angular/router';
import {AuthService, RETURN_URL_KEY} from "./services/auth/auth.service";

const authGuardFunc: CanActivateFn = (activeRoute, activeRouter) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  
  if (!authService.isAuthenticated) {
    // Сохраняем URL, на который пытался зайти пользователь
    const returnUrl = activeRouter.url;
    localStorage.setItem(RETURN_URL_KEY, returnUrl || '/main');
    
    router.navigate(['auth']);
    return false;
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
    loadChildren: () => import('./pages/main/main.module').then(m => m.MainModule),
  },
  {
    path: 'travels',
    children: [
      { path: '', loadChildren: () => import('./pages/travels/travels.module').then(m => m.TravelsModule) },
    ]
  },
  {
    path: 'comments',
    loadChildren: () => import('./pages/comments/comments.module').then(m => m.CommentsModule),
    canActivate: [authGuardFunc] // Добавляем guard для комментариев
  },
  {
    path: 'team',
    loadChildren: () => import('./pages/team/team.module').then(m => m.TeamModule),
    canActivate: [authGuardFunc]
  },
  {
    path: '**',
    redirectTo: 'main'
  },
  { 
    path: '', 
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