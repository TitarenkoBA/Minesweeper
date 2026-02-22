import { Injectable, Signal, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SoundService {
  public readonly isSoundEnabled!: Signal<boolean>;

  private readonly SOUND_ENABLED_KEY = 'soundEnabled';
  private isAudioContextInitialized = false;
  private readonly _isSoundEnabled = signal<boolean>(this.getInitialSoundState());
  private readonly activeAudioObjects = new Set<HTMLAudioElement>();
  private readonly audioCache = new Map<string, HTMLAudioElement>();
  private audioContext: AudioContext | null = null;
  private isPageVisible = true;
  private readonly isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  public constructor() {
    this._isSoundEnabled.set(this.getInitialSoundState());
    this.isSoundEnabled = this._isSoundEnabled.asReadonly();

    this.initializeAudioContext();
    this.initializePageVisibilityListener();
  }

  public toggleSound(): void {
    const newState = !this._isSoundEnabled();
    this._isSoundEnabled.set(newState);
    this.saveSoundState(newState);
  }

  public enableSound(): void {
    this._isSoundEnabled.set(true);
    this.saveSoundState(true);
  }

  public disableSound(): void {
    this._isSoundEnabled.set(false);
    this.saveSoundState(false);
  }

  public getPageVisibility(): boolean {
    return this.isPageVisible;
  }

  public stopAllSounds(): void {
    this.activeAudioObjects.forEach((audio) => {
      try {
        audio.pause();
        audio.currentTime = 0;
        audio.src = '';
      } catch {
        // nothing
      }
    });

    this.activeAudioObjects.clear();
  }
  public setVolumeAllSounds(newVolume: number, isMusicSoundChange = false): void {
    this.activeAudioObjects.forEach((audio) => {
      try {
        if (isMusicSoundChange) {
          if (!audio.src.startsWith('/assets')) {
            audio.volume = newVolume;
          }
        } else {
          if (audio.src.startsWith('/assets')) {
            audio.volume = newVolume;
          }
        }
      } catch {
        // nothing
      }
    });

  }

  public playSound(audioPath: string, volume = 0.5): void {
    if (volume && volume >= 1) {
      volume = volume/100
    }
    if (!this._isSoundEnabled()) {
      return;
    }

    if (!this.isPageVisible) {
      return;
    }

    if (!this.isAudioContextInitialized) {
      this.unlockAudioContext();
    }

    try {
      let audio: HTMLAudioElement;

      // На iOS используем кэшированные объекты или создаем новые с предзагрузкой
      if (this.isIOS) {
        const cachedAudio = this.audioCache.get(audioPath);
        if (cachedAudio) {
          // Используем кэшированный объект как шаблон, но создаем новый для воспроизведения
          // Если кэшированный объект уже загружен, создаем новый с тем же src
          audio = new Audio(audioPath);
          audio.setAttribute('playsinline', 'true');
          audio.setAttribute('preload', 'auto');
          audio.preload = 'auto';

          // Если кэшированный объект уже готов, новый тоже должен загрузиться быстрее
          if (cachedAudio.readyState >= 3) {
            // Кэш помог, файл уже в памяти браузера
          }
        } else {
          // Создаем новый и предзагружаем для будущего использования
          audio = new Audio(audioPath);
          audio.setAttribute('playsinline', 'true');
          audio.setAttribute('preload', 'auto');
          audio.preload = 'auto';

          // Создаем отдельный объект для кэша (предзагрузка)
          const preloadAudio = new Audio(audioPath);
          preloadAudio.setAttribute('playsinline', 'true');
          preloadAudio.setAttribute('preload', 'auto');
          preloadAudio.preload = 'auto';
          preloadAudio.volume = 0;
          preloadAudio.load();
          this.audioCache.set(audioPath, preloadAudio);
        }
      } else {
        // Для других платформ просто создаем новый объект
        audio = new Audio(audioPath);
        audio.preload = 'auto';
      }

      audio.volume = Math.max(0, Math.min(1, volume));
      audio.currentTime = 0;

      // Добавляем в список активных аудио объектов
      this.activeAudioObjects.add(audio);

      const cleanup = () => {
        this.activeAudioObjects.delete(audio);
        audio.removeEventListener('ended', cleanup);
        audio.removeEventListener('pause', cleanup);
        audio.removeEventListener('error', cleanup);
        audio.removeEventListener('canplaythrough', playAudio);
        audio.removeEventListener('loadeddata', playAudio);
        audio.removeEventListener('loadedmetadata', playAudio);
      };

      audio.addEventListener('ended', cleanup);
      audio.addEventListener('pause', cleanup);
      audio.addEventListener('error', cleanup);

      const playAudio = () => {
        if (!this.isPageVisible) {
          cleanup();
          return;
        }

        // На iOS важно убедиться, что аудио готово
        if (this.isIOS && audio.readyState < 2) {
          audio.load();
          audio.addEventListener(
            'canplaythrough',
            () => {
              const playPromise = audio.play();
              if (playPromise !== undefined) {
                playPromise.catch((error) => {
                  this.handlePlayError(error, audio, cleanup);
                });
              }
            },
            { once: true },
          );
          return;
        }

        const playPromise = audio.play();

        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            this.handlePlayError(error, audio, cleanup);
          });
        }
      };

      // На iOS всегда ждем полной загрузки (HAVE_ENOUGH_DATA = 4)
      // readyState: 0=HAVE_NOTHING, 1=HAVE_METADATA, 2=HAVE_CURRENT_DATA, 3=HAVE_FUTURE_DATA, 4=HAVE_ENOUGH_DATA
      if (this.isIOS) {
        // На iOS требуется HAVE_ENOUGH_DATA (4) для надежного воспроизведения
        if (audio.readyState >= 4) {
          playAudio();
        } else {
          // Ждем полной загрузки перед воспроизведением
          const tryPlay = () => {
            if (audio.readyState >= 4) {
              playAudio();
            } else {
              // Если еще не готов, ждем дальше
              audio.addEventListener('canplaythrough', playAudio, { once: true });
            }
          };

          audio.addEventListener('canplaythrough', playAudio, { once: true });
          audio.addEventListener('loadeddata', tryPlay, { once: true });
          audio.addEventListener('loadedmetadata', tryPlay, { once: true });
          audio.load();
        }
      } else {
        // Для других платформ достаточно HAVE_CURRENT_DATA (2)
        if (audio.readyState >= 2) {
          playAudio();
        } else {
          audio.addEventListener('canplaythrough', playAudio, { once: true });
          audio.addEventListener('loadeddata', playAudio, { once: true });
          audio.load();
        }
      }
    } catch (error) {
      console.warn('Ошибка при создании аудио объекта:', error);
    }
  }

  private handlePlayError(error: unknown, audio: HTMLAudioElement, cleanup: () => void): void {
    if (!this.isAudioContextInitialized) {
      this.unlockAudioContext()
        .then(() => {
          if (!this.isPageVisible) {
            cleanup();
            return;
          }

          // На iOS может потребоваться повторная загрузка
          if (this.isIOS && audio.readyState < 2) {
            audio.load();
            audio.addEventListener(
              'canplaythrough',
              () => {
                const retryPromise = audio.play();
                if (retryPromise !== undefined) {
                  retryPromise.catch(() => {
                    console.warn('Не удалось воспроизвести звук после разблокировки:', error);
                    cleanup();
                  });
                }
              },
              { once: true },
            );
          } else {
            const retryPromise = audio.play();
            if (retryPromise !== undefined) {
              retryPromise.catch(() => {
                console.warn('Не удалось воспроизвести звук после разблокировки:', error);
                cleanup();
              });
            }
          }
        })
        .catch(() => {
          console.warn('Не удалось воспроизвести звук:', error);
          cleanup();
        });
    } else {
      console.warn('Не удалось воспроизвести звук:', error);
      cleanup();
    }
  }

  private getInitialSoundState(): boolean {
    try {
      const saved = localStorage.getItem(this.SOUND_ENABLED_KEY);
      return saved !== null ? JSON.parse(saved) : true; // По умолчанию звук включен
    } catch {
      return true;
    }
  }

  private saveSoundState(enabled: boolean): void {
    try {
      localStorage.setItem(this.SOUND_ENABLED_KEY, JSON.stringify(enabled));
    } catch (error) {
      console.warn('Не удалось сохранить состояние звука:', error);
    }
  }

  private initializeAudioContext(): void {
    if (this.isAudioContextInitialized) {
      return;
    }

    const initAudio = () => {
      this.unlockAudioContext().then(() => {
        // Аудио контекст разблокирован
      });
    };

    document.addEventListener('click', initAudio, { once: true, passive: true });
    document.addEventListener('touchstart', initAudio, { once: true, passive: true });
    document.addEventListener('touchend', initAudio, { once: true, passive: true });
    document.addEventListener('keydown', initAudio, { once: true });
  }

  private unlockAudioContext(): Promise<void> {
    if (this.isAudioContextInitialized) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      try {
        // На iOS используем Web Audio API для более надежной разблокировки
        if (this.isIOS && typeof AudioContext !== 'undefined') {
          try {
            const AudioContextClass =
              window.AudioContext ||
              (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            this.audioContext = new AudioContextClass();

            // Создаем короткий беззвучный буфер
            const buffer = this.audioContext.createBuffer(1, 1, 22050);
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(this.audioContext.destination);
            source.start(0);

            // Также пробуем через HTMLAudioElement для совместимости
            const silentAudio = new Audio();
            silentAudio.volume = 0.01;
            silentAudio.preload = 'auto';
            silentAudio.setAttribute('playsinline', 'true');

            const playPromise = silentAudio.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  this.isAudioContextInitialized = true;
                  resolve();
                })
                .catch(() => {
                  // Если не удалось, все равно считаем инициализированным через Web Audio API
                  this.isAudioContextInitialized = true;
                  resolve();
                });
            } else {
              this.isAudioContextInitialized = true;
              resolve();
            }
          } catch {
            // Fallback на обычный метод
            this.unlockWithSilentAudio(resolve);
          }
        } else {
          // Для других платформ используем обычный метод
          this.unlockWithSilentAudio(resolve);
        }
      } catch {
        resolve();
      }
    });
  }

  private unlockWithSilentAudio(resolve: () => void): void {
    try {
      const silentAudio = new Audio(
        'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
      );
      silentAudio.volume = 0.01;
      silentAudio.preload = 'auto';

      const playPromise = silentAudio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.isAudioContextInitialized = true;
            resolve();
          })
          .catch(() => {
            resolve();
          });
      } else {
        resolve();
      }
    } catch {
      resolve();
    }
  }

  private initializePageVisibilityListener(): void {
    this.isPageVisible = !document.hidden;

    const handleVisibilityChange = () => {
      const wasVisible = this.isPageVisible;
      this.isPageVisible = !document.hidden;

      if (!this.isPageVisible && wasVisible) {
        this.pauseAllSounds();
      } else if (this.isPageVisible && !wasVisible) {
        if (!this.isAudioContextInitialized) {
          this.unlockAudioContext();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  private pauseAllSounds(): void {
    this.activeAudioObjects.forEach((audio) => {
      try {
        if (!audio.paused) {
          audio.pause();
        }
      } catch {
        // Игнорируем ошибки при приостановке
      }
    });
  }
}
