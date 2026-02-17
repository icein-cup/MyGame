# Generative Fiefdom - Design Documentation

## 00_version_alpha_mvp.md

# Version Alpha - Minimal Viable Prototype

## ■ Goal
Create a **skeleton version** of Generative Fiefdom to **prove the core concept works**:
- ■ NPCs make LLM-based decisions
- ■ NPCs move around autonomously
- ■ Memory system stores/retrieves NPC memories
- ■ Basic dialogue with player works
- ■ Game runs at 60 FPS

**Timeline:** 1-2 weeks
**Scope:** Absolute minimum to demonstrate AI is functional

---

## ■ What's Included in Version Alpha

### **1. Bare Minimum Rendering**

**No fancy sprites - use simple colored rectangles (initially):**
- **Player:** Green 32×32 square
- **NPCs:** Blue 32×32 squares (or basic sprites if available)
- **Walls:** Gray 32×32 squares
- **Background:** Solid color (grass green) or basic tile

**Why:** Skip complex art/animation pipelines initially. Focus on AI logic.

**World Size:** Small 50×50 tile map (not 400×400)

---

### **2. Minimal NPCs (5 Total)**

**Only 5 NPCs to test AI:**
1. **Bob the Farmer** (peasant)
2. **Alice the Baker** (peasant)
3. **Lord Edmund** (noble)
4. **Guard Tom** (peasant)
5. **Merchant Jane** (merchant)

**Why:** 5 NPCs is enough to test interactions, relationships, and LLM calls without overwhelming complexity.

---

### **3. Basic Movement**

**Player:**
- WASD or Arrow keys to move (continuous movement)
- Camera follows player (viewport centers on player coordinates)

**NPCs:**
- Move to destinations via pathfinding (A*)
- No physics engine yet (just tile-based movement logic)
- No collision (NPCs can overlap for Alpha)

**Why:** Prove NPCs can navigate to destinations based on AI plans.

---

### **4. LLM Integration (Core Feature)**

**Daily Planning:**
- Each NPC gets a daily plan from LLM (Gemini)
- Example plan: "Morning: Go to bakery. Afternoon: Buy bread. Evening: Go home."
- NPCs execute simple actions: `walkTo(x, y)`, `wait(seconds)`

**Dialogue:**
- Press E near NPC to talk
- Simple HTML overlay for text input
- NPC responds via LLM (Gemini)
- Conversation displayed as text log on screen

**Memory:**
- NPCs remember conversations (stored in memory array or vector store)
- When you talk to NPC again, they reference past conversations

**Why:** This is the CORE innovation - prove the AI works.

---

### **5. Minimal Time System**

- Simple clock: Day counter only (no detailed hours yet)
- Press SPACE to advance to next day
- NPCs get new daily plans each day

**Why:** Enough to test daily planning loop, no need for real-time simulation yet.

---

### **6. Debug UI**

**Show on screen (HTML Overlay):**
- Current NPC states (what each NPC is doing)
- LLM call log (last 5 LLM requests/responses)
- FPS counter
- Memory count per NPC

**Why:** Visibility into AI system for debugging.

---

# 01_game_overview.md

# Project Overview: "The Generative Fiefdom"

## 1. Concept
A top-down 2D medieval life-simulation RPG where every NPC is a fully autonomous generative agent.
Players take on the role of a single character in a living, breathing feudal society. The economy, social
hierarchy, and daily lives of NPCs are driven by their internal memories, needs, and class standing
within realistic time constraints, not by rigid scripted schedules. NPCs make emergent decisions via
LLM planning but operate within natural daily rhythms (work hours, sleep cycles, business hours).

## 2. Core Loops
* **Player:** Acquire land -> Farm/Harvest -> Fulfill Contracts -> Earn Coin -> Upgrade Social Status.
* **NPCs:** Plan day -> Execute work -> Socialize -> Sleep.
* **Emergent:** Information travels via physical Postal System (no telepathy).

---

# 02_technical_specs.md

# Technical Stack

## Core Engine
* **Frontend Framework:** `React` (v19) with `TypeScript`
* **Rendering:** `HTML5 Canvas API` (via React `useRef`) for high-performance 2D rendering
* **Build Tool:** `Vite`
* **Styling:** `Tailwind CSS`

## LLM Integration
* **Primary API:** `Google GenAI SDK` (@google/genai)
* **Models:**
    *   `gemini-2.5-flash`: High frequency calls (NPC dialogue, planning).
    *   `gemini-pro`: Complex reasoning, Dungeon Master events.

