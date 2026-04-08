import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-creator-dashboard',
  standalone: false,
  templateUrl: './creator-dashboard.html',
  styleUrl: './creator-dashboard.css',
})
export class CreatorDashboardComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private subscription: Subscription | null = null;

  readonly user$ = this.authService.currentUser$;

  activeView: 'home' | 'courses' = 'home';

  ngOnInit(): void {
    this.subscription = new Subscription();

    this.subscription.add(
      this.route.queryParamMap.subscribe((params) => {
        const view = params.get('view');
        this.activeView = view === 'courses' ? 'courses' : 'home';
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
  }
}
