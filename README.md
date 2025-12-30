# 🧬 RNA Canvas

A reusable, modular 3D canvas component, built with **Babylon.js** and **React**. Designed for the interactive visualization of RNA models.

Disclaimer: This component only renders from a custom JSON format for 3D representation of RNA Molecules. Does not currently support standard 3D geometry file formats.

## 📦 Installation

```bash
npm install @judah-silva/rnacanvas
# or
yarn add @judah-silva/rnacanvas
```

## Canvas Description

The canvas is an importable **React** component, with an extensive Event Management system for interaction with 3D models.\
Made using **Babylon.js**, the canvas is designed with a stationary camera, where 3D Motif models are displayed to be rotated, translated, scaled, and compared with RMSD scoring.

RNACanvas supports interaction through the mouse, keyboard, and touch screen inputs.

## Canvas Usage


### Canvas Component

To use it in your project, import it from the package:
```typescript
import { Canvas } from '@judah-silva/rnacanvas'
```

Then, return an instance of the component like you would with any other **React** component:
```typescript
import { Canvas } from '@judah-silva/rnacanvas'

export default function Component() {
  // Component code...

  return (
    <>
      <Canvas
        // ...
        // CanvasProps
        // ...
      />
    </>
  )
}
```

### Canvas Props

An interface defining the arguments taken by the Canvas component.

```typescript
export interface CanvasProps {
  title?: string, // Abitrary name for the Canvas
  rendererWidth?: number, // Width of the rendered Canvas
  rendererHeight?: number, // Height of the rendered Canvas
  rendererSizeIsWindow?: boolean, // Boolean determining if Canvas will be window size
  rendererBackgroundColor?: string, // #RRGGBB format color string
  cameraPositionZ?: number, // Number determining Z position of the camera
  motifProps: MotifProps[], // Array of MotifProps objects for Motifs to be displayed
  customEventProps?: AnyEventProps[], // Array of any typed CustomEventProps for custom event listeners
}
```

Here, we can pass in multiple attributes of the Canvas including size and color. All arguments are optional besides ```motifProps```.

### Motif Props

An interface defining the properties of Motif objects that will be displayed.

```typescript
export interface MotifProps {
  motif: Motif, // Custom Motif object with Babylon.js meshes
  locked: boolean, // Whether or not this Motif will be permanently locked (no interactions allowed) on the canvas
  position?: Vec3, // Custom Vector 3 object
  rotation?: Quat, // Custom Quaternion object
}
```

### Custom Event Props

An interface defining the properties of custom event listeners that the scene will trigger.

```typescript
export interface CustomEventProps<T extends Events.Event = Events.Event> {
  eventType: Events.EventType, // Type of Event to listen for.
  callback: (event: T) => void; // Callback function to execute on trigger
}
```

When creating the CustomEventProps for the CanvasProps:

```typescript
<Canvas
  // ...
  customEventProps = [
    {
      eventType: Events.EventType.KEY_DOWN,
      callback: (e: Events.KeyboardEvent) => {/* code to execute on trigger */},
    } as CustomEventProps<Events.KeyboardEvent>,
  ]
/>
```

## Motif Model Creation

### Motif Object

There are two wrapper classes made to represent different molecular components of an RNA strand: Motif and Residue. Motif is the primary object that the canvas works with, and it is a collection of Residues. Each Residue is a collection of Babylon Mesh objects.

### Motif Creation

Use the getMotif function to pass in a custom JSON file, with a specified color, and receive a Motif object.

```typescript
import { getMotif, Motif, MotifProps } from '@judah-silva/rnacanvas'

const motif1: Motif = await getMotif(
  'path_to_json',
  '#RRGGBB_color',
);

// Create a MotifProps object for this motif
const props: MotifProps = {
  motif: motif1,
  locked: false,
};
```
