import { Component, inject } from '@angular/core';
import { map } from 'rxjs';
import { AuthService, User } from '../../../core/services/auth';

@Component({
  selector: 'app-studio-sidebar',
  standalone: false,
  templateUrl: './studio-sidebar.html',
  styleUrl: './studio-sidebar.css',
})
export class StudioSidebarComponent {
  private readonly authService = inject(AuthService);

  readonly vm$ = this.authService.currentUser$.pipe(
    map((user) => ({
      initial: this.computeInitial(user),
      name: (user?.firstName || '').trim() || '—',
    }))
  );

  private computeInitial(user: User | null): string {
    const name = (user?.firstName || user?.email || '').trim();
    return name ? name[0].toUpperCase() : 'U';
  }
}
