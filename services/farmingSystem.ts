
import { Crop, CropStage, CropType, Item } from '../types';

export const CROPS_DEFINITION: Record<CropType, { growthDays: number, harvestItem: Item }> = {
    'wheat': {
        growthDays: 2,
        harvestItem: { 
            id: 'wheat_bundle', 
            type: 'wheat', 
            name: 'Wheat Bundle', 
            description: 'Golden grain ready for milling.' 
        }
    }
};

export const createCrop = (x: number, y: number, day: number, type: CropType = 'wheat'): Crop => {
    return {
        id: `crop_${Date.now()}_${Math.random()}`,
        type,
        x, 
        y,
        plantedDay: day,
        stage: 0
    };
};

export const updateCropGrowth = (crop: Crop, currentDay: number): Crop => {
    const def = CROPS_DEFINITION[crop.type];
    const daysAlive = currentDay - crop.plantedDay;
    
    // Simple logic: 
    // < 1/2 growth time = Stage 0
    // >= 1/2 growth time = Stage 1
    // >= growth time = Stage 2 (Mature)
    
    let newStage: CropStage = 0;
    
    if (daysAlive >= def.growthDays) {
        newStage = 2;
    } else if (daysAlive >= def.growthDays / 2) {
        newStage = 1;
    } else {
        newStage = 0;
    }

    return { ...crop, stage: newStage };
};

export const canHarvest = (crop: Crop): boolean => {
    return crop.stage === 2;
};

export const getHarvestItem = (crop: Crop): Item => {
    return CROPS_DEFINITION[crop.type].harvestItem;
};
