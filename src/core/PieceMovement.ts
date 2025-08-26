import { Board } from '@/types/Board';
import { Game } from '@/types/Game';

export interface PieceMovement {
    canMoveTo(
        board: Board,
        fromX: number,
        fromY: number,
        toX: number,
        toY: number,
        isWhite: boolean,
        game?: Game
    ): boolean;
    getMoveDirections(): { dx: number; dy: number; maxDistance?: number }[];
    getValidMoves?(
        board: Board,
        fromX: number,
        fromY: number,
        isWhite: boolean,
        game?: Game
    ): { x: number; y: number }[];
}

export class PawnMovement implements PieceMovement {
    canMoveTo(
        board: Board,
        fromX: number,
        fromY: number,
        toX: number,
        toY: number,
        isWhite: boolean,
        game?: Game
    ): boolean {
        const direction = isWhite ? -1 : 1;
        const startingRow = isWhite ? 6 : 1;
        const dx = toX - fromX;
        const dy = toY - fromY;

        const targetTile = board.tiles[toY * board.width + toX];
        const isTargetEmpty = targetTile === '  ';
        const isTargetOpponent =
            targetTile !== '  ' &&
            ((isWhite && targetTile[0] === 'b') || (!isWhite && targetTile[0] === 'w'));

        if (dx === 0 && dy === direction && isTargetEmpty) {
            return true;
        }

        if (
            dx === 0 &&
            dy === 2 * direction &&
            fromY === startingRow &&
            isTargetEmpty &&
            board.tiles[(toY - direction) * board.width + toX] === '  '
        ) {
            return true;
        }

        if (Math.abs(dx) === 1 && dy === direction && isTargetOpponent) {
            return true;
        }

        if (Math.abs(dx) === 1 && dy === direction && isTargetEmpty && game) {
            return this.canEnPassant(board, fromX, fromY, toX, toY, isWhite, game);
        }

        return false;
    }

    private canEnPassant(
        board: Board,
        fromX: number,
        fromY: number,
        toX: number,
        toY: number,
        isWhite: boolean,
        game: Game
    ): boolean {
        const expectedRow = isWhite ? 3 : 4;
        if (fromY !== expectedRow) return false;

        const capturedPawnY = fromY;
        const capturedPawnX = toX;
        const capturedPawn = board.tiles[capturedPawnY * board.width + capturedPawnX];

        if (capturedPawn === '  ' || 
            (isWhite && capturedPawn[0] !== 'b') || 
            (!isWhite && capturedPawn[0] !== 'w') ||
            capturedPawn[1] !== 'P') {
            return false;
        }

        if (game.moves.length === 0) return false;

        const lastMove = game.moves[game.moves.length - 1];
        return (
            lastMove.piece[1] === 'P' &&
            lastMove.toX === capturedPawnX &&
            lastMove.toY === capturedPawnY &&
            Math.abs(lastMove.fromY - lastMove.toY) === 2
        );
    }

    getMoveDirections(): { dx: number; dy: number; maxDistance?: number }[] {
        return [];
    }

    getValidMoves(
        board: Board,
        fromX: number,
        fromY: number,
        isWhite: boolean,
        game?: Game
    ): { x: number; y: number }[] {
        const validMoves: { x: number; y: number }[] = [];
        
        for (let x = 0; x < board.width; x++) {
            for (let y = 0; y < board.height; y++) {
                if (this.canMoveTo(board, fromX, fromY, x, y, isWhite, game)) {
                    validMoves.push({ x, y });
                }
            }
        }
        
        return validMoves;
    }
}

export class RookMovement implements PieceMovement {
    canMoveTo(
        board: Board,
        fromX: number,
        fromY: number,
        toX: number,
        toY: number,
        isWhite: boolean
    ): boolean {
        const dx = toX - fromX;
        const dy = toY - fromY;

        if (dx !== 0 && dy !== 0) return false;

        return this.isPathClear(board, fromX, fromY, toX, toY, isWhite);
    }

    getMoveDirections(): { dx: number; dy: number }[] {
        return [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 },
        ];
    }

    private isPathClear(
        board: Board,
        fromX: number,
        fromY: number,
        toX: number,
        toY: number,
        isWhite: boolean
    ): boolean {
        const dx = Math.sign(toX - fromX);
        const dy = Math.sign(toY - fromY);

        let x = fromX + dx;
        let y = fromY + dy;

        while (x !== toX || y !== toY) {
            if (board.tiles[y * board.width + x] !== '  ') return false;
            x += dx;
            y += dy;
        }

        const targetTile = board.tiles[toY * board.width + toX];
        return (
            targetTile === '  ' ||
            (isWhite && targetTile[0] === 'b') ||
            (!isWhite && targetTile[0] === 'w')
        );
    }
}

