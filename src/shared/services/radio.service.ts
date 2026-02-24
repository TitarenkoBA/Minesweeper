import { Injectable, signal, inject, computed } from '@angular/core';
import { SoundService } from './sound.service';
import { Cell } from 'src/models/cell.model';
import { uniqId } from '@shared/helpers';
import { GameResultType, GameStatsEntry } from 'src/models/game-stats.model';
import { GameSettings } from 'src/components/sidebar/sidebar.component';
import { GameService } from './game.service';

@Injectable({
  providedIn: 'root',
})
export class RadioService {
  public readonly isRadioOpen = signal(false);
  public readonly isRadioPlayed = signal(false);
  private readonly stationList = [
    {
      index: 1,
      name: 'Eurotruck-Radio',
      url: 'https://eurotruckradio.stream.laut.fm/eurotruckradio'
    },
    {
      index: 2,
      name: 'Radio ROKS Rock-Ballads',
      url: 'https://tavr.tvstitch.com/RadioROKS_Ballads'
    },
    {
      index: 3,
      name: 'Popcrush Nights',
      url: 'https://live.amperwave.net/direct/townsquare-nationalpopcrushmp3-ibc3.mp3'
    },
    {
      index: 4,
      name: 'Jazz',
      url: 'https://jazz.stream.laut.fm/jazz'
    },
    {
      index: 5,
      name: 'FunCrazy-Radio',
      url: 'https://server36791.streamplus.de/stream.mp3'
    },
  ]
  public readonly playedStation = signal(this.stationList[0]);
  public readonly gameService = inject(GameService);
  public readonly soundService = inject(SoundService);
  public readonly isLastStation = computed(() => this.playedStation().index === this.stationList.length);
  public readonly isFirstStation = computed(() => this.playedStation().index === 1);
  toggleRadio(): void {
    if (this.isRadioOpen()) {
      this.isRadioOpen.set(false)
    } else {
      this.isRadioOpen.set(true)
    }
  }
  prevStation(): void {
    if (!this.isFirstStation()) {
      const currentIndex = this.playedStation().index;
      const next = this.stationList[currentIndex-2];
      if (next) {
        if (this.isRadioPlayed()) {
          this.stopRadio();
          this.playedStation.set(next);
          setTimeout(() => this.playRadio());
        } else {
          this.playedStation.set(next);
        }
      }

    }
  }
  nextStation(): void {
    if (!this.isLastStation()) {
      const currentIndex = this.playedStation().index;
      const next = this.stationList[currentIndex];
      if (next) {
        if (this.isRadioPlayed()) {
          this.stopRadio();
          this.playedStation.set(next);
          setTimeout(() => this.playRadio());
        } else {
          this.playedStation.set(next);
        }
      }

    }
  }
  playRadio(): void {
      this.soundService.stopAllSounds()
      this.isRadioPlayed.set(true);
      this.soundService.playSound(this.playedStation().url, this.gameService.musicVolume)
  }
  stopRadio(): void {
      this.isRadioPlayed.set(false);
      this.soundService.stopAllSounds()
  }
}
