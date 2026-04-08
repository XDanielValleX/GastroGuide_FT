import { Component } from '@angular/core';

type HomeBadge = { label: string };

type HomeCourseCard = {
  title: string;
  author: string;
  rating: number;
  reviewsLabel: string;
  priceLabel: string;
  oldPriceLabel?: string;
  badges?: HomeBadge[];
};

type HomePromoCard = {
  title: string;
  subtitle: string;
};

type HomeSkillTab = {
  key: string;
  label: string;
  courses: HomeCourseCard[];
};

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class HomeComponent {
  searchQuery = '';

  readonly recentCourses: HomeCourseCard[] = [
    {
      title: 'Cocina Colombiana: sabores de casa',
      author: 'Chef invitado',
      rating: 4.7,
      reviewsLabel: '1.2k valoraciones',
      priceLabel: '$ 49.900',
      oldPriceLabel: '$ 69.900',
      badges: [{ label: 'Lo más vendido' }],
    },
    {
      title: 'Panadería desde cero: masas y técnicas',
      author: 'Equipo GastroGuide',
      rating: 4.6,
      reviewsLabel: '860 valoraciones',
      priceLabel: '$ 39.900',
      oldPriceLabel: '$ 59.900',
      badges: [{ label: 'Lo más vendido' }],
    },
    {
      title: 'Cocina saludable: menú semanal práctico',
      author: 'Nutri & Cocina',
      rating: 4.5,
      reviewsLabel: '540 valoraciones',
      priceLabel: '$ 29.900',
    },
    {
      title: 'Salsas y fondos: el sabor profesional',
      author: 'Chef Atelier',
      rating: 4.8,
      reviewsLabel: '2.1k valoraciones',
      priceLabel: '$ 54.900',
      oldPriceLabel: '$ 74.900',
      badges: [{ label: 'Lo más vendido' }],
    },
  ];

  readonly trendingCourses: HomeCourseCard[] = [
    {
      title: 'Repostería creativa: postres que enamoran',
      author: 'Dulce Studio',
      rating: 4.6,
      reviewsLabel: '980 valoraciones',
      priceLabel: '$ 44.900',
      oldPriceLabel: '$ 64.900',
      badges: [{ label: 'Lo más vendido' }],
    },
    {
      title: 'Cuchillos y cortes: base para avanzar',
      author: 'Chef de Línea',
      rating: 4.7,
      reviewsLabel: '1.5k valoraciones',
      priceLabel: '$ 35.900',
    },
    {
      title: 'Cocina internacional: del wok al horno',
      author: 'GastroLab',
      rating: 4.4,
      reviewsLabel: '430 valoraciones',
      priceLabel: '$ 49.900',
      oldPriceLabel: '$ 59.900',
    },
    {
      title: 'Emplatado: presenta como un chef',
      author: 'Plato & Arte',
      rating: 4.6,
      reviewsLabel: '720 valoraciones',
      priceLabel: '$ 53.900',
      oldPriceLabel: '$ 72.900',
    },
  ];

  readonly promoCards: HomePromoCard[] = [
    {
      title: 'Cocina con propósito',
      subtitle: 'Rutas de aprendizaje para avanzar con confianza.',
    },
    {
      title: 'Aprende a tu ritmo',
      subtitle: 'Clases cortas, proyectos prácticos y seguimiento.',
    },
    {
      title: 'Comparte tu talento',
      subtitle: 'Crea cursos y conecta con estudiantes.',
    },
  ];

  readonly skillTabs: HomeSkillTab[] = [
    {
      key: 'basicos',
      label: 'Básicos',
      courses: [
        {
          title: 'Básicos de cocina: mise en place',
          author: 'GastroGuide',
          rating: 4.6,
          reviewsLabel: '2.2k valoraciones',
          priceLabel: '$ 19.900',
        },
        {
          title: 'Sopas y cremas: texturas perfectas',
          author: 'Cocina Real',
          rating: 4.5,
          reviewsLabel: '640 valoraciones',
          priceLabel: '$ 24.900',
        },
        {
          title: 'Arroces: del tradicional al gourmet',
          author: 'Chef invitado',
          rating: 4.7,
          reviewsLabel: '1.1k valoraciones',
          priceLabel: '$ 29.900',
        },
        {
          title: 'Vegetales: técnicas de cocción',
          author: 'GastroLab',
          rating: 4.4,
          reviewsLabel: '410 valoraciones',
          priceLabel: '$ 18.900',
        },
      ],
    },
    {
      key: 'reposteria',
      label: 'Repostería',
      courses: [
        {
          title: 'Galletas y brownies: clásicos',
          author: 'Dulce Studio',
          rating: 4.7,
          reviewsLabel: '980 valoraciones',
          priceLabel: '$ 22.900',
        },
        {
          title: 'Tortas: rellenos y coberturas',
          author: 'Pastelería 101',
          rating: 4.6,
          reviewsLabel: '1.7k valoraciones',
          priceLabel: '$ 34.900',
        },
        {
          title: 'Postres fríos: mousse y más',
          author: 'Plato & Arte',
          rating: 4.5,
          reviewsLabel: '620 valoraciones',
          priceLabel: '$ 28.900',
        },
        {
          title: 'Pan dulce: fermentación sin miedo',
          author: 'Equipo GastroGuide',
          rating: 4.8,
          reviewsLabel: '2.9k valoraciones',
          priceLabel: '$ 39.900',
        },
      ],
    },
    {
      key: 'saludable',
      label: 'Saludable',
      courses: [
        {
          title: 'Meal prep: organiza tu semana',
          author: 'Nutri & Cocina',
          rating: 4.6,
          reviewsLabel: '1.3k valoraciones',
          priceLabel: '$ 26.900',
        },
        {
          title: 'Snacks inteligentes',
          author: 'Cocina Real',
          rating: 4.4,
          reviewsLabel: '390 valoraciones',
          priceLabel: '$ 15.900',
        },
        {
          title: 'Proteínas: puntos de cocción',
          author: 'Chef de Línea',
          rating: 4.7,
          reviewsLabel: '980 valoraciones',
          priceLabel: '$ 32.900',
        },
        {
          title: 'Salsas ligeras: sabor sin exceso',
          author: 'GastroLab',
          rating: 4.5,
          reviewsLabel: '510 valoraciones',
          priceLabel: '$ 17.900',
        },
      ],
    },
    {
      key: 'tendencias',
      label: 'Tendencias',
      courses: [
        {
          title: 'Cocina de autor: técnicas modernas',
          author: 'Chef Atelier',
          rating: 4.6,
          reviewsLabel: '740 valoraciones',
          priceLabel: '$ 59.900',
        },
        {
          title: 'Fermentos: kombucha y encurtidos',
          author: 'GastroLab',
          rating: 4.5,
          reviewsLabel: '610 valoraciones',
          priceLabel: '$ 41.900',
        },
        {
          title: 'Plant-based: platos completos',
          author: 'Cocina Real',
          rating: 4.4,
          reviewsLabel: '430 valoraciones',
          priceLabel: '$ 36.900',
        },
        {
          title: 'Parrilla urbana: asados en casa',
          author: 'Chef de Línea',
          rating: 4.7,
          reviewsLabel: '1.4k valoraciones',
          priceLabel: '$ 52.900',
        },
      ],
    },
  ];

  activeSkillKey: string = this.skillTabs[0]?.key ?? 'basicos';

  get activeSkill(): HomeSkillTab {
    return this.skillTabs.find((t) => t.key === this.activeSkillKey) ?? this.skillTabs[0];
  }

  setActiveSkill(key: string): void {
    this.activeSkillKey = key;
  }

  onSearchSubmit(): void {
    // UX: Home es estático por ahora. Mantener la interacción de búsqueda sin navegación.
    // (Si luego decides hacer catálogo público, este handler se puede conectar.)
  }
}