export class BishopMovement implements PieceMovement {
    canMoveTo(
        board: Board,
        fromX: number,
        fromY: number,
        toX: number,
        toY: number,
        isWhite: boolean
    ): boolean {
        const dx = toX - fromX;
        const dy = toY - fromY;

        if (Math.abs(dx) !== Math.abs(dy)) return false;

        return this.isPathClear(board, fromX, fromY, toX, toY, isWhite);
    }

    getMoveDirections(): { dx: number; dy: number }[] {
        return [
            { dx: 1, dy: 1 },
            { dx: 1, dy: -1 },
            { dx: -1, dy: 1 },
            { dx: -1, dy: -1 },
        ];
    }

    private isPathClear(
        board: Board,
        fromX: number,
        fromY: number,
        toX: number,
        toY: number,
        isWhite: boolean
    ): boolean {
        const dx = Math.sign(toX - fromX);
        const dy = Math.sign(toY - fromY);

        let x = fromX + dx;
        let y = fromY + dy;

        while (x !== toX || y !== toY) {
            if (board.tiles[y * board.width + x] !== '  ') return false;
            x += dx;
            y += dy;
        }

        const targetTile = board.tiles[toY * board.width + toX];
        return (
            targetTile === '  ' ||
            (isWhite && targetTile[0] === 'b') ||
            (!isWhite && targetTile[0] === 'w')
        );
    }
}

export class QueenMovement implements PieceMovement {
    private rookMovement = new RookMovement();
    private bishopMovement = new BishopMovement();

    canMoveTo(
        board: Board,
        fromX: number,
        fromY: number,
        toX: number,
        toY: number,
        isWhite: boolean
    ): boolean {
        return (
            this.rookMovement.canMoveTo(board, fromX, fromY, toX, toY, isWhite) ||
            this.bishopMovement.canMoveTo(board, fromX, fromY, toX, toY, isWhite)
        );
    }

    getMoveDirections(): { dx: number; dy: number }[] {
        return [
            ...this.rookMovement.getMoveDirections(),
            ...this.bishopMovement.getMoveDirections(),
        ];
    }
}

export class KnightMovement implements PieceMovement {
    canMoveTo(
        board: Board,
        fromX: number,
        fromY: number,
        toX: number,
        toY: number,
        isWhite: boolean
    ): boolean {
        const dx = Math.abs(toX - fromX);
        const dy = Math.abs(toY - fromY);

        if (!((dx === 2 && dy === 1) || (dx === 1 && dy === 2))) return false;

        const targetTile = board.tiles[toY * board.width + toX];
        return (
            targetTile === '  ' ||
            (isWhite && targetTile[0] === 'b') ||
            (!isWhite && targetTile[0] === 'w')
        );
    }

    getMoveDirections(): { dx: number; dy: number; maxDistance: number }[] {
        return [
            { dx: 2, dy: 1, maxDistance: 1 },
            { dx: 2, dy: -1, maxDistance: 1 },
            { dx: -2, dy: 1, maxDistance: 1 },
            { dx: -2, dy: -1, maxDistance: 1 },
            { dx: 1, dy: 2, maxDistance: 1 },
            { dx: 1, dy: -2, maxDistance: 1 },
            { dx: -1, dy: 2, maxDistance: 1 },
            { dx: -1, dy: -2, maxDistance: 1 },
        ];
    }
}

export class KingMovement implements PieceMovement {
    canMoveTo(
        board: Board,
        fromX: number,
        fromY: number,
        toX: number,
        toY: number,
        isWhite: boolean,
        game?: Game
    ): boolean {
        const dx = toX - fromX;
        const dy = toY - fromY;

        if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1 && !(dx === 0 && dy === 0)) {
            const targetTile = board.tiles[toY * board.width + toX];
            return (
                targetTile === '  ' ||
                (isWhite && targetTile[0] === 'b') ||
                (!isWhite && targetTile[0] === 'w')
            );
        }

        if (game && dy === 0 && Math.abs(dx) === 2) {
            return this.canCastle(board, fromX, fromY, toX, toY, isWhite, game);
        }

