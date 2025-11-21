'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState, PieceColor, Position, Room } from '@/types/chess';
import { createInitialGameState, getValidMoves, isValidMove } from '@/lib/chessLogic';
import ChessBoard from '@/components/ChessBoard';
import GameControls from '@/components/GameControls';
import MoveHistory from '@/components/MoveHistory';

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState>(createInitialGameState());
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerColor, setPlayerColor] = useState<PieceColor | null>(null);
  const [playerName, setPlayerName] = useState<string>('');
  const [opponentName, setOpponentName] = useState<string | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);

  useEffect(() => {
    // CHANGE: Dynamic socket URL - works for both local and network access
    // Automatically uses the current hostname
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
    
    const socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });
    
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('Connected to server:', socketInstance.id);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    socketInstance.on('gameState', (newGameState: GameState) => {
      setGameState(newGameState);
      setSelectedSquare(null);
      setValidMoves([]);
    });

    socketInstance.on('playerJoined', (player) => {
      if (player.id !== socketInstance.id) {
        setOpponentName(player.name);
      }
    });

    socketInstance.on('playerLeft', () => {
      setOpponentName(null);
    });

    socketInstance.on('error', (message: string) => {
      alert(message);
    });

    socketInstance.on('gameOver', (result) => {
      setTimeout(() => {
        if (result.winner === 'draw') {
          alert(`Game Over: ${result.reason}`);
        } else {
          alert(`Game Over: ${result.winner} wins by ${result.reason}!`);
        }
      }, 500);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const handleCreateRoom = (name: string) => {
    if (!socket) return;

    socket.emit('createRoom', name, (newRoomId: string) => {
      setRoomId(newRoomId);
      setPlayerColor('white');
      setPlayerName(name);
      setGameState(createInitialGameState());
    });
  };

  const handleJoinRoom = (id: string, name: string) => {
    if (!socket) return;

    socket.emit('joinRoom', id, name, (success: boolean, room?: Room) => {
      if (success && room) {
        setRoomId(id);
        setPlayerColor('black');
        setPlayerName(name);
        setGameState(room.gameState);

        const opponent = room.players.find(p => p.id !== socket.id);
        if (opponent) {
          setOpponentName(opponent.name);
        }
      } else {
        alert('Failed to join room. Room may be full or not exist.');
      }
    });
  };

  const handleLeaveRoom = () => {
    if (!socket) return;

    socket.emit('leaveRoom');
    setRoomId(null);
    setPlayerColor(null);
    setPlayerName('');
    setOpponentName(null);
    setGameState(createInitialGameState());
    setSelectedSquare(null);
    setValidMoves([]);
  };

  const handleSquareClick = (position: Position) => {
    if (!playerColor) return;

    // If a square is already selected
    if (selectedSquare) {
      // Try to make a move
      if (isValidMove(gameState, selectedSquare, position, playerColor)) {
        // Check for pawn promotion
        const piece = gameState.board[selectedSquare.row][selectedSquare.col];
        let promotion: 'queen' | 'rook' | 'bishop' | 'knight' | undefined;

        if (piece?.type === 'pawn' && (position.row === 0 || position.row === 7)) {
          const choice = prompt('Promote to (Q/R/B/N):', 'Q')?.toUpperCase();
          promotion = choice === 'R' ? 'rook' :
            choice === 'B' ? 'bishop' :
              choice === 'N' ? 'knight' : 'queen';
        }

        socket?.emit('makeMove', {
          from: selectedSquare,
          to: position,
          promotion,
        });

        setSelectedSquare(null);
        setValidMoves([]);
      } else {
        // Select a new piece if clicking on own piece
        const clickedPiece = gameState.board[position.row][position.col];
        if (clickedPiece && clickedPiece.color === playerColor) {
          setSelectedSquare(position);
          setValidMoves(getValidMoves(gameState, position));
        } else {
          setSelectedSquare(null);
          setValidMoves([]);
        }
      }
    } else {
      // Select a piece
      const clickedPiece = gameState.board[position.row][position.col];
      if (clickedPiece && clickedPiece.color === playerColor && gameState.currentTurn === playerColor) {
        setSelectedSquare(position);
        setValidMoves(getValidMoves(gameState, position));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-8 drop-shadow-lg">
          ♟️CHESS♟️
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Game Controls */}
          <div className="lg:col-span-1 space-y-6">
            <GameControls
              roomId={roomId}
              playerColor={playerColor}
              currentTurn={gameState.currentTurn}
              isCheck={gameState.isCheck}
              isCheckmate={gameState.isCheckmate}
              isStalemate={gameState.isStalemate}
              playerName={playerName}
              opponentName={opponentName}
              onCreateRoom={handleCreateRoom}
              onJoinRoom={handleJoinRoom}
              onLeaveRoom={handleLeaveRoom}
            />
          </div>

          {/* Middle Column - Chess Board */}
          <div className="lg:col-span-1 flex items-center justify-center">
            <div className="w-full max-w-[600px]">
              <ChessBoard
                board={gameState.board}
                selectedSquare={selectedSquare}
                validMoves={validMoves}
                playerColor={playerColor}
                currentTurn={gameState.currentTurn}
                onSquareClick={handleSquareClick}
              />
            </div>
          </div>

          {/* Right Column - Move History */}
          <div className="lg:col-span-1">
            <MoveHistory moves={gameState.moveHistory} />
          </div>
        </div>
      </div>
    </div>
  );
}