## Memory & Embeddings
* **Vector Store:** Client-side vector logic or external API (e.g., Pinecone/Chroma via proxy) if needed. For Alpha, in-memory arrays.
* **Data Structures:** TypeScript Interfaces for `Memory`, `Plan`, `NPC`.

## Serialization & Save/Load
* **Storage:** `localStorage` or `IndexedDB` for browser-based persistence.
* **Format:** JSON.

---

# 03_implementation_architecture.md

# Implementation Architecture Guide

## 1. Project Structure
```
src/
├── components/
│   ├── GameCanvas.tsx       # Main rendering loop
│   ├── DebugPanel.tsx       # UI Overlay
│   └── DialogueOverlay.tsx  # Chat UI
├── services/
│   ├── geminiService.ts     # LLM API calls
│   ├── pathfinding.ts       # A* Algorithm
│   ├── gameLoop.ts          # Main update logic
│   └── storageService.ts    # Save/Load
├── types/
│   └── index.ts             # TS Interfaces (NPC, Item, etc.)
├── constants.ts             # Configuration
└── App.tsx                  # Root component
```

## 2. Core Game Loop Architecture
### **Main Loop (React + requestAnimationFrame):**
```typescript
// App.tsx or GameCanvas.tsx
useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
        const dt = (time - lastTime) / 1000;
        lastTime = time;

        updateGameState(dt); // Update Logic
        render(dt);          // Draw to Canvas

        animationFrameId = requestAnimationFrame(loop);
    };
    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
}, []);
```

## 3. Data Structures
### **NPC Interface:**
```typescript
interface NPC {
    id: string;
    name: string;
    profession: string;
    position: { x: number; y: number };
    state: 'idle' | 'moving' | 'working' | 'sleeping';
    currentPlan: PlanAction[];
    memories: Memory[];
    stats: {
        hunger: number;
        energy: number;
        money: number;
    };
}
```

---

# 04_time_and_calendar.md

# Time & Calendar System

## 1. Time Progression

### **Time Ratio:**
**1 real minute = 20 game minutes (1:20 ratio)**

**Breakdown:**
- 1 real second = 20 game seconds
- 72 real minutes (1.2 hours) = 1 game day (24 hours)

### **Time Control:**
■ **Player can pause time** (ESC menu, dialogue).
■ **Time STOPS during player-NPC dialogue.**
■ **Time DOES NOT stop otherwise.**

---

## 2. Calendar Structure

### **Seasons (14 days each):**
**1. Spring (Bloomtide):** Frequent rain, crops grow faster.
**2. Summer (Suntide):** Clear, longer days.
**3. Fall (Harvestide):** Harvest season, shorter days.
**4. Winter (Frosttide):** Snow, crops freeze.

---

## 3. Day Structure & Time Blocks

### **24-Hour Clock**
**Day (6:00-20:00):**
- **06:00:** Dawn. NPCs wake up.
- **08:00:** Work begins. Shops open.
- **18:00:** Shops close.
- **20:00:** Sunset.

**Night (20:00-06:00):**
- **22:00:** Deep night. Most NPCs asleep. Criminals active.

---

# 05_animation_specs.md

# Animation Catalog & Performance Strategy

## 1. Overview
**Sprite Size:** 32x32 pixels.
**Frame Rate:** 60 FPS game loop.

## 2. Core Design Principles
### Performance-First Approach:
■ **Batch rendering:** Use `CanvasRenderingContext2D` efficiently. Draw all background tiles, then all entities, then UI.
■ **Sprite Sheets:** Load single large images instead of hundreds of small ones.

## 3. Animation Catalog
### **PHASE 1: MVP Animations**
**1. Walk Cycle**
- **Frames:** 4 per direction.
- **Speed:** ~200ms per frame.

**2. Idle/Standing**
- **Frames:** 2 per direction (subtle breathing).

## 4. Implementation Example (TypeScript)
```typescript
const drawCharacter = (
    ctx: CanvasRenderingContext2D, 
    img: HTMLImageElement, 
    x: number, 
    y: number, 
    frame: number, 
    facing: 'up'|'down'|'left'|'right'
) => {
    const spriteRow = facing === 'down' ? 0 : facing === 'up' ? 1 : facing === 'left' ? 2 : 3;
    ctx.drawImage(
        img, 
        frame * 32, spriteRow * 32, 32, 32, // Source
        x * 32, y * 32, 32, 32              // Destination
    );
};
```

