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

  setToQuaternion(quaternion: Nullable<Quaternion>): this {
    if (quaternion === null) {
      throw new Error('Cannot set to null quaternion');
    }
    this.setFromValues(quaternion.w, quaternion.x, quaternion.y, quaternion.z);

    return this;
  }

  setFromMatrix(matrix: Matrix4): this {
    this._quaternion = Quaternion.FromRotationMatrix(matrix.matrix);
    return this;
  }

  setFromEuler(eulerAngle: Vec3): this {
    this._quaternion = Quaternion.FromEulerAngles(eulerAngle.x, eulerAngle.y, eulerAngle.z);
    return this;
  }

  setFromValues(w: number, x: number, y: number, z: number): this {
    this._quaternion.set(x, y, z, w);
    return this;
  }

  toArray(): number[] {
    const quatArr: number[] = [];
    this._quaternion.toArray(quatArr);

    return quatArr;
  }

  get quaternion(): Quaternion {
    return this._quaternion;
  }

  get w(): number {
    return this._quaternion.w;
  }

  get x(): number {
    return this._quaternion.x;
  }

  get y(): number {
    return this._quaternion.y;
  }

  get z(): number {
    return this._quaternion.z;
  }
}
