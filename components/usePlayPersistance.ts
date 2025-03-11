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
    // Extract values from form submission
    const driveNum = formData.get('driveNum') as string;
    const filmNumber = formData.get('filmNumber') as string;
    const at = formData.get('at') as string;
    const down = formData.get('down') as string; 
    const distance = formData.get('distance') as string;
    const yardsGained = formData.get('yardsGained') as string;
    const result = formData.get('result') as PlayResult;
    
    // Parse values as integers for calculations
    const atValue = parseInt(at);
    const yardsGainedValue = parseInt(yardsGained);
    const downValue = parseInt(down);
    const distanceValue = parseInt(distance);
    
    // Calculate new field position
    const newAt = atValue + yardsGainedValue;
    
    // Calculate new down and distance based on football rules and play result
    let newDown = downValue;
    let newDistance = distanceValue;
    let newDriveNum = driveNum;
    
    // Handle touchdowns - new drive, reset field position
    if (result.includes('TD')) {
      // Reset to 1st and 10 for new drive after touchdown
      newDown = 1;
      newDistance = 10;
      // Add 1 to drive number since a touchdown happened
      newDriveNum = (parseInt(driveNum) + 1).toString();
      // Reset field position to own 25 (assuming touchback on kickoff)
      const newAt = -25; // Negative because it's own territory
    } 
    // Handle turnovers
    else if (result === 'Interception' || result === 'Fumble') {
      // Reset to 1st and 10 for new drive after turnover
      newDown = 1;
      newDistance = 10;
      // Add 1 to drive number since turnover happened
      newDriveNum = (parseInt(driveNum) + 1).toString();
    }
    // Handle penalties (special case)
    else if (result === 'Penalty') {
      // Typically penalties don't change down number, so we'll leave as is
      // But we won't update the distance or field position here
      // since penalty yards would be handled separately
      // For simplicity, we'll just keep existing values
    }
    // Regular play progression
    else {
      // Check if first down was achieved
      if (yardsGainedValue >= distanceValue) {
        // First down achieved
        newDown = 1;
        newDistance = 10;
      } else {
        // First down not achieved
        newDown = downValue + 1;
        newDistance = distanceValue - yardsGainedValue;
        
        // Check if we've reached 4th down and failed to convert
        if (newDown > 4) {
          // Turnover on downs
          newDown = 1;
          newDistance = 10;
          // Add 1 to drive number for change of possession
          newDriveNum = (parseInt(driveNum) + 1).toString();
        }
      }
    }
    
    // Handle special case for field position after touchdown
    let newAtPosition = newAt;
    if (result.includes('TD')) {
      newAtPosition = -25; // Own 25 yard line after kickoff/touchback
    }
    
    // Increment film number
    const newFilmNumber = (parseInt(filmNumber) + 1).toString();
    
    // Update the state
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