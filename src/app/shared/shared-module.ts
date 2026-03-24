import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar';
import { ShortsFeedComponent } from './components/reels/reels';
import { Header } from './components/header/header';
import { FooterComponent } from './components/footer/footer';
import { RoleSelectorComponent } from './components/role-selector/role-selector';
import { AuthFloatingInputComponent } from './components/auth-floating-input/auth-floating-input';

@NgModule({
  declarations: [
    SidebarComponent,
    ShortsFeedComponent,
    Header,
    FooterComponent,
    RoleSelectorComponent,
    AuthFloatingInputComponent,
  ],
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  exports: [
    SidebarComponent,    // <-- Exportamos la barra lateral
    ShortsFeedComponent, // <-- Exportamos el feed de videos
    Header,              // <-- Exportamos el nuevo header
    FooterComponent,     // <-- Exportamos el nuevo footer
    RoleSelectorComponent,
    AuthFloatingInputComponent,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class SharedModule { }