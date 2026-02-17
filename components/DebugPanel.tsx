import React from 'react';
import { GameState } from '../types';

interface DebugPanelProps {
    state: GameState;
    onToggleAI: () => void;
    onGenerateSprite: (npcId: string) => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ state, onToggleAI, onGenerateSprite }) => (
    <div className="fixed top-4 right-4 bg-black/80 text-green-400 p-4 rounded font-mono text-xs w-64 border border-green-900 z-50 overflow-y-auto max-h-[80vh] pointer-events-auto">
        <h3 className="font-bold mb-3 text-white border-b border-gray-600 pb-1">BETA.2 - Day {state.day}</h3>
        
        <div className="mb-4 pointer-events-auto">
            <button onClick={onToggleAI} className={`px-3 py-1.5 rounded w-full text-center text-white font-bold shadow transition-colors ${state.useAI ? 'bg-red-700 hover:bg-red-600' : 'bg-green-700 hover:bg-green-600'}`}>
                {state.useAI ? "DISABLE AI" : "ENABLE AI"}
            </button>
        </div>

        <div className="mb-2">Map: <span className="text-yellow-400">{state.activeMapId}</span></div>
        <div className="mb-2">AI Status: <span className={state.useAI ? "text-green-400" : "text-red-400"}>{state.useAI ? "ON" : "OFF"}</span></div>
        
        <div className="text-yellow-500 font-bold mb-2">{state.isGenerating ? "GENERATING PLANS..." : "ACTIVE"}</div>
        
        {/* Player Section */}
        <div className="border-b border-gray-700 pb-2 mb-2">
             <div className="flex justify-between items-center">
                 <span className="text-yellow-400 font-bold">Player</span>
                 <button 
                     onClick={() => onGenerateSprite('player')} 
                     disabled={!!state.generatingSpriteId}
                     className="bg-blue-800 hover:bg-blue-700 text-white px-2 py-0.5 rounded text-[9px] disabled:opacity-50"
                 >
                     {state.generatingSpriteId === 'player' ? '...' : 'Gen Sprite'}
                 </button>
             </div>
             <div className="text-[10px] text-gray-500">Loc: {state.player.mapId}</div>
        </div>

        <div className="space-y-3 mt-2">
            {state.npcs.map(npc => (
                <div key={npc.id} className="border-b border-gray-700 pb-2">
                    <div className="flex justify-between items-center">
                        <span className="text-blue-400 font-bold truncate max-w-[100px]">{npc.name}</span>
                        <div className="flex gap-2 items-center">
                            <span className="text-gray-500">{npc.state}</span>
                             <button 
                                onClick={() => onGenerateSprite(npc.id)} 
                                disabled={!!state.generatingSpriteId}
                                className="bg-blue-800 hover:bg-blue-700 text-white px-2 py-0.5 rounded text-[9px] disabled:opacity-50"
                                title="Generate AI Sprite"
                            >
                                {state.generatingSpriteId === npc.id ? '...' : 'Gen'}
                            </button>
                        </div>
                    </div>
                    <div className="text-[10px] text-gray-500 mb-1">Loc: {npc.mapId} ({Math.round(npc.position.x)},{Math.round(npc.position.y)})</div>
                    
                    {/* Needs Bars */}
                    <div className="space-y-1 mt-1">
                        <div className="flex items-center gap-1">
                            <span className="w-8 text-[9px] text-gray-400">HUNG</span>
                            <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-orange-500" style={{ width: `${npc.needs.hunger}%` }}></div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="w-8 text-[9px] text-gray-400">SOCL</span>
                            <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${npc.needs.social}%` }}></div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="w-8 text-[9px] text-gray-400">ENRG</span>
                            <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500" style={{ width: `${npc.needs.energy}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
        <div className="mt-4 border-t border-gray-600 pt-2">
            <div className="text-white mb-1">Log:</div>
            {state.logs.slice(-5).map((log, i) => (
                <div key={i} className="opacity-75 truncate">- {log}</div>
            ))}
        </div>
    </div>
);