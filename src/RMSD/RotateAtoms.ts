/**
 * Copyright (c) 2025 RNA3DS Lab CSUMB.
 * @author Judah Silva <jusilva@csumb.edu>
 */

import { Vec3, Quat } from '@/src/Math';

export function rotateAllPoints(atomCoords: Vec3[],
  quat: Quat): Vec3[] {
  const newCoordinates: Vec3[] = [];
  for (let i = 0; i < atomCoords.length; i += 1) {
    newCoordinates.push(atomCoords[i].clone());
    newCoordinates[i].applyQuaternion(quat);
  }

  return newCoordinates;
}
