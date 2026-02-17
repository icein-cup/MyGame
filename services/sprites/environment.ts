
import { TILE_SIZE } from '../../constants';
import { TileType } from '../../types';

// Helper: Adjust color brightness
const adjustColor = (color: string, amount: number): string => {
    let useColor = color;
    if (!useColor.startsWith('#')) {
        if (useColor === 'white') useColor = '#FFFFFF';
        if (useColor === 'black') useColor = '#000000';
    }
    
    const hex = useColor.replace('#', '');
    const num = parseInt(hex, 16);
    let r = (num >> 16) + amount;
    let g = ((num >> 8) & 0x00FF) + amount;
    let b = (num & 0x0000FF) + amount;
    r = Math.max(Math.min(255, r), 0);
    g = Math.max(Math.min(255, g), 0);
    b = Math.max(Math.min(255, b), 0);
    return '#' + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
};

const createCtx = (): [HTMLCanvasElement, CanvasRenderingContext2D] | null => {
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE;
    canvas.height = TILE_SIZE;
    const ctx = canvas.getContext('2d');
    return ctx ? [canvas, ctx] : null;
};

// Helper to draw a pixel rect with 1px black outline
const drawOutlinedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = '#000000';
    ctx.fillRect(x, y, w, h);
    
    if (w > 2 && h > 2) {
        ctx.fillStyle = color;
        ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
        
        ctx.fillStyle = adjustColor(color, 30);
        ctx.fillRect(x + 1, y + 1, w - 3, 1);
        ctx.fillRect(x + 1, y + 1, 1, h - 3);

        ctx.fillStyle = adjustColor(color, -30);
        ctx.fillRect(x + w - 2, y + 1, 1, h - 2);
        ctx.fillRect(x + 1, y + h - 2, w - 2, 1);
    }
};

const drawPixelRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
};

export const generateGroundSprite = (type: 'grass' | 'dirt' | 'cobblestone' | 'water'): HTMLCanvasElement => {
    const res = createCtx();
    if (!res) return document.createElement('canvas');
    const [canvas, ctx] = res;

    if (type === 'grass') {
        const base = '#5FA777';
        ctx.fillStyle = base;
        ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        // Noise
        for(let i=0; i<30; i++) {
            const x = Math.floor(Math.random() * TILE_SIZE);
            const y = Math.floor(Math.random() * TILE_SIZE);
            ctx.fillStyle = Math.random() > 0.5 ? '#7BC794' : '#4E8A60';
            ctx.fillRect(x, y, 2, 2);
        }
    } else if (type === 'dirt') {
        const base = '#8B5A2B';
        ctx.fillStyle = base;
        ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        // Gritty texture
        for(let i=0; i<40; i++) {
            const x = Math.floor(Math.random() * TILE_SIZE);
            const y = Math.floor(Math.random() * TILE_SIZE);
            ctx.fillStyle = Math.random() > 0.5 ? '#A06832' : '#6D4420';
            ctx.fillRect(x, y, 1, 1);
        }
    } else if (type === 'cobblestone') {
        const base = '#708090';
        ctx.fillStyle = '#58636E'; // Grout
        ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        
        const stones = [
            {x: 2, y: 2, w: 10, h: 8}, {x: 14, y: 4, w: 14, h: 10},
            {x: 4, y: 14, w: 12, h: 14}, {x: 18, y: 16, w: 10, h: 12}
        ];
        
        stones.forEach(s => {
            ctx.fillStyle = base;
            ctx.fillRect(s.x, s.y, s.w, s.h);
            ctx.fillStyle = adjustColor(base, 20);
            ctx.fillRect(s.x+1, s.y+1, s.w-2, 1);
            ctx.fillRect(s.x+1, s.y+1, 1, s.h-2);
            ctx.fillStyle = adjustColor(base, -20);
            ctx.fillRect(s.x+s.w-1, s.y+1, 1, s.h-2);
            ctx.fillRect(s.x+1, s.y+s.h-1, s.w-2, 1);
        });
    } else if (type === 'water') {
        const base = '#4682B4';
        ctx.fillStyle = base;
        ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#87CEEB';
        for(let i=0; i<5; i++) {
            const x = Math.floor(Math.random() * (TILE_SIZE - 6));
            const y = Math.floor(Math.random() * TILE_SIZE);
            ctx.fillRect(x, y, 6, 1);
        }
    }

    return canvas;
}

