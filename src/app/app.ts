import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('gastroGuideFT');
  private readonly router = inject(Router);
  private subscription: Subscription | null = null;
  private routeTimer: number | null = null;
  private pendingDelay = false;

  // Small artificial delay to simulate real-world navigation.
  protected readonly routeReady = signal(true);

  ngOnInit(): void {
    this.subscription = new Subscription();

    this.subscription.add(
      this.router.events
        .pipe(
          filter(
            (e) =>
              e instanceof NavigationStart ||
              e instanceof NavigationEnd ||
              e instanceof NavigationCancel ||
              e instanceof NavigationError
          )
        )
        .subscribe((event) => {
          if (event instanceof NavigationStart) {
            const fromUrl = this.router.url;
            const toUrl = event.url;

            // Do NOT simulate loading when switching between Studio internal views.
            const isStudioInternalNav = fromUrl.startsWith('/studio') && toUrl.startsWith('/studio');
            if (isStudioInternalNav) {
              this.pendingDelay = false;
              return;
            }

            this.clearTimer();
            this.pendingDelay = true;
            this.routeReady.set(false);
            return;
          }

          // End/cancel/error: reveal view with a small delay.
          if (!this.pendingDelay) {
            return;
          }

          this.clearTimer();
          this.routeTimer = window.setTimeout(() => {
            this.routeReady.set(true);
            this.routeTimer = null;
            this.pendingDelay = false;
          }, 320);
        })
    );
  }

  ngOnDestroy(): void {
    this.clearTimer();
    this.subscription?.unsubscribe();
    this.subscription = null;
  }

  private clearTimer(): void {
    if (this.routeTimer !== null) {
      clearTimeout(this.routeTimer);
      this.routeTimer = null;
    }
  }
}
