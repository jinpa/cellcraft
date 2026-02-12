"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import Cell from './cell';
import Toolbar from './toolbar';
import { DEFAULT_COLS, DEFAULT_ROWS, SPREADSHEET_LOCAL_STORAGE_KEY, DEFAULT_COL_WIDTH, DEFAULT_ROW_HEIGHT } from '@/lib/constants';

export type CellStyle = {
  bold?: boolean;
  backgroundColor?: string;
};

export type CellData = {
  value: string;
  style?: CellStyle;
};

type CellAddress = { row: number; col: number };

const createEmptyGrid = (rows: number, cols: number): CellData[][] => {
  return Array(rows).fill(null).map(() => Array(cols).fill(null).map(() => ({ value: '' })));
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
  const [gridData, setGridData] = useState<CellData[][]>(() => createEmptyGrid(DEFAULT_ROWS, DEFAULT_COLS));
  const [columnWidths, setColumnWidths] = useState<number[]>(() => Array(DEFAULT_COLS).fill(DEFAULT_COL_WIDTH));
  const [rowHeights, setRowHeights] = useState<number[]>(() => Array(DEFAULT_ROWS).fill(DEFAULT_ROW_HEIGHT));
  const [activeCell, setActiveCell] = useState<CellAddress | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const resizingRef = useRef<{ type: 'col' | 'row', index: number, startPos: number, startSize: number } | null>(null);
  
  const ROWNUM = gridData.length;
  const COLNUM = gridData[0]?.length || 0;

  useEffect(() => {
    try {
      const savedData = localStorage.getItem(SPREADSHEET_LOCAL_STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.gridData) {
            const rows = Math.max(DEFAULT_ROWS, parsed.gridData.length);
            const cols = Math.max(DEFAULT_COLS, parsed.gridData[0]?.length || 0);

            const data = createEmptyGrid(rows, cols);
            for (let i = 0; i < parsed.gridData.length; i++) {
                for (let j = 0; j < parsed.gridData[i].length; j++) {
                    data[i][j] = parsed.gridData[i][j] || { value: '' };
                }
            }
            setGridData(data);
            
            const cWidths = Array(cols).fill(DEFAULT_COL_WIDTH);
            if(parsed.columnWidths) {
              for (let i = 0; i < parsed.columnWidths.length; i++) {
                cWidths[i] = parsed.columnWidths[i];
              }
            }
            setColumnWidths(cWidths);

            const rHeights = Array(rows).fill(DEFAULT_ROW_HEIGHT);
            if(parsed.rowHeights) {
                for (let i = 0; i < parsed.rowHeights.length; i++) {
                    rHeights[i] = parsed.rowHeights[i];
                }
            }
            setRowHeights(rHeights);
        }
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      const dataToSave = {
        gridData,
        columnWidths,
        rowHeights
      };
      localStorage.setItem(SPREADSHEET_LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error("Failed to save data to localStorage", error);
    }
  }, [gridData, columnWidths, rowHeights]);

  const handleCellChange = useCallback((row: number, col: number, value: string) => {
    setGridData(prevData => {
      const newData = [...prevData];
      const newRow = [...(newData[row] || [])];
      const oldCellData = newRow[col] || { value: '' };
      newRow[col] = { ...oldCellData, value };
      newData[row] = newRow;
      return newData;
    });
  }, []);
  
  const handleToggleBold = useCallback(() => {
    if (!activeCell) return;
    const { row, col } = activeCell;
    setGridData(prevData => {
      const newData = [...prevData];
      const newRow = [...newData[row]];
      const cell = newRow[col] || { value: '' };
      
      const newStyle = {
        ...(cell.style || {}),
        bold: !cell.style?.bold,
      };

      const newCell = { ...cell, style: newStyle };

      if (Object.values(newCell.style).every(v => !v)) {
        delete newCell.style;
      }
      
      newRow[col] = newCell;
      newData[row] = newRow;
      return newData;
    });
  }, [activeCell]);

  const handleSetBackgroundColor = useCallback((color: string) => {
    if (!activeCell) return;
    const { row, col } = activeCell;
    setGridData(prevData => {
      const newData = [...prevData];
      const newRow = [...newData[row]];
      const cell = newRow[col] || { value: '' };

      const newBgColor = (color === '' || cell.style?.backgroundColor === color)
        ? undefined 
        : color;

      const newStyle = {
        ...(cell.style || {}),
        backgroundColor: newBgColor,
      };

      const newCell = { ...cell, style: newStyle };

      if (Object.values(newCell.style).every(v => !v)) {
        delete newCell.style;
      }

      newRow[col] = newCell;
      newData[row] = newRow;
      return newData;
    });
  }, [activeCell]);
  
  const handleClearAll = useCallback(() => {
    setGridData(createEmptyGrid(DEFAULT_ROWS, DEFAULT_COLS));
    setColumnWidths(Array(DEFAULT_COLS).fill(DEFAULT_COL_WIDTH));
    setRowHeights(Array(DEFAULT_ROWS).fill(DEFAULT_ROW_HEIGHT));
    setActiveCell(null);
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

  const handleColResizeStart = (e: React.MouseEvent, colIndex: number) => {
    e.preventDefault();
    resizingRef.current = {
      type: 'col',
      index: colIndex,
      startPos: e.clientX,
      startSize: columnWidths[colIndex],
    };
  };

  const handleRowResizeStart = (e: React.MouseEvent, rowIndex: number) => {
    e.preventDefault();
    resizingRef.current = {
      type: 'row',
      index: rowIndex,
      startPos: e.clientY,
      startSize: rowHeights[rowIndex],
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      const { type, index, startPos, startSize } = resizingRef.current;
      if (type === 'col') {
        const newWidth = startSize + (e.clientX - startPos);
        if (newWidth > 30) {
          setColumnWidths(prev => {
            const newWidths = [...prev];
            newWidths[index] = newWidth;
            return newWidths;
          });
        }
      } else {
        const newHeight = startSize + (e.clientY - startPos);
        if (newHeight > 20) {
          setRowHeights(prev => {
            const newHeights = [...prev];
            newHeights[index] = newHeight;
            return newHeights;
          });
        }
      }
    };

    const handleMouseUp = () => {
      resizingRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);
  
  const activeCellStyle = activeCell ? gridData[activeCell.row]?.[activeCell.col]?.style : undefined;

  return (
    <div className="flex-grow flex flex-col p-4 gap-4">
      <Toolbar 
        activeCellStyle={activeCellStyle}
        onToggleBold={handleToggleBold}
        onSetBackgroundColor={handleSetBackgroundColor}
        onClearAll={handleClearAll}
      />
      <div className="overflow-auto border rounded-lg shadow-lg bg-card flex-grow">
        <table ref={tableRef} className="table-fixed border-collapse w-full">
          <thead className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm">
            <tr>
              <th className="w-16 border-r border-b p-2 text-sm font-medium text-muted-foreground sticky left-0 z-20 bg-inherit"></th>
              {Array.from({ length: COLNUM }).map((_, colIndex) => (
                <th key={colIndex} style={{width: `${columnWidths[colIndex]}px`}} className="border-r border-b p-2 text-sm font-medium text-muted-foreground relative">
                  {getColumnName(colIndex)}
                  <div onMouseDown={e => handleColResizeStart(e, colIndex)} className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-accent"/>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gridData.map((row, rowIndex) => (
              <tr key={rowIndex} style={{height: `${rowHeights[rowIndex]}px`}}>
                <td className="w-16 sticky left-0 bg-card/80 backdrop-blur-sm border-r border-b p-2 text-center text-sm font-medium text-muted-foreground z-10 relative">
                  {rowIndex + 1}
                  <div onMouseDown={e => handleRowResizeStart(e, rowIndex)} className="absolute bottom-0 left-0 w-full h-1.5 cursor-row-resize hover:bg-accent"/>
                </td>
                {row.map((cellData, colIndex) => (
                  <Cell
                    key={`${rowIndex}-${colIndex}`}
                    row={rowIndex}
                    col={colIndex}
                    data={cellData}
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
