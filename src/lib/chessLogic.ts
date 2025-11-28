import { Board, ChessPiece, GameState, Move, PieceColor, Position } from '@/types/chess';

export function createInitialBoard(): Board {
    const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));

    // Place pawns
    for (let col = 0; col < 8; col++) {
        board[1][col] = { type: 'pawn', color: 'black' };
        board[6][col] = { type: 'pawn', color: 'white' };
    }

    // Place other pieces
    const backRow: Array<'rook' | 'knight' | 'bishop' | 'queen' | 'king'> =
        ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];

    for (let col = 0; col < 8; col++) {
        board[0][col] = { type: backRow[col], color: 'black' };
        board[7][col] = { type: backRow[col], color: 'white' };
    }

    return board;
}

export function createInitialGameState(): GameState {
    return {
        board: createInitialBoard(),
        currentTurn: 'white',
        moveHistory: [],
        isCheck: false,
        isCheckmate: false,
        isStalemate: false,
        whiteKingMoved: false,
        blackKingMoved: false,
        whiteRookKingsideMoved: false,
        whiteRookQueensideMoved: false,
        blackRookKingsideMoved: false,
        blackRookQueensideMoved: false,
        enPassantTarget: null,
    };
}

export function isValidPosition(pos: Position): boolean {
    return pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8;
}

export function getPieceAt(board: Board, pos: Position): ChessPiece | null {
    if (!isValidPosition(pos)) return null;
    return board[pos.row][pos.col];
}

export function isValidMove(
    gameState: GameState,
    from: Position,
    to: Position,
    playerColor: PieceColor
): boolean {
    const piece = getPieceAt(gameState.board, from);

    if (!piece) return false;
    if (piece.color !== playerColor) return false;
    if (piece.color !== gameState.currentTurn) return false;

    const targetPiece = getPieceAt(gameState.board, to);
    if (targetPiece && targetPiece.color === piece.color) return false;

    if (!isValidPieceMove(gameState, from, to, piece, false)) return false;

    // Check if move would put own king in check (use simple move without checkmate detection)
    const testBoard = makeMoveSimple(gameState.board, from, to, gameState.enPassantTarget);
    if (isKingInCheck(testBoard, piece.color)) return false;

    return true;
}

// Simple move function that only updates the board without checking for checkmate/stalemate
function makeMoveSimple(
    board: Board,
    from: Position,
    to: Position,
    enPassantTarget: Position | null
): Board {
    const newBoard = board.map(row => [...row]);
    const piece = newBoard[from.row][from.col]!;

    // Handle en passant
    if (piece.type === 'pawn' &&
        enPassantTarget &&
        to.row === enPassantTarget.row &&
        to.col === enPassantTarget.col) {
        const captureRow = piece.color === 'white' ? to.row + 1 : to.row - 1;
        newBoard[captureRow][to.col] = null;
    }

    // Handle castling
    if (piece.type === 'king' && Math.abs(to.col - from.col) === 2) {
        const row = from.row;
        if (to.col > from.col) {
            newBoard[row][5] = newBoard[row][7];
            newBoard[row][7] = null;
        } else {
            newBoard[row][3] = newBoard[row][0];
            newBoard[row][0] = null;
        }
    }

    // Move the piece
    newBoard[to.row][to.col] = piece;
    newBoard[from.row][from.col] = null;

    return newBoard;
}

// FIXED: Added skipCastling parameter to prevent infinite recursion
function isValidPieceMove(
    gameState: GameState,
    from: Position,
    to: Position,
    piece: ChessPiece,
    skipCastling: boolean = false  // NEW PARAMETER
): boolean {
    switch (piece.type) {
        case 'pawn':
            return isValidPawnMove(gameState, from, to, piece.color);
        case 'rook':
            return isValidRookMove(gameState.board, from, to);
        case 'knight':
            return isValidKnightMove(from, to);
        case 'bishop':
            return isValidBishopMove(gameState.board, from, to);
        case 'queen':
            return isValidQueenMove(gameState.board, from, to);
        case 'king':
            return isValidKingMove(gameState, from, to, piece.color, skipCastling);  // PASS skipCastling
        default:
            return false;
    }
}

function isValidPawnMove(
    gameState: GameState,
    from: Position,
    to: Position,
    color: PieceColor
): boolean {
    const direction = color === 'white' ? -1 : 1;
    const startRow = color === 'white' ? 6 : 1;
    const rowDiff = to.row - from.row;
    const colDiff = Math.abs(to.col - from.col);

    // Move forward one square
    if (colDiff === 0 && rowDiff === direction) {
        return !getPieceAt(gameState.board, to);
    }

    // Move forward two squares from starting position
    if (colDiff === 0 && rowDiff === 2 * direction && from.row === startRow) {
        const middlePos = { row: from.row + direction, col: from.col };
        return !getPieceAt(gameState.board, to) && !getPieceAt(gameState.board, middlePos);
    }

    // Capture diagonally
    if (colDiff === 1 && rowDiff === direction) {
        const targetPiece = getPieceAt(gameState.board, to);
        if (targetPiece && targetPiece.color !== color) return true;

        // En passant
        if (gameState.enPassantTarget &&
            to.row === gameState.enPassantTarget.row &&
            to.col === gameState.enPassantTarget.col) {
            return true;
        }
    }

    return false;
}

