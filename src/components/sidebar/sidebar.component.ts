import { Component, inject, signal } from '@angular/core';
import { GameService } from '@shared/services/game.service';
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
  selector: 'mines-sidebar',
  standalone: true,
  templateUrl: './sidebar.component.html',
  imports: [CustomTooltipDirect]
})
export class SidebarComponent {
  public readonly gameService = inject(GameService);
  public readonly soundService = inject(SoundService);
  public readonly isRadioOpen = signal(false);
  public readonly isRadioPlayed = signal(false);

  onNewGameClick(): void {
    this.gameService.newGame();
  }
  toggleSound(): void {
    if (this.soundService.isSoundEnabled()) {
      this.soundService.disableSound()
    } else {
      this.soundService.enableSound()
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
      this.soundService.playSound('https://eurotruckradio.stream.laut.fm/eurotruckradio', this.gameService.volume)
  }
  stopRadio(): void {
      this.isRadioPlayed.set(false);
      this.soundService.stopAllSounds()
  }

  get formattedDuration(): string {
    const minutes = Math.floor(this.gameService.gameDurationSeconds() / 60);
    const seconds = this.gameService.gameDurationSeconds() % 60;

    const m = minutes.toString().padStart(2, '0');
    const s = seconds.toString().padStart(2, '0');

    return `${m}:${s}`;
  }
}