        return false;
    }

    private canCastle(
        board: Board,
        fromX: number,
        fromY: number,
        toX: number,
        toY: number,
        isWhite: boolean,
        game: Game
    ): boolean {
        const kingRow = isWhite ? 7 : 0;
        
        if (fromX !== 4 || fromY !== kingRow) return false;
        
        if (this.hasPieceMoved(game, 'K', 4, kingRow, isWhite)) return false;

        const isKingsideCastle = toX === 6;
        const rookX = isKingsideCastle ? 7 : 0;
        const rookPiece = board.tiles[kingRow * board.width + rookX];
        
        const expectedRook = isWhite ? 'wR' : 'bR';
        if (rookPiece !== expectedRook) return false;
        if (this.hasPieceMoved(game, 'R', rookX, kingRow, isWhite)) return false;

        const direction = isKingsideCastle ? 1 : -1;
        const endX = isKingsideCastle ? 6 : 2;
        
        for (let x = fromX + direction; x !== endX + direction; x += direction) {
            if (board.tiles[kingRow * board.width + x] !== '  ') return false;
        }
        
        return true;
    }

    private hasPieceMoved(game: Game, pieceType: string, x: number, y: number, isWhite: boolean): boolean {
        const pieceColor = isWhite ? 'w' : 'b';
        const pieceString = pieceColor + pieceType;
        
        return game.moves.some(move => 
            move.piece === pieceString && 
            move.fromX === x && 
            move.fromY === y
        );
    }

    getMoveDirections(): { dx: number; dy: number; maxDistance: number }[] {
        return [
            { dx: 1, dy: 0, maxDistance: 1 },
            { dx: -1, dy: 0, maxDistance: 1 },
            { dx: 0, dy: 1, maxDistance: 1 },
            { dx: 0, dy: -1, maxDistance: 1 },
            { dx: 1, dy: 1, maxDistance: 1 },
            { dx: 1, dy: -1, maxDistance: 1 },
            { dx: -1, dy: 1, maxDistance: 1 },
            { dx: -1, dy: -1, maxDistance: 1 },
        ];
    }

    getValidMoves(
        board: Board,
        fromX: number,
        fromY: number,
        isWhite: boolean,
        game?: Game
    ): { x: number; y: number }[] {
        const validMoves: { x: number; y: number }[] = [];
        
        const directions = this.getMoveDirections();
        for (const direction of directions) {
            const newX = fromX + direction.dx;
            const newY = fromY + direction.dy;
            
            if (newX >= 0 && newX < board.width && newY >= 0 && newY < board.height) {
                if (this.canMoveTo(board, fromX, fromY, newX, newY, isWhite, game)) {
                    validMoves.push({ x: newX, y: newY });
                }
            }
        }
        
        if (game) {
            if (this.canMoveTo(board, fromX, fromY, fromX + 2, fromY, isWhite, game)) {
                validMoves.push({ x: fromX + 2, y: fromY });
            }
            if (this.canMoveTo(board, fromX, fromY, fromX - 2, fromY, isWhite, game)) {
                validMoves.push({ x: fromX - 2, y: fromY });
            }
        }
        
        return validMoves;
    }
}

export class PieceMovementHandler {
    private movements: Map<string, PieceMovement> = new Map();

    constructor() {
        this.movements.set('P', new PawnMovement());
        this.movements.set('R', new RookMovement());
        this.movements.set('N', new KnightMovement());
        this.movements.set('B', new BishopMovement());
        this.movements.set('Q', new QueenMovement());
        this.movements.set('H', new QueenMovement());
        this.movements.set('K', new KingMovement());
    }

    canPieceMoveTo(
        game: Game,
        fromX: number, 
        fromY: number, 
        toX: number, 
        toY: number
    ): boolean {
        const board = game.board;
        
        if (
            fromX < 0 ||
            fromX >= board.width ||
            fromY < 0 ||
            fromY >= board.height ||
            toX < 0 ||
            toX >= board.width ||
            toY < 0 ||
            toY >= board.height
        ) {
            return false;
        }

        const fromTile = board.tiles[fromY * board.width + fromX];
        if (fromTile === '  ') return false;

        const pieceType = fromTile[1];
        const isWhite = fromTile[0] === 'w';

        const movement = this.movements.get(pieceType);
        if (!movement) return false;

        return movement.canMoveTo(board, fromX, fromY, toX, toY, isWhite, game);
    }

    getValidMoves(
        game: Game,
        fromX: number, 
        fromY: number
    ): { x: number; y: number }[] {
        const validMoves: { x: number; y: number }[] = [];
        const board = game.board;

        if (fromX < 0 || fromX >= board.width || fromY < 0 || fromY >= board.height) {
            return validMoves;
        }

        const fromTile = board.tiles[fromY * board.width + fromX];
        if (fromTile === '  ') return validMoves;

        const pieceType = fromTile[1];
        const isWhite = fromTile[0] === 'w';
        const movement = this.movements.get(pieceType);
        if (!movement) return validMoves;

        if (movement.getValidMoves) {
            return movement.getValidMoves(board, fromX, fromY, isWhite, game);
        }

        const directions = movement.getMoveDirections();
        for (const direction of directions) {
            const maxDistance = direction.maxDistance || Math.max(board.width, board.height);

            for (let distance = 1; distance <= maxDistance; distance++) {
                const newX = fromX + direction.dx * distance;
                const newY = fromY + direction.dy * distance;

                if (newX < 0 || newX >= board.width || newY < 0 || newY >= board.height) {
                    break;
                }

                if (this.canPieceMoveTo(game, fromX, fromY, newX, newY)) {
                    validMoves.push({ x: newX, y: newY });

                    const targetTile = board.tiles[newY * board.width + newX];
                    if (targetTile !== '  ') {
                        break;
                    }
                } else {
                    break;
                }
            }
        }

        return validMoves;
    }
}

export const pieceMovementHandler = new PieceMovementHandler();