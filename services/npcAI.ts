
import { Type } from "@google/genai";
import { NPC, NPCAction, ActionType, Memory } from '../types';
import { getCompletion, getStreamCompletion } from './llmService';

// --- Memory System Core ---

/**
 * Calculates the importance of a memory on a scale of 1-10 using the LLM.
 * 1 = Mundane (e.g., "I ate bread")
 * 10 = Poignant (e.g., "I fell in love", "I was attacked")
 */
export const calculateImportance = async (text: string): Promise<number> => {
    const systemPrompt = `Rate the importance of the following memory for a medieval RPG character on a scale of 1 to 10.
    1 = Routine, mundane (Walking, eating, sleeping)
    5 = Meaningful conversation or event
    10 = Life-changing event, extreme danger, deep realization
    Output strict JSON: { "score": number }`;
    
    const geminiSchema = {
        type: Type.OBJECT,
        properties: {
            score: { type: Type.INTEGER }
        }
    };

    try {
        const result = await getCompletion(systemPrompt, `Memory: "${text}"`, geminiSchema, true);
        const data = JSON.parse(result);
        return Math.max(1, Math.min(10, data.score || 1));
    } catch (e) {
        return 1; // Default to low importance on failure
    }
};

/**
 * Creates a memory object, calculates its importance, and adds it to the NPC.
 */
