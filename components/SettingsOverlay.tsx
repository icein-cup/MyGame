
import React, { useState, useEffect } from 'react';
import { LLMSettings } from '../types';

interface SettingsOverlayProps {
    currentSettings: LLMSettings;
    onSave: (settings: LLMSettings) => void;
    onClose: () => void;
}

export const SettingsOverlay: React.FC<SettingsOverlayProps> = ({ currentSettings, onSave, onClose }) => {
    const [provider, setProvider] = useState<'gemini' | 'deepseek'>(currentSettings.provider);
    const [apiKey, setApiKey] = useState(currentSettings.apiKey);
    const [model, setModel] = useState(currentSettings.model);

    // Reset model default when provider changes if user hasn't typed a custom one
    useEffect(() => {
        if (provider === 'gemini' && model === 'deepseek-chat') setModel('gemini-2.5-flash');
        if (provider === 'deepseek' && model === 'gemini-2.5-flash') setModel('deepseek-chat');
    }, [provider]);

    const handleSave = () => {
        onSave({ provider, apiKey, model });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]">
            <div className="bg-[#1a202c] border-2 border-gray-600 p-6 rounded-lg w-[500px] shadow-2xl text-gray-200 font-mono">
                <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-2">
                    <h2 className="text-xl font-bold text-yellow-400">AI Configuration</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-1 text-gray-400">Provider</label>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setProvider('gemini')}
                                className={`flex-1 py-2 rounded border ${provider === 'gemini' ? 'bg-green-700 border-green-500 text-white' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}
                            >
                                Google Gemini
                            </button>
                            <button 
                                onClick={() => setProvider('deepseek')}
                                className={`flex-1 py-2 rounded border ${provider === 'deepseek' ? 'bg-blue-700 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}
                            >
                                DeepSeek
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-1 text-gray-400">API Key</label>
                        <input 
                            type="password" 
                            value={apiKey} 
                            onChange={(e) => setApiKey(e.target.value)} 
                            placeholder={provider === 'gemini' ? "Default (Env)" : "sk-..."}
                            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-yellow-400 outline-none"
                        />
                        <p className="text-[10px] text-gray-500 mt-1">
                            {provider === 'gemini' ? "Leave blank to use the built-in demo key." : "Required for DeepSeek."}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-1 text-gray-400">Model Name</label>
                        <input 
                            type="text" 
                            value={model} 
                            onChange={(e) => setModel(e.target.value)} 
                            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-yellow-400 outline-none"
                        />
                        <p className="text-[10px] text-gray-500 mt-1">Recommended: gemini-2.5-flash or deepseek-chat</p>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 rounded bg-yellow-600 hover:bg-yellow-500 text-white font-bold text-sm shadow-lg">Save Configuration</button>
                </div>
            </div>
        </div>
    );
};
