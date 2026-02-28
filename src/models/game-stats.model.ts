export type GameResultType = 'win' | 'loss';

export interface GameStatsEntry {
  id: string;
  rows: number;
  cols: number;
  mines: number;
  result: GameResultType;
  moves: number;
  minePositions: number[];
  finishedAt: string;
  durationMs: number;
  durationFormatted: string;
}

