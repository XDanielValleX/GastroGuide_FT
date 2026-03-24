import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: false,
  templateUrl: './footer.html',
  styleUrls: ['./footer.css']
})
export class FooterComponent {
  email: string = '';
  submitting: boolean = false;
  submitted: boolean = false;
  year: number = new Date().getFullYear();

  onSubscribe(event: Event) {
    event.preventDefault();
    if (!this.email) return;

    this.submitting = true;

    // Simulamos una llamada a la API
    setTimeout(() => {
      this.submitting = false;
      this.submitted = true;
      this.email = '';

      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        this.submitted = false;
      }, 3000);
    }, 1500);
  }
}