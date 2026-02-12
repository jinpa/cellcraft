"use client";

import { Bold, Palette, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
} from '@/components/ui/alert-dialog';
import { CellStyle } from './spreadsheet';

type ToolbarProps = {
  activeCellStyle?: CellStyle;
  onToggleBold: () => void;
  onSetBackgroundColor: (color: string) => void;
  onClearAll: () => void;
};

const COLORS = [
  '#FFFFFF',
  '#F87171', // red-400
  '#FBBF24', // amber-400
  '#34D399', // green-400
  '#60A5FA', // blue-400
  '#A78BFA', // violet-400
  '#F472B6', // pink-400
];

export default function Toolbar({ activeCellStyle, onToggleBold, onSetBackgroundColor, onClearAll }: ToolbarProps) {
  return (
    <div className="p-2 border-b flex items-center gap-2 bg-card rounded-lg">
      <Button
        variant={activeCellStyle?.bold ? 'secondary' : 'ghost'}
        size="icon"
        onClick={onToggleBold}
        className="h-8 w-8"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Palette className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <div className="grid grid-cols-4 gap-1">
            {COLORS.map(color => (
              <button
                key={color}
                className={`w-6 h-6 rounded-sm border ${activeCellStyle?.backgroundColor === color ? 'ring-2 ring-ring' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => onSetBackgroundColor(color === '#FFFFFF' ? '' : color)}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will clear all data and formatting from the spreadsheet and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onClearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
