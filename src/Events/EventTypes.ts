/**
 * Copyright (c) 2024 RNA3DS Lab CSUMB.
 * All code written for RNA3DS Lab is protected under the terms of the NDA.
 * No code shall be distributed or modified without the permission of the PI.
 * @author Judah Silva <silva.judah7@outlook.com>
 */

import type { Motif, Residue } from '@/src/3D';
import type { Vec3 } from '@/src/Math';

export namespace Events {
  export enum EventType {
    // Pointer events
    POINTER_DOWN = 'pointerDown',
    POINTER_UP = 'pointerUp',
    POINTER_MOVE = 'pointerMove',
    POINTER_WHEEL = 'pointerWheel',

    // Keyboard events
    KEY_DOWN = 'keyDown',
    KEY_UP = 'keyUp',

    // Touch events
    TOUCH_START = 'touchStart',
    TOUCH_END = 'touchEnd',
    TOUCH_MOVE = 'touchMove',
    PINCH_START = 'pinchStart',
    PINCH = 'pinch',
    PINCH_END = 'pinchEnd',

    // Selection events (high-level abstractions)
    OBJECT_SELECTED = 'objectSelected',
    OBJECT_DESELECTED = 'objectDeselected',

    // Canvas events
    RESIZE = 'resize',

    // Engine events
    RENDER = 'render',
    ENGINE_STARTED = 'engineStarted',
    ENGINE_STOPPED = 'engineStopped'
  }

  // Base interface for all events
  export interface Event {
    type: EventType | string;
    originalEvent?: globalThis.Event;
    canceled: boolean;
    timestamp: number;
  }

  // Mouse, Touch, and Stylus events
  export interface PointerEvent extends Event {
    position: { x: number, y: number };
    button?: number;
    buttons?: number;
    ctrlKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
    metaKey?: boolean;
    deltaX?: number;
    deltaY?: number;
    pickedResidue?: Residue;
  }

  // Keyboard events
  export interface KeyboardEvent extends Event {
    key: string;
    code: string;
    ctrlKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
    metaKey: boolean;
    repeat: boolean;
    rotationAxis: Vec3;
    translationDirection: Vec3;
  }

  // Touch pinch gesture events
  export interface PinchEvent extends Event {
    scale: number;
    center: { x: number, y: number };
  }

  // Motif selection events
  export interface SelectionEvent extends Event {
    residue?: Residue;
    motif?: Motif;
    multiSelect?: boolean;
  }
}
