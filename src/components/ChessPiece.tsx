'use client';

import { ChessPiece, PieceColor, Position } from '@/types/chess';

interface ChessPieceComponentProps {
    piece: ChessPiece;
    position: Position;
    isSelected: boolean;
    isDraggable: boolean;
    onPieceClick: (position: Position) => void;
}

const pieceSymbols: Record<string, Record<PieceColor, string>> = {
    king: { white: '♔', black: '♚' },
    queen: { white: '♕', black: '♛' },
    rook: { white: '♖', black: '♜' },
    bishop: { white: '♗', black: '♝' },
    knight: { white: '♘', black: '♞' },
    pawn: { white: '♙', black: '♟' },
};

export default function ChessPieceComponent({
    piece,
    position,
    isSelected,
    isDraggable,
    onPieceClick,
}: ChessPieceComponentProps) {
    return (
        <div
            className={`
                absolute inset-0 flex items-center justify-center
                text-5xl md:text-6xl select-none
                transition-all duration-200
                ${isDraggable ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed'}
                ${isSelected ? 'scale-110 drop-shadow-2xl' : ''}
            `}
            onClick={() => isDraggable && onPieceClick(position)}
            style={{
                // White pieces = white color with dark shadow
                // Black pieces = black color with light shadow
                color: piece.color === 'white' ? '#FFFFFF' : '#000000',
                textShadow: piece.color === 'white'
                    ? '0 2px 4px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,0.5)'
                    : '0 2px 4px rgba(255,255,255,0.6), 0 0 2px rgba(255,255,255,0.3)',
                filter: isSelected ? 'brightness(1.2)' : 'none',
                WebkitTextStroke: piece.color === 'white' 
                    ? '1px rgba(0,0,0,0.3)' 
                    : '1px rgba(255,255,255,0.2)',
            }}
        >
            {pieceSymbols[piece.type][piece.color]}
        </div>
    );
}