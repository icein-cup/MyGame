import { TILE_SIZE } from '../constants';
import { VisualTraits } from '../types';

// Helper to darken/lighten hex color for shading
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

// Helper for "Soft" Rect (Rounded corners for characters)
const drawSoftRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, outline: boolean = true) => {
    // Outline
    if (outline) {
        ctx.fillStyle = '#000000';
        // Cross shape for rounded corners
        ctx.fillRect(x + 1, y, w - 2, h);
        ctx.fillRect(x, y + 1, w, h - 2);
    }

    // Fill
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, w - 2, h - 2);

    // Highlight (Top/Left)
    ctx.fillStyle = adjustColor(color, 30);
    ctx.fillRect(x + 2, y + 1, w - 4, 1);
    ctx.fillRect(x + 1, y + 2, 1, h - 4);

    // Shadow (Bottom/Right)
    ctx.fillStyle = adjustColor(color, -30);
    ctx.fillRect(x + w - 2, y + 2, 1, h - 4);
    ctx.fillRect(x + 2, y + h - 2, w - 4, 1);
};

const drawPixelRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
};

export const imageToCanvas = (img: HTMLImageElement): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.drawImage(img, 0, 0);
    }
    return canvas;
};

export const generateItemSprite = (type: 'wood' | 'stone' | 'bread' | 'potion' | 'tomato'): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE;
    canvas.height = TILE_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    if (type === 'wood') {
        drawOutlinedRect(ctx, 6, 10, 20, 6, '#5D4037');
        drawOutlinedRect(ctx, 8, 16, 16, 6, '#5D4037');
        drawPixelRect(ctx, 4, 10, 2, 6, '#8D6E63'); 
    } else if (type === 'stone') {
        drawOutlinedRect(ctx, 8, 12, 16, 12, '#7F8C8D');
        drawPixelRect(ctx, 12, 14, 4, 4, '#95A5A6'); 
    } else if (type === 'bread') {
        drawOutlinedRect(ctx, 8, 10, 16, 12, '#E67E22');
        drawPixelRect(ctx, 10, 12, 12, 4, '#F39C12'); 
    } else if (type === 'potion') {
        drawOutlinedRect(ctx, 12, 12, 8, 12, '#C0392B'); 
        drawOutlinedRect(ctx, 14, 6, 4, 6, '#FFFFFF'); 
        drawPixelRect(ctx, 14, 8, 4, 2, '#C0392B');
    } else if (type === 'tomato') {
        drawOutlinedRect(ctx, 10, 10, 12, 12, '#C0392B'); // Red body
        drawPixelRect(ctx, 14, 8, 4, 3, '#27AE60'); // Green stem
        drawPixelRect(ctx, 12, 12, 3, 3, '#E74C3C'); // Highlight
    }

    return canvas;
};

// --- ADVANCED 16-BIT ANATOMY ---
// Smoother, rounder, proportional.

const ANATOMY = {
    HEAD: { w: 14, h: 12, x: 9, y: 2 },
    TORSO: {
        MALE: { w: 14, h: 10, x: 9, y: 13 },
        FEMALE: { w: 12, h: 10, x: 10, y: 13 }
    },
    LEGS: {
        MALE: { leftX: 9, rightX: 17, y: 23, w: 5, h: 7 },
        FEMALE: { leftX: 11, rightX: 16, y: 23, w: 4, h: 7 }
    },
    ARM: { w: 4, h: 9 }
};

