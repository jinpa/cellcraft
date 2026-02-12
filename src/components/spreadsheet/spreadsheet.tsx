"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import Cell from './cell';
import { Button } from '@/components/ui/button';
import { Trash2, Bold } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DEFAULT_COLS, DEFAULT_ROWS, SPREADSHEET_LOCAL_STORAGE_KEY, DEFAULT_COL_WIDTH, DEFAULT_ROW_HEIGHT } from '@/lib/constants';

export type CellData = {
  value: string;
  bold?: boolean;
  textColor?: string; // hex color code
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


const COLOR_PALETTE = [
  { name: 'Black', value: '#000000' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Purple', value: '#A855F7' },
];

type ToolbarProps = {
  onClearAll: () => void;
  activeCell: CellAddress | null;
  gridData: CellData[][];
  onToggleBold: () => void;
  onSetTextColor: (color: string) => void;
};

const Toolbar = ({ onClearAll, activeCell, gridData, onToggleBold, onSetTextColor }: ToolbarProps) => {
  const activeCellData = activeCell 
    ? gridData[activeCell.row]?.[activeCell.col]
    : null;
  const isBold = activeCellData?.bold || false;
  const currentTextColor = activeCellData?.textColor;
  const hasActiveCell = activeCell !== null;

  return (
    <div className="p-2 border-b flex items-center gap-2 bg-card rounded-t-lg">
      <div className="flex items-center gap-2 border-r pr-2">
        <Button
          variant={isBold ? "default" : "outline"}
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onToggleBold(e);
          }}
          disabled={!hasActiveCell}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center gap-1">
        {COLOR_PALETTE.map((color) => (
          <button
            key={color.value}
            onClick={(e) => {
              e.stopPropagation();
              onSetTextColor(color.value, e);
            }}
            disabled={!hasActiveCell}
            className={`
              w-6 h-6 rounded border-2 transition-all
              ${currentTextColor === color.value 
                ? 'border-foreground scale-110' 
                : 'border-border hover:border-foreground/50'
              }
              ${!hasActiveCell ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            style={{ backgroundColor: color.value }}
            title={color.name}
            aria-label={`Set text color to ${color.name}`}
          />
        ))}
      </div>
      <div className="flex-1" />
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all data in the spreadsheet and reset all column and row sizes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onClearAll}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};


export default function Spreadsheet() {
  const [gridData, setGridData] = useState<CellData[][]>(() => createEmptyGrid(DEFAULT_ROWS, DEFAULT_COLS));
  const [columnWidths, setColumnWidths] = useState<number[]>(() => Array(DEFAULT_COLS).fill(DEFAULT_COL_WIDTH));
  const [rowHeights, setRowHeights] = useState<number[]>(() => Array(DEFAULT_ROWS).fill(DEFAULT_ROW_HEIGHT));
  const [activeCell, setActiveCell] = useState<CellAddress | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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
                    const oldCell = parsed.gridData[i][j];
                    // Load value and formatting properties, with backward compatibility
                    data[i][j] = {
                        value: oldCell?.value || '',
                        ...(oldCell?.bold !== undefined && { bold: oldCell.bold }),
                        ...(oldCell?.textColor && { textColor: oldCell.textColor }),
                    };
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
    setGridData(currentGrid => {
      const newGrid = currentGrid.map(r => r.map(c => ({...c}))); // Deep copy
      if (newGrid[row] && newGrid[row][col]) {
        newGrid[row][col].value = value;
      }
      return newGrid;
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
      const target = event.target as Node;
      // Don't clear active cell if clicking inside the container (toolbar or table)
      if (containerRef.current && !containerRef.current.contains(target)) {
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
  
  const handleClearAll = () => {
    setGridData(createEmptyGrid(DEFAULT_ROWS, DEFAULT_COLS));
    setColumnWidths(Array(DEFAULT_COLS).fill(DEFAULT_COL_WIDTH));
    setRowHeights(Array(DEFAULT_ROWS).fill(DEFAULT_ROW_HEIGHT));
    setActiveCell(null);
  };

  const handleToggleBold = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!activeCell) return;
    const { row, col } = activeCell;
    setGridData(currentGrid => {
      const newGrid = currentGrid.map(r => r.map(c => ({...c}))); // Deep copy
      if (newGrid[row] && newGrid[row][col]) {
        newGrid[row][col] = {
          ...newGrid[row][col],
          bold: !newGrid[row][col].bold
        };
      }
      return newGrid;
    });
  }, [activeCell]);

  const handleSetTextColor = useCallback((color: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!activeCell) return;
    const { row, col } = activeCell;
    setGridData(currentGrid => {
      const newGrid = currentGrid.map(r => r.map(c => ({...c}))); // Deep copy
      if (newGrid[row] && newGrid[row][col]) {
        newGrid[row][col] = {
          ...newGrid[row][col],
          textColor: color
        };
      }
      return newGrid;
    });
  }, [activeCell]);
  
  return (
    <div className="flex-grow flex flex-col p-4 gap-4">
      <div ref={containerRef} className="overflow-auto border rounded-lg shadow-lg bg-card flex-grow flex flex-col">
        <Toolbar 
          onClearAll={handleClearAll}
          activeCell={activeCell}
          gridData={gridData}
          onToggleBold={handleToggleBold}
          onSetTextColor={handleSetTextColor}
        />
        <div className="overflow-auto flex-grow">
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
    </div>
  );
}
