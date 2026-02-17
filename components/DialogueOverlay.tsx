
import React, { useRef, useEffect, useState } from 'react';
import { NPC } from '../types';

interface DialogueOverlayProps {
    target: NPC;
    history: { speaker: string; text: string }[];
    isThinking: boolean;
    onClose: () => void;
    onSend: (msg: string) => void;
}

export const DialogueOverlay: React.FC<DialogueOverlayProps> = ({ target, history, isThinking, onClose, onSend }) => {
    const [input, setInput] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => { inputRef.current?.focus(); }, []);
    
    useEffect(() => { 
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; 
    }, [history, isThinking]);

    const handleSubmit = (e: React.FormEvent) => { 
        e.preventDefault(); 
        if (input.trim() && !isThinking) { 
            onSend(input); 
            setInput(""); 
        } 
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center pb-20 z-50">
            <div className="bg-[#f3e5ab] border-4 border-[#8b4513] p-6 rounded-lg w-[600px] shadow-2xl text-black font-serif relative" style={{backgroundImage: 'url("https://www.transparenttextures.com/patterns/aged-paper.png")'}}>
                <button onClick={onClose} className="absolute top-2 right-2 text-[#8b4513] hover:font-bold text-xl">✕</button>
                <div className="text-lg font-bold mb-4 border-b border-[#8b4513] pb-2 flex justify-between"><span>Talking to {target.name}</span></div>
                <div ref={scrollRef} className="h-64 overflow-y-auto mb-4 space-y-2 flex flex-col p-2 bg-[#e8dab2] rounded border border-[#d4c596]">
                    {history.map((msg, i) => (<div key={i} className={`p-2 rounded max-w-[85%] text-sm shadow-sm ${msg.speaker === 'Player' ? 'bg-[#dbeafe] self-end text-right border border-blue-200' : 'bg-white self-start text-left border border-gray-200'}`}><span className="font-bold block text-xs opacity-50 mb-1 uppercase tracking-wider">{msg.speaker}</span>{msg.text}</div>))}
                    {isThinking && (<div className="self-start p-2 bg-white/50 rounded italic text-gray-600 text-sm animate-pulse">{target.name} is thinking...</div>)}
                </div>
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 p-3 border border-[#8b4513] rounded bg-white outline-none focus:ring-2 focus:ring-[#8b4513]" placeholder="Type your message..." disabled={isThinking} />
                    <button type="submit" disabled={isThinking} className={`px-6 py-2 rounded font-bold text-[#f3e5ab] transition-colors ${isThinking ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#8b4513] hover:bg-[#65320d]'}`}>Say</button>
                </form>
            </div>
        </div>
    );
};
