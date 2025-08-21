import { Board } from '@/types/Board';
import styles from './BoardComponent.module.css';

export function BoardComponent(props: {
    board: Board;
    whitePOV: boolean;
    onTileClick: (x: number, y: number) => void;
}) {
    const fileMapping = new Map<string, string>([
        ['wK', 'w_k.svg'],
        ['wQ', 'w_q.svg'],
        ['wR', 'w_r.svg'],
        ['wB', 'w_b.svg'],
        ['wN', 'w_n.svg'],
        ['wP', 'w_p.svg'],
        ['wH', 'w_h.svg'],
        ['bK', 'b_k.svg'],
        ['bQ', 'b_q.svg'],
        ['bR', 'b_r.svg'],
        ['bB', 'b_b.svg'],
        ['bN', 'b_n.svg'],
        ['bP', 'b_p.svg'],
        ['bH', 'b_h.svg'],
        ['ci', 'circle.svg'],
    ]);

    const possibleTileValues: string[] = [
        'wK',
        'wQ',
        'wR',
        'wB',
        'wN',
        'wP',
        'wH',
        'bK',
        'bQ',
        'bR',
        'bB',
        'bN',
        'bP',
        'bH',
        'ci',
    ];

    function getChessPiece(piece: string) {
        if (!possibleTileValues.includes(piece)) return null;
        const src = fileMapping.get(piece);
        return <img src={`/pieces/${src}`} alt={piece} className={styles.piece} />;
    }

    return (
        <div
            className={styles.board}
            style={{
                gridTemplateColumns: `repeat(${props.board.width}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${props.board.height}, minmax(0, 1fr))`,
            }}
        >
            {Array.from({ length: props.board.height }).map((_, rowIndex) =>
                Array.from({ length: props.board.width }).map((_, colIndex) => {
                    // For black POV, flip both row and column indices
                    const displayRowIndex = props.whitePOV
                        ? rowIndex
                        : props.board.height - 1 - rowIndex;
                    const displayColIndex = props.whitePOV
                        ? colIndex
                        : props.board.width - 1 - colIndex;

                    // Use the original indices for tile data lookup
                    const idx = displayRowIndex * props.board.width + displayColIndex;
                    const piece = props.board.tiles[idx] || '';

                    // Calculate tile color based on display position (not flipped for black POV)
                    const isLight = (rowIndex + colIndex) % 2 === 0;

                    return (
                        <div
                            key={`${rowIndex}-${colIndex}`}
                            className={`${styles.tile} ${isLight ? styles.light : styles.dark}`}
                            onClick={() => props.onTileClick(displayColIndex, displayRowIndex)}
                        >
                            {getChessPiece(piece)}
                        </div>
                    );
                })
            )}
        </div>
    );
}
