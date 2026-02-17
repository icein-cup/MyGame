
import React, { useState } from 'react';
import { InventorySlot } from '../types';

interface InventoryOverlayProps {
    inventory: InventorySlot[];
    onClose: () => void;
    onUse: (index: number) => void;
    onDrop: (index: number) => void;
}

export const InventoryOverlay: React.FC<InventoryOverlayProps> = ({ inventory, onClose, onUse, onDrop }) => {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const selectedItem = selectedIndex !== null ? inventory[selectedIndex] : null;
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-[#f3e5ab] border-4 border-[#8b4513] p-6 rounded-lg w-[600px] h-[400px] shadow-2xl text-black font-serif relative flex gap-4" style={{backgroundImage: 'url("https://www.transparenttextures.com/patterns/aged-paper.png")'}}>
                 <button onClick={onClose} className="absolute top-2 right-2 text-[#8b4513] hover:font-bold text-xl">✕</button>
                 <div className="w-2/3 flex flex-col">
                    <h2 className="text-2xl font-bold text-[#5D4037] mb-4 border-b-2 border-[#8b4513] pb-2">Inventory</h2>
                    <div className="grid grid-cols-4 gap-2 overflow-y-auto">
                        {inventory.map((slot, i) => (
                            <div key={i} onClick={() => setSelectedIndex(i)} className={`relative bg-[#e8dab2] border-2 p-2 rounded flex flex-col items-center justify-center hover:bg-[#dcd0a0] cursor-pointer transition-colors aspect-square ${selectedIndex === i ? 'border-blue-500' : 'border-[#d4c596]'}`}>
                                <div className={`w-8 h-8 rounded mb-1 ${slot.item.type === 'wood' ? 'bg-[#5D4037]' : slot.item.type === 'stone' ? 'bg-gray-500' : slot.item.type === 'bread' ? 'bg-orange-400' : 'bg-red-600'}`}></div>
                                <span className="text-xs font-bold text-center leading-tight truncate w-full">{slot.item.name}</span>
                                <span className="absolute top-0 right-0 bg-[#8b4513] text-[#f3e5ab] text-[10px] px-1 rounded-bl font-bold">{slot.quantity}</span>
                            </div>
                        ))}
                    </div>
                 </div>
                 <div className="w-1/3 border-l-2 border-[#d4c596] pl-4 flex flex-col">
                    <h3 className="text-lg font-bold text-[#5D4037] mb-2">Details</h3>
                    {selectedItem ? (
                        <div className="flex flex-col h-full">
                            <div className="flex-1"><div className="text-xl font-bold mb-1">{selectedItem.item.name}</div><div className="text-xs text-gray-600 mb-4 italic capitalize">{selectedItem.item.type}</div><p className="text-sm text-[#3E2723]">{selectedItem.item.description}</p></div>
                            <div className="space-y-2 mt-4"><button onClick={() => onUse(selectedIndex!)} className="w-full bg-green-700 hover:bg-green-600 text-white py-1 rounded shadow text-sm">Use Item</button><button onClick={() => onDrop(selectedIndex!)} className="w-full bg-red-800 hover:bg-red-700 text-white py-1 rounded shadow text-sm">Drop (1)</button></div>
                        </div>
                    ) : (<div className="text-gray-500 italic text-sm mt-4">Select an item to see details.</div>)}
                 </div>
            </div>
        </div>
    )
}
