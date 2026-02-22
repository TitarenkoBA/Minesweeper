import { Component, computed, signal, OnDestroy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BoardComponent } from '../components/board/board.component';
import { SidebarComponent, GameSettings } from '../components/sidebar/sidebar.component';
import { Cell } from '../models/cell.model';
import { GameStatsEntry, GameResultType } from '../models/game-stats.model';
import { SoundService } from '../shared/services/sound.service';
import { uniqId } from '@shared/helpers';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, BoardComponent, SidebarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnDestroy {
  protected readonly title = signal('minesweeper');
  public readonly soundService = inject(SoundService);

  rows = 8;
  cols = 8;
  readonly titleRows = this.rows;
  readonly titleCols = this.cols;
  private get cellCount(): number {
    return this.rows * this.cols;
  }

  totalMines = 10;
  volume = 0.01;
  musicVolume = 0.01;

  readonly cells = signal<Cell[]>([]);
  readonly gameOver = signal(false);
  readonly gameWon = signal(false);

  readonly flagsCount = computed(
    () => this.cells().filter((cell) => cell.isFlagged).length,
  );

  readonly remainingMines = computed(
    () => this.totalMines - this.flagsCount(),
  );

  private minesPlaced = false;
  private moveCounter = 0;

  private gameStartTime: number | null = null;
  private timerId: number | null = null;
  readonly gameDurationSeconds = signal(0);
  readonly gameID = signal<string | null>(uniqId());

  private readonly statsStorageKey = 'minesweeperGameStats';
  private gameStats: GameStatsEntry[] = [];
  private totalGames = 0;

  constructor() {
    this.loadStats();
    this.newGame();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  newGame(): void {
    this.gameID.set(null);
    this.soundService.playSound('/assets/sounds/a9b9946fbabe4d0.mp3', this.volume);

    this.moveCounter = 0;
    this.stopTimer();
    this.gameStartTime = null;
    this.gameDurationSeconds.set(0);
    this.minesPlaced = false;
    this.gameOver.set(false);
    this.gameWon.set(false);
    this.cells.set(this.createEmptyCells());
    setTimeout(() => this.gameID.set(uniqId()));
  }

  onSettingsChange(settings: GameSettings): void {
    const nextRows = Number.isFinite(settings.rows) ? Math.floor(settings.rows) : this.rows;
    const nextCols = Number.isFinite(settings.cols) ? Math.floor(settings.cols) : this.cols;
    let rows = Math.min(Math.max(nextRows, 2), 20);
    let cols = Math.min(Math.max(nextCols, 2), 20);

    const maxMines = rows * cols - 1;
    const rawMines = Number.isFinite(settings.mines) ? Math.floor(settings.mines) : this.totalMines;
    let mines = rawMines;

    if (mines < 1) {
      mines = 1;
    }
    if (mines > maxMines) {
      mines = maxMines;
    }

    this.rows = rows;
    this.cols = cols;
    this.totalMines = mines;
    this.volume = settings.volume;
    this.musicVolume = settings.musicVolume;

    this.newGame();
  }

  onCellClick(cell: Cell): void {
    if (this.gameOver() || this.gameWon()) {
      return;
    }

    if (!this.minesPlaced) {
      this.placeMines(cell.id);
    }

    const cells = [...this.cells()];
    const index = cell.id;
    const current = cells[index];

    if (current.isRevealed || current.isFlagged) {
      return;
    }

    this.soundService.playSound('/assets/sounds/877427.mp3', this.volume);
    
    this.startTimer();

    this.moveCounter += 1;

    if (current.isMine) {
      cells[index] = {
        ...current,
        isRevealed: true,
      };
      this.revealAllMines(cells);
      this.cells.set(cells);
      this.gameOver.set(true);
      this.recordGame('loss', cells);

      this.soundService.playSound('/assets/sounds/1c7227d9b23f914.mp3', this.volume);
      return;
    }

    this.floodReveal(index, cells);
    this.cells.set(cells);

    if (cells.every((c) => c.isMine || c.isRevealed)) {
      this.gameWon.set(true);
      this.recordGame('win', cells);

      this.soundService.playSound('/assets/sounds/winn-cc.mp3', this.volume);
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

    this.soundService.playSound('/assets/sounds/mouth-pop-finger.mp3', this.volume);

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
      adjacentMines: 0,
    }));
  }

  private placeMines(firstClickIndex: number): void {
    const cells = this.createEmptyCells();
    const availableIndices = Array.from(
      { length: this.cellCount },
      (_, index) => index,
    ).filter((index) => index !== firstClickIndex);

    let minesToPlace = Math.min(this.totalMines, availableIndices.length);

    while (minesToPlace > 0 && availableIndices.length > 0) {
      const randomPosition = Math.floor(
        Math.random() * availableIndices.length,
      );
      const cellIndex = availableIndices.splice(randomPosition, 1)[0];

      cells[cellIndex] = {
        ...cells[cellIndex],
        isMine: true,
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
    const row = Math.floor(index / this.cols);
    const col = index % this.cols;

    for (let dr = -1; dr <= 1; dr += 1) {
      for (let dc = -1; dc <= 1; dc += 1) {
        if (dr === 0 && dc === 0) {
          continue;
        }

        const neighborRow = row + dr;
        const neighborCol = col + dc;

        if (
          neighborRow < 0 ||
          neighborRow >= this.rows ||
          neighborCol < 0 ||
          neighborCol >= this.cols
        ) {
          continue;
        }

        const neighborIndex = neighborRow * this.cols + neighborCol;

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
      rows: this.rows,
      cols: this.cols,
      mines: this.totalMines,
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

  private loadStats(): void {
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

  private stopTimer(): void {
    if (this.timerId !== null && typeof window !== 'undefined') {
      window.clearInterval(this.timerId);
    }

    this.timerId = null;
  }
}