// Layout:
// 0: Down
// 1: Up
// 2: Left
// 3: Right
export const generateBaseBody = (skinColor: string, gender: 'male' | 'female'): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE * 4;
    canvas.height = TILE_SIZE * 4;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const underwearColor = '#E2E2E2'; 
    const shadowColor = adjustColor(skinColor, -30);
    
    for (let dir = 0; dir < 4; dir++) {
        for (let frame = 0; frame < 4; frame++) {
            const ox = frame * TILE_SIZE;
            const oy = dir * TILE_SIZE;

            const isStep = frame === 1 || frame === 3;
            const bob = isStep ? 1 : 0; 

            const headX = ANATOMY.HEAD.x;
            const headY = ANATOMY.HEAD.y - bob;
            const headW = ANATOMY.HEAD.w;
            const headH = ANATOMY.HEAD.h;

            const torsoW = gender === 'male' ? ANATOMY.TORSO.MALE.w : ANATOMY.TORSO.FEMALE.w;
            const torsoX = gender === 'male' ? ANATOMY.TORSO.MALE.x : ANATOMY.TORSO.FEMALE.x;
            const torsoH = ANATOMY.TORSO.MALE.h;
            const torsoY = headY + headH - 1; // Overlap neck

            const legDefs = gender === 'male' ? ANATOMY.LEGS.MALE : ANATOMY.LEGS.FEMALE;
            const legY = torsoY + torsoH;

            // --- LEGS ---
            if (dir === 0 || dir === 1) { // Front (0) or Back (1)
                let lOff = 0, rOff = 0;
                if (frame === 1) lOff = -2; 
                if (frame === 3) rOff = -2; 
                
                drawSoftRect(ctx, ox + legDefs.leftX, oy + legY + lOff, legDefs.w, legDefs.h, skinColor);
                drawSoftRect(ctx, ox + legDefs.rightX, oy + legY + rOff, legDefs.w, legDefs.h, skinColor);
            } else { // Side (Left=2, Right=3)
                const legCenterX = 13;
                const sideLegW = 5;
                if (frame === 1) { 
                    drawSoftRect(ctx, ox + legCenterX - 4, oy + legY - 1, sideLegW, legDefs.h, skinColor);
                    drawSoftRect(ctx, ox + legCenterX + 2, oy + legY, sideLegW, legDefs.h, shadowColor);
                } else if (frame === 3) {
                    drawSoftRect(ctx, ox + legCenterX + 2, oy + legY - 1, sideLegW, legDefs.h, skinColor);
                    drawSoftRect(ctx, ox + legCenterX - 4, oy + legY, sideLegW, legDefs.h, shadowColor);
                } else {
                    drawSoftRect(ctx, ox + legCenterX - 1, oy + legY, 6, legDefs.h, skinColor);
                }
            }

            // --- TORSO ---
            drawSoftRect(ctx, ox + torsoX, oy + torsoY, torsoW, torsoH, skinColor);
            
            // Underwear
            if (gender === 'female') {
                drawPixelRect(ctx, ox + torsoX + 1, oy + torsoY + 7, torsoW - 2, 3, underwearColor);
            } else {
                drawPixelRect(ctx, ox + torsoX + 1, oy + torsoY + 8, torsoW - 2, 2, underwearColor);
            }

            // --- HEAD ---
            drawSoftRect(ctx, ox + headX, oy + headY, headW, headH, skinColor);

            if (dir === 0) { // Front
                const eyeY = headY + 4;
                // Whites
                drawPixelRect(ctx, ox + headX + 2, oy + eyeY, 4, 3, '#FFFFFF');
                drawPixelRect(ctx, ox + headX + headW - 6, oy + eyeY, 4, 3, '#FFFFFF');
                // Pupils
                drawPixelRect(ctx, ox + headX + 4, oy + eyeY + 1, 2, 2, '#2C3E50');
                drawPixelRect(ctx, ox + headX + headW - 4, oy + eyeY + 1, 2, 2, '#2C3E50');
                
                // Blush/Shadow
                drawPixelRect(ctx, ox + headX + 2, oy + headY + 8, 3, 1, '#E59866');
                drawPixelRect(ctx, ox + headX + headW - 5, oy + headY + 8, 3, 1, '#E59866');

            } else if (dir === 2) { // Left
                 drawPixelRect(ctx, ox + headX, oy + headY + 4, 3, 3, '#FFFFFF');
                 drawPixelRect(ctx, ox + headX, oy + headY + 5, 2, 2, '#2C3E50');
            } else if (dir === 3) { // Right
                 drawPixelRect(ctx, ox + headX + headW - 3, oy + headY + 4, 3, 3, '#FFFFFF'); 
                 drawPixelRect(ctx, ox + headX + headW - 2, oy + headY + 5, 2, 2, '#2C3E50');
            }
            // dir === 1 (Back) has no face details

            // --- ARMS ---
            const armW = ANATOMY.ARM.w;
            const armH = ANATOMY.ARM.h;
            const armY = torsoY + 1;
            
            if (dir === 0 || dir === 1) { // Front or Back
                let lArmOff = 0, rArmOff = 0;
                if (frame === 1) { lArmOff = 1; rArmOff = -1; }
                if (frame === 3) { lArmOff = -1; rArmOff = 1; }

                drawSoftRect(ctx, ox + torsoX - armW + 1, oy + armY + lArmOff, armW, armH, skinColor);
                drawSoftRect(ctx, ox + torsoX + torsoW - 1, oy + armY + rArmOff, armW, armH, skinColor);
            } else { // Side
                const armSwing = (frame === 1) ? 3 : (frame === 3) ? -3 : 0;
                drawSoftRect(ctx, ox + 14 + armSwing, oy + armY + 1, armW, armH, skinColor);
            }
        }
    }
    return canvas;
};

