// usePlayPersistence.ts
import { PlayResult } from '@/types/gameTypes';
import { useState, useCallback } from 'react';

interface PlayState {
  driveNum: string;
  filmNumber: string;
  at: string;
  down: string;
  distance: string;
}

export function usePlayPersistence() {
  const [previousPlay, setPreviousPlay] = useState<PlayState>({
    driveNum: '',
    filmNumber: '',
    at: '',
    down: '',
    distance: ''
  });

  const updatePlayState = useCallback((formData: FormData) => {
    const driveNum = formData.get('driveNum') as string;
    const filmNumber = formData.get('filmNumber') as string;
    const at = formData.get('at') as string;
    const down = formData.get('down') as string; 
    const distance = formData.get('distance') as string;
    const yardsGained = formData.get('yardsGained') as string;
    const result = formData.get('result') as PlayResult;
    
    const atValue = parseInt(at);
    const yardsGainedValue = parseInt(yardsGained);
    const downValue = parseInt(down);
    const distanceValue = parseInt(distance);
    
    const newAt = atValue + yardsGainedValue;
    
    let newDown = downValue;
    let newDistance = distanceValue;
    let newDriveNum = driveNum;
    
    if (result.includes('TD')) {
      newDown = 1;
      newDistance = 10;
      newDriveNum = (parseInt(driveNum) + 1).toString();
      const newAt = -25;
    } 
    // Handle turnovers
    else if (result === 'Interception' || result === 'Fumble') {
      newDown = 1;
      newDistance = 10;
      newDriveNum = (parseInt(driveNum) + 1).toString();
    }
    else if (result === 'Penalty') {
    }
    else {
      if (yardsGainedValue >= distanceValue) {
        newDown = 1;
        newDistance = 10;
      } else {
        newDown = downValue + 1;
        newDistance = distanceValue - yardsGainedValue;
        
        if (newDown > 4) {
          newDown = 1;
          newDistance = 10;
          newDriveNum = (parseInt(driveNum) + 1).toString();
        }
      }
    }
    
    let newAtPosition = newAt;
    if (result.includes('TD')) {
      newAtPosition = -25; 
    }
    
    const newFilmNumber = (parseInt(filmNumber) + 1).toString();
    
    setPreviousPlay({
      driveNum: newDriveNum,
      filmNumber: newFilmNumber,
      at: newAtPosition.toString(),
      down: newDown.toString(),
      distance: newDistance.toString()
    });
  }, []);
  
  return { previousPlay, updatePlayState };
}