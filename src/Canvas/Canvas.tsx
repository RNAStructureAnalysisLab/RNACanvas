/**
 * Copyright (c) 2025 RNA3DS Lab CSUMB.
 * @author Sameer Dingore <sdingore@csumb.edu>
 * @author Judah Silva <silva.judah7@outlook.com>
 */

'use client';

import React, { useRef, useEffect, useState } from 'react';
import { CanvasProps } from './CanvasTypes';
import { CanvasAttributeTypes, CanvasDataManager, ScoreInfo } from './CanvasDataManager';
import { MeshObject, Motif, RenderScene, Residue, updateAllMotifs } from '@/src/3D';
import { Events } from '@/src/Events';
import { calculateAllKabschRMSD } from '@/src/Kabsch';
import { Vec3 } from '@/src/Math';
import { calculateRMSD } from '@/src/RMSD';

/**
 * ________________________________________________________________________________________________
 */
/**
 * Canvas component renders the 3D canvas and the motifs on it.
 * @param param0 {CanvasProps} A CanvasProps object
 * @function Canvas {JSX.Element}
 * @returns {JSX.Element}
 */
export function Canvas({
  rendererHeight = 500,
  rendererWidth = 500,
  rendererBackgroundColor = '#040a20',
  rendererSizeIsWindow = false,
  cameraPositionZ = 1000,
  motifProps,
  customEventProps,
}: CanvasProps): JSX.Element {
  /**
   * ____________________________________________________________________________________________
   */
  /**
   * This are the references to the canvas, renderer, and camera.
   * They are used to manipulate the 3D scene.
   * #Ref
   */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scene = useRef<RenderScene | null>(null);

  /**
   * Pull the motif objects out of the motifProps for ease of access
   * Also set hardLockedMotifIds now
   */
  const motifs: Motif[] = [];
  let hardLockedMotifIds: string[] = [];
  motifProps.forEach((motifProp) => {
    motifs.push(motifProp.motif);
    if (motifProp.locked) hardLockedMotifIds.push(motifProp.motif.uuid);
  });
  CanvasDataManager.setHardLockedMotifIds(hardLockedMotifIds);

  /**
   * ____________________________________________________________________________________________
   */
  /**
   * This are the state vars that are tracking the activities on the canvas.
   * Things to remember :
   *  1. State vars are clientside components and they are little weird.
   *  2. when you use the useState it comes with the var itself and the function that can handle
   *      reassigment. there's no way to manipulate this var without using the Dispatch call.
   *  3. benefit of using them is they are aware of their states and You can use useEffect() on
   *      them.
   *
   * selectedMotifMeshState - A local state variable to hold selected motifs
   * cursorStyle - A local state variable to store
   * #State
   */
  // const [selectedMotifMeshState, setSelectedMotifMeshState] = useState<Set<Motif>>(new Set());
  const selectedMotifMeshState = useRef<Set<Motif>>(new Set());
  const lockedMotifIdState = useRef<string[]>([]);
  const [cursorStyle, setCursorStyle] = useState('auto');
  const [selectedMotifIds, setSelectedmotifIds] = useState<Set<string>>(new Set());
  const [scoreRMSD, setScoreRMSD] = useState<ScoreInfo[][]>([]);
  const [kabschRMSD, setKabschRMSD] = useState<number[][]>([]);
  const [lockedMotifIds, setLockedMotifIds] = useState<string[]>([]);

  /**
   * ____________________________________________________________________________________________
   */
  /**
   * Function to add a motif to the selected state variables
   * @param motif Motif to be added
  */
  const addMotif = (motif: Motif): void => {
    if (selectedMotifIds.has(motif.uuid)) { // If the motif is already selected
      return;
    }

    // Loop through motifs, adding them to a new set if they're selected already or are the argument Motif
    // Done this way to keep selectedMotifIds in ascending order of Motif uuid
    const newSet = new Set<string>();
    for (let i = 0; i < motifs.length; i += 1) {
      if (selectedMotifMeshState.current.has(motifs[i]) || motifs[i].uuid === motif.uuid) {
        newSet.add(motifs[i].uuid);
      }
    }
    setSelectedmotifIds(newSet);
    selectedMotifMeshState.current.add(motif);
  };

  /**
   * ____________________________________________________________________________________________
   */
  /**
   * Function to remove a motif from the selected state variables
   * @param motif Motif to be removed
   */
  const removeMotif = (motif: Motif): void => {
    if (!selectedMotifIds.has(motif.uuid)) { // If the motif is not selected
      return;
    }

    selectedMotifMeshState.current.delete(motif);
    setSelectedmotifIds((prevState: Set<string>) => {
      const newState = prevState;
      newState.delete(motif.uuid);
      return newState;
    });
  };

  /**
   * ____________________________________________________________________________________________
   */
  /**
   * This Function is used to update the glow of the selected motifs.
   * It checks the selectedMotifIds and based on that it updates the glow of the motifs.
   * @function updateGlow {void}
   * #Function
   */
  function updateGlow() {
    motifs.forEach((motif: Motif) => {
      motif.children.forEach((residue: Residue) => {
        residue.children.forEach((childMesh: MeshObject) => {
          if (selectedMotifIds.has(motif.uuid)) {
            // console.log(motif);
            childMesh.applyHighlight();
          } else {
            childMesh.resetHighlight();
          }
        });
      });
    });
  }

  /**
   * ____________________________________________________________________________________________
   */

  /**
   * This Function is called by Event Handling when a mesh is clicked on the scene.
   * It takes the motif on the Event object and adds it to the selected motifs
   * @param event {Events.SelectionEvent} - SelectionEvent info object
   * @returns {void}
   */
  function onSelectMotif(event: Events.SelectionEvent): void {
    if (event.type !== Events.EventType.OBJECT_SELECTED) {
      return;
    }

    const { motif } = event;

    if (!motif ||
        selectedMotifMeshState.current.has(motif) ||
        lockedMotifIdState.current.includes(motif.uuid) ||
        hardLockedMotifIds.includes(motif.uuid)) {
      return;
    }

    // console.log(motif);

    // If event has the ctrl key, then add this motif to the selected motifs
    if (event.multiSelect && motif) {
      addMotif(motif);
      // selectedMotifMeshArr.push(motif);
    } else if (motif) {
      // If event doesn't have ctrl key, set selected motifs to just this motif
      setSelectedmotifIds(new Set([motif.uuid]));
      selectedMotifMeshState.current = new Set([motif]);
      // selectedMotifMeshArr = [motif];
    }
    // setScoreRMSD(calculateRMSD(Array.from(selectedMotifMeshState.current), motifs));

    // console.log('selected');
  }

  /**
   * This Function is called by Event Handling when no mesh is clicked on the scene.
   * It removes all selected motifs from the state variables.
   * @param event {Events.SelectionEvent} - SelectionEvent info object.
   * @returns {void}
   */
  function onDeselectMotif(event: Events.SelectionEvent): void {
    if (event.type !== Events.EventType.OBJECT_DESELECTED) {
      return;
    }

    if (selectedMotifMeshState.current.size === 0) {
      return;
    }

    setSelectedmotifIds(new Set());
    selectedMotifMeshState.current.clear();

    // setScoreRMSD(calculateRMSD(Array.from(selectedMotifMeshState.current), motifs));
  }

  /**
   * ____________________________________________________________________________________________
   */
  /**
   * This Function has two functionalities
   *  1. If the right click is pressed and mouse is dragged it moves all the selected motifs
   *      based on the distance travlled by the mouse.
   *  2. If the left click is pressed and mouse is dragged it rotates all the selected motifs
   *      based on the distance travelled in x and y axises using quaternion.
   * @param event {Events.PointerEvent} - PointerEvent info object
   * @function onMouseMove {void}
   * @returns {void}
   * #MouseFunction
   */

  function onMouseMove(event: Events.PointerEvent): void {
    if (event.deltaX === 0 && event.deltaY === 0) {
      // console.log('possible destruction prevented: ', event);
      return;
    }
    // console.log(event);
    // Check if right-click is pressed.
    if (event.buttons === 2 && selectedMotifMeshState.current.size > 0) {
      if (scene.current) {
        //Calculate the movement.
        const { renderWidth, renderHeight } = scene.current;
        const rawDeltaX = event.deltaX!;
        const rawDeltaY = event.deltaY!;
        const deltaX = (rawDeltaX / renderWidth) * canvasRef.current!.width;
        const deltaY = (rawDeltaY / renderHeight) * canvasRef.current!.height;
        // Translate all unlocked motifs
        selectedMotifMeshState.current.forEach((element: Motif) => {
          if (!lockedMotifIdState.current.includes(element.uuid) &&
              !hardLockedMotifIds.includes(element.uuid)) {
            element.translate(-deltaX, -deltaY, 0);
          }
        });
      }
      // Check if left click is pressed and it motifs are already selected.
    } else if (event.buttons === 1 && selectedMotifMeshState.current.size > 0) {
      const { deltaX, deltaY } = event;

      const directionVec = new Vec3(-deltaX!, -deltaY!, 0);

      // Rotate that vector 90 degrees to get an axis of rotation
      const axisVec = directionVec.clone().applyAxisAngle(new Vec3(0, 0, 1), Math.PI / 2);
      axisVec.normalize();
      if (scene.current) {
        // Get an angle of rotation
        const angle = (directionVec.length() / scene.current.renderWidth) * (3 * Math.PI);
        // console.log(angle);
        // const rotationQuat = new THREE.Quaternion().setFromAxisAngle(axisVec, angle);

        // accumulatedRotationQ.multiplyQuaternions(rotationQuat, accumulatedRotationQ);
        selectedMotifMeshState.current.forEach((element: Motif) => {
          if (!lockedMotifIdState.current.includes(element.uuid) &&
              !hardLockedMotifIds.includes(element.uuid)) {
            // element.quaternion.multiplyQuaternions(rotationQuat, element.quaternion);
            // console.log(event);
            element.rotate(axisVec, angle);
          }
        });
        setScoreRMSD(calculateRMSD(Array.from(selectedMotifMeshState.current), motifs));
        // console.log(selectedMotifMeshState.current);
      }
    }
  }

  /**
   * ____________________________________________________________________________________________
   */
  /**
   * This Function overrides the default behavior of the scroll hence event.preventDefault
   * Also then it calculates the scroll distance and based on direction it adds or subtracts
   * the scale of the all selected motifs.
   * @param event {Events.PointerEvent} - PointerEvent info object
   * @returns {void}
   * #MouseFunction
   */
  function onMouseScroll(event: Events.PointerEvent): void {
    if (!event.originalEvent || !(event.originalEvent instanceof WheelEvent)) {
      throw new Error('Tried to trigger Wheel event, but the event info was not present or not of the correct type');
    }

    event.originalEvent.preventDefault();
    if (selectedMotifMeshState.current.size > 0) {
      const zoomSpeed = 0.1; // Adjust this value based on your desired zoom sensitivity
      const zoomDirection = event.originalEvent.deltaY > 0 ? -1 : 1; // -1 for zoom in, 1 for zoom out
      selectedMotifMeshState.current.forEach((element: Motif) => {
        // Adjust the scale of the selected motif based on the zoom direction
        if (!lockedMotifIdState.current.includes(element.uuid) &&
            !hardLockedMotifIds.includes(element.uuid)) {
          const scaleFactor = 1 + zoomDirection * zoomSpeed;
          element.multiplyScalar(scaleFactor);
        }
      });
    }
  }

  /**
   * ____________________________________________________________________________________________
   */
  /**
   * This Function sets the cursor style based on the input.
   * @param style {string} - Cursor Style
   * #MouseFunction
   */
  function onMouseUp(event: Events.PointerEvent): void {
    if (event.type !== Events.EventType.POINTER_UP) {
      return;
    }

    setCursorStyle('auto');
  }

  /**
   * ____________________________________________________________________________________________
   */
  /**
   * This Function captures the mouse event and sets the positionExUp to the current mouse
   * position.
   * @param event {Events.PointerEvent} - PointerEvent info object.
   * #MouseFunction
   */
  function onMouseDown(event: Events.PointerEvent): void {
    if (event.button === 2 && selectedMotifMeshState.current.size > 0) {
      setCursorStyle('move');
    } else if (event.button === 1 && event.ctrlKey) {
      setCursorStyle('crosshair');
    }

    // console.log('mouse down');
  }

  /**
   * ____________________________________________________________________________________________
   */
  /**
   * This Function captures keyboard input for rotation input
   * @param event {Events.KeyboardEvent} - KeyboardEvent info object
   * #KeyboardFunction
   */
  function onKeyboardRotate(event: Events.KeyboardEvent): void {
    if (event.rotationAxis.equals(Vec3.Zero)) { // If there is no rotation
      return;
    }

    const angle = (event.rotationAxis.length() / 500) * (6 * Math.PI);
    selectedMotifMeshState.current.forEach((element: Motif) => {
      if (!lockedMotifIdState.current.includes(element.uuid) &&
          !hardLockedMotifIds.includes(element.uuid)) {
        // element.quaternion.multiplyQuaternions(rotationQuat, element.quaternion);
        element.rotate(event.rotationAxis, angle);
      }
    });

    setScoreRMSD(calculateRMSD(Array.from(selectedMotifMeshState.current), motifs));
    // console.log('keyboard rotate');
  }

  /**
   * ____________________________________________________________________________________________
  */
  /**
  * This Function captures keyboard input for translation input
  * @param event {Events.KeyboardEvent} - KeyboardEvent info object
  * #KeyboardFunction
  */
  function onKeyboardTranslate(event: Events.KeyboardEvent): void {
    if (event.translationDirection.equals(Vec3.Zero)) { // If there is no translation
      return;
    }
    event.translationDirection.multiplyScalar(0.5);
    // console.log(selectedMotifMeshState);
    selectedMotifMeshState.current.forEach((element: Motif) => {
      if (!lockedMotifIdState.current.includes(element.uuid) &&
          !hardLockedMotifIds.includes(element.uuid)) {
        // console.log('translating ', element);
        element.translate(
          event.translationDirection.x,
          event.translationDirection.y,
          event.translationDirection.z
        );
      }
    });

    // console.log('keyboard translate');
  }

  /**
   * ____________________________________________________________________________________________
  */
  /**
   * This Function captures keyboard input for selecting motifs with number keys
   * @param event {Events.KeyboardEvent} - KeyboardEvent info object
   */
  function onKeyboardSelect(event: Events.KeyboardEvent): void {
    if (!event.rotationAxis.equals(Vec3.Zero)
      || !event.translationDirection.equals(Vec3.Zero)) { // If there is keyboard rotation or translation, this event should not be triggered
      return;
    }

    if (!(/^[0-9]$/.test(event.key))) { // A non-number key was pressed
      return;
    }

    // Get the 1-indexed motif
    const motif = motifs[Number(event.key) - 1];
    if (selectedMotifMeshState.current.has(motif)) { // Toggle select state for this motif
      removeMotif(motif);
    } else {
      addMotif(motif);
    }

    // console.log('keyboard select');
  }

  /**
   * ____________________________________________________________________________________________
   */
  /**
   * This function takes in a number of motifs and auto-determines starting positions for them on the canvas.
   * @param numMotifs { number } The number of motifs to be displayed on the canvas.
   */
  const calculatePositions = (numMotifs: number): Vec3[] => {
    if (!canvasRef.current) {
      return [];
    }

    const totalWidth: number = canvasRef.current.width;
    const subdividedWidth: number = totalWidth / (numMotifs);
    const halfWidth: number = subdividedWidth / 2;
    const totalHeight: number = canvasRef.current.height;
    const subdividedHeight: number = (totalHeight * (numMotifs > 3 ? 1 : 0)) / 5;

    const positions: Vec3[] = [];
    for (let i = 0, x = totalWidth / 2; i < numMotifs; i += 1, x -= subdividedWidth) {
      positions.push(new Vec3(x - halfWidth, subdividedHeight * (i % 2 ? 1 : -1), -100));
    }

    return positions;
  };

  /**
   * ____________________________________________________________________________________________
   */
  /**
   * This useEffect is used to update the selectedMotifIds state whenever the equivalent variable in the DataManager is updated.
   * #UseEffect
   * #State
   */
  useEffect(() => {
    const unsubscribe = CanvasDataManager.subscribe(CanvasAttributeTypes.SELECTED_MOTIFS, () => {
      setSelectedmotifIds(CanvasDataManager.selectedMotifIds);
      // console.log('selectedMotifIds Test');
    });

    return () => unsubscribe();
  }, []);

  /**
   * ____________________________________________________________________________________________
   */
  /**
   * This useEffect is used to update glow, selectedMotifMeshState, and the DataManager equivalent whenever the selectedMotifIds state is updated
   * #UseEffect
   * #State
   * Dependency: selectedMotifIds
   */
  useEffect(() => {
    if (CanvasDataManager.selectedMotifIds !== selectedMotifIds) { // To avoid update loop
      CanvasDataManager.setSelectedMotifIds(selectedMotifIds);
    }

    selectedMotifMeshState.current.clear();
    motifs.forEach((motif: Motif) => {
      if (selectedMotifIds.has(motif.uuid)) {
        selectedMotifMeshState.current.add(motif);
      }
    });

    updateGlow();
    setScoreRMSD(calculateRMSD(Array.from(selectedMotifMeshState.current), motifs));
  }, [selectedMotifIds]);

  /**
   * ____________________________________________________________________________________________
   */
  /**
   * This useEffect is used to update the lockedMotifIds state variable when the equivalent variable in the DataManager is updated.
   * #UseEffect
   * #State
   */
  useEffect(() => {
    const unsubscribe = CanvasDataManager.subscribe(CanvasAttributeTypes.LOCKED_MOTIF_IDS, () => {
      setLockedMotifIds(CanvasDataManager.lockedMotifIds);
    });

    return () => unsubscribe();
  }, []);

  /**
   * ____________________________________________________________________________________________
   */
  /**
   * This useEffect is used to update the DataManager equivalent variable whenever the lockedMotifIds state is updated.
   * #UseEffect
   * #State
   * Dependency: lockedMotifIds
   */
  useEffect(() => {
    lockedMotifIdState.current = lockedMotifIds;
    if (CanvasDataManager.lockedMotifIds !== lockedMotifIds) { // To avoid update loop
      CanvasDataManager.setLockedMotifIds(lockedMotifIds);
    }
  }, [lockedMotifIds]);

  /**
   * ____________________________________________________________________________________________
   */
  /**
   * This useEffect is used to update the hardLockedMotifIds state variable when the equivalent variable in the DataManager is updated.
   * #UseEffect
   * #State
   * Dependency: CanvasDataManager.hardLockedMotifIds
   */
  useEffect(() => {
    hardLockedMotifIds = CanvasDataManager.hardLockedMotifIds;
  }, [CanvasDataManager.hardLockedMotifIds]);

  /**
   * ____________________________________________________________________________________________
   */
  /**
   * This useEffect is used to update the scoreRMSD state variable when the equivalent variable in the DataManager is updated.
   * #UseEffect
   * #State
   * Dependency: CanvasDataManager.scoreRMSD
   */
  useEffect(() => {
    const unsubscribe = CanvasDataManager.subscribe(CanvasAttributeTypes.SCORE_RMSD, () => {
      setScoreRMSD(CanvasDataManager.scoreRMSD);
    });

    return () => unsubscribe();
  }, []);

  /**
   * ____________________________________________________________________________________________
   */
  /**
   * This useEffect is used to update the DataManager equivalent variable when the scoreRMSD state is updated.
   * #UseEffect
   * #State
   * Dependency: scoreRMSD
   */
  useEffect(() => {
    if (CanvasDataManager.scoreRMSD !== scoreRMSD) {
      CanvasDataManager.setScoreRMSD(scoreRMSD);
    }
  }, [scoreRMSD]);

  /**
   * ____________________________________________________________________________________________
   */
  /**
   * This useEffect is used to update the kabschRMSD state variable when the equivalent variable in the DataManager is updated.
   * #UseEffect
   * #State
   * Dependency: CanvasDataManager.kabschRMSD
   */
  useEffect(() => {
    const unsubscribe = CanvasDataManager.subscribe(CanvasAttributeTypes.KABSCH_RMSD, () => {
      setKabschRMSD(CanvasDataManager.kabschRMSD);
      // console.log('kabschRMSD Test');
    });

    return () => unsubscribe();
  }, []);

  /**
   * ____________________________________________________________________________________________
   */
  /**
   * This useEffect is used to update the DataManager equivalent variable when the kabschRMSD state is updated.
   * #UseEffect
   * #State
   * Dependency: kabschRMSD
   */
  useEffect(() => {
    if (CanvasDataManager.kabschRMSD !== kabschRMSD) {
      CanvasDataManager.setKabschRMSD(kabschRMSD);
    }
  }, [kabschRMSD]);

  /**
   * ____________________________________________________________________________________________
   */
  /**
   * This useEffect is used to set the cursor style based on the cursorStyle state.
   * #UseEffect
   * #State
   * Dependency: cursorStyle
   */
  useEffect(() => {
    document.body.style.cursor = cursorStyle;
  }, [cursorStyle]);

  /**
   * ____________________________________________________________________________________________
   */
  /**
   * This useEffect is used to set the canvas background color based on the colors state variable.
   * #UseEffect
   * #State
   * Dependency: colors
   */
  useEffect(() => {
    scene.current?.setBackgroundColor(rendererBackgroundColor);
  }, [rendererBackgroundColor]);

  /**
   * ____________________________________________________________________________________________
   */
  /**
   * This useEffect is used to set the scene.
   * It also adds the event listeners to the canvas.
   * #UseEffect
   * #State
   * #Ref
   * #Event
   * #Canvas
   * #Renderer
   * #Camera
   * #Scene
   * Dependency: motifs, rendererWidth, rendererHeight, rendererSizeIsWindow
   */
  useEffect(() => {
    if (!canvasRef.current) return;

    if (!scene.current) {
      scene.current = new RenderScene(
        canvasRef.current,
        rendererBackgroundColor,
        cameraPositionZ,
        rendererSizeIsWindow ? window.innerWidth : rendererWidth,
        rendererSizeIsWindow ? window.innerHeight : rendererHeight
      );
    }

    // console.log(canvasRef.current.width, canvasRef.current.height);

    /**
     * Initialization of the motifs on the canvas setting its position, and scale
     * #Definition
    */
   const positions = calculatePositions(motifs.length);

    if (motifs.length > 0) {
      updateAllMotifs(motifs).then(() => {
        setKabschRMSD(calculateAllKabschRMSD(motifs));
      });
      if (scene.current.children.size !== motifs.length) {
        motifs.forEach((motifMesh: Motif, index) => {
          // If there is a pre-determined position, update the positions array
          if (motifProps[index].position) positions[index] = motifProps[index].position;
          motifMesh.setPosition(positions[index].x, positions[index].y, positions[index].z);

          // If there is a pre-determined rotation, set the motif to it
          if (motifProps[index].rotation) motifMesh.setQuaternion(motifProps[index].rotation);

          // Set the scale of the motif based on the size of the canvas
          motifMesh.multiplyScalar(canvasRef.current!.width / 250);
          scene.current?.add(motifMesh);
        });

        const eventManager = scene.current?.eventManager;
        eventManager.on(Events.EventType.OBJECT_SELECTED, onSelectMotif);
        eventManager.on(Events.EventType.OBJECT_DESELECTED, onDeselectMotif);
        eventManager.on(Events.EventType.POINTER_MOVE, onMouseMove);
        eventManager.on(Events.EventType.POINTER_WHEEL, onMouseScroll);
        eventManager.on(Events.EventType.POINTER_DOWN, onMouseDown);
        eventManager.on(Events.EventType.POINTER_UP, onMouseUp);
        eventManager.on(Events.EventType.KEY_DOWN, onKeyboardRotate);
        eventManager.on(Events.EventType.KEY_DOWN, onKeyboardTranslate);
        eventManager.on(Events.EventType.KEY_DOWN, onKeyboardSelect);

        if (customEventProps) {
          customEventProps.forEach((customEventProp) => {
            switch (customEventProp.eventType) {
              // Handle Pointer Events
              case Events.EventType.POINTER_DOWN:
              case Events.EventType.POINTER_UP:
              case Events.EventType.POINTER_MOVE:
              case Events.EventType.POINTER_WHEEL:
              case Events.EventType.TOUCH_END:
              case Events.EventType.TOUCH_MOVE:
              case Events.EventType.TOUCH_START:
                eventManager.on(
                  customEventProp.eventType,
                  customEventProp.callback as (e: Events.PointerEvent) => void);
                break;

              // Handle Keyboard Events
              case Events.EventType.KEY_DOWN:
              case Events.EventType.KEY_UP:
                eventManager.on(
                  customEventProp.eventType,
                  customEventProp.callback as (e: Events.KeyboardEvent) => void);
                break;

              // Handle Pinch Events
              case Events.EventType.PINCH:
              case Events.EventType.PINCH_END:
              case Events.EventType.PINCH_START:
                eventManager.on(
                  customEventProp.eventType,
                  customEventProp.callback as (e: Events.PinchEvent) => void);
                break;

              // Handle Selection Events
              case Events.EventType.OBJECT_SELECTED:
              case Events.EventType.OBJECT_DESELECTED:
                eventManager.on(
                  customEventProp.eventType,
                  customEventProp.callback as (e: Events.SelectionEvent) => void);
                break;

              // Handle Events
              default:
                eventManager.on(
                  customEventProp.eventType,
                  customEventProp.callback as (e: Events.Event) => void);
                break;
            }
          });
        }
      } else {
        motifs.forEach((motifMesh) => {
          scene.current?.add(motifMesh);
        });
      }
    }
    /**
     * ________________________________________________________________________________________
     */

    // animate();
    scene.current?.start();

    /**
     * ________________________________________________________________________________________
     */
  }, [rendererWidth, rendererHeight, rendererSizeIsWindow, motifProps]);
  return (
    <>
      {/**
       * ________________________________________________________________________________
       */
      /**
       * This is the canvas element that is used to render the 3D scene.
       */}
      <canvas ref={canvasRef} />
      {/**
       * ________________________________________________________________________________
       */}
    </>
  );
}

/**
 * ________________________________________________________________________________________________
 */
/**
 * Notes:
 * 1. The Canvas component is used to render the 3D scene and the motifs on it.
 * 2. The Canvas component uses the onMouseClick, onMouseMove, onMouseScroll, disableContextMenuOnRightClick,
 *      onMouseUp, onMouseDown, onMoveClick functions to handle the mouse events.
 * 3. It uses the createParticles function to create the particles on the canvas.
 * 4. The Canvas component returns a JSX element.
 * 5. The Canvas component is the main component that renders the 3D canvas and the motifs on it.
 */