---

# 06_sprite_catalog.md

# Complete Sprite Specification

## 1. Technical Specifications
- **Resolution:** 32×32 pixels.
- **Format:** PNG with transparency.

## 2. File Organization
```
/public/assets/
  /characters/
    peasant_male.png
    noble_female.png
  /terrain/
    grass.png
    dirt.png
  /items/
    sword.png
    bread.png
```

---

# 07_world_generation.md

# Procedural World Generation

## 1. Generation Pipeline
* **Pass 1:** Geography (Noise-based Heightmap).
* **Pass 2:** Infrastructure (Drunken Walk Roads).
* **Pass 3:** Zoning (Residential/Commercial Parcels).

### **Algorithm Specs:**
**1. Heightmap Generation:**
Use a noise library (e.g., `simplex-noise` or custom implementation) to generate a 2D array of height values.

**2. Biome Mapping:**
| Height | Biome | Tile |
| :--- | :--- | :--- |
| < 0.3 | Ocean | Water Tile |
| 0.3 - 0.35 | Beach | Sand Tile |
| > 0.8 | Mountain | Rock Tile |
| Others | Plains | Grass Tile |

**3. Implementation (TypeScript):**
```typescript
const generateWorld = (width: number, height: number): Tile[][] => {
    const map: Tile[][] = [];
    for (let y = 0; y < height; y++) {
        const row: Tile[] = [];
        for (let x = 0; x < width; x++) {
            const h = noise(x * 0.1, y * 0.1);
            row.push(h < 0.3 ? 'water' : 'grass');
        }
        map.push(row);
    }
    return map;
};
```

---

# 08_construction.md

# Generative Construction

## 1. The Blueprint State
* **Ghost Layer:** Visual representation of where a building will go.
* **Blueprint Schema (JSON):**
```typescript
interface Blueprint {
    id: string;
    name: string;
    width: number;
    height: number;
    entrance: { x: number; y: number };
    resourcesRequired: { wood: number; stone: number };
    layout: { x: number; y: number; assetId: string }[];
}
```

## 2. The Building Loop
1. **Fetch:** NPC goes to stockpile, picks up resource.
2. **Build:** NPC goes to ghost tile, plays hammering animation.
3. **Progress:** Increment progress bar.
4. **Complete:** Replace ghost tile with solid wall tile.

---

# 09_npc_population.md

# NPC Population & Structure

## 1. Population
**Total:** 120 AI NPCs + Player.

### Social Classes:
* **Aristocrats (4):** Rulers, own large estates.
* **Nobles (12):** Landowners, manage vassals.
* **Merchants:** Wealthy traders.
* **Peasants:** Farmers, laborers.

## 2. Relationships
* **Axes:** Romance (0-100), Trust (0-100), Respect (0-100).
* **Initialization:** Pre-generated matrix based on family/work ties.

---

# 10_economy_system.md

# Economy System

## 1. Currency
**PoE (Pieces of Eight).**
Baseline: 1 Loaf of Bread = 1 PoE.

## 2. Marketplace Class (TypeScript)
```typescript
class Marketplace {
    prices: Record<string, number> = { "bread": 1, "wood": 5 };
    supply: Record<string, number> = {};
    demand: Record<string, number> = {};

    updatePrices() {
        // Elasticity formula
        for (const item in this.prices) {
            const s = this.supply[item] || 1;
            const d = this.demand[item] || 1;
            const ratio = d / s;
            // Price fluctuates based on scarcity
            this.prices[item] = Math.max(1, this.prices[item] * (1 + (ratio - 1) * 0.1));
        }
    }
}
```

---

# 11_agriculture_husbandry.md

# Farming & Animals

## Crops
* **Lifecycle:** Seed -> Sprout -> Mature.
* **Growth Time:** 5-7 game days.
* **Logic:** Each tile tracks `daysPlanted` and `isWatered`.

## Animals
* **Entities:** Chickens, Cows, Pigs.
* **Behavior:** Wander within fences, eat food/grass.
* **Production:** Eggs (Daily), Milk (Daily).

---

# 12_law_and_crime.md

# Law & Lineage

## 1. Crime System
* **Witnessing:** If an NPC sees a crime (Line of Sight check), they create a Memory.
* **Reporting:** They walk to the Sheriff to report.
* **Crimes:** Theft, Assault, Trespassing.

