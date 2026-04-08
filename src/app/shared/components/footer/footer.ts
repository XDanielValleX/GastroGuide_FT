import { Component, OnDestroy, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-footer',
  standalone: false,
  templateUrl: './footer.html',
  styleUrls: ['./footer.css']
})
export class FooterComponent implements OnDestroy {
  private readonly router = inject(Router);
  private subscription: Subscription | null = null;

  showFooter = true;
  year: number = new Date().getFullYear();

  constructor() {
    this.subscription = new Subscription();

    // Track route to show/hide footer.
    this.subscription.add(
      this.router.events
        .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
        .subscribe((e) => {
          this.showFooter = !e.urlAfterRedirects.startsWith('/auth');
        })
    );

    // Also set initial value.
    this.showFooter = !this.router.url.startsWith('/auth');
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
  }

}