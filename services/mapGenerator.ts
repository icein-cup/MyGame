
import { WORLD_WIDTH, WORLD_HEIGHT } from '../constants';
import { MapData, TileType } from '../types';

const createEmptyMap = (w: number, h: number): TileType[][] => Array(h).fill(null).map(() => Array(w).fill('grass'));
const createEmptyRoofMap = (w: number, h: number): TileType[][] => Array(h).fill(null).map(() => Array(w).fill(null));

// Generic function to populate a map object
const buildStructure = (
    mapData: MapData, 
    x: number, y: number, w: number, h: number, 
    wall: TileType, floor: TileType, roof: TileType, 
    doors: {x:number, y:number, targetMap?: string, targetX?: number, targetY?: number}[], 
    furniture: {x:number, y:number, type: TileType}[]
) => {
    // Floor & Roof
    for(let iy=0; iy<h; iy++) {
        for(let ix=0; ix<w; ix++) {
            if (y+iy < mapData.height && x+ix < mapData.width) {
                mapData.tiles[y+iy][x+ix] = floor;
                // Only add roof if it's NOT an interior map (interiors don't have roofs rendered inside)
                if (mapData.id === 'world') {
                    mapData.roofs[y+iy][x+ix] = (iy === h-1) 
                        ? (roof === 'roof_thatch' ? 'roof_thatch_bottom' : 'roof_slate_bottom') 
                        : roof;
                }
            }
        }
    }
    // Walls
    for(let ix=0; ix<w; ix++) { mapData.tiles[y][x+ix] = wall; mapData.tiles[y+h-1][x+ix] = wall; }
    for(let iy=0; iy<h; iy++) { mapData.tiles[y+iy][x] = wall; mapData.tiles[y+iy][x+w-1] = wall; }
    
    // Doors & Portals
    doors.forEach(d => {
        const dy = y + d.y; const dx = x + d.x;
        mapData.tiles[dy][dx] = 'door';
        if (d.targetMap) {
            mapData.portals.push({ x: dx, y: dy, targetMapId: d.targetMap, targetX: d.targetX || 0, targetY: d.targetY || 0 });
        }
        
        // Add path leading out
        if (mapData.id === 'world') {
            mapData.tiles[dy+1][dx] = 'dirt';
            mapData.tiles[dy+2][dx] = 'dirt';
        }
    });
    
    // Furniture
    furniture.forEach(f => {
        mapData.tiles[y+f.y][x+f.x] = f.type;
    });
};

// Generate World Map (Exteriors)
export const generateWorld = (): MapData => {
    const map = {
        id: 'world',
        width: WORLD_WIDTH,
        height: WORLD_HEIGHT,
        tiles: createEmptyMap(WORLD_WIDTH, WORLD_HEIGHT),
        roofs: createEmptyRoofMap(WORLD_WIDTH, WORLD_HEIGHT),
        crops: [],
        portals: []
    };
    
    // Generate Dirt Paths (Primitive Roads)
    const drawPath = (x1: number, y1: number, x2: number, y2: number) => {
        let cx = x1, cy = y1;
        while(cx !== x2 || cy !== y2) {
            if (Math.random() < 0.5 && cx !== x2) cx += (x2 > cx ? 1 : -1);
            else if (cy !== y2) cy += (y2 > cy ? 1 : -1);
            map.tiles[cy][cx] = 'dirt';
            // Widen path occasionally
            if (Math.random() < 0.3) map.tiles[cy+1][cx] = 'dirt';
            if (Math.random() < 0.3) map.tiles[cy][cx+1] = 'dirt';
        }
    };
    
    // Castle Area Paving
    for(let y=10; y<20; y++) {
        for(let x=30; x<45; x++) {
            if (Math.random() > 0.1) map.tiles[y][x] = 'cobblestone';
        }
    }
    // Church Area Paving
    for(let y=8; y<18; y++) {
        for(let x=6; x<16; x++) {
             if (Math.random() > 0.2) map.tiles[y][x] = 'cobblestone';
        }
    }

    // Connect Main Hubs
    drawPath(22, 22, 30, 28); // Home to Merchant
    drawPath(30, 28, 26, 20); // Merchant to Bakery
    drawPath(26, 20, 10, 20); // Bakery to Farm
    drawPath(22, 22, 4, 24);  // Home to Mill
    
    // Exteriors (Visual Representation)
    // Castle
    buildStructure(map, 34, 10, 8, 6, 'wall_stone', 'floor_stone', 'roof_slate', [{x:4, y:5, targetMap: 'castle', targetX: 6, targetY: 8}], []);
    // Bakery
    buildStructure(map, 26, 20, 5, 4, 'wall_wood', 'floor_wood', 'roof_thatch', [{x:2, y:3, targetMap: 'bakery', targetX: 4, targetY: 5}], []);
    // Farmhouse
    buildStructure(map, 10, 20, 5, 4, 'wall_wood', 'floor_wood', 'roof_thatch', [{x:2, y:3, targetMap: 'farmhouse', targetX: 3, targetY: 4}], []);
    // Merchant
    buildStructure(map, 30, 28, 5, 4, 'wall_wood', 'floor_wood', 'roof_thatch', [{x:2, y:3, targetMap: 'merchant', targetX: 3, targetY: 6}], []);
    // Guard
    buildStructure(map, 20, 33, 4, 4, 'wall_wood', 'floor_wood', 'roof_thatch', [{x:2, y:3, targetMap: 'guardhouse', targetX: 2, targetY: 4}], []);
    // Player
    buildStructure(map, 22, 22, 4, 4, 'wall_wood', 'floor_wood', 'roof_thatch', [{x:2, y:3, targetMap: 'cottage', targetX: 3, targetY: 4}], []);
    // Church
    buildStructure(map, 8, 8, 6, 8, 'wall_stone', 'floor_stone', 'roof_slate', [{x:3, y:7, targetMap: 'church', targetX: 4, targetY: 9}], []);
    // Mill
    buildStructure(map, 4, 24, 4, 4, 'wall_wood', 'floor_wood', 'roof_thatch', [{x:2, y:3, targetMap: 'mill', targetX: 3, targetY: 5}], []);
    // Forge
    buildStructure(map, 34, 28, 5, 4, 'wall_stone', 'floor_stone', 'roof_slate', [{x:2, y:3, targetMap: 'forge', targetX: 3, targetY: 5}], []);
    // Mary's
    buildStructure(map, 16, 16, 4, 4, 'wall_wood', 'floor_wood', 'roof_thatch', [{x:2, y:3, targetMap: 'mary_house', targetX: 3, targetY: 4}], []);

    return map;
};

