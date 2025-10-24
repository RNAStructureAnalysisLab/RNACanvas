/**
 * Copyright (c) 2025 RNA3DS Lab CSUMB.
 * @author Judah Silva <silva.judah7@outlook.com>
 */

import { NullEngine, Scene } from '@babylonjs/core';
import { Group } from './Group';
import type { MeshObject } from './MeshObject';

export class Residue extends Group<MeshObject> {
  constructor(name: string) {
    const tempEngine = new NullEngine();
    const tempScene = new Scene(tempEngine);
    super(name, tempScene);
  }
  addChild(child: MeshObject) {
    if (this._children.has(child)) {
      return;
    }

    child.setParent(this);
    this._children.add(child);
  }

  /**
   * Checks if the residue has a mesh with the given uuid
   * @param uuid 
   */
  hasMesh(uuid: string): boolean {
    let found: boolean = false;
    this._children.forEach((child: MeshObject) => {
      if (child.uuid === uuid) {
        found = true;
      }
    });

    return found;
  }

  /**
   * Cretes a material with the given color and sets it to the mesh
   * @param color String in the format of #RRGGBB
   */
  colorResidue(color: string) {
    this._children.forEach((child: MeshObject) => {
      child.createAndSetMaterial(color);
    })
  }
}
