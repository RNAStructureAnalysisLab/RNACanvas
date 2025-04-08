/**
 * Copyright (c) 2024 RNA3DS Lab CSUMB.
 * All code written for RNA3DS Lab is protected under the terms of the NDA.
 * No code shall be distributed or modified without the permission of the PI.
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

  // Temporary function to find if Residue contains mesh with uuid
  hasMesh(uuid: string): boolean {
    let found: boolean = false;
    this._children.forEach((child: MeshObject) => {
      if (child.uuid === uuid) {
        found = true;
      }
    });

    return found;
  }
}
