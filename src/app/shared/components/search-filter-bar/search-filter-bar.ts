import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-search-filter-bar',
  standalone: false,
  templateUrl: './search-filter-bar.html',
  styleUrl: './search-filter-bar.css',
})
export class SearchFilterBarComponent {
  @Input() placeholder = 'Buscar...';
  @Input() query = '';

  @Output() queryChange = new EventEmitter<string>();
  @Output() searchSubmit = new EventEmitter<string>();
  @Output() filterClick = new EventEmitter<void>();

  onQueryInput(value: string): void {
    this.query = value;
    this.queryChange.emit(this.query);
  }

  onSubmit(): void {
    this.searchSubmit.emit(this.query);
  }

  onFilterClick(): void {
    this.filterClick.emit();
  }
}
