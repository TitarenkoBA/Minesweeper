import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Cell } from '../../models/cell.model';

@Component({
  selector: 'app-board',
  standalone: true,
  templateUrl: './board.component.html',
  styleUrl: './board.component.css',
})
export class BoardComponent {
  @Input() cells: Cell[] = [];
  @Input() cols = 0;
  @Input() gameID: string | null = '';

  @Output() cellClick = new EventEmitter<Cell>();
  @Output() cellRightClick = new EventEmitter<{ event: MouseEvent; cell: Cell }>();

  handleCellClick(cell: Cell): void {
    this.cellClick.emit(cell);
  }

  handleCellRightClick(event: MouseEvent, cell: Cell): void {
    event.preventDefault();
    this.cellRightClick.emit({ event, cell });
  }
}

