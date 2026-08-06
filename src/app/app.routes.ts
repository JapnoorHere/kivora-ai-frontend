import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.HomeComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'recipes/:id/ingredients',
    loadComponent: () => import('./pages/ingredients/ingredients').then((m) => m.IngredientsComponent),
    canActivate: [authGuard],
  },
  {
    path: 'recipes/:id/steps',
    loadComponent: () => import('./pages/steps/steps').then((m) => m.StepsComponent),
    canActivate: [authGuard],
  },
  {
    path: 'recent',
    loadComponent: () => import('./pages/recent/recent').then((m) => m.RecentComponent),
    canActivate: [authGuard],
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings').then((m) => m.SettingsComponent),
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
