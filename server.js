const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
// CHANGE 1: '0.0.0.0' se sab network interfaces pe listen karega
const hostname = '0.0.0.0';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Store active rooms
const rooms = new Map();

app.prepare().then(() => {
    const httpServer = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    });

    // CHANGE 2: CORS ko properly configure karo
    const io = new Server(httpServer, {
        cors: {
            origin: '*', // Ya specific domains: ["http://192.168.x.x:3000", "https://your-tunnel-url"]
            methods: ['GET', 'POST'],
            credentials: true
        },
        // CHANGE 3: Transport options add karo
        transports: ['websocket', 'polling'],
        allowEIO3: true
    });

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        socket.on('createRoom', (playerName, callback) => {
            const roomId = generateRoomId();
            const player = {
                id: socket.id,
                color: 'white',
                name: playerName
            };

            const gameState = createInitialGameState();

            const room = {
                id: roomId,
                players: [player],
                gameState,
                createdAt: Date.now()
            };

            rooms.set(roomId, room);
            socket.join(roomId);
            socket.data.roomId = roomId;
            socket.data.playerColor = 'white';

            console.log(`Room ${roomId} created by ${playerName}`);
            callback(roomId);
        });

        socket.on('joinRoom', (roomId, playerName, callback) => {
            const room = rooms.get(roomId);

            if (!room) {
                callback(false);
                return;
            }

            if (room.players.length >= 2) {
                callback(false);
                return;
            }

            const player = {
                id: socket.id,
                color: 'black',
                name: playerName
            };

            room.players.push(player);
            socket.join(roomId);
            socket.data.roomId = roomId;
            socket.data.playerColor = 'black';

            console.log(`${playerName} joined room ${roomId}`);

            // Notify both players
            io.to(roomId).emit('playerJoined', player);
            io.to(roomId).emit('gameState', room.gameState);

            callback(true, room);
        });

        socket.on('makeMove', (moveData) => {
            const roomId = socket.data.roomId;
            const playerColor = socket.data.playerColor;

            if (!roomId) {
                socket.emit('error', 'Not in a room');
                return;
            }

            const room = rooms.get(roomId);
            if (!room) {
                socket.emit('error', 'Room not found');
                return;
            }

            const { from, to, promotion } = moveData;

            // Validate move
            if (!isValidMove(room.gameState, from, to, playerColor)) {
                socket.emit('error', 'Invalid move');
                return;
            }

            // Make the move
            const newGameState = makeMove(room.gameState, from, to, promotion);
            room.gameState = newGameState;

            // Broadcast the new game state
            io.to(roomId).emit('gameState', newGameState);

            // Check for game over
            if (newGameState.isCheckmate) {
                const winner = newGameState.currentTurn === 'white' ? 'black' : 'white';
                io.to(roomId).emit('gameOver', { winner, reason: 'checkmate' });
            } else if (newGameState.isStalemate) {
                io.to(roomId).emit('gameOver', { winner: 'draw', reason: 'stalemate' });
            }
        });

        socket.on('leaveRoom', () => {
            const roomId = socket.data.roomId;
            if (roomId) {
                const room = rooms.get(roomId);
                if (room) {
                    room.players = room.players.filter(p => p.id !== socket.id);

                    if (room.players.length === 0) {
                        rooms.delete(roomId);
                        console.log(`Room ${roomId} deleted`);
                    } else {
                        io.to(roomId).emit('playerLeft', socket.id);
                    }
                }
                socket.leave(roomId);
                socket.data.roomId = null;
                socket.data.playerColor = null;
            }
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
            const roomId = socket.data.roomId;

            if (roomId) {
                const room = rooms.get(roomId);
                if (room) {
                    room.players = room.players.filter(p => p.id !== socket.id);

                    if (room.players.length === 0) {
                        rooms.delete(roomId);
                        console.log(`Room ${roomId} deleted`);
                    } else {
                        io.to(roomId).emit('playerLeft', socket.id);
                    }
                }
            }
        });
    });

    httpServer
        .once('error', (err) => {
            console.error(err);
            process.exit(1);
        })
        .listen(port, hostname, () => {
            console.log(`> Ready on http://${hostname}:${port}`);
            console.log(`> Local: http://localhost:${port}`);
            // Network IP dikhane ke liye
            const os = require('os');
            const interfaces = os.networkInterfaces();
            Object.keys(interfaces).forEach((ifname) => {
                interfaces[ifname].forEach((iface) => {
                    if (iface.family === 'IPv4' && !iface.internal) {
                        console.log(`> Network: http://${iface.address}:${port}`);
                    }
                });
            });
        });
});

