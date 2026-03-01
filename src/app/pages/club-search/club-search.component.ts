import { Component, OnInit } from '@angular/core';
import { ClubService } from '../../services/club.service';
import confetti from 'canvas-confetti';


@Component({
  selector: 'app-club-search',
  templateUrl: './club-search.component.html',
  styleUrl: './club-search.component.css'
})
export class ClubSearchComponent implements OnInit {
  gridSize: number = 16;
  grid: string[][] = [];

  words: string[] = [];
  wordsDisplay: string[] = [];
  foundWords: string[] = [];
  currentDirection: { dr: number, dc: number } | null = null;


  selectedCells: { row: number, col: number }[] = [];
  foundCells: { row: number, col: number, color: string }[] = [];

  colorPalette: string[] = [
    '#2E7D32', // green
    '#E64A19', // orange
    '#1565C0', // blue
    '#C2185B', // pink
    '#6A1B9A', // purple
    '#F9A825', // amber
    '#00838F', // cyan
    '#C62828', // red
    '#558B2F', // olive green
    '#4527A0'  // deep purple
  ];

  isSelecting: boolean = false;
  gameCompleted: boolean = false;

  directions = [
    { dr: 0, dc: 1 },
    { dr: 1, dc: 0 },
    { dr: 1, dc: 1 },
    { dr: 1, dc: -1 }
  ];

  constructor(private clubService: ClubService) {}

  ngOnInit(): void {
    this.startGame();
  }

  startGame(): void {
    this.grid = [];
    this.words = [];
    this.wordsDisplay = [];
    this.foundWords = [];
    this.foundCells = [];
    this.gameCompleted = false;

    this.createEmptyGrid();

    this.clubService.getClubs().subscribe(data => {

      const randomClubs = data
        .map(c => ({
          display: c.club_name.toUpperCase(),
          value: c.club_name.replace(/[\s.\-']/g, '').toUpperCase()
        }))
        .filter(c => c.value.length <= 12)
        .sort(() => Math.random() - 0.5)
        .slice(0, 10);

      this.words = randomClubs.map(c => c.value);
      this.wordsDisplay = randomClubs.map(c => c.display);

      this.words.forEach(word => this.placeWord(word));

      this.fillEmptySpaces();
    });
  }

  createEmptyGrid(): void {
    this.grid = Array.from({ length: this.gridSize }, () =>
      Array(this.gridSize).fill('')
    );
  }

  placeWord(word: string): void {

    let placed = false;

    while (!placed) {

      const direction = this.directions[Math.floor(Math.random() * this.directions.length)];
      const reversed = Math.random() > 0.5;
      const finalWord = reversed ? word.split('').reverse().join('') : word;

      const startRow = Math.floor(Math.random() * this.gridSize);
      const startCol = Math.floor(Math.random() * this.gridSize);

      if (this.canPlaceWord(startRow, startCol, finalWord, direction)) {

        for (let i = 0; i < finalWord.length; i++) {
          const r = startRow + direction.dr * i;
          const c = startCol + direction.dc * i;
          this.grid[r][c] = finalWord[i];
        }

        placed = true;
      }
    }
  }

  canPlaceWord(row: number, col: number, word: string, direction: any): boolean {

    for (let i = 0; i < word.length; i++) {

      const r = row + direction.dr * i;
      const c = col + direction.dc * i;

      if (
        r < 0 || r >= this.gridSize ||
        c < 0 || c >= this.gridSize
      ) return false;

      if (
        this.grid[r][c] !== '' &&
        this.grid[r][c] !== word[i]
      ) return false;
    }

    return true;
  }

  fillEmptySpaces(): void {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        if (this.grid[row][col] === '') {
          this.grid[row][col] =
            letters[Math.floor(Math.random() * letters.length)];
        }
      }
    }
  }

  startSelection(row: number, col: number): void {
    if (this.gameCompleted) return;
  
    this.isSelecting = true;
    this.selectedCells = [{ row, col }];
    this.currentDirection = null;
  }

  dragSelection(row: number, col: number): void {
    if (!this.isSelecting) return;
  
    const first = this.selectedCells[0];
    const last = this.selectedCells[this.selectedCells.length - 1];
  
    if (last.row === row && last.col === col) return;
  
    const deltaRow = row - first.row;
    const deltaCol = col - first.col;
  
    // 🔥 Si es el segundo movimiento → definimos dirección
    if (!this.currentDirection && this.selectedCells.length === 1) {
  
      const dr = Math.sign(deltaRow);
      const dc = Math.sign(deltaCol);
  
      // Solo permitimos horizontal, vertical o diagonal perfecta
      if (
        (dr === 0 && dc !== 0) || 
        (dr !== 0 && dc === 0) || 
        (Math.abs(deltaRow) === Math.abs(deltaCol))
      ) {
        this.currentDirection = { dr, dc };
      } else {
        return; // Movimiento inválido
      }
    }
  
    if (!this.currentDirection) return;
  
    const expectedRow =
      first.row + this.currentDirection.dr * this.selectedCells.length;
  
    const expectedCol =
      first.col + this.currentDirection.dc * this.selectedCells.length;
  
    if (row === expectedRow && col === expectedCol) {
      this.selectedCells.push({ row, col });
    }
  }
  

  endSelection(): void {
    this.isSelecting = false;
    this.currentDirection = null;


    const word = this.selectedCells
      .map(c => this.grid[c.row][c.col])
      .join('');

    const reversed = word.split('').reverse().join('');

    const matched = this.words.find(w => w === word || w === reversed);

    if (matched && !this.foundWords.includes(matched)) {

      this.foundWords.push(matched);



      const color = this.colorPalette[this.foundWords.length - 1];
      
      this.selectedCells.forEach(cell => {
        this.foundCells.push({
          row: cell.row,
          col: cell.col,
          color: color
        });
      });

      if (this.foundWords.length === 10) {
        this.gameCompleted = true;
        this.launchConfetti();
      }
    }

    this.selectedCells = [];
  }

  isSelected(row: number, col: number): boolean {
    return this.selectedCells.some(c => c.row === row && c.col === col);
  }

  getFoundCell(row: number, col: number) {
    return this.foundCells.find(c => c.row === row && c.col === col);
  }
  
  launchConfetti(): void {
    confetti({
      particleCount: 400,
      spread: 160,
      origin: { y: 0.6 }
    });
  }


  onTouchStart(event: TouchEvent, row: number, col: number): void {
    event.preventDefault();
    this.startSelection(row, col);
  }
  
  onTouchMove(event: TouchEvent): void {
    event.preventDefault();
    const touch = event.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (element) {
      const rowAttr = element.getAttribute('data-row');
      const colAttr = element.getAttribute('data-col');
      if (rowAttr !== null && colAttr !== null) {
        this.dragSelection(+rowAttr, +colAttr);
      }
    }
  }
}
