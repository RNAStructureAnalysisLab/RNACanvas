/**
 * Copyright (c) 2025 RNA3DS Lab CSUMB.
 * @author Judah Silva
 */
/**
 * ________________________________________________________________________________________________
 */
/**
 * Get the vertices and indices from the nucleotide data
 * @param nucleotideData {number[][]}
 * @returns Object of { vertices: number[][], indices: number[][] }
 */
export function getPoints(
    nucleotideData: number[][]
): { vertices: number[][], indices: number[][] } {
    const vertices: number[][] = [];
    const indices: number[][] = [];

    for (let i = 1; i < nucleotideData.length; i += 2) {
        vertices.push(nucleotideData[i]);
        indices.push(nucleotideData[i + 1]);
    }

    return { vertices, indices };
}

/**
 * ________________________________________________________________________________________________
 */
