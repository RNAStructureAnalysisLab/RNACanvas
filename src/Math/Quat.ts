import { Nullable, Quaternion } from '@babylonjs/core';
import { Matrix4 } from './Matrix4';
import { Vec3 } from './Vec3';

export class Quat {
  private _quaternion: Quaternion;

  constructor() {
    this._quaternion = new Quaternion();
  }

  rotateByQuaternion(quaternion: Quat) {
    quaternion.quaternion.multiplyToRef(this._quaternion, this._quaternion);
  }

  setToQuaternion(quaternion: Nullable<Quaternion>) {
    if (quaternion === null) {
      throw new Error('Cannot set to null quaternion');
    }
    this._quaternion = quaternion;
  }

  setFromMatrix(matrix: Matrix4): this {
    this._quaternion = Quaternion.FromRotationMatrix(matrix.matrix);
    return this;
  }

  setFromEuler(eulerAngle: Vec3): this {
    this._quaternion = Quaternion.FromEulerAngles(eulerAngle.x, eulerAngle.y, eulerAngle.z);
    return this;
  }

  get quaternion(): Quaternion {
    return this._quaternion;
  }
}
