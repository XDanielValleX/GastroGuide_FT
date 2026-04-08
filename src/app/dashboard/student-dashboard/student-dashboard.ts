import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-student-dashboard',
  templateUrl: './student-dashboard.html',
  styleUrls: ['./student-dashboard.css'],
  standalone: false
})
export class StudentDashboardComponent implements OnInit, OnDestroy {

  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private subscription: Subscription | null = null;

  readonly user$ = this.authService.currentUser$;

  activeView: 'home' | 'courses' = 'home';

  constructor() { }

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