// Generate Interior Maps
export const generateInterior = (id: string, type: 'castle'|'house'|'shop'|'church'): MapData => {
    let w = 12, h = 10;
    if (type === 'house') { w = 8; h = 7; }
    if (type === 'shop') { w = 10; h = 8; }
    if (type === 'church') { w = 10; h = 12; }
    
    const map = {
        id, width: w, height: h,
        tiles: createEmptyMap(w, h),
        roofs: createEmptyRoofMap(w, h),
        crops: [],
        portals: []
    };
    
    // Fill background with void (null) or black logic in renderer
    const wall = (type === 'castle' || type === 'church' || id === 'forge') ? 'wall_stone' : 'wall_wood';
    const floor = (type === 'castle' || type === 'church' || id === 'forge') ? 'floor_stone' : 'floor_wood';
    
    // Find return coords based on ID
    const returnCoords: Record<string, {x:number, y:number}> = {
        'castle': {x: 38, y: 16}, 'bakery': {x: 28, y: 24}, 'farmhouse': {x: 12, y: 24},
        'merchant': {x: 32, y: 32}, 'guardhouse': {x: 22, y: 37}, 'cottage': {x: 24, y: 26},
        'church': {x: 11, y: 16}, 'mill': {x: 6, y: 28}, 'forge': {x: 36, y: 32}, 'mary_house': {x: 18, y: 20}
    };

    const ret = returnCoords[id] || {x: 25, y: 25};
    const doorPos = { x: Math.floor(w/2), y: h-1 };
    
    let furniture: {x:number, y:number, type: TileType}[] = [];
    
    if (id === 'bakery') furniture = [{x:1, y:1, type:'bed'}, {x:4, y:3, type:'table'}, {x:1, y:4, type:'wardrobe'}, {x:6, y:1, type:'table'}];
    else if (id === 'castle') furniture = [{x:6, y:2, type:'chair'}, {x:5, y:2, type:'candle_stand'}, {x:7, y:2, type:'candle_stand'}, {x:2, y:2, type:'bed'}, {x:2, y:5, type:'wardrobe'}, {x:8, y:5, type:'table'}];
    else if (id === 'church') furniture = [{x:2, y:2, type:'pew'}, {x:6, y:2, type:'pew'}, {x:4, y:1, type:'table'}];
    else if (id === 'forge') furniture = [{x:2, y:2, type:'anvil'}, {x:5, y:2, type:'table'}];
    else furniture = [{x:1, y:1, type:'bed'}, {x:w-2, y:2, type:'table'}]; // Generic

    buildStructure(map, 0, 0, w, h, wall, floor, null, [{x: doorPos.x, y: doorPos.y, targetMap: 'world', targetX: ret.x, targetY: ret.y}], furniture);

    return map;
};
