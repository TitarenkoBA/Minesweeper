import { Injectable, signal, inject, computed } from '@angular/core';
import { SoundService } from './sound.service';
import { Cell } from 'src/models/cell.model';
import { uniqId } from '@shared/helpers';
import { GameResultType, GameStatsEntry } from 'src/models/game-stats.model';
import { GameSettings } from 'src/components/sidebar/sidebar.component';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  public readonly soundService = inject(SoundService);
  public readonly isSettingsOpen = signal(false);
  public readonly isInfoOpen = signal(false);
  public readonly isDefuseOpen = signal(false);
  public readonly isDefuseActive = signal(false);
  public readonly defusingCell = signal<null|Cell>(null);
  public readonly isDefuseToolUsed = signal(false);
  public readonly isDefused = signal(false);
  public readonly isExplosionUsed = signal(false);
  rows = signal(8);
  cols = signal(8);
  totalMines = signal(10);
  volume = signal(0.01);
  musicVolume = signal(0.01);
  private get cellCount(): number {
    return this.rows() * this.cols();
  }
  readonly gameDurationSeconds = signal(0);
  readonly gameID = signal<string | null>(uniqId());
  readonly cells = signal<Cell[]>([]);
  readonly gameOver = signal(false);
  readonly gameWon = signal(false);
  readonly flagsCount = computed(
    () => this.cells().filter((cell) => cell.isFlagged).length,
  );
  readonly minMines = signal(Math.max(this.cols(), this.rows()));
  readonly maxMines = signal(this.rows() * this.cols() - 2);
  readonly remainingMines = computed(
    () => this.totalMines() - this.flagsCount(),
  );
  private minesPlaced = false;
  private moveCounter = 0;
  private gameStartTime: number | null = null;
  private timerId: number | null = null;
  private gameStats: GameStatsEntry[] = [];
  private totalGames = 0;
  private readonly statsStorageKey = 'minesweeperGameStats';

  constructor() {
    this.loadStats();
    this.newGame();
  }

  ngOnDestroy(): void {
    this.stopTimer();
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
  openInfo(): void {
    if (!this.isInfoOpen()) {
      setTimeout(() =>this.isInfoOpen.set(true))
    }
  }
  closeInfo(): void {
    if (this.isInfoOpen()) {
      setTimeout(() =>this.isInfoOpen.set(false))
    }
  }
  toggleDefuseActive(): void {
    if (this.isDefuseActive()) {
      this.isDefuseActive.set(false)
    } else {
      this.isDefuseActive.set(true)
    }
  }
  openDefuse(): void {
    if (!this.isDefuseOpen() && !this.isDefuseToolUsed()) {
      setTimeout(() =>this.isDefuseOpen.set(true))
    }
  }
  closeDefuse(): void {
    if (this.isDefuseOpen()) {
      setTimeout(() =>this.isDefuseOpen.set(false))
    }
  }
  onDefuseButtonClick(): void {
    const chance = Math.floor(Math.random() * 2);
    if (chance) {
      this.isDefused.set(true)
    } else {
      this.isDefused.set(false)
    }
    const cell = this.defusingCell();
    this.isDefuseToolUsed.set(true);
    this.isDefuseActive.set(false);
    this.closeDefuse();
    if (cell) {
      setTimeout(() => this.onCellClick(cell, {isDefusingCell: true}));
    };
  }
  newGame(): void {
    this.gameID.set(null);
    this.soundService.playSound('./assets/sounds/a9b9946fbabe4d0.mp3', this.volume());

    this.moveCounter = 0;
    this.stopTimer();
    this.gameStartTime = null;
    this.gameDurationSeconds.set(0);
    this.minesPlaced = false;
    this.gameOver.set(false);
    this.gameWon.set(false);
    this.isDefuseToolUsed.set(false);
    this.isDefuseActive.set(false);
    this.isDefused.set(false);
    this.isExplosionUsed.set(false);
    this.defusingCell.set(null);
    this.cells.set(this.createEmptyCells());
    setTimeout(() => this.gameID.set(uniqId()));
  }

  onSettingsChange(settings: GameSettings, isVolumeChange = false): void {
    if (isVolumeChange) {
      this.volume.set(settings.volume);
      this.musicVolume.set(settings.musicVolume);
    } else {
      const nextRows = Number.isFinite(settings.rows) ? Math.floor(settings.rows) : this.rows();
      const nextCols = Number.isFinite(settings.cols) ? Math.floor(settings.cols) : this.cols();
      let rows = Math.min(Math.max(nextRows, 2), 20);
      let cols = Math.min(Math.max(nextCols, 2), 20);
  
      const maxMines = rows * cols - 2;
      const minMines = Math.max(cols, rows);
      const rawMines = Number.isFinite(settings.mines) ? Math.floor(settings.mines) : this.totalMines();
      let mines = rawMines;
  
      if (mines < minMines) {
        mines = minMines;
      }
      if (mines > maxMines) {
        mines = maxMines;
      }
  
      this.rows.set(rows);
      this.cols.set(cols);
      this.minMines.set(minMines);
      this.maxMines.set(maxMines);
      this.totalMines.set(mines);
      
      this.newGame();
    }
  }

  onCellClick(cell: Cell, params?: {isDefusingCell?: boolean, isHelpingCell?: boolean}): void {
    const {isDefusingCell = false, isHelpingCell = false} = params ?? {};

    if (this.gameOver() || this.gameWon()) {
      return;
    }

    if (!this.minesPlaced) {
      this.placeMines(cell.id);
    }

    const cells = [...this.cells()];
    const index = cell.id;
    const current = cells[index];

    if (current.isRevealed || current.isFlagged || current.isDefused) {
      return;
    }

    this.soundService.playSound('./assets/sounds/877427.mp3', this.volume());
    
    this.startTimer();

    this.moveCounter += 1;

    if (isDefusingCell && this.isDefused() && this.defusingCell()) {
      cells[index] = {
        ...current,
        isRevealed: true,
        canBeDefused: true,
        isDefused: true,
      };
      this.cells.set(cells);

      this.defusingCell.set(null);
      this.isDefused.set(false);
      this.isDefuseActive.set(false);

      this.soundService.playSound('./assets/sounds/1c7227d9b23f914.mp3', this.volume());

      if (cells.filter(c => c.isMine).every((c) => c.isRevealed || c.isDefused)) {
        this.gameWon.set(true);
        this.recordGame('win', cells);

        this.soundService.playSound('./assets/sounds/winn-cc.mp3', this.volume());
      } else {
        return;
      }
      
    }

    if (current.canBeDefused && !current.isDefused && !current.isFlagged && !this.isDefuseActive() && isHelpingCell) {
      cells[index] = {
        ...current,
        isRevealed: true,
        isDefused: true,
      };
      this.cells.set(cells);

      this.soundService.playSound('./assets/sounds/1c7227d9b23f914.mp3', this.volume());

      if (cells.filter(c => c.isMine).every((c) => c.isRevealed || c.isDefused)) {
        this.gameWon.set(true);
        this.recordGame('win', cells);

        this.soundService.playSound('./assets/sounds/winn-cc.mp3', this.volume());
      } else {
        return;
      }
    }

    if (current.isMine) {
      if (this.isDefuseActive()) {
        this.defusingCell.set(current);
        this.openDefuse();
        return
      }
      cells[index] = {
        ...current,
        isRevealed: true,
      };
      this.revealAllMines(cells);
      this.cells.set(cells);
      this.gameOver.set(true);
      this.recordGame('loss', cells);

      this.soundService.playSound('./assets/sounds/1c7227d9b23f914.mp3', this.volume());
      return;
    }

    this.floodReveal(index, cells);
    this.cells.set(cells);

    if (cells.every((c) => c.isMine || c.isRevealed)) {
      this.gameWon.set(true);
      this.recordGame('win', cells);

      this.soundService.playSound('./assets/sounds/winn-cc.mp3', this.volume());
    }
  }

  onCellRightClick(event: MouseEvent, cell: Cell): void {
    event.preventDefault();

    if (this.gameOver() || this.gameWon()) {
      return;
    }

    const cells = [...this.cells()];
    const index = cell.id;
    const current = cells[index];

    if (current.isRevealed) {
      return;
    }

    this.soundService.playSound('./assets/sounds/mouth-pop-finger.mp3', this.volume());

    this.moveCounter += 1;

    cells[index] = {
      ...current,
      isFlagged: !current.isFlagged,
    };

    this.cells.set(cells);
  }

  private createEmptyCells(): Cell[] {
    return Array.from({ length: this.cellCount }, (_, id) => ({
      id,
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      isDefused: false,
      canBeDefused: false,
      adjacentMines: 0,
    }));
  }

  private placeMines(firstClickIndex: number): void {
    const cells = this.createEmptyCells();
    const availableIndices = Array.from(
      { length: this.cellCount },
      (_, index) => index,
    ).filter((index) => index !== firstClickIndex);

    let minesToPlace = Math.min(this.totalMines(), availableIndices.length);
    let canBeDefusedConter = 1;

    while (minesToPlace > 0 && availableIndices.length > 0) {
      const randomPosition = Math.floor(
        Math.random() * availableIndices.length,
      );
      const cellIndex = availableIndices.splice(randomPosition, 1)[0];

      cells[cellIndex] = {
        ...cells[cellIndex],
        isMine: true,
        canBeDefused: 1 === canBeDefusedConter++,
      };

      minesToPlace -= 1;
    }

    this.calculateAdjacents(cells);
    this.cells.set(cells);
    this.minesPlaced = true;
  }

  private calculateAdjacents(cells: Cell[]): void {
    for (let index = 0; index < cells.length; index += 1) {
      if (cells[index].isMine) {
        continue;
      }

      const neighbors = this.getNeighbors(index);
      const adjacentMines = neighbors.reduce(
        (count, neighborIndex) =>
          count + (cells[neighborIndex].isMine ? 1 : 0),
        0,
      );

      cells[index] = {
        ...cells[index],
        adjacentMines,
      };
    }
  }

  private getNeighbors(index: number): number[] {
    const neighbors: number[] = [];
    const row = Math.floor(index / this.cols());
    const col = index % this.cols();

    for (let dr = -1; dr <= 1; dr += 1) {
      for (let dc = -1; dc <= 1; dc += 1) {
        if (dr === 0 && dc === 0) {
          continue;
        }

        const neighborRow = row + dr;
        const neighborCol = col + dc;

        if (
          neighborRow < 0 ||
          neighborRow >= this.rows() ||
          neighborCol < 0 ||
          neighborCol >= this.cols()
        ) {
          continue;
        }

        const neighborIndex = neighborRow * this.cols() + neighborCol;

        if (neighborIndex < 0 || neighborIndex >= this.cellCount) {
          continue;
        }

        neighbors.push(neighborIndex);
      }
    }

    return neighbors;
  }

  private floodReveal(startIndex: number, cells: Cell[]): void {
    const queue: number[] = [startIndex];
    const visited = new Set<number>();

    while (queue.length > 0) {
      const index = queue.shift() as number;

      if (visited.has(index)) {
        continue;
      }

      visited.add(index);

      const cell = cells[index];

      if (cell.isRevealed || cell.isFlagged || cell.isMine) {
        continue;
      }

      cells[index] = {
        ...cell,
        isRevealed: true,
      };

      if (cell.adjacentMines > 0) {
        continue;
      }

      const neighbors = this.getNeighbors(index);

      for (const neighborIndex of neighbors) {
        if (!visited.has(neighborIndex)) {
          queue.push(neighborIndex);
        }
      }
    }
  }

  private revealAllMines(cells: Cell[]): void {
    for (let index = 0; index < cells.length; index += 1) {
      if (!cells[index].isMine) {
        continue;
      }

      cells[index] = {
        ...cells[index],
        isRevealed: true,
      };
    }
  }

  private recordGame(result: GameResultType, cells: Cell[]): void {
    const finishedAt = new Date();
    const durationMs =
      this.gameStartTime !== null
        ? finishedAt.getTime() - this.gameStartTime
        : 0;

    this.stopTimer();

    const minePositions = cells
      .filter((c) => c.isMine)
      .map((c) => c.id);

    const entry: GameStatsEntry = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      rows: this.rows(),
      cols: this.cols(),
      mines: this.totalMines(),
      result,
      moves: this.moveCounter,
      minePositions,
      finishedAt: finishedAt.toISOString(),
      durationMs,
    };

    this.gameStats.push(entry);
    this.totalGames += 1;
    this.saveStats();
  }

  public loadStats(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    const raw = window.localStorage.getItem(this.statsStorageKey);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as {
        totalGames?: number;
        games?: GameStatsEntry[];
      };

      if (Array.isArray(parsed.games)) {
        this.gameStats = parsed.games;
      }

      if (typeof parsed.totalGames === 'number') {
        this.totalGames = parsed.totalGames;
      } else {
        this.totalGames = this.gameStats.length;
      }
    } catch {
      this.gameStats = [];
      this.totalGames = 0;
    }
  }

  private saveStats(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    const payload = {
      totalGames: this.totalGames,
      // games: this.gameStats,
    };

    window.localStorage.setItem(
      this.statsStorageKey,
      JSON.stringify(payload),
    );
  }

  private startTimer(): void {
    if (this.gameStartTime !== null) {
      return;
    }

    this.gameStartTime = Date.now();
    this.gameDurationSeconds.set(0);

    if (typeof window === 'undefined') {
      return;
    }

    this.timerId = window.setInterval(() => {
      if (this.gameOver() || this.gameWon() || this.gameStartTime === null) {
        return;
      }

      const now = Date.now();
      const seconds = Math.floor((now - this.gameStartTime) / 1000);
      this.gameDurationSeconds.set(seconds);
    }, 1000);
  }

  public stopTimer(): void {
    if (this.timerId !== null && typeof window !== 'undefined') {
      window.clearInterval(this.timerId);
    }

    this.timerId = null;
  }
}
