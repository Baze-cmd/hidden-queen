import { Board } from '@/types/Board';

export interface PieceMovement {
    canMoveTo(
        board: Board,
        fromX: number,
        fromY: number,
        toX: number,
        toY: number,
        isWhite: boolean
    ): boolean;
    getMoveDirections(): { dx: number; dy: number; maxDistance?: number }[];
}

export class PawnMovement implements PieceMovement {
    canMoveTo(
        board: Board,
        fromX: number,
        fromY: number,
        toX: number,
        toY: number,
        isWhite: boolean
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

        return false;
    }

    getMoveDirections(): { dx: number; dy: number; maxDistance?: number }[] {
        return [];
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
        isWhite: boolean
    ): boolean {
        const dx = Math.abs(toX - fromX);
        const dy = Math.abs(toY - fromY);

        if (dx > 1 || dy > 1) return false;
        if (dx === 0 && dy === 0) return false;

        const targetTile = board.tiles[toY * board.width + toX];
        return (
            targetTile === '  ' ||
            (isWhite && targetTile[0] === 'b') ||
            (!isWhite && targetTile[0] === 'w')
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

    canPieceMoveTo(board: Board, fromX: number, fromY: number, toX: number, toY: number): boolean {
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

        return movement.canMoveTo(board, fromX, fromY, toX, toY, isWhite);
    }

    getValidMoves(board: Board, fromX: number, fromY: number): { x: number; y: number }[] {
        const validMoves: { x: number; y: number }[] = [];

        if (fromX < 0 || fromX >= board.width || fromY < 0 || fromY >= board.height) {
            return validMoves;
        }

        const fromTile = board.tiles[fromY * board.width + fromX];
        if (fromTile === '  ') return validMoves;

        const pieceType = fromTile[1];
        const movement = this.movements.get(pieceType);
        if (!movement) return validMoves;

        if (pieceType === 'P') {
            for (let x = 0; x < board.width; x++) {
                for (let y = 0; y < board.height; y++) {
                    if (this.canPieceMoveTo(board, fromX, fromY, x, y)) {
                        validMoves.push({ x, y });
                    }
                }
            }
            return validMoves;
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

                if (this.canPieceMoveTo(board, fromX, fromY, newX, newY)) {
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
