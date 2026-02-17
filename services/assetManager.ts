
import { Player, NPC } from '../types';
import { compositeSprites, generateItemSprite, imageToCanvas } from './spriteGenerator';
import { generateStructureSprite, generateGroundSprite } from './sprites/environment';
import { generateTilledDirtSprite, generateCropSprite } from './sprites/farming';

export class AssetManager {
    public sprites: Record<string, HTMLCanvasElement> = {};

    async loadAll(player: Player, npcs: NPC[]) {
        const proceduralSprites: Record<string, HTMLCanvasElement> = {};
        
        // 1. Procedural Generation
        proceduralSprites['player'] = compositeSprites(player.visuals);
        npcs.forEach(npc => { proceduralSprites[npc.id] = compositeSprites(npc.visuals); });
        
        const structureTypes = ['wall_wood', 'floor_wood', 'wall_stone', 'floor_stone', 'door', 'door_open', 'roof_thatch', 'roof_thatch_bottom', 'roof_slate', 'roof_slate_bottom', 'bed', 'chair', 'table', 'wardrobe', 'candle_stand', 'anvil', 'pew'];
        structureTypes.forEach(type => { 
            // @ts-ignore 
            proceduralSprites[type] = generateStructureSprite(type); 
        });

        const groundTypes = ['grass', 'dirt', 'cobblestone', 'water'];
        groundTypes.forEach(type => {
            // @ts-ignore
            proceduralSprites[type] = generateGroundSprite(type);
        });
        
        const itemTypes = ['wood', 'stone', 'bread', 'potion', 'tomato', 'wheat', 'seeds_wheat'];
        itemTypes.forEach(type => { 
            // @ts-ignore 
            proceduralSprites[`item_${type}`] = generateItemSprite(type); 
        });
        
        // --- FARMING SPRITES ---
        proceduralSprites['tilled_dirt'] = generateTilledDirtSprite();
        proceduralSprites['crop_wheat_0'] = generateCropSprite(0);
        proceduralSprites['crop_wheat_1'] = generateCropSprite(1);
        proceduralSprites['crop_wheat_2'] = generateCropSprite(2);

        // 2. File Overrides
        const loadOverride = (key: string, path: string) => {
            return new Promise<void>((resolve) => {
                const img = new Image();
                img.src = path;
                img.onload = () => {
                    proceduralSprites[key] = imageToCanvas(img);
                    resolve();
                };
                img.onerror = () => resolve();
            });
        };

        await loadOverride('player', 'assets/player.png');
        for(const npc of npcs) { await loadOverride(npc.id, `assets/${npc.id}.png`); }
        for(const t of structureTypes) { await loadOverride(t, `assets/${t}.png`); }
        for(const t of groundTypes) { await loadOverride(t, `assets/${t}.png`); }

        this.sprites = proceduralSprites;
    }

    public async setSprite(id: string, base64: string) {
        const img = new Image();
        img.src = `data:image/png;base64,${base64}`;
        await new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve(); 
        });
        this.sprites[id] = imageToCanvas(img);
    }
}

export const assetManager = new AssetManager();
