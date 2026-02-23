import { Component, OnDestroy, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BoardComponent } from '../components/board/board.component';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { SoundService } from '../shared/services/sound.service';
import { GameService } from '@shared/services/game.service';
import { ClickOutside } from '@shared/directives';

declare const device: { platform: any; };
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, BoardComponent, SidebarComponent, ClickOutside],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit, OnDestroy {
  public readonly gameService = inject(GameService);
  public readonly soundService = inject(SoundService);

  constructor() {
    this.gameService.loadStats();
    this.gameService.newGame();
  }

  ngOnInit(): void {
    document.addEventListener("deviceready", () => alert(device.platform))
  }

  ngOnDestroy(): void {
    this.gameService.stopTimer();
  }
  onRowsChange(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.gameService.rows = value;
    this.changeSettings();
  }

  onColsChange(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.gameService.cols = value;
    this.changeSettings();
  }

  onMinesChange(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.gameService.totalMines = value;
    this.changeSettings();
  }
  onVolumeChange(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.gameService.volume = value;
    this.soundService.setVolumeAllSounds(value/100)
    this.changeSettings(true);
  }
  onMusicVolumeChange(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.gameService.musicVolume = value;
    this.soundService.setVolumeAllSounds(value/100, true)
    this.changeSettings(true);
  }

  private changeSettings(isVolumeChange = false): void {
    this.gameService.onSettingsChange({
      rows: this.gameService.rows,
      cols: this.gameService.cols,
      mines: this.gameService.totalMines,
      volume: this.gameService.volume,
      musicVolume: this.gameService.musicVolume,
    }, isVolumeChange);
  }
}
