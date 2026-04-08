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
import { SearchFilterBarComponent } from './components/search-filter-bar/search-filter-bar';
import { CreatorCreateCourseViewComponent } from './components/creator-create-course-view/creator-create-course-view';
import { CreatorCreateCourseInfoViewComponent } from './components/creator-create-course-info-view/creator-create-course-info-view';
import { CreatorCreateCourseModulesViewComponent } from './components/creator-create-course-modules-view/creator-create-course-modules-view';
import { CreatorCreateCourseLessonsViewComponent } from './components/creator-create-course-lessons-view/creator-create-course-lessons-view';
import { CreatorCreateCoursePublishViewComponent } from './components/creator-create-course-publish-view/creator-create-course-publish-view';
import { CreatorSavedCoursesPanelComponent } from './components/creator-saved-courses-panel/creator-saved-courses-panel';
import { StudentHomeViewComponent } from './components/student-home-view/student-home-view';
import { StudentCoursesViewComponent } from './components/student-courses-view/student-courses-view';
import { StudioSidebarComponent } from './components/studio-sidebar/studio-sidebar';

@NgModule({
  declarations: [
    SidebarComponent,
    ShortsFeedComponent,
    Header,
    FooterComponent,
    RoleSelectorComponent,
    AuthFloatingInputComponent,
    SearchFilterBarComponent,
    CreatorCreateCourseViewComponent,
    CreatorCreateCourseInfoViewComponent,
    CreatorCreateCourseModulesViewComponent,
    CreatorCreateCourseLessonsViewComponent,
    CreatorCreateCoursePublishViewComponent,
    CreatorSavedCoursesPanelComponent,
    StudentHomeViewComponent,
    StudentCoursesViewComponent,
    StudioSidebarComponent,
  ],
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  exports: [
    SidebarComponent,    // <-- Exportamos la barra lateral
    ShortsFeedComponent, // <-- Exportamos el feed de videos
    Header,              // <-- Exportamos el nuevo header
    FooterComponent,     // <-- Exportamos el nuevo footer
    RoleSelectorComponent,
    AuthFloatingInputComponent,
    SearchFilterBarComponent,
    CreatorCreateCourseViewComponent,
    CreatorSavedCoursesPanelComponent,
    StudentHomeViewComponent,
    StudentCoursesViewComponent,
    StudioSidebarComponent,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class SharedModule { }