function isValidRookMove(board: Board, from: Position, to: Position): boolean {
    if (from.row !== to.row && from.col !== to.col) return false;
    return isPathClear(board, from, to);
}

function isValidKnightMove(from: Position, to: Position): boolean {
    const rowDiff = Math.abs(to.row - from.row);
    const colDiff = Math.abs(to.col - from.col);
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
}

function isValidBishopMove(board: Board, from: Position, to: Position): boolean {
    const rowDiff = Math.abs(to.row - from.row);
    const colDiff = Math.abs(to.col - from.col);
    if (rowDiff !== colDiff) return false;
    return isPathClear(board, from, to);
}

function isValidQueenMove(board: Board, from: Position, to: Position): boolean {
    return isValidRookMove(board, from, to) || isValidBishopMove(board, from, to);
}

// FIXED: Added skipCastling parameter
function isValidKingMove(
    gameState: GameState,
    from: Position,
    to: Position,
    color: PieceColor,
    skipCastling: boolean = false  // NEW PARAMETER
): boolean {
    const rowDiff = Math.abs(to.row - from.row);
    const colDiff = Math.abs(to.col - from.col);

    // Normal king move
    if (rowDiff <= 1 && colDiff <= 1) return true;

    // Castling - SKIP when checking for threats
    if (!skipCastling && rowDiff === 0 && colDiff === 2) {
        return canCastle(gameState, color, to.col > from.col ? 'kingside' : 'queenside');
    }

    return false;
}

function isPathClear(board: Board, from: Position, to: Position): boolean {
    const rowStep = to.row === from.row ? 0 : (to.row - from.row) / Math.abs(to.row - from.row);
    const colStep = to.col === from.col ? 0 : (to.col - from.col) / Math.abs(to.col - from.col);

    let currentRow = from.row + rowStep;
    let currentCol = from.col + colStep;

    while (currentRow !== to.row || currentCol !== to.col) {
        if (board[currentRow][currentCol] !== null) return false;
        currentRow += rowStep;
        currentCol += colStep;
    }

    return true;
}

function canCastle(
    gameState: GameState,
    color: PieceColor,
    side: 'kingside' | 'queenside'
): boolean {
    const row = color === 'white' ? 7 : 0;
    const kingMoved = color === 'white' ? gameState.whiteKingMoved : gameState.blackKingMoved;

    if (kingMoved) return false;
    if (isKingInCheck(gameState.board, color)) return false;

    if (side === 'kingside') {
        const rookMoved = color === 'white'
            ? gameState.whiteRookKingsideMoved
            : gameState.blackRookKingsideMoved;

        if (rookMoved) return false;

        // Check if squares between king and rook are empty
        if (gameState.board[row][5] !== null || gameState.board[row][6] !== null) return false;

        // Check if king passes through or ends up in check
        const testState1 = { ...gameState, board: gameState.board.map(r => [...r]) };
        testState1.board[row][4] = null;
        testState1.board[row][5] = { type: 'king', color };
        if (isKingInCheck(testState1.board, color)) return false;

        return true;
    } else {
        const rookMoved = color === 'white'
            ? gameState.whiteRookQueensideMoved
            : gameState.blackRookQueensideMoved;

        if (rookMoved) return false;

        // Check if squares between king and rook are empty
        if (gameState.board[row][1] !== null ||
            gameState.board[row][2] !== null ||
            gameState.board[row][3] !== null) return false;

        // Check if king passes through or ends up in check
        const testState1 = { ...gameState, board: gameState.board.map(r => [...r]) };
        testState1.board[row][4] = null;
        testState1.board[row][3] = { type: 'king', color };
        if (isKingInCheck(testState1.board, color)) return false;

        return true;
    }
}

