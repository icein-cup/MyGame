

// World Dimensions
export const TILE_SIZE = 32;
export const WORLD_WIDTH = 50;
export const WORLD_HEIGHT = 50;

// Colors - Clean Medieval Grid Palette
export const COLOR_GRASS = '#5FA777'; // Medium Green (Style Guide)
export const COLOR_GRASS_LIGHT = '#7BC794'; // Light Green (Style Guide)
export const COLOR_PLAYER = '#00FF00'; // Bright Green (Legacy/marker)
export const COLOR_NPC = '#0064FF'; // Blue (Legacy/marker)
export const COLOR_WALL = '#5A5A5A'; // Dark Gray Stone
export const COLOR_TEXT = '#FFFFFF';

// Rendering
export const VIEWPORT_WIDTH = 800;
export const VIEWPORT_HEIGHT = 600;

// Game Settings
export const FPS = 60;
export const MOVE_SPEED = 0.8; // NPC Speed: Tiles per second
export const PLAYER_SPEED = 6.0; // Player Speed: Tiles per second

// NPC Definitions
export const NPC_ROSTER = [
    { 
        id: 'npc_1', 
        name: 'Bob', 
        profession: 'Farmer', 
        x: 12, 
        y: 25, // Moved outside farmhouse 
        color: '#8B4513',
        visuals: {
            gender: 'male',
            hairStyle: 'short',
            hairColor: '#5D4037', 
            clothingStyle: 'tunic',
            clothingColor: '#8D6E63', 
            skinColor: '#E0AC69'
        },
        personality: {
            traits: ["Hardworking", "Simple", "Superstitious"],
            background: "Has worked this land for 40 years. Distrusts magic.",
            goal: "To have a bountiful harvest and pay his taxes."
        }
    }, 
    { 
        id: 'npc_2', 
        name: 'Alice', 
        profession: 'Baker', 
        x: 28, 
        y: 25, // Moved outside bakery
        color: '#E67E22',
        visuals: {
            gender: 'female',
            hairStyle: 'braids',
            hairColor: '#E65100', 
            clothingStyle: 'dress',
            clothingColor: '#FFB74D', 
            skinColor: '#FFCC80'
        },
        personality: {
            traits: ["Cheerful", "Gossip", "Generous"],
            background: "Knows everyone's secrets because everyone buys her bread.",
            goal: "To bake the perfect cake for the King one day."
        }
    }, 
    { 
        id: 'npc_3', 
        name: 'Lord Edmund', 
        profession: 'Noble', 
        x: 38, 
        y: 18, 
        color: '#6C3483',
        visuals: {
            gender: 'male',
            hairStyle: 'short',
            hairColor: '#F5F5F5', 
            clothingStyle: 'robe',
            clothingColor: '#8E44AD', 
            skinColor: '#F5CBA7'
        },
        personality: {
            traits: ["Arrogant", "Educated", "Anxious"],
            background: "Inherited a crumbling estate. Worried about peasant revolts.",
            goal: "To restore his family's wealth and status."
        }
    }, 
    { 
        id: 'npc_4', 
        name: 'Guard Tom', 
        profession: 'Guard', 
        x: 22, 
        y: 38, // Moved outside guardhouse
        color: '#707B7C',
        visuals: {
            gender: 'male',
            hairStyle: 'bald',
            hairColor: '#000000',
            clothingStyle: 'tunic',
            clothingColor: '#546E7A', 
            skinColor: '#D7CCC8'
        },
        personality: {
            traits: ["Loyal", "Lazy", "Hungry"],
            background: "Former soldier who took a quiet village job.",
            goal: "To get through the shift without trouble and find a snack."
        }
    }, 
    { 
        id: 'npc_5', 
        name: 'Merchant Jane', 
        profession: 'Merchant', 
        x: 32, 
        y: 33, // Moved outside merchant shop
        color: '#D4AC0D',
        visuals: {
            gender: 'female',
            hairStyle: 'long',
            hairColor: '#3E2723', 
            clothingStyle: 'robe',
            clothingColor: '#F1C40F', 
            skinColor: '#E0AC69'
        },
        personality: {
            traits: ["Shrewd", "Charismatic", "Opportunist"],
            background: "Travels between cities. Sees value where others don't.",
            goal: "To amass enough gold to buy a noble title."
        }
    },
    // New NPCs
    { 
        id: 'npc_6', 
        name: 'Friar Tuck', 
        profession: 'Priest', 
        x: 11, 
        y: 17, // Moved outside church
        color: '#8D6E63',
        visuals: {
            gender: 'male',
            hairStyle: 'bald',
            hairColor: '#4E342E', 
            clothingStyle: 'robe',
            clothingColor: '#6D4C41', 
            skinColor: '#F5CBA7'
        },
        personality: {
            traits: ["Kind", "Jovial", "Pious"],
            background: "Takes care of the village church and the poor.",
            goal: "To guide the villagers spiritually."
        }
    },
    { 
        id: 'npc_7', 
        name: 'Miller John', 
        profession: 'Miller', 
        x: 6, 
        y: 29, // Moved outside mill
        color: '#FFF3E0',
        visuals: {
            gender: 'male',
            hairStyle: 'short',
            hairColor: '#F5F5F5', 
            clothingStyle: 'tunic',
            clothingColor: '#FFE0B2', 
            skinColor: '#E0AC69'
        },
        personality: {
            traits: ["Sturdy", "Loud", "Honest"],
            background: "Grinds grain for the whole village. Covered in flour.",
            goal: "To keep the mill running smoothly."
        }
    },
    { 
        id: 'npc_8', 
        name: 'Blacksmith Gendry', 
        profession: 'Blacksmith', 
        x: 36, 
        y: 33, // Moved outside forge
        color: '#212121',
        visuals: {
            gender: 'male',
            hairStyle: 'bald',
            hairColor: '#212121', 
            clothingStyle: 'tunic',
            clothingColor: '#424242', 
            skinColor: '#D7CCC8'
        },
        personality: {
            traits: ["Strong", "Quiet", "Skilled"],
            background: "Forges tools and horseshoes. Rarely speaks.",
            goal: "To craft a masterwork sword."
        }
    },
    { 
        id: 'npc_9', 
        name: 'Peasant Mary', 
        profession: 'Farmhand', 
        x: 18, 
        y: 21, // Moved outside cottage
        color: '#A1887F',
        visuals: {
            gender: 'female',
            hairStyle: 'braids',
            hairColor: '#FDD835', 
            clothingStyle: 'dress',
            clothingColor: '#81C784', 
            skinColor: '#FFCC80'
        },
        personality: {
            traits: ["Optimistic", "Tired", "Dreamer"],
            background: "Helps Bob on the farm. Dreams of the big city.",
            goal: "To save enough coins to travel."
        }
    },
    { 
        id: 'npc_10', 
        name: 'Beggar Tom', 
        profession: 'Beggar', 
        x: 30, 
        y: 30, // Wandering market
        color: '#9E9E9E',
        visuals: {
            gender: 'male',
            hairStyle: 'long',
            hairColor: '#BDBDBD', 
            clothingStyle: 'tunic',
            clothingColor: '#757575', 
            skinColor: '#E0AC69'
        },
        personality: {
            traits: ["Cunning", "Desperate", "Observant"],
            background: "Lost everything in a fire. Now watches everything.",
            goal: "To survive another winter."
        }
    },
];
