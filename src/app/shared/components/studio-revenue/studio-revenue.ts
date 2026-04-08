import { Component, inject } from '@angular/core';
import { CreatorRevenueService } from '../../../core/services/creator-revenue';

@Component({
  selector: 'app-studio-revenue',
  standalone: false,
  templateUrl: './studio-revenue.html',
  styleUrl: './studio-revenue.css',
})
export class StudioRevenueComponent {
  private readonly creatorRevenueService = inject(CreatorRevenueService);

  readonly summary$ = this.creatorRevenueService.getSummary();
}
