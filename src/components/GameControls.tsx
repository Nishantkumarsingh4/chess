'use client';

import { PieceColor } from '@/types/chess';

interface GameControlsProps {
    roomId: string | null;
    playerColor: PieceColor | null;
    currentTurn: PieceColor;
    isCheck: boolean;
    isCheckmate: boolean;
    isStalemate: boolean;
    playerName: string;
    opponentName: string | null;
    onCreateRoom: (playerName: string) => void;
    onJoinRoom: (roomId: string, playerName: string) => void;
    onLeaveRoom: () => void;
}

export default function GameControls({
    roomId,
    playerColor,
    currentTurn,
    isCheck,
    isCheckmate,
    isStalemate,
    playerName,
    opponentName,
    onCreateRoom,
    onJoinRoom,
    onLeaveRoom,
}: GameControlsProps) {
    const handleCreateRoom = () => {
        const name = prompt('Enter your name:');
        if (name) {
            onCreateRoom(name);
        }
    };

    const handleJoinRoom = () => {
        const id = prompt('Enter room ID:');
        if (id) {
            const name = prompt('Enter your name:');
            if (name) {
                onJoinRoom(id, name);
            }
        }
    };

    const getGameStatus = () => {
        if (isCheckmate) {
            const winner = currentTurn === 'white' ? 'Black' : 'White';
            return `Checkmate! ${winner} wins! 🎉`;
        }
        if (isStalemate) {
            return 'Stalemate! Game is a draw.';
        }
        if (isCheck) {
            return `Check! ${currentTurn === 'white' ? 'White' : 'Black'} king is in danger!`;
        }
        return `${currentTurn === 'white' ? 'White' : 'Black'}'s turn`;
    };

    if (!roomId) {
        return (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-8 shadow-2xl border border-slate-700">
                <h2 className="text-3xl font-bold text-white mb-6 text-center">
                    Multiplayer Chess
                </h2>
                <div className="space-y-4">
                    <button
                        onClick={handleCreateRoom}
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                    >
                        Create New Game
                    </button>
                    <button
                        onClick={handleJoinRoom}
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                    >
                        Join Game
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 shadow-2xl border border-slate-700 space-y-4">
            {/* Room Info */}
            <div className="bg-slate-700/50 rounded-lg p-4 backdrop-blur">
                <h3 className="text-sm font-semibold text-slate-400 mb-2">Room ID</h3>
                <div className="flex items-center justify-between">
                    <code className="text-2xl font-mono font-bold text-white tracking-wider">
                        {roomId}
                    </code>
                    <button
                        onClick={() => navigator.clipboard.writeText(roomId)}
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                    >
                        Copy
                    </button>
                </div>
            </div>

            {/* Players */}
            <div className="space-y-2">
                <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
                    <div className="flex items-center justify-between">
                        <span className="text-white font-semibold">{playerName}</span>
                        <span className="px-3 py-1 bg-white text-slate-900 rounded-full text-sm font-bold">
                            {playerColor === 'white' ? '⚪ White' : '⚫ Black'}
                        </span>
                    </div>
                </div>

                {opponentName ? (
                    <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
                        <div className="flex items-center justify-between">
                            <span className="text-white font-semibold">{opponentName}</span>
                            <span className="px-3 py-1 bg-slate-600 text-white rounded-full text-sm font-bold">
                                {playerColor === 'white' ? '⚫ Black' : '⚪ White'}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 backdrop-blur">
                        <p className="text-yellow-200 text-sm text-center font-medium">
                            Waiting for opponent...
                        </p>
                    </div>
                )}
            </div>

            {/* Game Status */}
            <div className={`
        rounded-lg p-4 backdrop-blur font-bold text-center text-lg
        ${isCheckmate ? 'bg-red-500/20 border border-red-500 text-red-200' : ''}
        ${isStalemate ? 'bg-gray-500/20 border border-gray-500 text-gray-200' : ''}
        ${isCheck && !isCheckmate ? 'bg-orange-500/20 border border-orange-500 text-orange-200' : ''}
        ${!isCheck && !isCheckmate && !isStalemate ? 'bg-blue-500/20 border border-blue-500 text-blue-200' : ''}
      `}>
                {getGameStatus()}
            </div>

            {/* Turn Indicator */}
            {opponentName && !isCheckmate && !isStalemate && (
                <div className="bg-slate-700/50 rounded-lg p-3 backdrop-blur">
                    <div className="flex items-center justify-center space-x-2">
                        {currentTurn === playerColor ? (
                            <>
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-green-400 font-semibold">Your Turn</span>
                            </>
                        ) : (
                            <>
                                <div className="w-3 h-3 bg-gray-500 rounded-full" />
                                <span className="text-gray-400 font-semibold">Opponent's Turn</span>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Leave Button */}
            <button
                onClick={onLeaveRoom}
                className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-500 text-red-200 font-semibold py-3 px-4 rounded-lg transition-all duration-200"
            >
                Leave Game
            </button>
        </div>
    );
}
