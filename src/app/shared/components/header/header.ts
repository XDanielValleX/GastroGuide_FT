import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth';
import { Subscription } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private subscription: Subscription | null = null;
  private readonly avatarStorageKey = 'gastro_avatar';
  private readonly defaultAvatarUrl = '/avatar-default.svg';

  showCreate = false;
  profileRoute: string = '/dashboard/student';
  user: { image?: string | null; username?: string; name?: string } | null = null;
  isDashboard = false;
  isStudentDashboard = false;
  isCreatorDashboard = false;
  dashboardQuery = '';
  dashboardView: 'home' | 'courses' | 'create' = 'home';
  avatarSrc = this.defaultAvatarUrl;

  get hasAvatarImage(): boolean {
    return !!this.avatarSrc && this.avatarSrc !== this.defaultAvatarUrl;
  }

  get avatarInitial(): string {
    const name = (this.user?.username || this.user?.name || '').trim();
    return name ? name[0].toUpperCase() : 'U';
  }

  showCategories = true;
  studentCategories: string[] = [
    'Técnicas',
    'Recetas',
    'Repostería',
    'Panadería',
    'Cocina saludable',
    'Cocina internacional',
    'Emplatado',
  ];
  activeStudentCategory: string = this.studentCategories[0] ?? 'Técnicas';

  ngOnInit(): void {
    this.subscription = new Subscription();

    this.updateRouteContext(this.router.url);
    this.avatarSrc = localStorage.getItem(this.avatarStorageKey) || this.defaultAvatarUrl;
    this.subscription.add(
      this.router.events
        .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
        .subscribe((e) => {
          this.updateRouteContext(e.urlAfterRedirects);
          this.avatarSrc = localStorage.getItem(this.avatarStorageKey) || this.defaultAvatarUrl;
        })
    );

    this.subscription.add(this.authService.currentUser$.subscribe((currentUser) => {
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
    }));
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
  }

  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement | null;
    if (img) {
      img.src = this.defaultAvatarUrl;
    }
    this.avatarSrc = this.defaultAvatarUrl;
  }

  onLogoutClick(): void {
    this.authService.logout();
  }

  onDashboardQueryChange(value: string): void {
    this.dashboardQuery = value;
    void this.router.navigate([], {
      queryParams: { q: value ? value : null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  onDashboardSearchSubmit(value: string): void {
    this.onDashboardQueryChange(value);
    this.setDashboardView('courses');
  }

  onDashboardFilterClick(): void {
    if (this.isStudentDashboard || this.isCreatorDashboard) {
      this.showCategories = !this.showCategories;
      return;
    }

    // UX previo: en otros dashboards, este botón funciona como atajo a "Cursos".
    this.setDashboardView('courses');
  }

  setActiveStudentCategory(category: string): void {
    this.activeStudentCategory = category;
  }

  onCreateClick(): void {
    void this.router.navigate(['/studio'], { replaceUrl: true });
  }

  setDashboardView(view: 'home' | 'courses'): void {
    this.dashboardView = view;
    void this.router.navigate([], {
      queryParams: { view },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private parseDashboardView(url: string): 'home' | 'courses' | 'create' {
    const viewParam = this.router.parseUrl(url).queryParams['view'];
    if (viewParam === 'courses') return 'courses';
    if (viewParam === 'create') return 'create';
    return 'home';
  }

  private updateRouteContext(url: string): void {
    const wasStudentDashboard = this.isStudentDashboard;
    const wasCreatorDashboard = this.isCreatorDashboard;

    this.isDashboard = url.startsWith('/dashboard');
    this.isStudentDashboard = url.startsWith('/dashboard/student');
    this.isCreatorDashboard = url.startsWith('/dashboard/creator');
    this.dashboardQuery = this.router.parseUrl(url).queryParams['q'] ?? '';
    this.dashboardView = this.parseDashboardView(url);

    if (!this.isStudentDashboard && !this.isCreatorDashboard) {
      this.showCategories = false;
      return;
    }

    // Entrando al dashboard de estudiante: mostrar por defecto.
    if (!wasStudentDashboard && this.isStudentDashboard) {
      this.showCategories = true;
    }

    // Dashboard de creador: mismo comportamiento que estudiante.
    if (!wasCreatorDashboard && this.isCreatorDashboard) {
      this.showCategories = true;
    }
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  scrollToSection(id: string): void {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
