
import { GameState, NPC } from '../types';
import { TILE_SIZE, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, COLOR_GRASS } from '../constants';

export const renderGame = (
    ctx: CanvasRenderingContext2D, 
    state: GameState, 
    sprites: Record<string, HTMLCanvasElement>,
    playerFacing: string,
    isPlayerMoving: boolean,
    time: number,
    sleepAlpha: number
) => {
    ctx.imageSmoothingEnabled = false;
    
    const { player, activeMapId, maps, npcs, worldItems, speechBubbles } = state;
    const currentMap = maps[activeMapId];
    
    // 1. Clear Screen
    ctx.fillStyle = '#1a202c'; 
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); 
    
    // 2. Calculate Camera
    const camX = Math.floor(player.position.x * TILE_SIZE - VIEWPORT_WIDTH / 2);
    const camY = Math.floor(player.position.y * TILE_SIZE - VIEWPORT_HEIGHT / 2);
    
    ctx.save(); 
    ctx.translate(-camX, -camY);
    
    // 3. Culling bounds
    const startX = Math.max(0, Math.floor(camX / TILE_SIZE));
    const startY = Math.max(0, Math.floor(camY / TILE_SIZE));
    const endX = Math.min(currentMap.width, Math.ceil((camX + VIEWPORT_WIDTH) / TILE_SIZE));
    const endY = Math.min(currentMap.height, Math.ceil((camY + VIEWPORT_HEIGHT) / TILE_SIZE));
    
    // 4. Draw Map Tiles (Floor & Walls)
    for(let y=startY; y<endY; y++) {
        for(let x=startX; x<endX; x++) {
            const tile = currentMap.tiles[y][x];
            const px = x * TILE_SIZE; 
            const py = y * TILE_SIZE;
            
            // Draw Ground Layer
            if (activeMapId === 'world') {
                if (tile === 'grass' && sprites['grass']) {
                     ctx.drawImage(sprites['grass'], px, py);
                } else if (tile === 'dirt' && sprites['dirt']) {
                     ctx.drawImage(sprites['dirt'], px, py);
                } else if (tile === 'tilled_dirt' && sprites['tilled_dirt']) {
                     ctx.drawImage(sprites['tilled_dirt'], px, py);
                } else if (tile === 'cobblestone' && sprites['cobblestone']) {
                     ctx.drawImage(sprites['cobblestone'], px, py);
                } else {
                     ctx.fillStyle = COLOR_GRASS; ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                }
            } else {
                ctx.fillStyle = '#000'; ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE); 
            }
            
            // Draw Object/Structure Layer
            if (tile && tile !== 'grass' && tile !== 'dirt' && tile !== 'tilled_dirt' && tile !== 'cobblestone' && sprites[tile]) {
                ctx.drawImage(sprites[tile], px, py);
            }
        }
    }
    
    // 5. Draw Crops (Layered on top of ground, below entities)
    currentMap.crops.forEach(crop => {
        const px = crop.x * TILE_SIZE;
        const py = crop.y * TILE_SIZE;
        // Check culling
        if (crop.x >= startX && crop.x < endX && crop.y >= startY && crop.y < endY) {
            const spriteKey = `crop_${crop.type}_${crop.stage}`;
            if (sprites[spriteKey]) {
                ctx.drawImage(sprites[spriteKey], px, py);
            }
        }
    });
    
    // 6. Draw Items
    worldItems.filter(i => i.mapId === activeMapId).forEach(item => {
            const sprite = sprites[`item_${item.item.type}`];
            if (sprite) ctx.drawImage(sprite, item.position.x * TILE_SIZE, item.position.y * TILE_SIZE);
    });

    // 7. Draw Entities (Y-Sort)
    const visibleNPCs = npcs.filter(n => n.mapId === activeMapId);
    const entities = [...visibleNPCs.map(n => ({type: 'npc', data: n, y: n.position.y})), {type:'player', data: player, y: player.position.y}];
    entities.sort((a, b) => a.y - b.y);
    
    entities.forEach(ent => {
        if (ent.type === 'npc') {
            const n = ent.data as NPC;
            if (sprites[n.id]) {
                const cx = Math.round(n.position.x * TILE_SIZE); const cy = Math.round(n.position.y * TILE_SIZE);
                
                // Animation Logic - NEW LAYOUT
                let row = 0; // Default Down
                if (n.facing === 'up') row = 1;
                else if (n.facing === 'left') row = 2;
                else if (n.facing === 'right') row = 3;
                
                let frame = 0;
                let bounceY = 0;
                
                if (n.state === 'moving') {
                    frame = Math.floor((time / 200) % 4);
                } else {
                    bounceY = Math.floor(time / 500) % 2 === 0 ? 0 : 1;
                    frame = 0;
                }
                
                ctx.drawImage(sprites[n.id], frame * 32, row * 32, 32, 32, cx, cy + bounceY, 32, 32);
                
                // Name Tag
                ctx.fillStyle = 'white'; 
                ctx.font = '10px sans-serif'; 
                ctx.fillText(n.name, cx, cy - 5 + bounceY);
                
                if (n.wantsToTalk) {
                        ctx.fillStyle = 'yellow';
                        ctx.beginPath(); ctx.arc(cx + 16, cy - 10 + bounceY, 4, 0, Math.PI*2); ctx.fill();
                        ctx.fillStyle = 'black'; ctx.font = 'bold 8px sans-serif'; ctx.fillText("!", cx + 14.5, cy - 7.5 + bounceY);
                }
            }
        } else {
            if (sprites['player']) {
                    const cx = Math.round(player.position.x * TILE_SIZE); const cy = Math.round(player.position.y * TILE_SIZE);
                    
                    let row = 0; 
                    if (playerFacing === 'up') row = 1;
                    else if (playerFacing === 'left') row = 2;
                    else if (playerFacing === 'right') row = 3;
                    
                    let frame = 0;
                    let bounceY = 0;
                    
                    if (isPlayerMoving) {
                         frame = Math.floor((time / 200) % 4);
                    } else {
                         bounceY = Math.floor(time / 500) % 2 === 0 ? 0 : 1;
                         frame = 0;
                    }
                    
                    ctx.drawImage(sprites['player'], frame*32, row*32, 32, 32, cx, cy + bounceY, 32, 32);
                    ctx.fillStyle = 'yellow'; ctx.font = '10px sans-serif'; ctx.fillText("YOU", cx+5, cy - 5 + bounceY);
            }
        }
    });
    
    // 8. Draw Roofs (World Only)
    if (activeMapId === 'world') {
        for(let y=startY; y<endY; y++) {
            for(let x=startX; x<endX; x++) {
                const roof = currentMap.roofs[y][x];
                if (roof && sprites[roof]) {
                        const dist = Math.sqrt(Math.pow(player.position.x - x, 2) + Math.pow(player.position.y - y, 2));
                        ctx.globalAlpha = dist < 4 ? 0.3 : 1.0; 
                        ctx.drawImage(sprites[roof], x * TILE_SIZE, y * TILE_SIZE);
                        ctx.globalAlpha = 1.0;
                }
            }
        }
    }

    // 9. Draw Speech Bubbles
    const bubblesToDraw: { bubble: typeof speechBubbles[0], x: number, y: number, w: number, h: number }[] = [];
    speechBubbles.forEach(bubble => {
        const npc = visibleNPCs.find(n => n.id === bubble.npcId);
        if (!npc) return;
        const bx = Math.round(npc.position.x * TILE_SIZE) + 16;
        let by = Math.round(npc.position.y * TILE_SIZE) - 20;
        ctx.font = "12px sans-serif";
        const textWidth = ctx.measureText(bubble.text).width;
        const bw = textWidth + 16;
        const bh = 24;
        bubblesToDraw.push({ bubble, x: bx, y: by, w: bw, h: bh });
    });
    bubblesToDraw.sort((a, b) => b.y - a.y);
    
    for(let i=0; i<bubblesToDraw.length; i++) {
        const current = bubblesToDraw[i];
        for(let j=0; j<i; j++) {
            const other = bubblesToDraw[j];
            const cLeft = current.x - current.w/2; const cRight = current.x + current.w/2;
            const oLeft = other.x - other.w/2; const oRight = other.x + other.w/2;
            if (cLeft < oRight + 4 && cRight > oLeft - 4) {
                 const cTop = current.y - current.h; const cBottom = current.y;
                 const oTop = other.y - other.h; const oBottom = other.y;
                 if (cTop < oBottom + 4 && cBottom > oTop - 4) { current.y = oTop - 5; }
            }
        }
    }

    bubblesToDraw.forEach(({ bubble, x: bx, y: by, w: bw, h: bh }) => {
        ctx.fillStyle = "white"; ctx.strokeStyle = "black"; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bx - bw/2 + 5, by - bh); ctx.lineTo(bx + bw/2 - 5, by - bh);
        ctx.quadraticCurveTo(bx + bw/2, by - bh, bx + bw/2, by - bh + 5);
        ctx.lineTo(bx + bw/2, by - 5); ctx.quadraticCurveTo(bx + bw/2, by, bx + bw/2 - 5, by);
        ctx.lineTo(bx + 5, by); ctx.lineTo(bx - 5, by); ctx.lineTo(bx - bw/2 + 5, by);
        ctx.quadraticCurveTo(bx - bw/2, by, bx - bw/2, by - 5);
        ctx.lineTo(bx - bw/2, by - bh + 5); ctx.quadraticCurveTo(bx - bw/2, by - bh, bx - bw/2 + 5, by - bh);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = "black"; ctx.textAlign = "center"; ctx.fillText(bubble.text, bx, by - 6); ctx.textAlign = "start"; 
    });

    // 10. Sleep Overlay
    if (sleepAlpha > 0) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); 
        ctx.fillStyle = `rgba(0, 0, 0, ${sleepAlpha})`;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();
    }
    
    ctx.restore();
};
