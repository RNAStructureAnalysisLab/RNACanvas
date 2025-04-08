/**
 * Copyright (c) 2024 RNA3DS Lab CSUMB.
 * All code written for RNA3DS Lab is protected under the terms of the NDA.
 * No code shall be distributed or modified without the permission of the PI.
 * @author Judah Silva <jusilva@csumb.edu>
 */

import { rotateAllPoints } from './RotateAtoms';
import { calculateRMSDSlide } from './RMSDSlidingWindow';
import { Motif } from '@/src/3D';
import { ScoreInfo } from '@/src/Canvas';
import { Vec3 } from '@/src/Math';

export function calculateRMSD(selectedMotifMeshArray: Motif[],
  motifMeshArray: Motif[]) {
  // Rotated all motifs according to their quaterions, and then map the id to an index for later use
  const idToIdx: { [key: string]: number } = {};
  const rotatedCoordinates: Vec3[][] = [];
  for (let i = 0; i < motifMeshArray.length; i += 1) {
    rotatedCoordinates.push(rotateAllPoints(motifMeshArray[i].userData.atomInfo,
      motifMeshArray[i].quat));
    idToIdx[motifMeshArray[i].uuid] = i;
  }

  // Loop through the selected motifs and calculate rmsd between it and all other motifs
  const scores: ScoreInfo[][] = [];
  for (let i = 0; i < selectedMotifMeshArray.length; i += 1) {
    const currScores = [];
    for (let j = 0; j < motifMeshArray.length; j += 1) {
      if (selectedMotifMeshArray[i].uuid !== motifMeshArray[j].uuid) {
        const score = calculateRMSDSlide(
          rotatedCoordinates[idToIdx[selectedMotifMeshArray[i].uuid]],
          rotatedCoordinates[idToIdx[motifMeshArray[j].uuid]]
        );
        currScores.push({
          score,
          selId: selectedMotifMeshArray[i].uuid,
          refId: motifMeshArray[j].uuid,
        });
      }
    }
    if (currScores.length !== 0) {
      scores.push(currScores);
    }
  }

  return scores;
}