// Helper functions
function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function createInitialGameState() {
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

function createInitialBoard() {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));

    // Place pawns
    for (let col = 0; col < 8; col++) {
        board[1][col] = { type: 'pawn', color: 'black' };
        board[6][col] = { type: 'pawn', color: 'white' };
    }

    // Place other pieces
    const backRow = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];

    for (let col = 0; col < 8; col++) {
        board[0][col] = { type: backRow[col], color: 'black' };
        board[7][col] = { type: backRow[col], color: 'white' };
    }

    return board;
}

// Import chess logic validation
function isValidMove(gameState, from, to, playerColor) {
    const piece = getPieceAt(gameState.board, from);

    if (!piece) return false;
    if (piece.color !== playerColor) return false;
    if (piece.color !== gameState.currentTurn) return false;

    const targetPiece = getPieceAt(gameState.board, to);
    if (targetPiece && targetPiece.color === piece.color) return false;

    if (!isValidPieceMove(gameState, from, to, piece)) return false;

    const testBoard = makeMoveSimple(gameState.board, from, to, gameState.enPassantTarget);
    if (isKingInCheck(testBoard, piece.color)) return false;

    return true;
}

function makeMoveSimple(board, from, to, enPassantTarget) {
    const newBoard = board.map(row => [...row]);
    const piece = newBoard[from.row][from.col];

    if (piece.type === 'pawn' &&
        enPassantTarget &&
        to.row === enPassantTarget.row &&
        to.col === enPassantTarget.col) {
        const captureRow = piece.color === 'white' ? to.row + 1 : to.row - 1;
        newBoard[captureRow][to.col] = null;
    }

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

    newBoard[to.row][to.col] = piece;
    newBoard[from.row][from.col] = null;

    return newBoard;
}

function getPieceAt(board, pos) {
    if (pos.row < 0 || pos.row >= 8 || pos.col < 0 || pos.col >= 8) return null;
    return board[pos.row][pos.col];
}

function isValidPieceMove(gameState, from, to, piece) {
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
            return isValidKingMove(gameState, from, to, piece.color);
        default:
            return false;
    }
}

function isValidPawnMove(gameState, from, to, color) {
    const direction = color === 'white' ? -1 : 1;
    const startRow = color === 'white' ? 6 : 1;
    const rowDiff = to.row - from.row;
    const colDiff = Math.abs(to.col - from.col);

    if (colDiff === 0 && rowDiff === direction) {
        return !getPieceAt(gameState.board, to);
    }

    if (colDiff === 0 && rowDiff === 2 * direction && from.row === startRow) {
        const middlePos = { row: from.row + direction, col: from.col };
        return !getPieceAt(gameState.board, to) && !getPieceAt(gameState.board, middlePos);
    }

    if (colDiff === 1 && rowDiff === direction) {
        const targetPiece = getPieceAt(gameState.board, to);
        if (targetPiece && targetPiece.color !== color) return true;

        if (gameState.enPassantTarget &&
            to.row === gameState.enPassantTarget.row &&
            to.col === gameState.enPassantTarget.col) {
            return true;
        }
    }

    return false;
}

function isValidRookMove(board, from, to) {
    if (from.row !== to.row && from.col !== to.col) return false;
    return isPathClear(board, from, to);
}

function isValidKnightMove(from, to) {
    const rowDiff = Math.abs(to.row - from.row);
    const colDiff = Math.abs(to.col - from.col);
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
}

