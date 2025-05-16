/**
 * Copyright (c) 2025 RNA3DS Lab CSUMB.
 * @author Judah Silva <silva.judah7@outlook.com>
 */

import { Camera, Color4, Engine, Geometry, HemisphericLight, Material, Mesh, Scene, TransformNode, UniversalCamera, Vector3 } from '@babylonjs/core';
import type { Motif } from './Motif';
import { Residue } from './Residue';
import { MeshObject } from './MeshObject';
import { Events, EventManager } from '@/src/Events';

export class RenderScene {
  private _canvas: HTMLCanvasElement;
  private _scene: Scene;
  private _engine: Engine;
  private _camera: UniversalCamera;

  // For access to motif objects in the scene
  private _children: Map<string, Motif> = new Map();

  // Event variables
  private _eventManager: EventManager;

  // State variables
  private _isDisposed: boolean = false;
  public isRunning: boolean = false;

  constructor(
    canvas: HTMLCanvasElement,
    hexColor: string,
    cameraPositionZ: number,
    renderWidth: number,
    renderHeight: number
  ) {
    this._canvas = canvas;
    this._engine = new Engine(this._canvas, true);
    this._engine.setSize(renderWidth, renderHeight);
    this._scene = new Scene(this._engine);
    this._scene.clearColor = Color4.FromHexString(`${hexColor.replace(/^0x/, '')}`);

    this._camera = new UniversalCamera('camera', new Vector3(0, 0, cameraPositionZ));
    this._camera.setTarget(new Vector3(0, 0, 0));
    this._camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
    this._camera.orthoTop = this._engine.getRenderHeight() / 2;
    this._camera.orthoBottom = this._engine.getRenderHeight() / -2;
    this._camera.orthoLeft = this._engine.getRenderWidth() / -2;
    this._camera.orthoRight = this._engine.getRenderWidth() / 2;
    this._camera.minZ = 10;
    // this._camera.attachControl(canvas, true);

    const light = new HemisphericLight('light', Vector3.Up(), this._scene);
    light.intensity = 1.25;

    this._eventManager = new EventManager();

    window.addEventListener('resize', this._handleResize.bind(this));
  }

  // Start the render loop
  start(): void {
    if (this._isDisposed) {
      throw new Error('Cannot start a disposed RenderScene.');
    }

    // Already running
    if (this.isRunning) {
      // console.log('Engine is already running');
      return;
    }

    this._eventManager.setupEventHandling(this);

    this._engine.runRenderLoop(() => {
      this._scene.render();
      this._eventManager.notifyObservers(Events.EventType.RENDER, {
        type: Events.EventType.RENDER,
        canceled: false,
        timestamp: performance.now(),
      });
    });

    this._eventManager.notifyObservers(Events.EventType.ENGINE_STARTED, {
      type: Events.EventType.ENGINE_STARTED,
      canceled: false,
      timestamp: performance.now(),
    });
    this.isRunning = true;
  }

  // Stop the render loop without disposing resources
  stop(): void {
    if (this.isRunning) {
      this._engine.stopRenderLoop();
      this._eventManager.notifyObservers(Events.EventType.ENGINE_STOPPED, {
        type: Events.EventType.ENGINE_STOPPED,
        canceled: false,
        timestamp: performance.now(),
      });
      this.isRunning = false;
    }
  }

  // Stop and dispose of all resources
  dispose(): void {
    this.stop();
    window.removeEventListener('resize', this._handleResize);

    // Dispose of event listeners and triggers
    this._eventManager.dispose();

    // Free resources for the scene and engine
    this._scene.dispose();
    this._engine.dispose();
    this.isRunning = false;
    this._isDisposed = true;
  }

  add(motif: Motif): void {
    if (this._children.has(motif.uuid)) {
      return;
    }

    this._reattachToScene(motif.node, motif);

    this._children.set(motif.uuid, motif);
    this._scene.addTransformNode(motif.node);
  }

  remove(motif: Motif): void {
    if (!this._children.has(motif.uuid)) {
      return;
    }

    this._children.delete(motif.uuid);
    this._scene.removeTransformNode(motif.node);
  }

  setBackgroundColor(hexColor: string): void {
    this._scene.clearColor = Color4.FromHexString(`${hexColor.replace(/^0x/, '')}`);
  }

  private _reattachToScene(node: TransformNode, currObj: Motif | Residue | MeshObject): void {
    // eslint-disable-next-line no-param-reassign
    node._scene = this._scene;

    if (node instanceof Mesh && currObj instanceof MeshObject) {
      const meshSerialized = node.serialize();
      const verticeData = node.geometry?.serializeVerticeData();
      const materialData = node.material?.serialize();

      const mesh = Mesh.Parse(meshSerialized, this._scene, '');
      const geo = Geometry.Parse(verticeData, this._scene, '');
      const mat = Material.Parse(materialData, this._scene, '');

      geo?.applyToMesh(mesh);
      mesh.material = mat;

      currObj.setNewMesh(mesh);

      node.dispose();
    }

    // If currObj is not a MeshObject, recurse over the children
    if (!(currObj instanceof MeshObject)) {
      currObj.children.forEach((childObj: Residue | MeshObject) => {
        if (childObj instanceof Residue) { // If the currObj is a Motif and the childObj is a Residue
          this._reattachToScene(childObj.node, childObj);
        } else if (currObj instanceof Residue) { // If the currObj is a Residue and the childObj is a MeshObject
          this._reattachToScene(childObj.mesh, childObj);
          childObj.setParent(currObj);
        }
      });
    }
  }

  private _handleResize = () => {
    this._engine.setSize(window.innerWidth, window.innerHeight);

    // console.log('resize');

    // const aspect = this._canvas.width / this._canvas.height;
    // const cameraSize = 10;

    this._camera.orthoTop = this._engine.getRenderHeight() / 2;
    this._camera.orthoBottom = this._engine.getRenderHeight() / -2;
    this._camera.orthoLeft = (this._engine.getRenderWidth()) / -2;
    this._camera.orthoRight = (this._engine.getRenderWidth()) / 2;

    // Notify observers of the resize event
    this._eventManager.notifyObservers(Events.EventType.RESIZE, {
      type: Events.EventType.RESIZE,
      canceled: false,
      timestamp: performance.now(),
    });
  };

  /**
 * Returns the Babylon.js Scene object.
 */
  get scene(): Scene {
    return this._scene;
  }

  /**
   * Returns the engine.
   */
  get engine(): Engine {
      return this._engine;
    }

  /**
   * Returns the camera.
   */
  get camera(): UniversalCamera {
    return this._camera;
  }

  /**
   * Returns the event manager
   */
  get eventManager(): EventManager {
    return this._eventManager;
  }

  /**
   * Returns the set of children.
   */
  get children(): Map<string, Motif> {
    return this._children;
  }

  /**
   * Returns the current render width
   */
  get renderWidth(): number {
    return this._engine.getRenderWidth();
  }

  /**
   * Returns the current render height
   */
  get renderHeight(): number {
    return this._engine.getRenderHeight();
  }
}
