/**
 * Copyright (c) 2024 RNA3DS Lab CSUMB.
 * All code written for RNA3DS Lab is protected under the terms of the NDA.
 * No code shall be distributed or modified without the permission of the PI.
 * @author Judah Silva <silva.judah7@outlook.com>
 */

import { AbstractMesh, KeyboardEventTypes, KeyboardInfo, Observable, Observer, PointerEventTypes, PointerInfo, Scene, TransformNode } from '@babylonjs/core';
import { Events } from './EventTypes';
import type { Motif, RenderScene, Residue } from '@/src/3D';
import { Vec3 } from '@/src/Math';

/**
 * Class to handle event registration, notification, and removal.
 * Limited to managing events for one scene.
 */
export class EventManager {
  // Custom observables for each event type
  private _eventObservables: Map<string, Observable<Events.Event>> = new Map();

  // Babylon.js observer references for cleanup
  private _pointerObserver: Observer<PointerInfo> | null = null;
  private _keyboardObserver: Observer<KeyboardInfo> | null = null;
  private _renderObserver: Observer<Scene> | null = null;

  private _activeKeys: Set<string> = new Set();

  // Event state variables
  private _pendingDeselect: boolean = false;
  // private _listeningForEvents: boolean = true;

  constructor() {
    this._initializeObservables();
  }

  /**
   * Dispose of the event listeners and triggers
   */
  dispose() {
    // Clear all observables
    this._eventObservables.forEach(observable => observable.clear());
    this._eventObservables.clear();

    // Remove Babylon observers
    this._pointerObserver?.remove();
    this._pointerObserver = null;
    this._keyboardObserver?.remove();
    this._keyboardObserver = null;
    this._renderObserver?.remove();
    this._renderObserver = null;
  }

  /**
   * Register an event of a certain type
   * @param eventType String event type. Can be custom or standard.
   * @param callback Callback function to run when the event is triggered
   * @returns Babylon Observer instance for later removal
   */
  on<T extends Events.Event>(eventType: Events.EventType | string,
    callback: (event: T) => void): Observer<Events.Event> {
    // Create an observable for custom event types if it doesn't exist
    if (!this._eventObservables.has(eventType)) {
      this._eventObservables.set(eventType, new Observable<Events.Event>());
    }

    // Add the observer and return it so the user can remove it later
    return this._eventObservables.get(eventType)!.add(callback as (event: Events.Event) => void);
  }

  /**
   * Remove a registered event observer
   * @param observer Babylon Observer with the registered callback
   */
  off(observer: Observer<Events.Event>): void {
    observer.remove();
  }

  /**
   * Emit a custom event, triggering listeners registered with that event type.
   * @param eventType A string event type. Can be custom or standard.
   * @param eventData Event info object partial.
   */
  emit(eventType: string, eventData: Partial<Events.Event>): void {
    const event: Events.Event = {
      type: eventType,
      canceled: false,
      timestamp: performance.now(),
      ...eventData,
    };

    try {
      this.notifyObservers(eventType, event);
    } catch (err) {
      throw new Error(`Error emitting event ${eventType}:`);
    }
  }

  /**
   * Method to notify listeners of a type of event
   * @param eventType A string event type. Can be custom or standard.
   * @param event Event info object
   */
  notifyObservers(eventType: string, event: Events.Event): void {
    if (this._eventObservables.has(eventType)) {
      this._eventObservables.get(eventType)!.notifyObservers(event);
    }
  }

