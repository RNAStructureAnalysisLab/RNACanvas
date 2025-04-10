/**
 * Copyright (c) 2025 RNA3DS Lab CSUMB.
 * @author Judah Silva <silva.judah7@outlook.com>
 */

import { Color3, Mesh, StandardMaterial, VertexData } from '@babylonjs/core';
import type { Residue } from './Residue';

export class MeshObject {
  private _mesh: Mesh;
  public userData: Object;

  constructor(name: string) {
    this._mesh = new Mesh(name);
    this.userData = {};
  }

  setParent(parent: Residue | null) {
    if (parent === null) {
      this._mesh.parent = null;
      return;
    }
    this._mesh.parent = parent.node;
  }

  applyVertexData(positions: number[], indices: number[]) {
    const normals: number[] = [];
    VertexData.ComputeNormals(positions, indices, normals);

    const vertexData = new VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.normals = normals;
    vertexData.applyToMesh(this._mesh);
  }

  applyHighlight() {
    const mat = this._mesh.material as StandardMaterial;
    mat.emissiveColor = mat.diffuseColor.scale(0.75);
  }

  resetHighlight() {
    const mat = this._mesh.material as StandardMaterial;
    mat.emissiveColor = Color3.Black();
  }

  /**
   * Cretes a material with the given color and sets it to the mesh
   * @param color String in the format of #RRGGBB
   */
  createAndSetMaterial(color: string) {
    const mat = new StandardMaterial('mat');
    const color3 = Color3.FromHexString(`#${color.replace(/^0x/, '')}`);
    mat.diffuseColor = color3;
    mat.specularColor = color3;
    this._mesh.material = mat;
  }

  setNewMesh(mesh: Mesh): MeshObject {
    this._mesh = mesh;
    return this;
  }

  get mesh(): Mesh {
    return this._mesh;
  }

  get uuid(): string {
    return this._mesh.uniqueId.toString();
  }
}
