export interface Cell {
  id: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  isDefused: boolean;
  canBeDefused: boolean;
  adjacentMines: number;
}

