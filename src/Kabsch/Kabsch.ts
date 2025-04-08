/**
 * Copyright (c) 2024 RNA3DS Lab CSUMB.
 * All code written for RNA3DS Lab is protected under the terms of the NDA.
 * No code shall be distributed or modified without the permission of the PI.
 * @author Sameer Dingore <sdingore@csumb.edu>
 * @author Judah Silva <jusilva@csumb.edu>
 */

import numeric from 'numeric';
import { rotateAllPoints, getRMSD } from '@/src/RMSD';
import { Motif } from '@/src/3D';
import { Quat, Vec3, Matrix4 } from '@/src/Math';

type Matrix = number[][];

function dot(matrix1: Matrix, matrix2: Matrix): Matrix {
  const result: Matrix = [];
  for (let i = 0; i < matrix1.length; i += 1) {
    result[i] = [];
    for (let j = 0; j < 3; j += 1) {
      result[i][j] = 0;
      for (let k = 0; k < matrix1[0].length; k += 1) {
        result[i][j] +=
          matrix1[i][k] * matrix2[k][j];
      }
    }
  }

  return result;
}

/**
 * @param coordinates1 N x 3 array of coordinates for first object
 * @param coordinates2 N x 3 array of coordinates for second object
 */

function calculateKabsch(coordinates1: Vec3[],
  coordinates2: Vec3[]): number[][] {
    try {
      //convert coordinates2 to number[][]
      const convertedCoordinates1: Matrix = [];
      for (let i = 0; i < coordinates1.length; i += 1) {
          convertedCoordinates1.push([coordinates1[i].x, coordinates1[i].y, coordinates1[i].z]);
      }

      // convert coordinates2 to number[][]
      const convertedCoordinates2: Matrix = [];
      for (let i = 0; i < coordinates2.length; i += 1) {
          convertedCoordinates2.push([coordinates2[i].x, coordinates2[i].y, coordinates2[i].z]);
      }

      // compute covariance matrix
      // 3 x N matrix times N x 3 matrix
      const covarianceMatrix: Matrix =
        dot(numeric.transpose(convertedCoordinates1), convertedCoordinates2);

      const { U, V } = numeric.svd(covarianceMatrix);

      // const fix: Matrix = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
      // fix[2][2] = numeric.det(V) * numeric.det(U) < 0 ? -1 : 1;

      // const rotationMatrix: Matrix = dot(U, dot(fix, numeric.transpose(V)));
      let rotationMatrix: Matrix = numeric.dot(V, numeric.transpose(U)) as Matrix;

      // const fix = [1, 1, 1];
      if (numeric.det(rotationMatrix) < 0) {
        V[2] = V[2].map((val: number) => -val);
        rotationMatrix = dot(V, numeric.transpose(U));
      }

      // console.log(rotationMatrix);
      return rotationMatrix;
    } catch (error) {
      // console.log(error);
      throw new Error('error');
    }
}

function getKabschCoords(coordinates2: Vec3[], mat: number[][]) {
  const flatMatrix = mat.flat();
  // console.log('flatMatrix: ', flatMatrix);
  const newMat4 = new Matrix4().fromArray(flatMatrix);
  // Problem could be here
  const quat = new Quat().setFromMatrix(newMat4);
  // console.log('rotationMatrix: ', newMat4);

  return rotateAllPoints(coordinates2, quat);
}

function updateCoords(motif1: Motif, motif2: Motif) {
  const rotatedCoords: Vec3[][] = [];
  rotatedCoords.push(rotateAllPoints(motif1.userData.atomInfo, motif1.quat));
  rotatedCoords.push(rotateAllPoints(motif2.userData.atomInfo, motif2.quat));

  // rotatedCoords.push(motif1.userData.atomInfo.slice());
  // rotatedCoords.push(motif2.userData.atomInfo.slice());

  return rotatedCoords;
}

// maybe change which coordinates the rotation is applied on?
// https://onlinelibrary.wiley.com/doi/10.1002/jcc.20110  <- read this

/**
 * @param motif1 The motif to rotate to
 * @param motif2 The motif that will be rotated
 * @returns An object with the best rotation matrix and best rmsd
 */
export function kabschSlidingWindow(motif1: Motif, motif2: Motif):
 { matrix: number[][], rmsd: number } {
  try {
    // rotate the atomInfo for both motifs
    const rotatedCoords = updateCoords(motif1, motif2);
    const coordinates1 = rotatedCoords[0].slice();
    const coordinates2 = rotatedCoords[1].slice();

    // Find the smallest size of coordinates
    const minLength = Math.min(coordinates1.length, coordinates2.length);
    const smallObj = minLength === coordinates1.length ? coordinates1 : coordinates2;
    const largeObj = minLength === coordinates1.length ? coordinates2 : coordinates1;
    const iterations = largeObj.length - smallObj.length + 1;

    const trimmedCoordinates1 = smallObj.slice(0, minLength);
    let minRMSD = 1000.00;
    let bestRotation: number[][] = [];
    // console.log('smallObj: ', trimmedCoordinates1);

    for (let startPosition = 0; startPosition < iterations; startPosition += 1) {
      // Take only the first `minLength` coordinates
      const trimmedCoordinates2 = largeObj.slice(startPosition, startPosition + minLength);

      const optimalRotation = calculateKabsch(trimmedCoordinates1, trimmedCoordinates2);
      const kabschPoints = getKabschCoords(trimmedCoordinates2, optimalRotation);
      const rmsd = getRMSD(trimmedCoordinates1, kabschPoints);

      // console.log(trimmedCoordinates1, kabschPoints);
      // console.log(startPosition);

      // console.log(rmsd);
      if (rmsd < minRMSD) {
        minRMSD = rmsd;
        bestRotation = optimalRotation;
      }
    }
    // console.log('kabsch RMSD: ', minRMSD.toFixed(4));
    return { matrix: bestRotation, rmsd: minRMSD };
  } catch (error) {
    throw new Error(`Error in Kabsch calculation between motifs ${motif1.uuid} and ${motif2.uuid}.`);
  }
}

export function calculateAllKabschRMSD(motifMeshArray: Motif[]): number[][] {
  const res: number[][] = [];
  for (let i = 0; i < motifMeshArray.length; i += 1) {
    res.push([]);
    for (let j = 0; j < motifMeshArray.length; j += 1) {
      res[i].push(0);
    }
  }

  for (let i = 0; i < motifMeshArray.length - 1; i += 1) {
    for (let j = i + 1; j < motifMeshArray.length; j += 1) {
      const { rmsd } = kabschSlidingWindow(motifMeshArray[i], motifMeshArray[j]);
      res[i][j] = rmsd;
      res[j][i] = rmsd;
    }
  }

  return res;
}
