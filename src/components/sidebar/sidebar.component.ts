import { Component, EventEmitter, inject, Input, Output, signal, viewChild } from '@angular/core';
import { ClickOutside } from '@shared/directives';
import { SoundService } from '@shared/services/sound.service';
import { CustomTooltipDirect } from '@shared/ui/tooltip/tooltip.directive';

export interface GameSettings {
  rows: number;
  cols: number;
  mines: number;
  volume: number;
  musicVolume: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
  imports: [ClickOutside, CustomTooltipDirect]
})
export class SidebarComponent {
  @Input() totalMines = 0;
  @Input() flagsCount = 0;
  @Input() remainingMines = 0;
  @Input() gameOver = false;
  @Input() gameWon = false;

  @Input() durationSeconds = 0;

  @Input() rows = 8;
  @Input() cols = 8;
  @Input() mines = 10;
  @Input() volume = 0.2;
  @Input() musicVolume = 0.2;

  @Output() newGame = new EventEmitter<void>();
  @Output() settingsChange = new EventEmitter<GameSettings>();
  public readonly soundService = inject(SoundService);
  public readonly isSettingsOpen = signal(false);
  public readonly isRadioOpen = signal(false);
  public readonly isRadioPlayed = signal(false);

  onNewGameClick(): void {
    this.newGame.emit();
  }
  toggleSound(): void {
    if (this.soundService.isSoundEnabled()) {
      this.soundService.disableSound()
    } else {
      this.soundService.enableSound()
    }
  }
  toggleSettings(): void {
    if (this.isSettingsOpen()) {
      this.isSettingsOpen.set(false)
    } else {
      this.isSettingsOpen.set(true)
    }
  }
  openSettings(): void {
    if (!this.isSettingsOpen()) {
      setTimeout(() =>this.isSettingsOpen.set(true))
    }
  }
  closeSettings(): void {
    if (this.isSettingsOpen()) {
      setTimeout(() =>this.isSettingsOpen.set(false))
    }
  }
  toggleRadio(): void {
    if (this.isRadioOpen()) {
      this.isRadioOpen.set(false)
    } else {
      this.isRadioOpen.set(true)
    }
  }
  playRadio(): void {
      this.soundService.stopAllSounds()
      this.isRadioPlayed.set(true);
      this.soundService.playSound('https://eurotruckradio.stream.laut.fm/eurotruckradio', this.volume)
  }
  stopRadio(): void {
      this.isRadioPlayed.set(false);
      this.soundService.stopAllSounds()
  }

  onRowsChange(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.rows = value;
    this.emitSettings();
  }

  onColsChange(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.cols = value;
    this.emitSettings();
  }

  onMinesChange(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.mines = value;
    this.emitSettings();
  }
  onVolumeChange(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.volume = value;
    this.soundService.setVolumeAllSounds(value/100)
    this.emitSettings();
  }
  onMusicVolumeChange(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.musicVolume = value;
    this.soundService.setVolumeAllSounds(value/100, true)
    this.emitSettings();
  }

  private emitSettings(): void {
    this.settingsChange.emit({
      rows: this.rows,
      cols: this.cols,
      mines: this.mines,
      volume: this.volume,
      musicVolume: this.musicVolume,
    });
  }

  get formattedDuration(): string {
    const minutes = Math.floor(this.durationSeconds / 60);
    const seconds = this.durationSeconds % 60;

    const m = minutes.toString().padStart(2, '0');
    const s = seconds.toString().padStart(2, '0');

    return `${m}:${s}`;
  }
}

