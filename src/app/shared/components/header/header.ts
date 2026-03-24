import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {
  private readonly authService = inject(AuthService);

  showCreate = false;
  profileRoute: string = '/dashboard/student';
  user: { image?: string | null; username?: string; name?: string } | null = null;

  ngOnInit(): void {
    const currentUser = this.authService.currentUserValue;

    this.user = currentUser
      ? {
          name: currentUser.firstName,
          username: currentUser.firstName,
          image: null,
        }
      : null;

    this.showCreate = currentUser?.role === 'CREATOR';

    if (currentUser?.role === 'ADMIN') {
      this.profileRoute = '/dashboard/admin';
    } else if (currentUser?.role === 'CREATOR') {
      this.profileRoute = '/dashboard/creator';
    } else {
      this.profileRoute = '/dashboard/student';
    }
  }

  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement | null;
    if (img) {
      img.src = '';
    }
    if (this.user) {
      this.user.image = null;
    }
  }

  onLogoutClick(): void {
    this.authService.logout();
  }
}
