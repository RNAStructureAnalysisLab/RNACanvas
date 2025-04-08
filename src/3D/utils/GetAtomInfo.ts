/* eslint-disable no-restricted-syntax */
/**
 * Copyright (c) 2024 RNA3DS Lab CSUMB.
 * All code written for RNA3DS Lab is protected under the terms of the NDA.
 * No code shall be distributed or modified without the permission of the PI.
 * @author Judah Silva <jusilva@csumb.edu>
 */

import { Motif } from '@/src/3D';
import { Vec3 } from '@/src/Math';

async function parseAtomCoords(fileName: string): Promise<Vec3[]> {
  const response = await fetch(`/${fileName}`);
  const jsonData = await response.json();

  const coordinates: Vec3[] = [];
  // parse the jsonData and pull out the atom positions
  for (const [key] of Object.entries(jsonData)) {
    const atomMap: { [key: string]: string[] } = jsonData[key][0];
    // for (const [atomKey] of Object.entries(atomMap)) {
    //   coordinates.push(parseFloat(atomMap[atomKey][0]),
    //   parseFloat(atomMap[atomKey][1]), parseFloat(atomMap[atomKey][2]));
    // }
    if (atomMap["\"C1'\""]) {
      coordinates.push(
        new Vec3(
          parseFloat(atomMap["\"C1'\""][0]),
          parseFloat(atomMap["\"C1'\""][1]),
          parseFloat(atomMap["\"C1'\""][2])
        )
      );
    }
  }

  return coordinates;
}

async function getAtomCoords(fileName: string): Promise<Vec3[]> {
  const coordinates = await parseAtomCoords(fileName);
  return coordinates;
}

export async function updateAllMotifs(motifMeshArray: Motif[]) {
  const fileNames: string[] = [];
  for (const motif of motifMeshArray) {
    fileNames.push(motif.userData.fileName);
  }
  const atomInfoLists = await Promise.all(fileNames.map(o => getAtomCoords(o)));
  for (let i = 0; i < motifMeshArray.length; i += 1) {
    // eslint-disable-next-line no-param-reassign
    motifMeshArray[i].userData.atomInfo = atomInfoLists[i];
  }
}
