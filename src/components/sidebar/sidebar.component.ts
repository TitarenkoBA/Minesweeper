import { Component, inject } from '@angular/core';
import { GameService } from '@shared/services/game.service';
import { RadioService } from '@shared/services/radio.service';
import { SoundService } from '@shared/services/sound.service';
import { CustomTooltipDirect } from '@shared/directives/tooltip.directive';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { formatDuration } from '@shared/helpers';

@Component({
  selector: 'mines-sidebar',
  standalone: true,
  templateUrl: './sidebar.component.html',
  imports: [CustomTooltipDirect, TranslatePipe]
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
    return formatDuration(this.gameService.gameDurationSeconds());
  }
}

