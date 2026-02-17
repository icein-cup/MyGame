
import { WORLD_WIDTH, WORLD_HEIGHT } from '../constants';
import { Position, TileType } from '../types';

interface Node {
    x: number;
    y: number;
    f: number;
    g: number;
    h: number;
    parent?: Node;
}

// Simple heuristic (Manhattan)
const heuristic = (a: Position, b: Position) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

// Check if a tile is walkable
const isWalkable = (map: TileType[][] | undefined, x: number, y: number): boolean => {
    if (!map) return true; // Fallback for legacy calls without map
    
    // Dynamic bounds check based on map size
    const mapHeight = map.length;
    const mapWidth = map[0]?.length || 0;
    
    if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) return false;
    
    const tile = map[y][x];
    const blocking = ['wall_wood', 'wall_stone', 'water', 'fence', 'table', 'wardrobe', 'bed', 'anvil', 'pew', 'candle_stand'];
    return !blocking.includes(tile as string);
};

// Helper to find nearest walkable tile if target is invalid
const findNearestWalkable = (map: TileType[][], x: number, y: number): Position | null => {
    const maxRadius = 3;
    for (let r = 1; r <= maxRadius; r++) {
        for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
                if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue; // Only check edges of square
                const nx = x + dx;
                const ny = y + dy;
                if (isWalkable(map, nx, ny)) {
                    return { x: nx, y: ny };
                }
            }
        }
    }
    return null;
};

export const findPath = (start: Position, end: Position, map?: TileType[][]): Position[] => {
    // Simplified check: if close enough, just return direct (Alpha optimization)
    if (heuristic(start, end) < 2) return [end];

    let targetX = Math.round(end.x);
    let targetY = Math.round(end.y);

    // If target isn't walkable, snap to nearest walkable
    if (map && !isWalkable(map, targetX, targetY)) {
        const nearest = findNearestWalkable(map, targetX, targetY);
        if (nearest) {
            targetX = nearest.x;
            targetY = nearest.y;
        } else {
            return []; // No valid target found nearby
        }
    }

    const openList: Node[] = [];
    
    // Initialize closedList based on actual map dimensions if available, else world defaults
    const h = map ? map.length : WORLD_HEIGHT;
    const w = map ? map[0].length : WORLD_WIDTH;
    const closedList: boolean[][] = Array(h).fill(false).map(() => Array(w).fill(false));

    openList.push({ x: Math.round(start.x), y: Math.round(start.y), f: 0, g: 0, h: 0 });

    // Limit iterations for performance in JS main thread
    let iterations = 0;
    const MAX_ITERATIONS = 500;

    while (openList.length > 0 && iterations < MAX_ITERATIONS) {
        iterations++;
        
        // Sort by lowest f
        openList.sort((a, b) => a.f - b.f);
        const currentNode = openList.shift()!;

        // Found goal
        if (Math.abs(currentNode.x - targetX) < 1 && Math.abs(currentNode.y - targetY) < 1) {
            const path: Position[] = [];
            let curr: Node | undefined = currentNode;
            while (curr) {
                path.push({ x: curr.x, y: curr.y });
                curr = curr.parent;
            }
            return path.reverse().slice(1); // Remove start node
        }

        // Safety check for bounds before accessing closedList
        if (currentNode.y >= 0 && currentNode.y < h && currentNode.x >= 0 && currentNode.x < w) {
            closedList[Math.floor(currentNode.y)][Math.floor(currentNode.x)] = true;
        }

        const neighbors = [
            { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
        ];

        for (const offset of neighbors) {
            const neighborX = currentNode.x + offset.x;
            const neighborY = currentNode.y + offset.y;

            // Bounds check
            if (neighborX < 0 || neighborX >= w || neighborY < 0 || neighborY >= h) continue;
            if (closedList[Math.floor(neighborY)][Math.floor(neighborX)]) continue;

            // Collision check using Map
            if (!isWalkable(map, neighborX, neighborY)) continue;

            const g = currentNode.g + 1;
            const hVal = heuristic({ x: neighborX, y: neighborY }, { x: targetX, y: targetY });
            const f = g + hVal;

            const existingNode = openList.find(n => n.x === neighborX && n.y === neighborY);
            if (existingNode && g < existingNode.g) {
                existingNode.g = g;
                existingNode.f = f;
                existingNode.parent = currentNode;
            } else if (!existingNode) {
                openList.push({ x: neighborX, y: neighborY, g, h: hVal, f, parent: currentNode });
            }
        }
    }

    // Fallback: if no path found or timeout, stop.
    return []; 
};