export const generateStructureSprite = (type: TileType): HTMLCanvasElement => {
    const res = createCtx();
    if (!res) return document.createElement('canvas');
    const [canvas, ctx] = res;

    if (type === 'wall_wood') {
        ctx.fillStyle = '#5D4037'; 
        ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#4E342E';
        ctx.fillRect(7, 1, 2, 30);
        ctx.fillRect(15, 1, 2, 30);
        ctx.fillRect(23, 1, 2, 30);
    } 
    else if (type === 'floor_wood') {
        ctx.fillStyle = '#8D6E63';
        ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#795548';
        for (let i = 0; i < TILE_SIZE; i += 8) ctx.fillRect(0, i, TILE_SIZE, 1);
    }
    else if (type === 'wall_stone') {
        ctx.fillStyle = '#7F8C8D';
        ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#95A5A6';
        ctx.fillRect(2, 2, 12, 8);
        ctx.fillRect(16, 2, 14, 8);
        ctx.fillRect(2, 14, 8, 8);
        ctx.fillRect(12, 14, 18, 8);
        ctx.fillRect(2, 24, 14, 6);
        ctx.fillRect(18, 24, 12, 6);
    }
    else if (type === 'floor_stone') {
        ctx.fillStyle = '#95A5A6';
        ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = '#7F8C8D';
        ctx.strokeRect(2, 2, 12, 12);
        ctx.strokeRect(16, 4, 14, 10);
        ctx.strokeRect(4, 18, 10, 12);
        ctx.strokeRect(18, 18, 12, 10);
    }
    else if (type === 'door') {
        ctx.fillStyle = '#8D6E63';
        ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#3E2723';
        ctx.fillRect(2, 2, 28, 30);
        ctx.fillStyle = '#6D4C41';
        ctx.fillRect(4, 4, 24, 28);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(22, 16, 3, 3); 
    }
    else if (type === 'door_open') {
        ctx.fillStyle = '#8D6E63';
        ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#2E1C15';
        ctx.fillRect(4, 2, 20, 30); 
        ctx.fillStyle = '#3E2723';
        ctx.fillRect(2, 2, 4, 30);
    }
    else if (type === 'roof_thatch') {
        ctx.fillStyle = '#C0392B'; 
        ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#922B21';
        const rowHeight = 8;
        for (let y = 0; y < TILE_SIZE; y += rowHeight) {
            ctx.fillRect(0, y + 6, TILE_SIZE, 2);
            const shift = (y / rowHeight) % 2 === 0 ? 0 : 8;
            for (let x = shift; x < TILE_SIZE; x += 16) ctx.fillRect(x, y, 2, 6);
        }
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
    }
    else if (type === 'roof_thatch_bottom') {
        ctx.fillStyle = '#C0392B'; 
        ctx.fillRect(0, 0, TILE_SIZE, 22);
        ctx.fillStyle = '#922B21';
        const rowHeight = 8;
        for (let y = 0; y < 16; y += rowHeight) {
            ctx.fillRect(0, y + 6, TILE_SIZE, 2);
            const shift = (y / rowHeight) % 2 === 0 ? 0 : 8;
            for (let x = shift; x < TILE_SIZE; x += 16) ctx.fillRect(x, y, 2, 6);
        }
        ctx.fillStyle = '#5D100B';
        ctx.fillRect(0, 22, TILE_SIZE, 2);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, TILE_SIZE, 22);
    }
    else if (type === 'roof_slate') {
        ctx.fillStyle = '#34495E'; 
        ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = '#2C3E50';
        ctx.lineWidth = 1;
        for(let y=0; y<TILE_SIZE; y+=8) {
            const shift = (y/8)%2===0 ? 0 : 16;
            for(let x=shift; x<TILE_SIZE; x+=16) {
                ctx.beginPath(); ctx.moveTo(x, y+8); ctx.lineTo(x+8, y); ctx.lineTo(x+16, y+8); ctx.stroke();
            }
        }
        ctx.strokeStyle = 'black';
        ctx.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
    }
    else if (type === 'roof_slate_bottom') {
        ctx.fillStyle = '#34495E'; 
        ctx.fillRect(0, 0, TILE_SIZE, 22);
        ctx.strokeStyle = '#2C3E50';
        ctx.lineWidth = 1;
        for(let y=0; y<16; y+=8) {
            const shift = (y/8)%2===0 ? 0 : 16;
            for(let x=shift; x<TILE_SIZE; x+=16) {
                ctx.beginPath(); ctx.moveTo(x, y+8); ctx.lineTo(x+8, y); ctx.lineTo(x+16, y+8); ctx.stroke();
            }
        }
        ctx.fillStyle = '#17202A';
        ctx.fillRect(0, 22, TILE_SIZE, 2);
        ctx.strokeStyle = 'black';
        ctx.strokeRect(0, 0, TILE_SIZE, 22);
    }
    else if (type === 'bed') {
        ctx.fillStyle = '#8D6E63';
        ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        drawOutlinedRect(ctx, 4, 2, 24, 28, '#5D4037');
        drawOutlinedRect(ctx, 6, 4, 20, 6, '#FFFFFF');
        drawOutlinedRect(ctx, 6, 10, 20, 18, '#C0392B');
    }
    else if (type === 'wardrobe') {
        ctx.fillStyle = '#8D6E63';
        ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        drawOutlinedRect(ctx, 2, 2, 28, 28, '#4E342E');
        ctx.fillStyle = '#000000';
        ctx.fillRect(15, 4, 2, 24);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(12, 14, 2, 2);
        ctx.fillRect(18, 14, 2, 2);
    }
    else if (type === 'table') {
        ctx.fillStyle = '#8D6E63';
        ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        drawOutlinedRect(ctx, 4, 4, 24, 24, '#6D4C41');
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(8, 8, 16, 16);
    }
    else if (type === 'chair') {
        ctx.fillStyle = '#8D6E63';
        ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        drawOutlinedRect(ctx, 8, 10, 16, 16, '#5D4037');
        drawOutlinedRect(ctx, 8, 2, 16, 8, '#4E342E');
    }
    else if (type === 'candle_stand') {
        ctx.fillStyle = '#8D6E63';
        ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        drawOutlinedRect(ctx, 10, 20, 12, 8, '#3E2723');
        drawOutlinedRect(ctx, 14, 10, 4, 10, '#F5F5F5');
        drawPixelRect(ctx, 14, 4, 4, 6, '#FFD700');
        drawPixelRect(ctx, 15, 6, 2, 3, '#E67E22');
    }
    else if (type === 'anvil') {
        ctx.fillStyle = '#95A5A6';
        ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        drawOutlinedRect(ctx, 6, 10, 20, 16, '#2C3E50'); // Base
        drawOutlinedRect(ctx, 4, 8, 24, 6, '#34495E'); // Top
    }
    else if (type === 'pew') {
        ctx.fillStyle = '#95A5A6'; 
        ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        drawOutlinedRect(ctx, 2, 6, 28, 20, '#5D4037'); // Bench
        drawPixelRect(ctx, 4, 8, 24, 16, '#8D6E63'); // Seat
    }

    return canvas;
};
