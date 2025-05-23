/**
 * Copyright (c) 2025 RNA3DS Lab CSUMB.
 * @author Sameer Dingore <sdingore@csumb.edu>
 * @author Judah Silva
 */

import { getPoints } from './GetPoints';
import { MeshObject, Motif, parseAtomCoords, Residue } from '@/src/3D';

export type MotifMesh = Record<string, any>;
/**
 * ________________________________________________________________________________________________
 */
/**
 *  reads the json file and returns the motif structure mesh as THREE.Group
 * @param motifJSONFileName
 * json file name with coordinates of the motif
 * @param motifColorHex
 * color of the motif structure
 * @param highLightColorHex
 * color of the highlighted motif structure
 * @returns {Promise<Motif>}
 * @async
 */
export async function getMotif(
    motifName: string,
    motifMesh: MotifMesh,
    motifColorHex: string = '0xcc2900',
    // highLightColorHex: string = '0xff3300'
): Promise<Motif> {
    /**
     * Create a motif group and add the motif structure to it
     */
    const motif = new Motif(`${motifName}_motif`);
    // const motifJSONFileData = await fetch(`/${motifJSONFileName}`);
    // const jsonObject = await motifJSONFileData.json();
    // eslint-disable-next-line no-restricted-syntax
    for (const [key] of Object.entries(motifMesh)) {
        const { vertices, indices } = getPoints(motifMesh[key]);
        const residue = new Residue('residue');
        /**
         * ________________________________________________________________________________________
         */
        /**
         * Create a residue group and add the motif structure to it
         */
        const backboneMesh = new MeshObject(`backbone_${key}`);
        backboneMesh.applyVertexData(vertices[0], indices[0]);
        backboneMesh.createAndSetMaterial(motifColorHex);

        const ringMesh = new MeshObject(`ring_${key}`);
        ringMesh.applyVertexData(vertices[1], indices[1]);
        ringMesh.createAndSetMaterial(motifColorHex);

        residue.addChild(backboneMesh);
        residue.addChild(ringMesh);

        motif.addChild(residue);
    }

    motif.userData.fileName = motifName;
    motif.userData.atomInfo = await parseAtomCoords(motifMesh);
    return motif;
}

/**
 * ________________________________________________________________________________________________
 */
/**
 * Copyright (c) 2025 RNA3DS Lab CSUMB.

 * @author Sameer Dingore <sdingore@csumb.edu>
 * @author Judah Silva
 */