export function makeMove(
    gameState: GameState,
    from: Position,
    to: Position,
    promotion?: 'queen' | 'rook' | 'bishop' | 'knight'
): GameState {
    const newBoard = gameState.board.map(row => [...row]);
    const piece = newBoard[from.row][from.col]!;
    const capturedPiece = newBoard[to.row][to.col];

    let isEnPassant = false;
    let isCastling = false;

    // Handle en passant
    if (piece.type === 'pawn' &&
        gameState.enPassantTarget &&
        to.row === gameState.enPassantTarget.row &&
        to.col === gameState.enPassantTarget.col) {
        isEnPassant = true;
        const captureRow = piece.color === 'white' ? to.row + 1 : to.row - 1;
        newBoard[captureRow][to.col] = null;
    }

    // Handle castling
    if (piece.type === 'king' && Math.abs(to.col - from.col) === 2) {
        isCastling = true;
        const row = from.row;
        if (to.col > from.col) {
            // Kingside castling
            newBoard[row][5] = newBoard[row][7];
            newBoard[row][7] = null;
        } else {
            // Queenside castling
            newBoard[row][3] = newBoard[row][0];
            newBoard[row][0] = null;
        }
    }

    // Move the piece
    newBoard[to.row][to.col] = piece;
    newBoard[from.row][from.col] = null;

    // Handle pawn promotion
    if (piece.type === 'pawn' && (to.row === 0 || to.row === 7)) {
        newBoard[to.row][to.col] = { type: promotion || 'queen', color: piece.color };
    }

    // Update en passant target
    let enPassantTarget: Position | null = null;
    if (piece.type === 'pawn' && Math.abs(to.row - from.row) === 2) {
        enPassantTarget = { row: (from.row + to.row) / 2, col: from.col };
    }

    // Update castling rights
    const newState: GameState = {
        ...gameState,
        board: newBoard,
        currentTurn: gameState.currentTurn === 'white' ? 'black' : 'white',
        enPassantTarget,
        moveHistory: [...gameState.moveHistory, {
            from,
            to,
            piece,
            captured: capturedPiece || undefined,
            isEnPassant,
            isCastling,
            promotion,
            timestamp: Date.now(),
        }],
    };

    if (piece.type === 'king') {
        if (piece.color === 'white') {
            newState.whiteKingMoved = true;
        } else {
            newState.blackKingMoved = true;
        }
    }

    if (piece.type === 'rook') {
        if (piece.color === 'white') {
            if (from.row === 7 && from.col === 7) newState.whiteRookKingsideMoved = true;
            if (from.row === 7 && from.col === 0) newState.whiteRookQueensideMoved = true;
        } else {
            if (from.row === 0 && from.col === 7) newState.blackRookKingsideMoved = true;
            if (from.row === 0 && from.col === 0) newState.blackRookQueensideMoved = true;
        }
    }

    // Check for check, checkmate, stalemate
    const opponentColor = newState.currentTurn;
    newState.isCheck = isKingInCheck(newBoard, opponentColor);
    newState.isCheckmate = newState.isCheck && !hasValidMoves(newState, opponentColor);
    newState.isStalemate = !newState.isCheck && !hasValidMoves(newState, opponentColor);

    return newState;
}

function findKing(board: Board, color: PieceColor): Position | null {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece && piece.type === 'king' && piece.color === color) {
                return { row, col };
            }
        }
    }
    return null;
}

// FIXED: Now passes skipCastling=true to prevent infinite recursion
export function isKingInCheck(board: Board, color: PieceColor): boolean {
    const kingPos = findKing(board, color);
    if (!kingPos) return false;

    const opponentColor = color === 'white' ? 'black' : 'white';

    // Check all opponent pieces
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece && piece.color === opponentColor) {
                const from = { row, col };
                const tempState: GameState = {
                    board,
                    currentTurn: opponentColor,
                    moveHistory: [],
                    isCheck: false,
                    isCheckmate: false,
                    isStalemate: false,
                    whiteKingMoved: false,
                    blackKingMoved: false,
                    whiteRookKingsideMoved: false,
                    whiteRookQueensideMoved: false,
                    blackRookKingsideMoved: false,
                    blackRookQueensideMoved: false,
                    enPassantTarget: null,
                };

                // CRITICAL FIX: Pass skipCastling=true to prevent recursion
                if (isValidPieceMove(tempState, from, kingPos, piece, true)) {
                    return true;
                }
            }
        }
    }

    return false;
}

function hasValidMoves(gameState: GameState, color: PieceColor): boolean {
    for (let fromRow = 0; fromRow < 8; fromRow++) {
        for (let fromCol = 0; fromCol < 8; fromCol++) {
            const piece = gameState.board[fromRow][fromCol];
            if (piece && piece.color === color) {
                for (let toRow = 0; toRow < 8; toRow++) {
                    for (let toCol = 0; toCol < 8; toCol++) {
                        const from = { row: fromRow, col: fromCol };
                        const to = { row: toRow, col: toCol };

                        if (isValidMove(gameState, from, to, color)) {
                            return true;
                        }
                    }
                }
            }
        }
    }
    return false;
}

export function getValidMoves(gameState: GameState, from: Position): Position[] {
    const piece = getPieceAt(gameState.board, from);
    if (!piece) return [];

    const validMoves: Position[] = [];

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const to = { row, col };
            if (isValidMove(gameState, from, to, piece.color)) {
                validMoves.push(to);
            }
        }
    }

    return validMoves;
}