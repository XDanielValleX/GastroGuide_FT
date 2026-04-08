import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard'; // Revisa que la importación coincida con el nombre que te generó
import { creatorGuard } from './core/guards/creator-guard';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./home/home-module').then(m => m.HomeModule)
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth-module').then(m => m.AuthModule)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard], // Protegemos todo el módulo dashboard
    loadChildren: () => import('./dashboard/dashboard-module').then(m => m.DashboardModule)
  },
  {
    path: 'studio',
    canActivate: [creatorGuard],
    loadChildren: () => import('./studio/studio-module').then(m => m.StudioModule)
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }