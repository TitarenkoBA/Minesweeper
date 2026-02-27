import { Component, inject, signal } from '@angular/core';
import { GameService } from '@shared/services/game.service';
import { RadioService } from '@shared/services/radio.service';
import { SoundService } from '@shared/services/sound.service';
import { CustomTooltipDirect } from '@shared/directives/tooltip.directive';

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
  public readonly radioService = inject(RadioService);
  onNewGameClick(): void {
    this.gameService.newGame();
  }
  onExplosionClick(): void {
    const cell = this.gameService.cells().find(cell => cell.canBeDefused && !cell.isDefused);
    if (cell) {
      this.gameService.onCellClick(cell, {isHelpingCell: true});
      this.gameService.isExplosionUsed.set(true);
    }
  }
  onDefuseClick(): void {
    this.gameService.toggleDefuseActive();
  }
  toggleSound(): void {
    if (this.soundService.isSoundEnabled()) {
      this.soundService.disableSound()
    } else {
      this.soundService.enableSound()
    }
  }
  get formattedDuration(): string {
    const minutes = Math.floor(this.gameService.gameDurationSeconds() / 60);
    const seconds = this.gameService.gameDurationSeconds() % 60;

    const m = minutes.toString().padStart(2, '0');
    const s = seconds.toString().padStart(2, '0');

    return `${m}:${s}`;
  }
}