export const generateClothingLayer = (style: 'tunic' | 'robe' | 'dress', color: string, gender: 'male' | 'female'): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE * 4;
    canvas.height = TILE_SIZE * 4;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const darkColor = adjustColor(color, -40);
    const lightColor = adjustColor(color, 40);
    const shoeColor = '#4E342E';

    for (let dir = 0; dir < 4; dir++) {
        for (let frame = 0; frame < 4; frame++) {
            const ox = frame * TILE_SIZE;
            const oy = dir * TILE_SIZE;
            const isStep = frame === 1 || frame === 3;
            const bob = isStep ? 1 : 0;
            
            const headY = ANATOMY.HEAD.y - bob;
            const torsoY = headY + ANATOMY.HEAD.h - 1;
            const torsoW = gender === 'male' ? ANATOMY.TORSO.MALE.w : ANATOMY.TORSO.FEMALE.w;
            const torsoX = gender === 'male' ? ANATOMY.TORSO.MALE.x : ANATOMY.TORSO.FEMALE.x;
            const legY = torsoY + ANATOMY.TORSO.MALE.h;
            const legDefs = gender === 'male' ? ANATOMY.LEGS.MALE : ANATOMY.LEGS.FEMALE;

            // --- BOOTS ---
            if (dir === 0 || dir === 1) { // Front or Back
                let lOff = 0, rOff = 0;
                if (frame === 1) lOff = -2; if (frame === 3) rOff = -2;
                drawSoftRect(ctx, ox + legDefs.leftX, oy + legY + 4 + lOff, legDefs.w, 4, shoeColor);
                drawSoftRect(ctx, ox + legDefs.rightX, oy + legY + 4 + rOff, legDefs.w, 4, shoeColor);
            } else { // Side
                const legCenterX = 13;
                const sideLegW = 5;
                if (frame === 1) {
                    drawSoftRect(ctx, ox + legCenterX - 4, oy + legY + 3, sideLegW, 4, shoeColor);
                    drawSoftRect(ctx, ox + legCenterX + 2, oy + legY + 4, sideLegW, 4, shoeColor);
                } else if (frame === 3) {
                    drawSoftRect(ctx, ox + legCenterX + 2, oy + legY + 3, sideLegW, 4, shoeColor);
                    drawSoftRect(ctx, ox + legCenterX - 4, oy + legY + 4, sideLegW, 4, shoeColor);
                } else {
                    drawSoftRect(ctx, ox + legCenterX - 1, oy + legY + 4, 6, 4, shoeColor);
                }
            }

            // --- CLOTHING ---
            if (style === 'tunic') {
                drawSoftRect(ctx, ox + torsoX - 1, oy + torsoY, torsoW + 2, 12, color);
                drawPixelRect(ctx, ox + torsoX - 1, oy + torsoY + 8, torsoW + 2, 3, '#3E2723'); // Belt
                if (dir === 0) drawPixelRect(ctx, ox + 15, oy + torsoY + 8, 2, 3, '#FFD700'); // Buckle

                // Sleeves
                const armW = ANATOMY.ARM.w + 1;
                const armY = torsoY;
                if (dir === 0 || dir === 1) { // Front or Back
                    drawSoftRect(ctx, ox + torsoX - armW + 1, oy + armY, armW, 6, color);
                    drawSoftRect(ctx, ox + torsoX + torsoW - 1, oy + armY, armW, 6, color);
                } else { // Side
                     const armSwing = (frame === 1) ? 3 : (frame === 3) ? -3 : 0;
                     drawSoftRect(ctx, ox + 14 + armSwing, oy + armY, armW, 6, color);
                }

            } else if (style === 'robe') {
                drawSoftRect(ctx, ox + torsoX - 1, oy + torsoY, torsoW + 2, 19, color);
                drawPixelRect(ctx, ox + 15, oy + torsoY, 2, 19, darkColor); // Trim

                const armW = ANATOMY.ARM.w + 1;
                const armY = torsoY;
                if (dir === 0 || dir === 1) { // Front or Back
                    drawSoftRect(ctx, ox + torsoX - armW + 1, oy + armY, armW, 12, color);
                    drawSoftRect(ctx, ox + torsoX + torsoW - 1, oy + armY, armW, 12, color);
                } else { // Side
                     const armSwing = (frame === 1) ? 3 : (frame === 3) ? -3 : 0;
                     drawSoftRect(ctx, ox + 14 + armSwing, oy + armY, armW, 12, color);
                }

            } else if (style === 'dress') {
                 drawSoftRect(ctx, ox + torsoX - 1, oy + torsoY, torsoW + 2, 9, color);
                 const skirtW = torsoW + 4;
                 const skirtX = torsoX - 2;
                 drawSoftRect(ctx, ox + skirtX, oy + torsoY + 7, skirtW, 12, color);
                 drawPixelRect(ctx, ox + 13, oy + torsoY + 7, 6, 12, lightColor); // Apron

                 const armW = ANATOMY.ARM.w + 1;
                 const armY = torsoY;
                 if (dir === 0 || dir === 1) { // Front or Back
                    drawSoftRect(ctx, ox + torsoX - armW + 1, oy + armY, armW, 5, color);
                    drawSoftRect(ctx, ox + torsoX + torsoW - 1, oy + armY, armW, 5, color);
                 } else { // Side
                    const armSwing = (frame === 1) ? 3 : (frame === 3) ? -3 : 0;
                    drawSoftRect(ctx, ox + 14 + armSwing, oy + armY, armW, 5, color);
                 }
            }
        }
    }
    return canvas;
};

