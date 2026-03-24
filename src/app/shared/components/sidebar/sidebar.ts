import { Component } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  host: {
    '[class.is-collapsed]': 'collapsed',
  },
})
export class SidebarComponent {
  query = '';
  collapsed = false;

  toggleCollapsed(): void {
    this.collapsed = !this.collapsed;
  }

  onSearch(): void {
    // Placeholder: aquí puedes conectar la búsqueda real más adelante.
    const trimmed = this.query.trim();
    if (!trimmed) return;
    console.log('Buscar:', trimmed);
  }
}
