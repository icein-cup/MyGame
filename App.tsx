
import { React, useEffect, useRef, useState, useCallback } from 'react';
import { TILE_SIZE, NPC_ROSTER, PLAYER_SPEED, FPS, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from './constants';
import { GameState, Player, NPC, Position, WorldItem, MapData, ActionType, TileType, InventorySlot, Crop, VisualTraits } from './types';
import { generateWorld, generateInterior } from './services/mapGenerator';
import { renderGame } from './systems/renderSystem';
import { assetManager } from './services/assetManager';
import { findPath } from './services/pathfinding';
import { generateSprite } from './services/llmService';
import { generateDailyPlan, generateDialogueStream, addMemory, reflectOnDay, generateStaticPlan } from './services/npcAI';
import { updateCropGrowth, createCrop, canHarvest, getHarvestItem } from './services/farmingSystem';
import { updateNPCs } from './systems/npcSystem';

// Components
import { DebugPanel } from './components/DebugPanel';
import { InventoryOverlay } from './components/InventoryOverlay';
import { DialogueOverlay } from './components/DialogueOverlay';

// Utils
const getTargetTile = (pos: Position, facing: string): Position => {
    let x = Math.round(pos.x);
    let y = Math.round(pos.y);
    if (facing === 'up') y -= 1;
    if (facing === 'down') y += 1;
    if (facing === 'left') x -= 1;
    if (facing === 'right') x += 1;
    return { x, y };
};

const isColliding = (map: MapData, x: number, y: number): boolean => {
    if (x < 0 || y < 0 || x >= map.width || y >= map.height) return true;
    const tile = map.tiles[y][x];
    const blocking = ['wall_wood', 'wall_stone', 'water', 'fence', 'table', 'wardrobe', 'bed', 'anvil', 'pew', 'candle_stand'];
    return blocking.includes(tile as string);
};

const App: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const keysPressed = useRef<Record<string, boolean>>({});
    
    // Game State
    const [gameState, setGameState] = useState<GameState>({
        day: 1,
        player: {
            id: 'player',
            name: 'Hero',
            position: { x: 24, y: 26 }, // Outside cottage
            mapId: 'world',
            visuals: {
                gender: 'male',
                hairStyle: 'short',
                hairColor: '#4E342E',
                clothingStyle: 'tunic',
                clothingColor: '#1565C0',
                skinColor: '#FFCC80'
            },
            inventory: [
                { item: { id: 'seeds_wheat', type: 'seeds_wheat', name: 'Wheat Seeds', description: 'Plant in tilled dirt.' }, quantity: 5 }
            ]
        },
        npcs: [],
        worldItems: [],
        activeMapId: 'world',
        maps: {},
        speechBubbles: [],
        dialogueTarget: null,
        dialogueHistory: [],
        isPaused: false,
        isInventoryOpen: false,
        isSettingsOpen: false,
        isGenerating: false,
        isDialogueGenerating: false,
        isSleeping: false,
        useAI: true,
        logs: ["Welcome to Gemini Village!"]
    });

    const [spritesLoaded, setSpritesLoaded] = useState(false);
    const [lastTime, setLastTime] = useState(0);
    const [sleepAlpha, setSleepAlpha] = useState(0);
    
    // State Ref for loop access
    const stateRef = useRef(gameState);
    useEffect(() => { stateRef.current = gameState; }, [gameState]);

    // Initialization
    useEffect(() => {
        const initGame = async () => {
            // Generate Maps
            const worldMap = generateWorld();
            const maps: Record<string, MapData> = { 'world': worldMap };
            
            // Generate interiors based on portals
            const interiorsToGen = new Set<string>();
            worldMap.portals.forEach(p => interiorsToGen.add(p.targetMapId));
            
            interiorsToGen.forEach(id => {
                let type: 'house'|'shop'|'castle'|'church' = 'house';
                if (id === 'castle') type = 'castle';
                if (id === 'church') type = 'church';
                if (id === 'bakery' || id === 'merchant' || id === 'forge' || id === 'mill') type = 'shop';
                maps[id] = generateInterior(id, type);
            });

            // Initialize NPCs
            const initializedNPCs: NPC[] = NPC_ROSTER.map(def => {
                const { x, y, visuals, ...rest } = def;
                return {
                    ...rest,
                    position: { x, y },
                    mapId: 'world', 
                    facing: 'down',
                    currentPlan: [],
                    currentActionIndex: 0,
                    state: 'idle',
                    waitTimer: 0,
                    path: [],
                    memories: [],
                    lastReflectionDay: 0,
                    needs: { hunger: 80, social: 80, energy: 100 },
                    relationships: {},
                    wantsToTalk: false,
                    seekingTimer: 0,
                    interactionCooldown: 0,
                    portalCooldown: 0,
                    visuals: visuals as VisualTraits
                };
            });

            // Initial Plans
            for (const npc of initializedNPCs) {
                 npc.currentPlan = generateStaticPlan(npc); 
            }

            // Load Assets
            await assetManager.loadAll(gameState.player, initializedNPCs);
            setSpritesLoaded(true);

            setGameState(prev => ({
                ...prev,
                maps,
                npcs: initializedNPCs,
                worldItems: [], 
                logs: [...prev.logs, "World Generated."]
            }));
        };

        initGame();
    }, []);

    // Interaction Handlers
    const handleInteraction = useCallback(async () => {
        const state = stateRef.current;
        if (state.isPaused || state.isSleeping) return;

        const { player, activeMapId, maps, npcs } = state;
        const currentMap = maps[activeMapId];
        
        const target = getTargetTile(player.position, playerFacing.current);
        const tx = target.x;
        const ty = target.y;

        // 2. Check NPC Interaction
        const targetNPC = npcs.find(n => n.mapId === activeMapId && Math.round(n.position.x) === tx && Math.round(n.position.y) === ty);
        if (targetNPC) {
            setGameState(prev => ({
                ...prev,
                dialogueTarget: targetNPC.id,
                dialogueHistory: [], 
                isPaused: true
            }));
            
            if (state.useAI) {
                generateGreeting(targetNPC).then(greeting => {
                    setGameState(prev => ({
                        ...prev,
                        dialogueHistory: [{ speaker: targetNPC.name, text: greeting }]
                    }));
                });
            } else {
                 setGameState(prev => ({
                        ...prev,
                        dialogueHistory: [{ speaker: targetNPC.name, text: "Hello!" }]
                    }));
            }
            return;
        }

        // 3. Doors
        if (currentMap.tiles[ty][tx] === 'door') {
             const newMaps = { ...maps };
             newMaps[activeMapId] = { ...currentMap, tiles: currentMap.tiles.map(row => [...row]) };
             newMaps[activeMapId].tiles[ty][tx] = 'door_open';
             setGameState(prev => ({ ...prev, maps: newMaps }));
             return;
        }
        
        // 4. Bed (Sleep)
        if (currentMap.tiles[ty][tx] === 'bed' || currentMap.tiles[ty][tx+1] === 'bed') {
             startSleepCycle();
             return;
        }

        // 5. Farming
        const cropIndex = currentMap.crops.findIndex(c => c.x === tx && c.y === ty);
        if (cropIndex >= 0) {
            const crop = currentMap.crops[cropIndex];
            if (canHarvest(crop)) {
                const item = getHarvestItem(crop);
                const newInventory = [...player.inventory];
                const slotIndex = newInventory.findIndex(s => s.item.id === item.id);
                if (slotIndex >= 0) newInventory[slotIndex] = { ...newInventory[slotIndex], quantity: newInventory[slotIndex].quantity + 1 };
                else newInventory.push({ item, quantity: 1 });
                
                const newCrops = [...currentMap.crops];
                newCrops.splice(cropIndex, 1);
                
                const newMaps = { ...maps, [activeMapId]: { ...currentMap, crops: newCrops } };
                
                setGameState(prev => ({
                    ...prev,
                    player: { ...prev.player, inventory: newInventory },
                    maps: newMaps,
                    logs: [...prev.logs, `Harvested ${item.name}`]
                }));
            }
            return;
        }

        if (currentMap.tiles[ty][tx] === 'tilled_dirt') {
             const seeds = player.inventory.find(s => s.item.type === 'seeds_wheat');
             if (seeds && seeds.quantity > 0) {
                 const newCrop = createCrop(tx, ty, state.day);
                 const newMaps = { ...maps, [activeMapId]: { ...currentMap, crops: [...currentMap.crops, newCrop] } };
                 const newInventory = player.inventory.map(s => s.item.type === 'seeds_wheat' ? { ...s, quantity: s.quantity - 1 } : s).filter(s => s.quantity > 0);
                 
                 setGameState(prev => ({
                     ...prev,
                     player: { ...prev.player, inventory: newInventory },
                     maps: newMaps,
                     logs: [...prev.logs, `Planted Wheat`]
                 }));
             }
             return;
        }

        if (currentMap.tiles[ty][tx] === 'dirt' || currentMap.tiles[ty][tx] === 'grass') {
            const newMaps = { ...maps };
            newMaps[activeMapId] = { ...currentMap, tiles: currentMap.tiles.map(row => [...row]) };
            newMaps[activeMapId].tiles[ty][tx] = 'tilled_dirt';
            setGameState(prev => ({ ...prev, maps: newMaps }));
            return;
        }

    }, []);

    const generateGreeting = async (npc: NPC) => {
        return import('./services/npcAI').then(m => m.generateGreeting(npc));
    }

    const startSleepCycle = () => {
        setGameState(prev => ({ ...prev, isSleeping: true, isPaused: true }));
        let alpha = 0;
        const interval = setInterval(() => {
            alpha += 0.1;
            setSleepAlpha(alpha);
            if (alpha >= 1) {
                clearInterval(interval);
                performSleepLogic();
            }
        }, 50);
    };

    const performSleepLogic = async () => {
        const state = stateRef.current;
        const nextDay = state.day + 1;
        const newMaps = { ...state.maps };
        Object.keys(newMaps).forEach(mapId => {
            newMaps[mapId] = {
                ...newMaps[mapId],
                crops: newMaps[mapId].crops.map(c => updateCropGrowth(c, nextDay))
            };
        });
        
        let alpha = 1;
        const interval = setInterval(() => {
            alpha -= 0.1;
            setSleepAlpha(alpha);
            if (alpha <= 0) {
                clearInterval(interval);
                setGameState(prev => ({ 
                    ...prev, 
                    day: nextDay,
                    maps: newMaps,
                    isSleeping: false, 
                    isPaused: false,
                    logs: [...prev.logs, `Day ${nextDay} started.`]
                }));
            }
        }, 50);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            if (key === 'escape') {
                setGameState(prev => {
                    if (prev.isSettingsOpen) return { ...prev, isSettingsOpen: false, isPaused: false };
                    if (prev.isInventoryOpen) return { ...prev, isInventoryOpen: false, isPaused: false };
                    if (prev.dialogueTarget) return { ...prev, dialogueTarget: null, dialogueHistory: [], isPaused: false, isDialogueGenerating: false };
                    return { ...prev, isPaused: !prev.isPaused };
                });
                return;
            }
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key)) { 
                keysPressed.current[key] = true; 
            }
            if (key === 'e' || key === ' ') {
                e.preventDefault(); 
                handleInteraction();
            }
            if (key === 'i') {
                setGameState(prev => ({ ...prev, isInventoryOpen: !prev.isInventoryOpen, isPaused: !prev.isInventoryOpen }));
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            if (keysPressed.current[key]) delete keysPressed.current[key];
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [handleInteraction]);

    const requestRef = useRef<number>();
    const playerFacing = useRef<string>('down');
    const isPlayerMoving = useRef<boolean>(false);

    const update = useCallback((time: number) => {
        if (!stateRef.current.isSleeping && spritesLoaded) {
             const delta = time - lastTime;
             if (delta >= 1000 / FPS) {
                 setGameState(prev => {
                     const nextState = { ...prev };
                     const map = nextState.maps[nextState.activeMapId];

                     // 1. Player Movement (Only if not paused)
                     if (!nextState.isPaused) {
                         let dx = 0;
                         let dy = 0;
                         if (keysPressed.current['w'] || keysPressed.current['arrowup']) dy = -1;
                         if (keysPressed.current['s'] || keysPressed.current['arrowdown']) dy = 1;
                         if (keysPressed.current['a'] || keysPressed.current['arrowleft']) dx = -1;
                         if (keysPressed.current['d'] || keysPressed.current['arrowright']) dx = 1;
                         
                         if (dx !== 0 || dy !== 0) {
                             isPlayerMoving.current = true;
                             if (dx !== 0 && dy !== 0) { dx *= 0.7071; dy *= 0.7071; }
                             if (Math.abs(dx) > Math.abs(dy)) playerFacing.current = dx > 0 ? 'right' : 'left';
                             else playerFacing.current = dy > 0 ? 'down' : 'up';

                             const moveDist = (PLAYER_SPEED * delta) / 1000;
                             const currentX = nextState.player.position.x;
                             const currentY = nextState.player.position.y;
                             const isStuck = isColliding(map, Math.round(currentX), Math.round(currentY));

                             const nextX = currentX + dx * moveDist;
                             if (isStuck || !isColliding(map, Math.round(nextX), Math.round(currentY))) nextState.player.position.x = nextX;
                             const nextY = currentY + dy * moveDist;
                             if (isStuck || !isColliding(map, Math.round(nextState.player.position.x), Math.round(nextY))) nextState.player.position.y = nextY;
                             
                             const pX = nextState.player.position.x; const pY = nextState.player.position.y;
                             const portal = map.portals.find(p => Math.abs(p.x - pX) < 0.5 && Math.abs(p.y - pY) < 0.5);
                             if (portal) {
                                     nextState.activeMapId = portal.targetMapId;
                                     nextState.player.position.x = portal.targetX;
                                     nextState.player.position.y = portal.targetY;
                                     nextState.player.mapId = portal.targetMapId;
                                     nextState.logs = [...nextState.logs, `Entered ${portal.targetMapId}`];
                             }
                         } else {
                             isPlayerMoving.current = false;
                         }
                     }

                     // 2. NPC Logic - Running continuously unless sleeping
                     // Note: updateNPCs now takes the dialogueTarget ID to exclude them from movement
                     nextState.npcs = updateNPCs(nextState.npcs, nextState.maps, delta / 1000, nextState.dialogueTarget);

                     return nextState;
                 });
                 setLastTime(time);
             }
        }
        
        if (canvasRef.current && spritesLoaded) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                renderGame(ctx, stateRef.current, assetManager.sprites, playerFacing.current, isPlayerMoving.current, time, sleepAlpha);
            }
        }
        requestRef.current = requestAnimationFrame(update);
    }, [spritesLoaded, lastTime, sleepAlpha]);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(update);
        return () => cancelAnimationFrame(requestRef.current!);
    }, [update]);

    const toggleAI = () => setGameState(prev => ({ ...prev, useAI: !prev.useAI }));
    
    const handleSpriteGen = async (id: string) => {
        if (gameState.isGenerating) return;
        setGameState(prev => ({ ...prev, generatingSpriteId: id, isGenerating: true }));
        const target = id === 'player' ? gameState.player : gameState.npcs.find(n => n.id === id);
        if (target) {
            let desc = "";
            if ('visuals' in target) {
                const v = target.visuals;
                desc = `${v.gender}, ${v.clothingColor} ${v.clothingStyle}, ${v.hairColor} ${v.hairStyle} hair, ${v.skinColor} skin.`;
                if ('profession' in target) desc += ` Profession: ${target.profession}.`;
            }
            const base64 = await generateSprite(desc);
            if (base64) {
                await assetManager.setSprite(id, base64);
                setGameState(prev => ({ ...prev, logs: [...prev.logs, `Sprite generated for ${target.name}`] }));
            }
        }
        setGameState(prev => ({ ...prev, generatingSpriteId: null, isGenerating: false }));
    };

    const handleDialogueSend = async (text: string) => {
        if (!gameState.dialogueTarget) return;
        const npcId = gameState.dialogueTarget;
        const npc = gameState.npcs.find(n => n.id === npcId);
        if (!npc) return;
        setGameState(prev => ({ ...prev, dialogueHistory: [...prev.dialogueHistory, { speaker: 'Player', text }] }));
        setGameState(prev => ({ ...prev, isDialogueGenerating: true }));
        let fullReply = "";
        try {
            if (gameState.useAI) {
                const stream = generateDialogueStream(npc, text, [], gameState.dialogueHistory, 'Hero', 'player');
                for await (const chunk of stream) fullReply += chunk;
            } else fullReply = "I don't have much to say.";
        } catch(e) { fullReply = "..."; }
        setGameState(prev => ({
            ...prev,
            dialogueHistory: [...prev.dialogueHistory, { speaker: npc.name, text: fullReply }],
            isDialogueGenerating: false
        }));
        if (gameState.useAI) await addMemory(npc, `Player said: "${text}". I replied: "${fullReply}"`, 'dialogue', gameState.day, 'player');
    };

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden font-sans select-none">
            <canvas 
                ref={canvasRef} 
                width={VIEWPORT_WIDTH} 
                height={VIEWPORT_HEIGHT} 
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-4 border-[#333] shadow-lg"
                style={{ imageRendering: 'pixelated' }}
            />
            <div className="absolute top-4 left-4 text-white font-mono text-shadow pointer-events-none">
                <div className="text-2xl font-bold text-yellow-400">Day {gameState.day}</div>
                <div>{gameState.activeMapId}</div>
            </div>
            <DebugPanel state={gameState} onToggleAI={toggleAI} onGenerateSprite={handleSpriteGen} />
            {gameState.isInventoryOpen && (
                <InventoryOverlay 
                    inventory={gameState.player.inventory} 
                    onClose={() => setGameState(prev => ({ ...prev, isInventoryOpen: false, isPaused: false }))}
                    onUse={() => {}} onDrop={(i) => {
                         const newInv = [...gameState.player.inventory];
                         if (newInv[i].quantity > 1) newInv[i].quantity--; else newInv.splice(i, 1);
                         setGameState(prev => ({ ...prev, player: { ...prev.player, inventory: newInv } }));
                    }} 
                />
            )}
            {gameState.dialogueTarget && (
                <DialogueOverlay 
                    target={gameState.npcs.find(n => n.id === gameState.dialogueTarget)!} 
                    history={gameState.dialogueHistory} 
                    isThinking={gameState.isDialogueGenerating} 
                    onClose={() => setGameState(prev => ({ ...prev, dialogueTarget: null, dialogueHistory: [], isPaused: false }))}
                    onSend={handleDialogueSend} 
                />
            )}
            <div className="absolute bottom-4 left-4 text-gray-500 text-xs font-mono pointer-events-none">
                WASD: Move | E: Interact | I: Inventory | ESC: Menu/Back
            </div>
        </div>
    );
};

export default App;
