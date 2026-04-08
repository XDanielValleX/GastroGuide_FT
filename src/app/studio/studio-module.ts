import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared-module';
import { StudioRoutingModule } from './studio-routing-module';

import { StudioComponent } from './studio';
import { StudioPanelComponent } from '../shared/components/studio-panel/studio-panel';
import { StudioQuickFormComponent } from '../shared/components/studio-quick-form/studio-quick-form';
import { StudioContentComponent } from '../shared/components/studio-content/studio-content';
import { StudioAnalyticsComponent } from '../shared/components/studio-analytics/studio-analytics';
import { StudioCommunityComponent } from '../shared/components/studio-community/studio-community';
import { StudioRevenueComponent } from '../shared/components/studio-revenue/studio-revenue';
import { StudioSettingsComponent } from '../shared/components/studio-settings/studio-settings';
import { StudioFeedbackComponent } from '../shared/components/studio-feedback/studio-feedback';

@NgModule({
  declarations: [
    StudioComponent,
    StudioPanelComponent,
    StudioQuickFormComponent,
    StudioContentComponent,
    StudioAnalyticsComponent,
    StudioCommunityComponent,
    StudioRevenueComponent,
    StudioSettingsComponent,
    StudioFeedbackComponent,
  ],
  imports: [CommonModule, SharedModule, StudioRoutingModule],
})
export class StudioModule {}

