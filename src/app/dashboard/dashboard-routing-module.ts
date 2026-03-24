import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StudentDashboardComponent } from './student-dashboard/student-dashboard';
import { CreatorDashboardComponent } from './creator-dashboard/creator-dashboard';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard';

const routes: Routes = [
  { path: 'student', component: StudentDashboardComponent },
  { path: 'creator', component: CreatorDashboardComponent },
  { path: 'admin', component: AdminDashboardComponent },
  // Si alguien entra a /dashboard a secas, lo mandamos por defecto a student (o donde prefieras)
  { path: '', redirectTo: 'student', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }