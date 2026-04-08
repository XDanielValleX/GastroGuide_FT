import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService, User } from '../core/services/auth';

@Component({
  selector: 'app-studio',
  standalone: false,
  templateUrl: './studio.html',
  styleUrl: './studio.css',
})
export class StudioComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private subscription: Subscription | null = null;

  avatarInitial = 'U';

  ngOnInit(): void {
    this.subscription = this.authService.currentUser$.subscribe((currentUser) => {
      this.avatarInitial = this.computeInitial(currentUser);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
  }

  private computeInitial(user: User | null): string {
    const name = (user?.firstName || user?.email || '').trim();
    return name ? name[0].toUpperCase() : 'U';
  }
}