## 2. Punishment
* **Fines:** Deducted from gold.
* **Jail:** Teleported to Jail cell for X days.

---

# 13_llm_strategy.md

# LLM Integration Strategy

## 1. Architecture
* **Gemini Flash:** Used for high-frequency tasks (NPC daily planning, simple chat).
* **Gemini Pro:** Used for complex storytelling, player dialogue, or "Dungeon Master" events.

## 2. Optimization
* **Context Window:** Only send recent/relevant memories.
* **Response Schema:** Use JSON output for plans to ensure parsing reliability.

---

# 14_dialogue_system.md

# Dialogue & Communication System

## 1. Player-NPC Dialogue
* **Trigger:** Press 'E'.
* **UI:** React Overlay.
* **Input:** Text field.
* **Output:** Streaming text from LLM.

## 2. NPC-NPC Dialogue (Ambient)
* **Visual:** Speech bubbles above heads (Canvas drawing).
* **Trigger:** When NPCs are close and idle.
* **Content:** Short, generated exchanges based on shared memories/gossip.

---

# 15_vassal_system.md

# Vassal & Servant System

## 1. Overview
**Vassals** are simplified NPCs (non-LLM initially) to save performance.
* **Behavior:** Finite State Machine (FSM) or Behavior Tree.
* **Tasks:** Farm, Haul, Sleep.

## 2. Freedom Aspiration
* 15% of Vassals may gain "Sentience" (promoted to LLM agent) if they save enough money or triggered by story events.

---

# 16_ai_theory_ref.md

# AI Architecture

## 1. Memory Stream
* **Structure:** Array of objects `{ id, text, timestamp, importance }`.
* **Retrieval:** Weighted sum of Recency, Importance, and Relevance.

## 2. Reflection
* Periodically (e.g., every night), the AI summarizes daily memories into high-level insights.

---

# 17_performance_guide.md

# Performance Optimization Guide (Web)

## 1. Rendering
* **Canvas API:** Use `drawImage` efficiently.
* **Culling:** Do not draw tiles/NPCs outside the viewport.
* **Offscreen Canvas:** Pre-render static layers (terrain) to an offscreen canvas and draw that as a single image.

## 2. React Optimization
* **State Management:** Avoid putting high-frequency game loop data (like 60FPS player coordinates) into React State if possible. Use Refs for mutable game state and only trigger re-renders for UI updates (Dialogue, Inventory).

## 3. Pathfinding
* **Staggering:** Don't calculate paths for all 120 NPCs in the same frame. Distribute over multiple frames.
* **Caching:** Cache common paths.

---

# 18_postal_system.md

# Postal System

## 1. Concept
No telepathy. Information travels physically.

## 2. Couriers
* **Role:** NPCs that carry "Letter" items.
* **Route:** Post Office -> Village Homes -> Post Office.

## 3. Letters
* **Item Type:** `Letter { sender, receiver, content, readStatus }`.
* **Mechanic:** Player writes text -> LLM formats it -> Item created -> Deposited in box.

---

# 19_version_beta_mvp.md

# Version Beta Goals

## 1. Visual Upgrade
* Replace colored squares with actual sprites.
* Implement UI styling (parchment theme).

## 2. Systems
* Active Economy (Marketplace).
* Postal System functional.
* Construction system (building placement).

## 3. World
* Full 256x256 map generation.
* Distinct zones (Residential, Commercial, Farming).

---

# 20_quality_assurance.md

# QA & Validation

## 1. World Gen Validation
* **Check:** Is there enough walkable land?
* **Check:** Are all cities connected?
* **Fallback:** If generation fails, load a safe default map.

## 2. Blueprint Validation
* **Check:** Do buildings have entrances?
* **Check:** Are required resources positive integers?

---

# 21_visual_style_guide.md

# Visual Style Guide - "Clean Medieval Grid"

## 1. Aesthetic
* **View:** Top-down Orthographic.
* **Grid:** 32x32 pixel alignment.
* **Colors:** Flat, medieval earth tones. No gradients. 1px black outlines.

## 2. Color Palette
* **Grass:** Forest Green (#228B22)
* **Dirt:** Brown (#8B4513)
* **Water:** Blue (#4682B4)
* **Walls:** Stone Gray (#708090) or Wood Brown (#A0522D)

## 3. Implementation
* Use Canvas API to draw these colors/sprites precisely on the grid.
