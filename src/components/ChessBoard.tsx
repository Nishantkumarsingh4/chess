'use client';

import { Board, PieceColor, Position } from '@/types/chess';
import ChessPieceComponent from './ChessPiece';

interface ChessBoardProps {
    board: Board;
    selectedSquare: Position | null;
    validMoves: Position[];
    playerColor: PieceColor | null;
    currentTurn: PieceColor;
    onSquareClick: (position: Position) => void;
}

export default function ChessBoard({
    board,
    selectedSquare,
    validMoves,
    playerColor,
    currentTurn,
    onSquareClick,
}: ChessBoardProps) {
    const isSquareSelected = (row: number, col: number) => {
        return selectedSquare?.row === row && selectedSquare?.col === col;
    };

    const isValidMove = (row: number, col: number) => {
        return validMoves.some(move => move.row === row && move.col === col);
    };

    const isLightSquare = (row: number, col: number) => {
        return (row + col) % 2 === 0;
    };

    const getSquareColor = (row: number, col: number) => {
        if (isSquareSelected(row, col)) {
            return 'bg-yellow-400';
        }
        if (isValidMove(row, col)) {
            return isLightSquare(row, col) ? 'bg-green-300' : 'bg-green-500';
        }
        return isLightSquare(row, col) ? 'bg-amber-100' : 'bg-amber-700';
    };

    return (
        <div className="relative">
            {/* Board container */}
            <div className="grid grid-cols-8 gap-0 border-4 border-amber-900 shadow-2xl rounded-lg overflow-hidden">
                {board.map((row, rowIndex) =>
                    row.map((piece, colIndex) => {
                        const position = { row: rowIndex, col: colIndex };
                        const isDraggable =
                            piece !== null &&
                            playerColor !== null &&
                            piece.color === playerColor &&
                            currentTurn === playerColor;

                        return (
                            <div
                                key={`${rowIndex}-${colIndex}`}
                                className={`
                  relative aspect-square w-full
                  ${getSquareColor(rowIndex, colIndex)}
                  transition-colors duration-200
                  cursor-pointer
                  hover:brightness-110
                `}
                                onClick={() => onSquareClick(position)}
                            >
                                {/* Valid move indicator */}
                                {isValidMove(rowIndex, colIndex) && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className={`
                      rounded-full
                      ${piece ? 'w-full h-full border-4 border-green-400' : 'w-4 h-4 bg-green-600 opacity-60'}
                    `} />
                                    </div>
                                )}

                                {/* Chess piece */}
                                {piece && (
                                    <ChessPieceComponent
                                        piece={piece}
                                        position={position}
                                        isSelected={isSquareSelected(rowIndex, colIndex)}
                                        isDraggable={isDraggable}
                                        onPieceClick={onSquareClick}
                                    />
                                )}

                                {/* Coordinate labels */}
                                {colIndex === 0 && (
                                    <div className="absolute left-1 top-1 text-xs font-bold opacity-50">
                                        {8 - rowIndex}
                                    </div>
                                )}
                                {rowIndex === 7 && (
                                    <div className="absolute right-1 bottom-1 text-xs font-bold opacity-50">
                                        {String.fromCharCode(97 + colIndex)}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
