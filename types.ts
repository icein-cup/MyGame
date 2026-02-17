
export interface Position {
    x: number;
    y: number;
}

export enum ActionType {
    IDLE = 'IDLE',
    WALK = 'WALK',
    WAIT = 'WAIT',
    TALK = 'TALK'
}

export interface NPCAction {
    type: ActionType;
    target?: Position;
    duration?: number; // in seconds
    description: string; // "Go to bakery"
}

export interface Memory {
    id: string;
    text: string;
    timestamp: number; // Game day
    importance: number; // 1 (Mundane) to 10 (Poignant)
    type: 'dialogue' | 'observation' | 'reflection';
    relatedEntityId?: string; // Optional: who this memory is about
}

export interface NPCNeeds {
    hunger: number; // 0-100 (0=Starving)
    social: number; // 0-100 (0=Lonely)
    energy: number; // 0-100 (0=Exhausted)
}

export interface VisualTraits {
    gender: 'male' | 'female';
    hairStyle: 'short' | 'long' | 'bald' | 'braids';
    hairColor: string;
    clothingStyle: 'tunic' | 'robe' | 'dress';
    clothingColor: string;
    skinColor: string;
}

export interface Personality {
    traits: string[]; // e.g. ["Greedy", "Charming"]
    background: string; // "Born in a barn..."
    goal: string; // "To become mayor"
}

export interface Relationship {
    entityId: string;
    name: string; // Cache name for easy display
    trust: number; // 0-100
    respect: number; // 0-100
    romance: number; // 0-100
    lastInteractionDay: number;
}

export interface NPC {
    id: string;
    name: string;
    profession: string;
    position: Position;
    mapId: string; // Which map is the NPC currently on?
    color: string; // Legacy debug color
    visuals: VisualTraits; 
    facing: 'up' | 'down' | 'left' | 'right'; 
    
    // AI State
    personality: Personality;
    relationships: Record<string, Relationship>; // Map entityId -> Relationship
    currentPlan: NPCAction[];
    currentActionIndex: number;
    state: 'idle' | 'moving' | 'waiting';
    waitTimer: number;
    path: Position[]; 
    
    // Memory System
    memories: Memory[];
    lastReflectionDay: number;
    lastLLMResponse?: string;
    
    // Needs
    needs: NPCNeeds;

    // Interaction State
    wantsToTalk: boolean;
    seekingTimer: number; // How long they've been chasing the player
    interactionCooldown: number; 
    portalCooldown: number; // Debounce for map transitions
}

export interface Item {
    id: string; // internal ID reference (e.g. "wood_01")
    type: 'wood' | 'stone' | 'bread' | 'potion' | 'tomato' | 'wheat' | 'seeds_wheat';
    name: string;
    description: string;
}

export interface InventorySlot {
    item: Item;
    quantity: number;
}

export interface WorldItem {
    id: string;
    item: Item;
    mapId: string; // Which map is the item on?
    position: Position;
}

export interface Player {
    id: string;
    name: string;
    position: Position;
    mapId: string; // Current scene
    visuals: VisualTraits;
    inventory: InventorySlot[];
}

export type TileType = 'grass' | 'dirt' | 'tilled_dirt' | 'cobblestone' | 'water' | 'wall_wood' | 'floor_wood' | 'door' | 'door_open' | 'roof_thatch' | 'roof_thatch_bottom' | 'bed' | 'chair' | 'table' | 'wardrobe' | 'candle_stand' | 'wall_stone' | 'floor_stone' | 'roof_slate' | 'roof_slate_bottom' | 'anvil' | 'pew' | null;

export interface SpeechBubble {
    id: string;
    npcId: string;
    text: string;
    timer: number; // Frames remaining
}

export interface Portal {
    x: number;
    y: number;
    targetMapId: string;
    targetX: number;
    targetY: number;
}

// --- FARMING TYPES ---
export type CropType = 'wheat';
export type CropStage = 0 | 1 | 2; // 0: Seed, 1: Sprout, 2: Mature

export interface Crop {
    id: string;
    type: CropType;
    x: number;
    y: number;
    plantedDay: number;
    stage: CropStage;
}

export interface MapData {
    id: string;
    width: number;
    height: number;
    tiles: TileType[][];
    roofs: TileType[][];
    crops: Crop[]; // New farming layer
    portals: Portal[];
}

export interface LLMSettings {
    provider: 'gemini' | 'deepseek';
    apiKey: string;
    model: string;
}

export interface GameState {
    day: number;
    player: Player;
    npcs: NPC[];
    worldItems: WorldItem[]; 
    
    // Map System
    activeMapId: string;
    maps: Record<string, MapData>;
    
    speechBubbles: SpeechBubble[]; 
    dialogueTarget: string | null; 
    dialogueHistory: { speaker: string; text: string }[];
    isPaused: boolean;
    isInventoryOpen: boolean;
    isSettingsOpen: boolean;
    isGenerating: boolean; 
    isDialogueGenerating: boolean; 
    isSleeping: boolean;
    generatingSpriteId?: string | null; 
    useAI: boolean; 
    logs: string[]; 
}
