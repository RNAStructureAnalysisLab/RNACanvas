/**
 * Copyright (c) 2025 RNA3DS Lab CSUMB.
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
    scale?: number,
}

/**
 * ________________________________________________________________________________________________
*/
export interface CustomEventProps<T extends Events.Event = Events.Event> {
    eventType: Events.EventType,
    callback: (event: T) => void;
}

/**
 * ________________________________________________________________________________________________
 */
type AnyEventProps =
    | CustomEventProps<Events.Event> 
    | CustomEventProps<Events.KeyboardEvent> 
    | CustomEventProps<Events.PinchEvent> 
    | CustomEventProps<Events.PointerEvent> 
    | CustomEventProps<Events.SelectionEvent>
;

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
    motifProps: MotifProps[],
    customEventProps?: AnyEventProps[],
}
/**
 * ________________________________________________________________________________________________
 */
