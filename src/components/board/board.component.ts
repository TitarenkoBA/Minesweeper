import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { Cell } from '../../models/cell.model';
import { GameService } from '@shared/services/game.service';

@Component({
  selector: 'mines-board',
  standalone: true,
  templateUrl: './board.component.html',
  styleUrl: './board.component.css',
})
export class BoardComponent {
  public readonly gameService = inject(GameService);

  handleCellClick(cell: Cell): void {
    this.gameService.onCellClick(cell);
  }

  handleCellRightClick(event: MouseEvent, cell: Cell): void {
    event.preventDefault();
    this.gameService.onCellRightClick(event, cell);
  }
}

