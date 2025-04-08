import { Quaternion, Vector3 } from '@babylonjs/core';
import { Quat } from './Quat';

export class Vec3 {
  private _vector3: Vector3;

  public static Zero = new Vec3(0, 0, 0);

  constructor(x: number, y: number, z: number) {
    this._vector3 = new Vector3(x, y, z);
  }

  clone(): Vec3 {
    return new Vec3(this.x, this.y, this.z);
  }

  normalize() {
    this._vector3.normalize();
  }

  applyAxisAngle(axis: Vec3, angle: number): Vec3 {
    const rotationQuat = Quaternion.RotationAxis(axis._vector3, angle);
    this._vector3.rotateByQuaternionAroundPointToRef(rotationQuat, Vector3.Zero(), this._vector3);

    return this;
  }

  applyQuaternion(quat: Quat) {
    this._vector3.applyRotationQuaternionInPlace(quat.quaternion);
  }

  multiplyScalar(scalar: number) {
    this._vector3.scaleInPlace(scalar);
  }

  add(vec: Vec3) {
    this._vector3.addInPlace(vec._vector3);
  }

  length(): number {
    return this._vector3.length();
  }

  equals(other: Vec3): boolean {
    return this.x === other.x && this.y === other.y && this.z === other.z;
  }

  get x(): number {
    return this._vector3.x;
  }

  get y(): number {
    return this._vector3.y;
  }

  get z(): number {
    return this._vector3.z;
  }
}
