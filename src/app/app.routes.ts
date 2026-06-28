import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.HomeComponent),
  },
  {
    path: 'ingredients',
    loadComponent: () => import('./pages/ingredients/ingredients').then((m) => m.IngredientsComponent),
    canActivate: [authGuard],
  },
  {
    path: 'steps',
    loadComponent: () => import('./pages/steps/steps').then((m) => m.StepsComponent),
    canActivate: [authGuard],
  },
  {
    path: 'recent',
    loadComponent: () => import('./pages/recent/recent').then((m) => m.RecentComponent),
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
