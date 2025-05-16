/**
 * Copyright (c) 2025 RNA3DS Lab CSUMB.
 * @author Judah Silva <silva.judah7@outlook.com>
 */

import { NullEngine, Quaternion, Scene, Space, Vector3 } from '@babylonjs/core';
import { Group } from './Group';
import type { Residue } from './Residue';
import { Quat, Vec3 } from '@/src/Math';

interface userData {
  atomInfo: Vec3[];
  fileName: string;
}

/**
 * A MotifObject is a collection of residue meshes in one object.
 * It is a wrapper class around the Babylon TransformNode.
 */
export class Motif extends Group<Residue> {
  public userData: userData;

  constructor(name: string) {
    const tempEngine = new NullEngine();
    const tempScene = new Scene(tempEngine);

    super(name, tempScene);
    this.userData = {
      atomInfo: [],
      fileName: '',
    };
  }

  addChild(child: Residue) {
    if (this._children.has(child)) {
      return;
    }

    child.setParent(this);
    this._children.add(child);
  }

  setPosition(x: number, y: number, z: number) {
    this._node.setAbsolutePosition(new Vector3(x, y, z));
  }

  translate(x: number, y: number, z: number) {
    const newX = this.position.x + x;
    const newY = this.position.y + y;
    const newZ = this.position.z + z;
    this.setPosition(newX, newY, newZ);
  }

  rotate(axis: Vec3, angle: number) {
    // Option 1: Create a custom quaternion, and set it to the motif's rotation
    // Option 2: Create a custom quaternion, and multiply it with the motif's rotation quaternion (worried about local rotation)
    this._node.rotate(new Vector3(
      axis.x,
      axis.y,
      axis.z
    ), angle, Space.WORLD);
  }

  rotateByQuaternion(quat: Quat) {
    if (this._node.rotationQuaternion === null) {
      this._node.rotationQuaternion = this._node.rotation.toQuaternion();
    }
    quat.quaternion.multiplyToRef(this._node.rotationQuaternion!, this._node.rotationQuaternion!);
  }

  setQuaternion(quat: Quat) {
    if (this._node.rotationQuaternion === null) {
      this._node.rotationQuaternion = this._node.rotation.toQuaternion();
    }
    this._node.rotationQuaternion.set(quat.x, quat.y, quat.z, quat.w);
  }

  multiplyScalar(scalar: number) {
    this._node.scaling = new Vector3(
      this._node.scaling.x * scalar,
      this._node.scaling.y * scalar,
      this._node.scaling.z * scalar
    );
  }

  setScale(scale: number) {
    this._node.scaling = new Vector3(
      scale,
      scale,
      scale
    );
  }

  get uuid(): string {
    return this._node.uniqueId.toString();
  }

  get quat(): Quat {
    if (this._node.rotationQuaternion === null) {
      this._node.rotationQuaternion = this._node.rotation.toQuaternion();
    }
    return new Quat().setToQuaternion(this._node.rotationQuaternion);
  }

  get scale(): number {
    return this._node.scaling.x;
  }

  get position(): Vec3 {
    return new Vec3(
      this._node.absolutePosition.x,
      this._node.absolutePosition.y,
      this._node.absolutePosition.z
    );
  }
}
