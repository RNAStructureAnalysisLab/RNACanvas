/**
 * Copyright (c) 2025 RNA3DS Lab CSUMB.
 * All code written for RNA3DS Lab is protected under the terms of the NDA.
 * No code shall be distributed or modified without the permission of the PI.
 * @author Judah Silva <silva.judah7@outlook.com>
 */

export interface ScoreInfo {
  score: number,
  selId: string,
  refId: string,
}

export enum CanvasAttributeTypes {
  SELECTED_MOTIFS = 'selectedMotifs',
  LOCKED_MOTIF_IDS = 'lockedMotifIds',
  HLOCKED_MOTIF_IDS = 'hardLockedMotifIds',
  SCORE_RMSD = 'scoreRMSD',
  KABSCH_RMSD = 'kabschRMSD',
}

export class CanvasDataManager {
  private static _selectedMotifIds: Set<string> = new Set<string>();
  private static _lockedMotifIds: string[] = [];
  private static _hardLockedMotifIds: string[] = [];
  private static _scoreRMSD: ScoreInfo[][] = [];
  private static _kabschRMSD: number[][] = [];
  private static _listeners: Map<string, Set<() => void>> = new Map();
  // private static _backgroundColor: string = '#040a20';

  static get selectedMotifIds(): Set<string> {
    return this._selectedMotifIds;
  }

  static setSelectedMotifIds(selectedMotifIds: Set<string>): void {
    this._selectedMotifIds = selectedMotifIds;
    this._listeners.get(CanvasAttributeTypes.SELECTED_MOTIFS)?.forEach((fn) => fn());
  }

  static get lockedMotifIds(): string[] {
    return this._lockedMotifIds;
  }

  static setLockedMotifIds(lockedMotifIds: string[]): void {
    this._lockedMotifIds = lockedMotifIds;
    this._listeners.get(CanvasAttributeTypes.LOCKED_MOTIF_IDS)?.forEach((fn) => fn());
  }

  static get hardLockedMotifIds(): string[] {
    return this._hardLockedMotifIds;
  }

  static setHardLockedMotifIds(hardLockedMotifIds: string[]): void {
    this._hardLockedMotifIds = hardLockedMotifIds;
    this._listeners.get(CanvasAttributeTypes.HLOCKED_MOTIF_IDS)?.forEach((fn) => fn());
  }

  static get scoreRMSD(): ScoreInfo[][] {
    return this._scoreRMSD;
  }

  static setScoreRMSD(scoreRMSD: ScoreInfo[][]): void {
    this._scoreRMSD = scoreRMSD;
    this._listeners.get(CanvasAttributeTypes.SCORE_RMSD)?.forEach((fn) => fn());
  }

  static get kabschRMSD(): number[][] {
    return this._kabschRMSD;
  }

  static setKabschRMSD(kabschRMSD: number[][]): void {
    this._kabschRMSD = kabschRMSD;
    this._listeners.get(CanvasAttributeTypes.KABSCH_RMSD)?.forEach((fn) => fn());
  }

  static subscribe(canvasAttributeType: CanvasAttributeTypes, callback: () => void): () => void {
    if (!this._listeners.has(canvasAttributeType)) {
      this._listeners.set(canvasAttributeType, new Set());
    }

    this._listeners.get(canvasAttributeType)!.add(callback);

    return () => this._listeners.get(canvasAttributeType)!.delete(callback);
  }

  // static get backgroundColor(): string {
  //   return this._backgroundColor;
  // }

  // static setBackgroundColor(backgroundColor: string): void {
  //   this._backgroundColor = backgroundColor;
  // }
}
