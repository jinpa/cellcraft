"use client";

import { useRef, useEffect } from 'react';
import { CellData } from './spreadsheet';
import { cn } from '@/lib/utils';

type CellProps = {
  row: number;
  col: number;
  data: CellData;
  isActive: boolean;
  onSelect: () => void;
  onChange: (value: string) => void;
};

export default function Cell({ row, col, data, isActive, onSelect, onChange }: CellProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isActive]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const { value } = data || { value: '' };

  const cellClassName = cn(
    'border-b border-r p-0 relative transition-all duration-150',
    {
      'ring-2 ring-accent ring-inset z-10': isActive,
      'hover:bg-accent/10 cursor-cell': !isActive,
    }
  );

  return (
    <td
      id={`cell-${row}-${col}`}
      className={cellClassName}
      onClick={onSelect}
      tabIndex={-1}
    >
      {isActive ? (
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          className="w-full h-full p-2 outline-none bg-transparent text-foreground text-sm"
        />
      ) : (
        <div className="w-full h-full p-2 text-sm truncate">
          {value || <>&nbsp;</>}
        </div>
      )}
    </td>
  );
}
