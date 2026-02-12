"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import Cell from './cell';
import { DEFAULT_COLS, DEFAULT_ROWS, SPREADSHEET_LOCAL_STORAGE_KEY } from '@/lib/constants';

type CellAddress = { row: number; col: number };

const createEmptyGrid = (rows: number, cols: number): string[][] => {
  return Array(rows).fill(null).map(() => Array(cols).fill(''));
};

const getColumnName = (colIndex: number): string => {
  let name = '';
  let n = colIndex;
  while (n >= 0) {
    name = String.fromCharCode((n % 26) + 65) + name;
    n = Math.floor(n / 26) - 1;
  }
  return name;
};

export default function Spreadsheet() {
  const [gridData, setGridData] = useState<string[][]>(() => createEmptyGrid(DEFAULT_ROWS, DEFAULT_COLS));
  const [activeCell, setActiveCell] = useState<CellAddress | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const ROWNUM = gridData.length;
  const COLNUM = gridData[0]?.length || 0;


  useEffect(() => {
    try {
      const savedData = localStorage.getItem(SPREADSHEET_LOCAL_STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        if (Array.isArray(parsedData) && parsedData.length > 0 && Array.isArray(parsedData[0])) {
            const rows = Math.max(DEFAULT_ROWS, parsedData.length);
            const cols = Math.max(DEFAULT_COLS, parsedData[0].length);
            const data = createEmptyGrid(rows, cols);
            for (let i = 0; i < parsedData.length; i++) {
                for (let j = 0; j < parsedData[i].length; j++) {
                    data[i][j] = parsedData[i][j];
                }
            }
            setGridData(data);
        }
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SPREADSHEET_LOCAL_STORAGE_KEY, JSON.stringify(gridData));
    } catch (error) {
      console.error("Failed to save data to localStorage", error);
    }
  }, [gridData]);

  const handleCellChange = useCallback((row: number, col: number, value: string) => {
    setGridData(prevData => {
      const newData = prevData.map(r => [...r]);
      if (!newData[row]) newData[row] = [];
      newData[row][col] = value;
      return newData;
    });
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!activeCell) return;

    let { row, col } = activeCell;
    let newPos: CellAddress | null = null;
    const isEditing = e.target instanceof HTMLInputElement;

    switch (e.key) {
      case 'ArrowUp':
        newPos = { row: Math.max(0, row - 1), col };
        break;
      case 'ArrowDown':
      case 'Enter':
        newPos = { row: Math.min(ROWNUM - 1, row + 1), col };
        break;
      case 'ArrowLeft':
        if (!isEditing || (e.target as HTMLInputElement).selectionStart === 0) {
          newPos = { row, col: Math.max(0, col - 1) };
        }
        break;
      case 'ArrowRight':
        if (!isEditing || (e.target as HTMLInputElement).selectionEnd === (e.target as HTMLInputElement).value.length) {
          newPos = { row, col: Math.min(COLNUM - 1, col + 1) };
        }
        break;
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
            newPos = { row, col: Math.max(0, col - 1) };
            if (col - 1 < 0 && row > 0) {
              newPos = { row: row - 1, col: COLNUM - 1 };
            }
        } else {
            newPos = { row, col: Math.min(COLNUM - 1, col + 1) };
            if (col + 1 >= COLNUM && row < ROWNUM - 1) {
              newPos = { row: row + 1, col: 0 };
            }
        }
        break;
    }

    if (newPos) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
        e.preventDefault();
      } else if (!isEditing || (newPos.col !== col)) {
        e.preventDefault();
      }
      
      setActiveCell(newPos);
    }
  }, [activeCell, ROWNUM, COLNUM]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  const handleSelectCell = (row: number, col: number) => {
    setActiveCell({ row, col });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tableRef.current && !tableRef.current.contains(event.target as Node)) {
        setActiveCell(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  return (
    <div className="w-full h-screen p-4 flex flex-col bg-background">
      <header className="mb-4 text-center">
        <h1 className="text-4xl font-bold text-primary font-headline">CellCraft</h1>
        <p className="text-muted-foreground">A lightweight browser-based spreadsheet</p>
      </header>
      <div className="overflow-auto border rounded-lg shadow-lg bg-card flex-grow">
        <table ref={tableRef} className="table-fixed border-collapse w-full">
          <thead className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm">
            <tr>
              <th className="w-16 border-r border-b p-2 text-sm font-medium text-muted-foreground sticky left-0 z-20 bg-inherit"></th>
              {Array.from({ length: COLNUM }).map((_, colIndex) => (
                <th key={colIndex} className="w-32 border-r border-b p-2 text-sm font-medium text-muted-foreground">
                  {getColumnName(colIndex)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gridData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td className="w-16 sticky left-0 bg-card/80 backdrop-blur-sm border-r border-b p-2 text-center text-sm font-medium text-muted-foreground z-10">
                  {rowIndex + 1}
                </td>
                {row.map((cellValue, colIndex) => (
                  <Cell
                    key={`${rowIndex}-${colIndex}`}
                    row={rowIndex}
                    col={colIndex}
                    value={cellValue}
                    isActive={activeCell?.row === rowIndex && activeCell?.col === colIndex}
                    onSelect={() => handleSelectCell(rowIndex, colIndex)}
                    onChange={(value) => handleCellChange(rowIndex, colIndex, value)}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
