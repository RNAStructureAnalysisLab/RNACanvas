import { Matrix } from '@babylonjs/core';

export class Matrix4 {
  private _matrix: Matrix;

  constructor() {
    this._matrix = Matrix.Identity();
  }

  fromArray(array: number[]): this {
    let matArray = array;
    if (array.length === 9) {
      matArray = [
        array[0], array[1], array[2], 0,
        array[3], array[4], array[5], 0,
        array[6], array[7], array[8], 1,
      ];
    }
    this._matrix = Matrix.FromArray(matArray);
    return this;
  }

  get matrix(): Matrix {
    return this._matrix;
  }
}
