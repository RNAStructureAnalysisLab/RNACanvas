/**
 * Copyright (c) 2025 RNA3DS Lab CSUMB.
 * @author Judah Silva <silva.judah7@outlook.com>
 */

import { Scene, TransformNode } from '@babylonjs/core';
import type { MeshObject } from './MeshObject';

export abstract class Group<T extends MeshObject | Group<MeshObject>> {
  protected _node: TransformNode;
  protected _children: Set<T>;

  constructor(name: string, scene: Scene) {
    this._node = new TransformNode(name, scene);
    this._children = new Set<T>();
    this._node.rotationQuaternion = this._node.rotation.toQuaternion();
  }

  setParent(parent: Group<Group<MeshObject>> | null) {
    this._node.parent = parent ? parent.node : null;
  }

  removeChild(child: T) {
    if (!this._children.has(child)) {
      return;
    }

    this._children.delete(child);
    child.setParent(null);
  }

  get node(): TransformNode {
    return this._node;
  }

  get children(): Set<T> {
    return this._children;
  }
}