export const generateHairLayer = (style: 'short' | 'long' | 'bald' | 'braids', color: string): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE * 4;
    canvas.height = TILE_SIZE * 4;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    if (style === 'bald') return canvas;
    const highlight = adjustColor(color, 40);

    for (let dir = 0; dir < 4; dir++) {
        for (let frame = 0; frame < 4; frame++) {
            const ox = frame * TILE_SIZE;
            const oy = dir * TILE_SIZE;
            const isStep = frame === 1 || frame === 3;
            const bob = isStep ? 1 : 0;
            
            const headX = ANATOMY.HEAD.x;
            const headY = ANATOMY.HEAD.y - bob;
            const headW = ANATOMY.HEAD.w;

            // Top Texture (Highlight)
            drawSoftRect(ctx, ox + headX - 1, oy + headY - 1, headW + 2, 6, color);
            drawPixelRect(ctx, ox + headX + 2, oy + headY, headW - 4, 2, highlight); 

            if (style === 'short') {
                if (dir === 0) { // Front
                    drawSoftRect(ctx, ox + headX - 1, oy + headY, 3, 6, color);
                    drawSoftRect(ctx, ox + headX + headW - 2, oy + headY, 3, 6, color);
                    // Bangs
                    drawPixelRect(ctx, ox + headX + 2, oy + headY, headW - 4, 2, color);
                } else if (dir === 2) { // Left (was 1)
                    drawSoftRect(ctx, ox + headX + 6, oy + headY, 10, 9, color);
                } else if (dir === 3) { // Right (was 2)
                    drawSoftRect(ctx, ox + headX, oy + headY, 10, 9, color);
                } else if (dir === 1) { // Back (was 3)
                    drawSoftRect(ctx, ox + headX - 1, oy + headY, headW + 2, 9, color);
                }
            } else if (style === 'long') {
                if (dir === 0) { // Front
                    drawSoftRect(ctx, ox + headX - 2, oy + headY, 4, 14, color);
                    drawSoftRect(ctx, ox + headX + headW - 2, oy + headY, 4, 14, color);
                } else if (dir === 2) { // Left
                    drawSoftRect(ctx, ox + headX + 6, oy + headY, 10, 14, color);
                } else if (dir === 3) { // Right
                    drawSoftRect(ctx, ox + headX, oy + headY, 10, 14, color);
                } else if (dir === 1) { // Back
                    drawSoftRect(ctx, ox + headX - 2, oy + headY, headW + 4, 16, color);
                }
            } else if (style === 'braids') {
                 if (dir === 0) { // Front
                    drawSoftRect(ctx, ox + headX - 3, oy + headY + 4, 4, 10, color); // Braid L
                    drawSoftRect(ctx, ox + headX + headW - 1, oy + headY + 4, 4, 10, color); // Braid R
                    drawPixelRect(ctx, ox + headX + 2, oy + headY, headW - 4, 2, color); 
                } else if (dir === 1) { // Back (was 3)
                    drawSoftRect(ctx, ox + headX, oy + headY, headW, 7, color);
                } else if (dir === 2) { // Left
                     drawSoftRect(ctx, ox + headX + 6, oy + headY, 9, 7, color);
                } else if (dir === 3) { // Right
                     drawSoftRect(ctx, ox + headX, oy + headY, 9, 7, color);
                }
            }
        }
    }
    return canvas;
};

export const compositeSprites = (traits: VisualTraits): HTMLCanvasElement => {
    const base = generateBaseBody(traits.skinColor, traits.gender);
    const clothes = generateClothingLayer(traits.clothingStyle as any, traits.clothingColor, traits.gender);
    const hair = generateHairLayer(traits.hairStyle as any, traits.hairColor);

    const canvas = document.createElement('canvas');
    canvas.width = base.width;
    canvas.height = base.height;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
        ctx.drawImage(base, 0, 0);
        ctx.drawImage(clothes, 0, 0);
        ctx.drawImage(hair, 0, 0);
    }
    
    return canvas;
};