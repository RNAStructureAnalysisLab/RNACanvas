/**
 * Copyright (c) 2025 RNA3DS Lab CSUMB.
 * @author Judah Silva <jusilva@csumb.edu>
 */

import { Motif, MotifMesh } from '@/src/3D';
import { Vec3 } from '@/src/Math';

export async function parseAtomCoords(meshObject: MotifMesh): Promise<Vec3[]> {
  // const response = await fetch(`/${fileName}`);
  // const jsonData = await response.json();

  const coordinates: Vec3[] = [];
  // parse the jsonData and pull out the atom positions
  for (const [key] of Object.entries(meshObject)) {
    const atomMap: { [key: string]: string[] } = meshObject[key][0];
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

// async function getAtomCoords(fileName: string): Promise<Vec3[]> {
//   const coordinates = await parseAtomCoords(fileName);
//   return coordinates;
// }

// export async function updateAllMotifs(motifMeshArray: Motif[]) {
//   const fileNames: string[] = [];
//   for (const motif of motifMeshArray) {
//     fileNames.push(motif.userData.fileName);
//   }
//   const atomInfoLists = await Promise.all(fileNames.map(o => getAtomCoords(o)));
//   for (let i = 0; i < motifMeshArray.length; i += 1) {
//     // eslint-disable-next-line no-param-reassign
//     motifMeshArray[i].userData.atomInfo = atomInfoLists[i];
//   }
// }