function isValidBishopMove(board, from, to) {
    const rowDiff = Math.abs(to.row - from.row);
    const colDiff = Math.abs(to.col - from.col);
    if (rowDiff !== colDiff) return false;
    return isPathClear(board, from, to);
}

function isValidQueenMove(board, from, to) {
    return isValidRookMove(board, from, to) || isValidBishopMove(board, from, to);
}

function isValidKingMove(gameState, from, to, color) {
    const rowDiff = Math.abs(to.row - from.row);
    const colDiff = Math.abs(to.col - from.col);

    if (rowDiff <= 1 && colDiff <= 1) return true;

    if (rowDiff === 0 && colDiff === 2) {
        return canCastle(gameState, color, to.col > from.col ? 'kingside' : 'queenside');
    }

    return false;
}

function isPathClear(board, from, to) {
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

function canCastle(gameState, color, side) {
    const row = color === 'white' ? 7 : 0;
    const kingMoved = color === 'white' ? gameState.whiteKingMoved : gameState.blackKingMoved;

    if (kingMoved) return false;
    if (isKingInCheck(gameState.board, color)) return false;

    if (side === 'kingside') {
        const rookMoved = color === 'white'
            ? gameState.whiteRookKingsideMoved
            : gameState.blackRookKingsideMoved;

        if (rookMoved) return false;

        if (gameState.board[row][5] !== null || gameState.board[row][6] !== null) return false;

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

        if (gameState.board[row][1] !== null ||
            gameState.board[row][2] !== null ||
            gameState.board[row][3] !== null) return false;

        const testState1 = { ...gameState, board: gameState.board.map(r => [...r]) };
        testState1.board[row][4] = null;
        testState1.board[row][3] = { type: 'king', color };
        if (isKingInCheck(testState1.board, color)) return false;

        return true;
    }
}

function makeMove(gameState, from, to, promotion) {
    const newBoard = gameState.board.map(row => [...row]);
    const piece = newBoard[from.row][from.col];
    const capturedPiece = newBoard[to.row][to.col];

    let isEnPassant = false;
    let isCastling = false;

    if (piece.type === 'pawn' &&
        gameState.enPassantTarget &&
        to.row === gameState.enPassantTarget.row &&
        to.col === gameState.enPassantTarget.col) {
        isEnPassant = true;
        const captureRow = piece.color === 'white' ? to.row + 1 : to.row - 1;
        newBoard[captureRow][to.col] = null;
    }

    if (piece.type === 'king' && Math.abs(to.col - from.col) === 2) {
        isCastling = true;
        const row = from.row;
        if (to.col > from.col) {
            newBoard[row][5] = newBoard[row][7];
            newBoard[row][7] = null;
        } else {
            newBoard[row][3] = newBoard[row][0];
            newBoard[row][0] = null;
        }
    }

    newBoard[to.row][to.col] = piece;
    newBoard[from.row][from.col] = null;

    if (piece.type === 'pawn' && (to.row === 0 || to.row === 7)) {
        newBoard[to.row][to.col] = { type: promotion || 'queen', color: piece.color };
    }

    let enPassantTarget = null;
    if (piece.type === 'pawn' && Math.abs(to.row - from.row) === 2) {
        enPassantTarget = { row: (from.row + to.row) / 2, col: from.col };
    }

    const newState = {
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

    const opponentColor = newState.currentTurn;
    newState.isCheck = isKingInCheck(newBoard, opponentColor);
    newState.isCheckmate = newState.isCheck && !hasValidMoves(newState, opponentColor);
    newState.isStalemate = !newState.isCheck && !hasValidMoves(newState, opponentColor);

    return newState;
}

function findKing(board, color) {
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

function isKingInCheck(board, color) {
    const kingPos = findKing(board, color);
    if (!kingPos) return false;

    const opponentColor = color === 'white' ? 'black' : 'white';

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece && piece.color === opponentColor) {
                const from = { row, col };
                const tempState = {
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

                if (isValidPieceMove(tempState, from, kingPos, piece)) {
                    return true;
                }
            }
        }
    }

    return false;
}

function hasValidMoves(gameState, color) {
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