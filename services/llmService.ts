import { GoogleGenAI } from "@google/genai";
import { LLMSettings } from '../types';

export const configureLLM = (settings: LLMSettings) => {
    // Deprecated: API key is now strictly from process.env.API_KEY
};

// Generic LLM Helper
export async function getCompletion(
    systemPrompt: string, 
    userPrompt: string, 
    schema?: any,
    jsonMode: boolean = false
): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: jsonMode ? "application/json" : "text/plain",
                responseSchema: schema 
            }
        });
        return response.text || "";
    } catch (e) {
        console.error("Gemini API Error:", e);
        throw e;
    }
}

export async function* getStreamCompletion(
    systemPrompt: string, 
    userPrompt: string
): AsyncGenerator<string, void, unknown> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
        const responseStream = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction: systemPrompt,
            }
        });

        for await (const chunk of responseStream) {
            yield chunk.text;
        }
    } catch (e) {
        console.error("Gemini Stream Error:", e);
        yield "...";
    }
}

export async function generateSprite(description: string): Promise<string | null> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Precise prompt based on user request and engine constraints
    const prompt = `Create a 32x32 pixel paper doll character sprite sheet with walking animations for all 4 directions. The sprite sheet should include:

- 4 rows (one for each direction: front-facing/down, back/up, left, right)
- 4 frames per row showing a complete walking cycle
- Character should be centered in each 32x32 pixel frame
- Simple, clear pixel art style with clean outlines
- Character design should be modular/paper doll compatible (separable head, body, legs)
- Consistent proportions across all frames
- Smooth walking animation with proper leg movement
- Neutral/basic clothing that can serve as a base layer
- TRANSPARENT BACKGROUND (no background color, PNG format)

Layout: 4 columns × 4 rows grid (128x128 pixels total)
Row 1: Walking down/toward camera
Row 2: Walking up/away from camera  
Row 3: Walking left
Row 4: Walking right

Style: Retro pixel art, similar to classic 16-bit RPG games. Clear silhouette, 8-16 color palette maximum. Save as PNG with alpha transparency.

Character Details: ${description}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: prompt,
            // Note: responseMimeType is not supported for nano banana series models for image gen
        });
        
        // Extract image data
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    return part.inlineData.data;
                }
            }
        }
        return null;
    } catch (e) {
        console.error("Sprite Generation Error:", e);
        return null;
    }
}