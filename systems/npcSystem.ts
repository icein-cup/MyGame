
import { NPC, MapData, ActionType } from '../types';
import { findPath } from '../services/pathfinding';
import { MOVE_SPEED } from '../constants';

export const updateNPCs = (npcs: NPC[], maps: Record<string, MapData>, dt: number, talkingNPCId: string | null = null): NPC[] => {
    return npcs.map(npc => {
        // If this NPC is currently talking to the player, do not update their movement or plans
        if (npc.id === talkingNPCId) {
            return { ...npc, state: 'idle' as const };
        }

        const map = maps[npc.mapId];
        if (!map) return npc; // Map not loaded or invalid

        const newNPC = { ...npc };
        
        // If no plan, stay idle
        if (newNPC.currentPlan.length === 0) return newNPC;
        
        const action = newNPC.currentPlan[newNPC.currentActionIndex];
        if (!action) return newNPC; // Plan finished

        if (action.type === ActionType.WALK) {
            newNPC.state = 'moving';
            
            // Generate path if missing or needs update
            if (newNPC.path.length === 0) {
                 if (action.target) {
                     newNPC.path = findPath(newNPC.position, action.target, map.tiles);
                     // If path empty after search, target is unreachable or we are there
                     if (newNPC.path.length === 0) {
                         // Skip to next action
                         newNPC.currentActionIndex++;
                         return newNPC;
                     }
                 }
            }

            // Move along path
            if (newNPC.path.length > 0) {
                const target = newNPC.path[0];
                const dx = target.x - newNPC.position.x;
                const dy = target.y - newNPC.position.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                const moveDist = MOVE_SPEED * dt;

                if (dist <= moveDist) {
                    // Reached node
                    newNPC.position = { x: target.x, y: target.y };
                    newNPC.path.shift();
                    
                    if (newNPC.path.length === 0) {
                        // Action complete
                        newNPC.currentActionIndex++;
                        newNPC.state = 'idle';
                    }
                } else {
                    // Normalize and move
                    newNPC.position.x += (dx / dist) * moveDist;
                    newNPC.position.y += (dy / dist) * moveDist;
                    
                    // Update Facing
                    if (Math.abs(dx) > Math.abs(dy)) {
                        newNPC.facing = dx > 0 ? 'right' : 'left';
                    } else {
                        newNPC.facing = dy > 0 ? 'down' : 'up';
                    }
                }
            }

        } else if (action.type === ActionType.WAIT) {
             newNPC.state = 'waiting';
             newNPC.waitTimer = (newNPC.waitTimer || 0) + dt;
             if (newNPC.waitTimer >= (action.duration || 1)) {
                 newNPC.waitTimer = 0;
                 newNPC.currentActionIndex++;
                 newNPC.state = 'idle';
             }
        } else {
            // Default to next action if type unknown or IDLE
            newNPC.currentActionIndex++;
        }

        return newNPC;
    });
};
