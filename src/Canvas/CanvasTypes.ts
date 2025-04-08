/**
 * Copyright (c) 2024 RNA3DS Lab CSUMB.
 * All code written for RNA3DS Lab is protected under the terms of the NDA.
 * No code shall be distributed or modified without the permission of the PI.
 * @author Sameer Dingore <sdingore@csumb.edu>
 */

import type { Motif } from '@/src/3D';
import type { Events } from '@/src/Events';
import type { Quat, Vec3 } from '@/src/Math';

/**
 * ________________________________________________________________________________________________
 */
export interface MotifProps {
    motif: Motif,
    locked: boolean,
    position?: Vec3,
    rotation?: Quat,
}

/**
 * ________________________________________________________________________________________________
 */
export interface CustomEventProps {
    event: Events.Event,
    eventType: Events.EventType,
    callback: (event: Events.Event) => void;
}

/**
 * ________________________________________________________________________________________________
 */
export interface CanvasProps {
    title?: string,
    rendererWidth?: number,
    rendererHeight?: number,
    rendererBackgroundColor?: string,
    rendererSizeIsWindow?: boolean,
    cameraPositionZ?: number,
    // Grid view
    // Custom motif props (e.g. position, rotation, lock, etc.)
    motifProps: MotifProps[],
    // Custom events
    customEventProps?: CustomEventProps[],
}
/**
 * ________________________________________________________________________________________________
 */