  /**
   * Method to set up pointer and keyboard events on the scene.
   * Comes preset with POINTER_DOWN, POINTER_UP, POINTER_MOVE, KEYBOARD_DOWN, and KEYBOARD_UP event triggering.
   * @param scene A RenderScene object
   */
  setupEventHandling(scene: RenderScene) {
    if (scene.isRunning) {
      throw new Error('Cannot setup event handling on running scene.\n');
    }

    const babylonScene: Scene = scene.scene;

    // Add pointer event handling
    this._pointerObserver = babylonScene.onPointerObservable.add((pointerInfo: PointerInfo) => {
      const event = pointerInfo.event as PointerEvent;

      // Create PointerEvent for passing into the notifyObservers function
      const pointerEvent: Events.PointerEvent = {
        type: Events.EventType.POINTER_DOWN, // will be overwritten below
        position: { x: event.clientX, y: event.clientY },
        button: event.button,
        buttons: event.buttons,
        ctrlKey: event.ctrlKey,
        altKey: event.altKey,
        shiftKey: event.shiftKey,
        metaKey: event.metaKey,
        originalEvent: event,
        canceled: false,
        timestamp: performance.now(),
      };

      // If a mesh was clicked, get the motif node object (grandparent of the mesh) and picked mesh
      let motifNode: TransformNode | null = null;
      let pickedMesh: AbstractMesh | null = null;
      if (pointerInfo.pickInfo?.hit && pointerInfo.pickInfo?.pickedMesh) {
        pickedMesh = pointerInfo.pickInfo.pickedMesh;
        motifNode = pointerInfo.pickInfo.pickedMesh.parent?.parent as TransformNode;
      }

      // If the motif node exists, get the Motif object and Residue from scene children
      let motifObj: Motif | null = null;
      let residue: Residue | null = null;
      if (motifNode && pickedMesh) {
        motifObj = scene.children.get(motifNode.uniqueId.toString())!;
        residue = this._getResidueFromMotifNode(
          motifNode,
          pickedMesh?.uniqueId.toString(),
          scene.children
        );
      }

      // If an object was picked, put it into the Event object
      if (motifNode && residue) {
        pointerEvent.pickedResidue = residue;
      }

      switch (pointerInfo.type) {
        case PointerEventTypes.POINTERDOWN: // For selecting motifs or residues
          pointerEvent.type = Events.EventType.POINTER_DOWN;
          this.notifyObservers(Events.EventType.POINTER_DOWN, pointerEvent); // Notify basic click listeners

          if (motifObj && residue) { // Send a selection event trigger as well
            const selectionEvent: Events.SelectionEvent = {
              type: Events.EventType.OBJECT_SELECTED,
              residue,
              motif: motifObj,
              multiSelect: event.ctrlKey,
              canceled: false,
              timestamp: performance.now(),
            };

            this.notifyObservers(Events.EventType.OBJECT_SELECTED, selectionEvent);
            // this._listeningForEvents = true;
          } else { // If click away, get ready to possibly deselect all motifs
            this._pendingDeselect = true;
          }
          break;

        case PointerEventTypes.POINTERUP: // For deselecting motifs
          pointerEvent.type = Events.EventType.POINTER_UP;
          this.notifyObservers(Events.EventType.POINTER_UP, pointerEvent);
          if (this._pendingDeselect) {
            const deselectionEvent: Events.SelectionEvent = {
              type: Events.EventType.OBJECT_DESELECTED,
              canceled: false,
              timestamp: performance.now(),
            };

            this.notifyObservers(Events.EventType.OBJECT_DESELECTED, deselectionEvent);
            // this._listeningForEvents = false;
            this._pendingDeselect = false;
          }
          break;

        case PointerEventTypes.POINTERMOVE: // For rotating/translating selected motifs
          // if (!this._listeningForEvents) { // If no motifs are selected, don't check for move
          //   break;
          // }

          pointerEvent.type = Events.EventType.POINTER_MOVE;
          pointerEvent.deltaX = event.movementX;
          pointerEvent.deltaY = event.movementY;
          this.notifyObservers(Events.EventType.POINTER_MOVE, pointerEvent);
          this._pendingDeselect = false;
          break;

        case PointerEventTypes.POINTERWHEEL: // For scaling the selected motifs
          pointerEvent.type = Events.EventType.POINTER_WHEEL;
          this.notifyObservers(Events.EventType.POINTER_WHEEL, pointerEvent);
          break;
      }
    });

    // Add keyboard event handling
    this._keyboardObserver = babylonScene.onKeyboardObservable.add((keyboardInfo: KeyboardInfo) => {
      const event = keyboardInfo.event as KeyboardEvent;

      // Create KeyboardEvent for passing into notifyObservers function
      const keyboardEvent: Events.KeyboardEvent = {
        type: keyboardInfo.type === KeyboardEventTypes.KEYDOWN
        ? Events.EventType.KEY_DOWN
        : Events.EventType.KEY_UP,
        key: event.key,
        code: event.code,
        ctrlKey: event.ctrlKey,
        altKey: event.altKey,
        shiftKey: event.shiftKey,
        metaKey: event.metaKey,
        repeat: event.repeat,
        rotationAxis: new Vec3(0, 0, 0),
        translationDirection: new Vec3(0, 0, 0),
        originalEvent: event,
        canceled: false,
        timestamp: performance.now(),
      };

      if (keyboardInfo.type === KeyboardEventTypes.KEYDOWN) {
        this._activeKeys.add(event.key);
      } else if (keyboardInfo.type === KeyboardEventTypes.KEYUP) {
        this._activeKeys.delete(event.key);
      }

      // Set up rotationDirection for convenience
      if (this._activeKeys.has('w')) keyboardEvent.rotationAxis.add(new Vec3(-1, 0, 0));
      if (this._activeKeys.has('a')) keyboardEvent.rotationAxis.add(new Vec3(0, 1, 0));
      if (this._activeKeys.has('s')) keyboardEvent.rotationAxis.add(new Vec3(1, 0, 0));
      if (this._activeKeys.has('d')) keyboardEvent.rotationAxis.add(new Vec3(0, -1, 0));
      if (this._activeKeys.has('q')) keyboardEvent.rotationAxis.add(new Vec3(0, 0, -1));
      if (this._activeKeys.has('e')) keyboardEvent.rotationAxis.add(new Vec3(0, 0, 1));

      // Set up translationDirection for convenience
      if (this._activeKeys.has('W')) keyboardEvent.translationDirection.add(new Vec3(0, 1, 0));
      if (this._activeKeys.has('A')) keyboardEvent.translationDirection.add(new Vec3(1, 0, 0));
      if (this._activeKeys.has('S')) keyboardEvent.translationDirection.add(new Vec3(0, -1, 0));
      if (this._activeKeys.has('D')) keyboardEvent.translationDirection.add(new Vec3(-1, 0, 0));

      // Track active keys and notify observers
      if (keyboardInfo.type === KeyboardEventTypes.KEYDOWN) {
        this.notifyObservers(Events.EventType.KEY_DOWN, keyboardEvent);
      } else if (keyboardInfo.type === KeyboardEventTypes.KEYUP) {
        this.notifyObservers(Events.EventType.KEY_UP, keyboardEvent);
      }
    });
  }

  /**
   * Initialize observables for all standard event types
   */
  private _initializeObservables(): void {
    // Create an observable for each standard event type
    Object.values(Events.EventType).forEach(eventType => {
      this._eventObservables.set(eventType, new Observable<Events.Event>());
    });
  }

  /**
   * Helper function to get the residue that contains a picked mesh using the transform node of a motif
   * @param node {TransformNode} Motif's TransformNode
   * @param meshUUID Stringified uniqueId of the picked mesh
   * @param sceneChildren Map of Motifs that exist in the scene
   * @returns The Residue that contains the picked mesh, or null if it does not exist
   */
  private _getResidueFromMotifNode(
    node: TransformNode,
    meshUUID: string,
    sceneChildren: Map<string, Motif>
  ): Residue | null {
    const motifUUID: string = node.uniqueId.toString();
    if (!sceneChildren.has(motifUUID)) {
      return null;
    }

    const motif: Motif = sceneChildren.get(motifUUID)!;
    let residue: Residue | null = null;
    motif.children.forEach((child: Residue) => { // Check each residue child to see if any have the clicked mesh
      if (child.hasMesh(meshUUID)) residue = child;
    });

    return residue;
  }
}
