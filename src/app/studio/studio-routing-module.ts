import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StudioComponent } from './studio';
import { StudioPanelComponent } from '../shared/components/studio-panel/studio-panel';
import { StudioContentComponent } from '../shared/components/studio-content/studio-content';
import { StudioAnalyticsComponent } from '../shared/components/studio-analytics/studio-analytics';
import { StudioCommunityComponent } from '../shared/components/studio-community/studio-community';
import { StudioQuickFormComponent } from '../shared/components/studio-quick-form/studio-quick-form';
import { StudioRevenueComponent } from '../shared/components/studio-revenue/studio-revenue';
import { StudioSettingsComponent } from '../shared/components/studio-settings/studio-settings';
import { StudioFeedbackComponent } from '../shared/components/studio-feedback/studio-feedback';



const routes: Routes = [
  {
    path: '',
    component: StudioComponent,
    children: [
      { path: '', redirectTo: 'panel', pathMatch: 'full' },
      { path: 'panel', component: StudioPanelComponent },
      { path: 'crear-rapido', component: StudioQuickFormComponent },
      { path: 'contenido', component: StudioContentComponent },
      { path: 'analytics', component: StudioAnalyticsComponent },
      { path: 'comunidad', component: StudioCommunityComponent },
      { path: 'ingresos', component: StudioRevenueComponent },
      { path: 'configuracion', component: StudioSettingsComponent },
      { path: 'comentarios', component: StudioFeedbackComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StudioRoutingModule {}
