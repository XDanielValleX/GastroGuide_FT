import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { Subscription } from 'rxjs';

interface GastroShort {
  id: string;
  videoUrl: string;
  creator: string;
  description: string;
  hashtags: string[];
  likes: number;
  comments: number;
}

@Component({
  selector: 'app-reels-feed',
  templateUrl: './reels.html',
  styleUrls: ['./reels.css'],
  standalone: false
})
export class ShortsFeedComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly defaultVolume = 1;
  private readonly audioState = new Map<string, { volume: number; muted: boolean }>();
  private globalVolume = this.defaultVolume;
  private globalMuted = false;

  private readonly playState = new Map<string, { userPaused: boolean }>();
  private intersectionObserver?: IntersectionObserver;
  private readonly visibilityRatio = new Map<HTMLVideoElement, number>();
  private videoListChangesSub?: Subscription;

  @ViewChildren('videoEl')
  private readonly videoEls!: QueryList<ElementRef<HTMLVideoElement>>;

  gastroShorts: GastroShort[] = [
    {
      id: '1',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      creator: 'Chef Daniel Ortiz',
      description: 'Cómo picar cebolla como un profesional 🧅🔪',
      hashtags: ['cocina', 'tips', 'cebolla'],
      likes: 15300,
      comments: 432
    },
    {
      id: '2',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      creator: 'Chef Valentina Ríos',
      description: '3 trucos para un arroz perfecto (sin que se pegue) 🍚',
      hashtags: ['arroz', 'trucos', 'cocina'],
      likes: 8750,
      comments: 210
    },
    {
      id: '3',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      creator: 'Chef Marco Pérez',
      description: 'Salsa rápida para pasta en 5 minutos 🍝',
      hashtags: ['pasta', 'salsa', 'rapido'],
      likes: 22100,
      comments: 980
    },
    {
      id: '4',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      creator: 'Cocina con Sofía',
      description: 'Cómo lograr una tortilla jugosa (sin romperla) 🥚',
      hashtags: ['tortilla', 'huevos', 'tips'],
      likes: 1290,
      comments: 64
    },
    {
      id: '5',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      creator: 'Chef Andrés Molina',
      description: 'Corta y guarda hierbas frescas para toda la semana 🌿',
      hashtags: ['hierbas', 'mealprep', 'conservacion'],
      likes: 50300,
      comments: 1502
    },
    {
      id: '6',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      creator: 'Chef Daniel Ortiz',
      description: 'Sellado perfecto: evita que la carne suelte jugo 🥩',
      hashtags: ['carne', 'sellado', 'tecnica'],
      likes: 31200,
      comments: 740
    }
  ];

  constructor() { }

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
    this.videoListChangesSub = this.videoEls.changes.subscribe(() => this.setupIntersectionObserver());
  }

  ngOnDestroy(): void {
    this.videoListChangesSub?.unsubscribe();
    this.intersectionObserver?.disconnect();
    this.visibilityRatio.clear();
  }

  togglePlay(id: string, video: HTMLVideoElement): void {
    if (!video) return;

    const state = this.ensurePlayState(id);

    if (video.paused) {
      state.userPaused = false;
      this.playState.set(id, state);
      this.pauseAllExcept(id);
      this.applyAudioState(id, video);
      void this.playWithAutoplayFallback(id, video);
    } else {
      state.userPaused = true;
      this.playState.set(id, state);
      video.pause();
    }
  }

  isMuted(id: string): boolean {
    return this.ensureAudioState(id).muted;
  }

  getVolume(id: string): number {
    return this.ensureAudioState(id).volume;
  }

  applyAudioState(id: string, video: HTMLVideoElement): void {
    if (!video) return;
    const state = this.ensureAudioState(id);
    video.volume = state.volume;
    video.muted = state.muted;
  }

  toggleMute(id: string, video: HTMLVideoElement): void {
    const state = this.ensureAudioState(id);
    state.muted = !state.muted;

    if (!state.muted && state.volume === 0) {
      state.volume = this.defaultVolume;
    }

    this.audioState.set(id, state);
    this.globalMuted = state.muted;
    this.globalVolume = state.volume;

    if (video) {
      video.volume = state.volume;
      video.muted = state.muted;
      if (!state.muted) {
        void this.playWithAutoplayFallback(id, video);
      }
    }
  }

  onVolumeInput(id: string, video: HTMLVideoElement, event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const rawValue = input ? Number.parseFloat(input.value) : Number.NaN;
    const volume = Number.isFinite(rawValue) ? Math.min(1, Math.max(0, rawValue)) : this.defaultVolume;

    const state = this.ensureAudioState(id);
    state.volume = volume;
    state.muted = volume === 0;
    this.audioState.set(id, state);
    this.globalMuted = state.muted;
    this.globalVolume = state.volume;

    if (video) {
      video.volume = volume;
      video.muted = state.muted;
      void this.playWithAutoplayFallback(id, video);
    }
  }

  creatorInitial(creator: string): string {
    const initial = (creator ?? '').trim().slice(0, 1).toUpperCase();
    return initial || '?';
  }

  onCreatorClick(short: GastroShort): void {
    // Placeholder: aquí puedes navegar a un perfil real cuando exista la ruta.
    console.log('Ver perfil del creador:', short.creator);
  }

  formatCount(value: number): string {
    if (!Number.isFinite(value)) return '0';
    const abs = Math.abs(value);

    if (abs >= 1_000_000_000) {
      return `${this.roundToOneDecimal(value / 1_000_000_000)}B`;
    }
    if (abs >= 1_000_000) {
      return `${this.roundToOneDecimal(value / 1_000_000)}M`;
    }
    if (abs >= 1_000) {
      return `${this.roundToOneDecimal(value / 1_000)}K`;
    }
    return `${value}`;
  }

  private roundToOneDecimal(value: number): string {
    const rounded = Math.round(value * 10) / 10;
    return Number.isInteger(rounded) ? `${rounded.toFixed(0)}` : `${rounded.toFixed(1)}`;
  }

  private ensureAudioState(id: string): { volume: number; muted: boolean } {
    const existing = this.audioState.get(id);
    if (existing) return existing;

    const initial = { volume: this.globalVolume, muted: this.globalMuted };
    this.audioState.set(id, initial);
    return initial;
  }

  private ensurePlayState(id: string): { userPaused: boolean } {
    const existing = this.playState.get(id);
    if (existing) return existing;

    const initial = { userPaused: false };
    this.playState.set(id, initial);
    return initial;
  }

  private setupIntersectionObserver(): void {
    this.intersectionObserver?.disconnect();
    this.visibilityRatio.clear();

    this.pauseAllExcept(null);

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const video = entry.target as HTMLVideoElement;
          this.visibilityRatio.set(video, entry.intersectionRatio);
        }

        const mostVisible = this.getMostVisibleVideo();
        if (!mostVisible) {
          this.pauseAllExcept(null);
          return;
        }

        const id = mostVisible.dataset['id'] ?? null;
        if (!id) {
          this.pauseAllExcept(null);
          return;
        }

        this.pauseAllExcept(id);

        const playState = this.ensurePlayState(id);
        if (!playState.userPaused) {
          this.applyAudioState(id, mostVisible);
          void this.playWithAutoplayFallback(id, mostVisible);
        }
      },
      {
        threshold: [0, 0.25, 0.5, 0.65, 0.75, 0.9, 1],
      }
    );

    for (const ref of this.videoEls?.toArray() ?? []) {
      const video = ref.nativeElement;
      this.visibilityRatio.set(video, 0);
      this.intersectionObserver.observe(video);
    }
  }

  private getMostVisibleVideo(): HTMLVideoElement | null {
    let best: HTMLVideoElement | null = null;
    let bestRatio = 0;

    for (const [video, ratio] of this.visibilityRatio.entries()) {
      if (ratio > bestRatio) {
        bestRatio = ratio;
        best = video;
      }
    }

    return bestRatio >= 0.65 ? best : null;
  }

  private pauseAllExcept(activeId: string | null): void {
    for (const ref of this.videoEls?.toArray() ?? []) {
      const video = ref.nativeElement;
      const id = video.dataset['id'] ?? null;

      if (!activeId || id !== activeId) {
        video.pause();
      }
    }
  }

  private async playWithAutoplayFallback(id: string, video: HTMLVideoElement): Promise<void> {
    try {
      await video.play();
    } catch {
      // Some browsers block autoplay with sound. If that happens, fall back to muted playback.
      if (!video.muted) {
        const state = this.ensureAudioState(id);
        state.muted = true;
        this.audioState.set(id, state);
        this.globalMuted = true;
        video.muted = true;
        try {
          await video.play();
        } catch {
          // ignore
        }
      }
    }
  }
}