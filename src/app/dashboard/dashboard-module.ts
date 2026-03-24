import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardRoutingModule } from './dashboard-routing-module';
import { StudentDashboardComponent } from './student-dashboard/student-dashboard';
import { CreatorDashboardComponent } from './creator-dashboard/creator-dashboard';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard';
import { SharedModule } from '../shared/shared-module'; // <-- IMPORTANTE

@NgModule({
  declarations: [
    StudentDashboardComponent,
    CreatorDashboardComponent,
    AdminDashboardComponent
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    SharedModule // <-- Lo agregamos aquí
  ]
})
export class DashboardModule { }