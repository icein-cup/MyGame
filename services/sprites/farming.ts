
import { TILE_SIZE } from '../../constants';

const createCtx = (): [HTMLCanvasElement, CanvasRenderingContext2D] | null => {
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE;
    canvas.height = TILE_SIZE;
    const ctx = canvas.getContext('2d');
    return ctx ? [canvas, ctx] : null;
};

// Helper: Tilled Dirt (Darker rows)
export const generateTilledDirtSprite = (): HTMLCanvasElement => {
    const res = createCtx();
    if (!res) return document.createElement('canvas');
    const [canvas, ctx] = res;

    // Base Dirt
    ctx.fillStyle = '#6D4C41'; 
    ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    
    // Furrows
    ctx.fillStyle = '#3E2723'; // Darker
    for(let y = 4; y < TILE_SIZE; y += 8) {
        ctx.fillRect(0, y, TILE_SIZE, 3);
    }
    
    // Highlights
    ctx.fillStyle = '#8D6E63';
    for(let y = 4; y < TILE_SIZE; y += 8) {
        // Random highlights to look like turned earth
        for(let x = 0; x < TILE_SIZE; x+=4) {
            if (Math.random() > 0.5) ctx.fillRect(x, y-1, 2, 1);
        }
    }

    return canvas;
};

// Helper: Wheat Generator
export const generateCropSprite = (stage: 0 | 1 | 2): HTMLCanvasElement => {
    const res = createCtx();
    if (!res) return document.createElement('canvas');
    const [canvas, ctx] = res;

    // Stage 0: Seeds / Small Sprouts
    if (stage === 0) {
        ctx.fillStyle = '#8BC34A'; // Light Green
        // 3 rows of small dots matching furrows
        const rows = [4, 12, 20, 28];
        rows.forEach(y => {
            if (y >= TILE_SIZE) return;
            for(let x=4; x<TILE_SIZE; x+=8) {
                const h = 2 + Math.random() * 2;
                ctx.fillRect(x, y, 2, h);
            }
        });
    }
    // Stage 1: Growing Stalks
    else if (stage === 1) {
        ctx.fillStyle = '#4CAF50'; // Green
        const rows = [4, 12, 20, 28];
        rows.forEach(y => {
            if (y >= TILE_SIZE) return;
            for(let x=4; x<TILE_SIZE; x+=8) {
                const h = 6 + Math.random() * 4;
                ctx.fillRect(x, y - h + 3, 2, h);
                // Little leaf
                ctx.fillRect(x+2, y - h + 5, 2, 1);
            }
        });
    }
    // Stage 2: Mature (Golden Wheat)
    else if (stage === 2) {
        const rows = [4, 12, 20, 28];
        rows.forEach(y => {
            if (y >= TILE_SIZE) return;
            for(let x=2; x<TILE_SIZE; x+=6) {
                const h = 10 + Math.random() * 4;
                // Stalk
                ctx.fillStyle = '#AED581'; // Pale Green stem
                ctx.fillRect(x, y - h + 3, 2, h);
                
                // Head (The Grain)
                ctx.fillStyle = '#FDD835'; // Gold
                ctx.fillRect(x-1, y - h, 4, 6);
                ctx.fillStyle = '#FBC02D'; // Darker Gold detail
                ctx.fillRect(x, y - h + 1, 2, 4);
            }
        });
    }

    return canvas;
};