export const addMemory = async (npc: NPC, text: string, type: Memory['type'], day: number, relatedEntityId?: string): Promise<Memory> => {
    // Optimization: If it's ambient dialogue, assume low importance to save API calls, 
    // unless it contains keywords like 'love', 'kill', 'king'.
    let importance = 2;
    if (type === 'reflection' || type === 'dialogue') {
        importance = await calculateImportance(text);
    }

    const memory: Memory = {
        id: `mem_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,
        text,
        timestamp: day,
        importance,
        type,
        relatedEntityId
    };

    npc.memories.push(memory);
    return memory;
};

/**
 * Retrieves memories based on a mix of Recency and Importance.
 * "Generative Agents Lite" Retrieval:
 * 1. Top 3 most recent memories.
 * 2. Top 3 highest importance memories (all time).
 */
const retrieveRelevantMemories = (npc: NPC): string => {
    if (npc.memories.length === 0) return "No memories yet.";

    // 1. Recency: Last 3
    const recent = [...npc.memories].sort((a, b) => b.timestamp - a.timestamp).slice(0, 3);
    
    // 2. Importance: Top 3 (excluding ones already in recent to avoid duplicates)
    const recentIds = new Set(recent.map(m => m.id));
    const important = [...npc.memories]
        .filter(m => !recentIds.has(m.id))
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 3);

    // Combine and Sort by time for coherent reading
    const combined = [...recent, ...important].sort((a, b) => a.timestamp - b.timestamp);

    return `MEMORIES:\n${combined.map(m => `[Day ${m.timestamp}] (Imp: ${m.importance}) ${m.text}`).join('\n')}`;
};

/**
 * End-of-Day Reflection.
 * Summarizes the day's events into high-level insights.
 */
export const reflectOnDay = async (npc: NPC, currentDay: number): Promise<void> => {
    // Get memories from this day
    const todaysMemories = npc.memories.filter(m => m.timestamp === currentDay && m.type !== 'reflection');
    
    if (todaysMemories.length === 0) return;

    const memoriesText = todaysMemories.map(m => `- ${m.text}`).join('\n');
    
    const systemPrompt = `You are ${npc.name}, reflecting on your day.
    Analyze the following raw memories and generate 1-2 high-level insights or generalizations about your life, relationships, or goals.
    Example: Instead of "Bob said hi", generate "Bob seems friendly lately."
    Output strict JSON: { "insights": ["insight 1", "insight 2"] }`;

    const geminiSchema = {
        type: Type.OBJECT,
        properties: {
            insights: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            }
        }
    };

    try {
        const text = await getCompletion(systemPrompt, `Memories of Day ${currentDay}:\n${memoriesText}`, geminiSchema, true);
        const data = JSON.parse(text);
        
        // Add insights as new memories with naturally high importance
        for (const insight of data.insights) {
            await addMemory(npc, `Reflection: ${insight}`, 'reflection', currentDay);
        }
        npc.lastReflectionDay = currentDay;
    } catch (e) {
        console.error(`Reflection failed for ${npc.name}`, e);
    }
};

// --- Context Formatters ---

const formatConversationHistory = (history: { speaker: string; text: string }[]): string => {
    if (history.length === 0) return "Conversation just started.";
    return `CURRENT CONVERSATION:\n${history.map(m => `${m.speaker}: "${m.text}"`).join('\n')}`;
};

const formatRelationshipContext = (npc: NPC, targetId: string, targetName: string): string => {
    const rel = npc.relationships[targetId] || { trust: 50, respect: 50, romance: 0 };
    return `
    RELATIONSHIP with ${targetName}:
    Trust: ${rel.trust}/100
    Respect: ${rel.respect}/100
    Romance: ${rel.romance}/100
    `;
};

// --- Planning Logic ---

export const generateDailyPlan = async (npc: NPC, day: number): Promise<NPCAction[]> => {
    if (day === 1) {
        return generateStaticPlan(npc);
    }

    // Inject Reflections/Memories into the planning prompt
    const memoryContext = retrieveRelevantMemories(npc);
    
    // Inject Needs
    const needsContext = `Current Needs (0-100): Hunger: ${Math.round(npc.needs.hunger)} (Low=Eat), Social: ${Math.round(npc.needs.social)} (Low=Talk), Energy: ${Math.round(npc.needs.energy)}.`;

    const systemPrompt = `You are ${npc.name}, a ${npc.profession}. 
    Traits: ${npc.personality.traits.join(", ")}. Goal: ${npc.personality.goal}.
    ${memoryContext}
    ${needsContext}
    
    Plan your day in 2 distinct actions. Prioritize your Needs (e.g. if Hunger is low, go to Bakery/Farm/Tavern to eat; if Social is low, go to Market/Tavern).
    Available locations: "Bakery", "Farm", "Market", "Castle", "Home", "Guard Post", "Church", "Mill", "Forge".
    Output strict JSON.`;

    const prompt = `It is Day ${day}. Plan your day.
    Example JSON format:
    {
      "actions": [
        { "description": "Go to bakery to eat bread", "location": "Bakery", "duration": 10 }
      ]
    }`;

    const geminiSchema = {
        type: Type.OBJECT,
        properties: {
            actions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        description: { type: Type.STRING },
                        location: { type: Type.STRING },
                        duration: { type: Type.NUMBER }
                    }
                }
            }
        }
    };

    try {
        const text = await getCompletion(systemPrompt, prompt, geminiSchema, true);
        if (!text) return [];
        
        const data = JSON.parse(text);
        
        const locationMap: Record<string, {x: number, y: number}> = {
            "Bakery": { x: 28, y: 24 },
            "Farm": { x: 12, y: 24 },
            "Market": { x: 32, y: 33 },
            "Castle": { x: 38, y: 16 },
            "Home": { x: 24, y: 26 },
            "Guard Post": { x: 22, y: 38 },
            "Church": { x: 11, y: 16 },
            "Mill": { x: 6, y: 28 },
            "Forge": { x: 36, y: 33 }
        };

        return data.actions.map((a: any) => {
            const basePos = locationMap[a.location] || { x: 25, y: 25 };
            const jitterX = (Math.random() - 0.5) * 2; 
            const jitterY = (Math.random() - 0.5) * 2;
            return {
                type: ActionType.WALK,
                description: a.description,
                target: { x: basePos.x + jitterX, y: basePos.y + jitterY }, 
                duration: a.duration
            };
        });

    } catch (error) {
        console.error("Plan Gen Error:", error);
        return [{ type: ActionType.WAIT, description: "Confused...", duration: 10 }];
    }
};

export const generateStaticPlan = (npc: NPC): NPCAction[] => {
    // Locations adjusted to match generateWorld() coordinates
    const locations = {
        "Bakery": { x: 28, y: 24 },
        "Farm": { x: 12, y: 24 },
        "Market": { x: 32, y: 33 },
        "Castle": { x: 38, y: 16 }, 
        "Home": { x: 24, y: 26 }, 
        "Guard Post": { x: 22, y: 38 },
        "Church": { x: 11, y: 16 },
        "Mill": { x: 6, y: 28 },
        "Forge": { x: 36, y: 33 },
        "Tavern": { x: 30, y: 28 } 
    };

    const jitter = () => (Math.random() - 0.5) * 3;
    const getLoc = (key: string) => ({ x: locations[key].x + jitter(), y: locations[key].y + jitter() });

    // Static fallback: Ensure they eat at some point
    switch (npc.profession) {
        case 'Farmer':
            return [
                { type: ActionType.WALK, description: "Working the fields", target: getLoc("Farm"), duration: 60 },
                { type: ActionType.WALK, description: "Eating lunch", target: getLoc("Home"), duration: 20 },
                { type: ActionType.WALK, description: "Resting at home", target: getLoc("Home"), duration: 30 }
            ];
        case 'Baker':
            return [
                { type: ActionType.WALK, description: "Baking bread", target: getLoc("Bakery"), duration: 50 },
                { type: ActionType.WALK, description: "Eating lunch", target: getLoc("Market"), duration: 20 },
                { type: ActionType.WALK, description: "Selling at market", target: getLoc("Market"), duration: 40 }
            ];
        case 'Guard':
            return [
                { type: ActionType.WALK, description: "Patrolling", target: getLoc("Guard Post"), duration: 60 },
                { type: ActionType.WALK, description: "Checking Castle", target: getLoc("Castle"), duration: 40 },
                { type: ActionType.WALK, description: "Break time", target: getLoc("Market"), duration: 20 }
            ];
        default:
            return [
                { type: ActionType.WALK, description: "Wandering", target: getLoc("Market"), duration: 40 },
                { type: ActionType.WALK, description: "Finding food", target: getLoc("Bakery"), duration: 20 },
                { type: ActionType.WALK, description: "Going home", target: getLoc("Home"), duration: 40 }
            ];
    }
};

// --- Dialogue Logic ---

export async function* generateDialogueStream(
    npc: NPC, 
    playerInput: string, 
    recentMemories: string[], // Legacy param ignored in favor of retrieveRelevantMemories
    conversationHistory: { speaker: string; text: string }[],
    targetName: string,
    targetId: string
): AsyncGenerator<string, void, unknown> {
    
    // Use the smart retrieval system
    const memoryContext = retrieveRelevantMemories(npc);
    const historyContext = formatConversationHistory(conversationHistory);
    const relContext = formatRelationshipContext(npc, targetId, targetName);
    const needsContext = `Current Stats: Hunger ${Math.round(npc.needs.hunger)}%, Energy ${Math.round(npc.needs.energy)}%.`;

    const systemPrompt = `You are ${npc.name}, a ${npc.profession}. Traits: ${npc.personality.traits.join(", ")}. Background: ${npc.personality.background}.
    Respond naturally in 1-2 sentences. Keep it medieval. Tone reflects Trust/Respect.
    ${needsContext} (If hunger is low, mention being hungry. If energy low, mention being tired).`;
    
    const prompt = `
    ${relContext}
    ${memoryContext}
    ${historyContext}
    Target says: "${playerInput}"
    Respond:
    `;

    yield* getStreamCompletion(systemPrompt, prompt);
}

export const generateGreeting = async (npc: NPC): Promise<string> => {
    const memoryContext = retrieveRelevantMemories(npc);
    const needsContext = npc.needs.hunger < 30 ? "You are very hungry." : (npc.needs.energy < 30 ? "You are exhausted." : "");
    
    const systemPrompt = `You are ${npc.name}, a ${npc.profession}. Traits: ${npc.personality.traits.join(", ")}.
    Relevant Memories: ${memoryContext}
    ${needsContext}`;
    
    const prompt = `You have approached the player. Generate a short, natural opening line (1 sentence).`;

    try {
        const text = await getCompletion(systemPrompt, prompt);
        return text || "Greetings.";
    } catch (error) {
        return "Hello there.";
    }
};

export const generateAmbientDialogue = async (npc1: NPC, npc2: NPC): Promise<[string, string]> => {
    // Context Retrieval for both
    const mem1 = retrieveRelevantMemories(npc1);
    const mem2 = retrieveRelevantMemories(npc2);
    
    const rel1 = npc1.relationships[npc2.id] || { trust: 50 };
    const rel2 = npc2.relationships[npc1.id] || { trust: 50 };

    const systemPrompt = "Generate a short interaction (2 lines). Output strict JSON: { \"npc1_line\": \"...\", \"npc2_line\": \"...\" }";
    const prompt = `
    Characters: 
    1. ${npc1.name} (${npc1.profession}) - Traits: ${npc1.personality.traits.join(", ")}. \n${mem1}\nTrust in ${npc2.name}: ${rel1.trust}\nHunger: ${npc1.needs.hunger}
    2. ${npc2.name} (${npc2.profession}) - Traits: ${npc2.personality.traits.join(", ")}. \n${mem2}\nTrust in ${npc1.name}: ${rel2.trust}\nHunger: ${npc2.needs.hunger}
    They are standing near each other.
    `;

    const geminiSchema = {
        type: Type.OBJECT,
        properties: {
            npc1_line: { type: Type.STRING },
            npc2_line: { type: Type.STRING }
        }
    };

    try {
        const text = await getCompletion(systemPrompt, prompt, geminiSchema, true);
        if (!text) return ["...", "..."];
        const data = JSON.parse(text);
        return [data.npc1_line, data.npc2_line];

    } catch (error) {
        return ["Nice day.", "Indeed."];
    }
};

export const analyzeSocialInteraction = async (
    npc: NPC, 
    targetName: string, 
    conversationLog: string
): Promise<{ trustChange: number, respectChange: number, summary: string }> => {
    const systemPrompt = `Analyze conversation for ${npc.name}.
    1. Did interaction increase/decrease Trust? (-10 to +10)
    2. Did it increase/decrease Respect? (-10 to +10)
    3. Summarize the conversation in 1 sentence for the NPC's memory.
    Output strict JSON: { "trustChange": 0, "respectChange": 0, "summary": "..." }`;

    const prompt = `Transcript:\n"${conversationLog}"`;

    const geminiSchema = {
        type: Type.OBJECT,
        properties: {
            trustChange: { type: Type.NUMBER },
            respectChange: { type: Type.NUMBER },
            summary: { type: Type.STRING }
        }
    };

    try {
        const text = await getCompletion(systemPrompt, prompt, geminiSchema, true);
        if (!text) throw new Error("No text");
        return JSON.parse(text);
    } catch (e) {
        return { trustChange: 0, respectChange: 0, summary: `Talked to ${targetName}` };
    }
};
