import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';

export type CourseState = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

// Must match backend enums (Spring/Jackson expects exact strings)
export type DifficultyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export type CourseCategory =
  | 'BASIC_TECHNIQUES'
  | 'PASTRY'
  | 'INTERNATIONAL_CUISINE'
  | 'MIXOLOGY'
  | 'RESTAURANT_MANAGEMENT'
  | 'MOLECULAR_CUISNE'
  | 'BAKING'
  | 'SMMELIER'
  | 'NUTRION'
  | 'FOOD_PHOTOGRAPHY';

export type CuisineType =
  | 'ITALIAN'
  | 'FRENCH'
  | 'ASIAN'
  | 'LATIN_AMERICAN'
  | 'FUSION'
  | 'MEDITERRANEAN'
  | 'MIDDLE_EASTERN'
  | 'AFRICAN'
  | 'AMERICAN'
  | 'NONE'
  | 'OTHER';

export interface CreateCoursePayload {
  title: string;
  description: string;
  difficultyLevel: DifficultyLevel;
  category: CourseCategory;
  cuisineType: CuisineType;
}

export interface CreateCourseResponseDto {
  id: number;
}

export interface CreateModulePayload {
  courseId: number;
  title: string;
  description: string;
}

export interface CreateModuleResponseDto {
  id: number;
}

export interface CreateLessonPayload {
  moduleId: number;
  title: string;
  content: string;
}

export interface CreateLessonResponseDto {
  id: number;
}

export interface UpdateCoursePayload {
  title?: string;
  description?: string;
  difficultyLevel?: DifficultyLevel;
  category?: CourseCategory;
  cuisineType?: CuisineType;
  coverImageUrl?: string;
  tags?: string;
  language?: string;
}

export interface CourseDto {
  id: number;
  title: string;
  description: string;
  state: CourseState;
  difficultyLevel: DifficultyLevel;
  category: CourseCategory;
  cuisineType: CuisineType;
  coverImageUrl?: string | null;
  tags?: string | null;
  language?: string | null;
  price?: number | null;
  isFree?: boolean | null;
  estimatedDurationMinutes?: number | null;
  creator?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
  } | null;
}

export interface PaginationResult<T> {
  content: T[];
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
}

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  private readonly apiBaseUrl = 'http://localhost:8080/api';
  private readonly requestTimeoutMs = 15000;

  constructor(private readonly http: HttpClient) {}

  createCourse(payload: CreateCoursePayload): Observable<CreateCourseResponseDto> {
    return this.http
      .post<CreateCourseResponseDto>(`${this.apiBaseUrl}/courses/create`, payload)
      .pipe(timeout(this.requestTimeoutMs));
  }

  updateCourse(courseId: number, payload: UpdateCoursePayload): Observable<string> {
    return this.http
      .patch(`${this.apiBaseUrl}/courses/${courseId}`, payload, { responseType: 'text' })
      .pipe(timeout(this.requestTimeoutMs));
  }

  createModule(payload: CreateModulePayload): Observable<CreateModuleResponseDto> {
    return this.http
      .post<CreateModuleResponseDto>(`${this.apiBaseUrl}/modules/create`, payload)
      .pipe(timeout(this.requestTimeoutMs));
  }

  createLesson(payload: CreateLessonPayload): Observable<CreateLessonResponseDto> {
    return this.http
      .post<CreateLessonResponseDto>(`${this.apiBaseUrl}/lessons/create`, payload)
      .pipe(timeout(this.requestTimeoutMs));
  }

  getCourseById(courseId: number): Observable<CourseDto> {
    return this.http.get<CourseDto>(`${this.apiBaseUrl}/courses/${courseId}`).pipe(timeout(this.requestTimeoutMs));
  }

  getPublishedCourses(params?: {
    pageNumber?: number;
    pageSize?: number;
    sortBy?: string;
    direction?: 'asc' | 'desc';
  }): Observable<PaginationResult<CourseDto>> {
    const pageNumber = params?.pageNumber ?? 0;
    const pageSize = params?.pageSize ?? 20;
    const sortBy = params?.sortBy ?? 'id';
    const direction = params?.direction ?? 'asc';

    const query = `pageNumber=${encodeURIComponent(pageNumber)}&pageSize=${encodeURIComponent(pageSize)}&sortBy=${encodeURIComponent(
      sortBy
    )}&direction=${encodeURIComponent(direction)}`;

    return this.http
      .get<PaginationResult<CourseDto>>(`${this.apiBaseUrl}/courses/published?${query}`)
      .pipe(timeout(this.requestTimeoutMs));
  }
}
