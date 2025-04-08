/**
 * Copyright (c) 2024 RNA3DS Lab CSUMB.
 * All code written for RNA3DS Lab is protected under the terms of the NDA.
 * No code shall be distributed or modified without the permission of the PI.
 * @author Sameer Dingore <sdingore@csumb.edu>
 * @author Shahidul Islam <sislam@csumb.edu>
 */

import { rotateAllPoints } from './RotateAtoms';
import { Motif } from '@/src/3D';
import { Vec3 } from '@/src/Math';

/**
 * Calculates the RMSD between two arrays of vector points
 * @param coordinates1 An array of Vector3 coordinates
 * @param coordinates2 An array of Vector3 coordinates
 * @returns The RMSD score of the two coordinate arrays
 */
export function getRMSD(coordinates1: Vec3[], coordinates2: Vec3[]): number;

/**
 * Calculates the RMSD score between the two motifs
 * @param motif1 A Motif object
 * @param motif2 A Motif object
 * @returns The RMSD score of the motifs
 */
export function getRMSD(motif1: Motif, motif2: Motif): number;

export function getRMSD(a: any, b: any): number {
    let newCoords1: Vec3[];
    let newCoords2: Vec3[];
    if (!(Array.isArray(a) || Array.isArray(b))) {
      if (a instanceof Motif && b instanceof Motif) {
        newCoords1 = rotateAllPoints(a.userData.atomInfo, a.quat);
        newCoords2 = rotateAllPoints(b.userData.atomInfo, b.quat);
      } else {
        return -1;
      }
    } else if (a.every((item: any) => item instanceof Vec3)) {
      newCoords1 = a;
      newCoords2 = b;
    } else {
      return -1;
    }
    // Calculate squared distances
    const squaredDistances = newCoords1.reduce((sum, coord1, index) => {
      const coord2 = newCoords2[index];
      const distanceSquared =
        (coord1.x - coord2.x) ** 2 + (coord1.y - coord2.y) ** 2 + (coord1.z - coord2.z) ** 2;

      return sum + distanceSquared;
    }, 0);

    // Calculate mean squared distance
    const minLength = newCoords1.length;
    const meanSquaredDistance = squaredDistances / minLength;

    // Calculate RMSD
    return Math.sqrt(meanSquaredDistance);
}

//Temporory solution must be replaced with alignment or userdefined nucleotide input
export function calculateRMSDSlide(coordinates1: Vec3[],
  coordinates2: Vec3[]): number {
    try {
      // Find the smallest size of coordinates
      const minLength = Math.min(coordinates1.length, coordinates2.length);
      const smallObj = minLength === coordinates1.length ? coordinates1 : coordinates2;
      const largeObj = minLength === coordinates1.length ? coordinates2 : coordinates1;
      const iterations = largeObj.length - smallObj.length + 1;

      const trimmedCoordinates1 = smallObj.slice(0, minLength);
      let minRMSD = 1000.00;

      for (let startPosition = 0; startPosition < iterations; startPosition += 1) {
        // Take only the first `minLength` coordinates
        const trimmedCoordinates2 = largeObj.slice(startPosition, startPosition + minLength);
        const rmsd = getRMSD(trimmedCoordinates1, trimmedCoordinates2);

        if (rmsd < minRMSD) {
          minRMSD = rmsd;
        }
      }
      return minRMSD;
    } catch (error) {
      throw new Error('Error in RMSD calculation');
    }
}
