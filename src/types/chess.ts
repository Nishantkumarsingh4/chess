export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export type PieceColor = 'white' | 'black';

export interface ChessPiece {
    type: PieceType;
    color: PieceColor;
}

export interface Position {
    row: number;
    col: number;
}

export interface Move {
    from: Position;
    to: Position;
    piece: ChessPiece;
    captured?: ChessPiece;
    isEnPassant?: boolean;
    isCastling?: boolean;
    promotion?: PieceType;
    timestamp: number;
}

export type Board = (ChessPiece | null)[][];

export interface GameState {
    board: Board;
    currentTurn: PieceColor;
    moveHistory: Move[];
    isCheck: boolean;
    isCheckmate: boolean;
    isStalemate: boolean;
    whiteKingMoved: boolean;
    blackKingMoved: boolean;
    whiteRookKingsideMoved: boolean;
    whiteRookQueensideMoved: boolean;
    blackRookKingsideMoved: boolean;
    blackRookQueensideMoved: boolean;
    enPassantTarget: Position | null;
}

export interface Player {
    id: string;
    color: PieceColor;
    name: string;
}

export interface Room {
    id: string;
    players: Player[];
    gameState: GameState;
    createdAt: number;
}

// Socket.IO event types
export interface ServerToClientEvents {
    gameState: (state: GameState) => void;
    playerJoined: (player: Player) => void;
    playerLeft: (playerId: string) => void;
    moveMade: (move: Move) => void;
    gameOver: (result: { winner: PieceColor | 'draw'; reason: string }) => void;
    error: (message: string) => void;
    roomCreated: (roomId: string) => void;
    roomJoined: (room: Room) => void;
}

export interface ClientToServerEvents {
    createRoom: (playerName: string, callback: (roomId: string) => void) => void;
    joinRoom: (roomId: string, playerName: string, callback: (success: boolean, room?: Room) => void) => void;
    makeMove: (move: { from: Position; to: Position; promotion?: PieceType }) => void;
    leaveRoom: () => void;
}
