'use client';

import { Move } from '@/types/chess';

interface MoveHistoryProps {
    moves: Move[];
}

export default function MoveHistory({ moves }: MoveHistoryProps) {
    const formatPosition = (pos: { row: number; col: number }) => {
        const file = String.fromCharCode(97 + pos.col);
        const rank = 8 - pos.row;
        return `${file}${rank}`;
    };

    const formatMove = (move: Move, index: number) => {
        const pieceSymbol = move.piece.type === 'knight' ? 'N' : move.piece.type[0].toUpperCase();
        const from = formatPosition(move.from);
        const to = formatPosition(move.to);
        const capture = move.captured ? 'x' : '-';

        return `${index + 1}. ${pieceSymbol}${from}${capture}${to}`;
    };

    return (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 shadow-2xl border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <span className="mr-2">📜</span>
                Move History
            </h3>

            <div className="bg-slate-700/30 rounded-lg p-4 max-h-96 overflow-y-auto custom-scrollbar">
                {moves.length === 0 ? (
                    <p className="text-slate-400 text-center italic">No moves yet</p>
                ) : (
                    <div className="space-y-2">
                        {moves.map((move, index) => (
                            <div
                                key={index}
                                className={`
                  p-2 rounded-lg font-mono text-sm
                  ${move.piece.color === 'white'
                                        ? 'bg-white/10 text-white'
                                        : 'bg-slate-900/50 text-slate-300'}
                  transition-all duration-200 hover:bg-white/20
                `}
                            >
                                {formatMove(move, index)}
                                {move.isEnPassant && <span className="ml-2 text-yellow-400">e.p.</span>}
                                {move.isCastling && <span className="ml-2 text-blue-400">O-O</span>}
                                {move.promotion && <span className="ml-2 text-purple-400">={move.promotion[0].toUpperCase()}</span>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
