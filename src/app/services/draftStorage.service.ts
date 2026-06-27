import { Injectable } from '@angular/core';

import { TimePeriod, TrainingAction } from '../model/trainingAction';
import { TrainingMaterial } from '../model/trainingMaterial';

type StorageWithExpiry<T> = {
  data: T;
  expiresAt: number;
};

@Injectable({
  providedIn: 'root',
})
export class DraftStorageService {
  private readonly materialKey = 'training-material-draft';
  private readonly actionKey = 'training-action-draft';

  private readonly ttlMs = 1000 * 60 * 60;

  saveMaterial(item: TrainingMaterial): void {
    this.setWithExpiry(this.materialKey, item.toPlain());
  }

  loadMaterial(): TrainingMaterial | null {
    const plain = this.getWithExpiry<TrainingMaterial>(this.materialKey);
    if (plain) {
      plain.created = new Date(plain.created);
      plain.updatedAt = new Date(plain.updatedAt);
      return new TrainingMaterial(plain)
    } 
    return null;
  }

  clearMaterial(): void {
    localStorage.removeItem(this.materialKey);
  }

  saveAction(item: TrainingAction): void {
    this.setWithExpiry(this.actionKey, item.toPlain());
  }

  loadAction(): TrainingAction | null {
    const plain = this.getWithExpiry<TrainingAction>(this.actionKey);
    if (plain) {
      plain.created = new Date(plain.created);
      plain.updatedAt = new Date(plain.updatedAt);
      plain.timing = plain.timing.map(period => {
        return {
          start: new Date(period.start),
          end: period.end != undefined ? new Date(period.end) : undefined,
          showTime: period.showTime,
        } as TimePeriod
      })
      return new TrainingAction(plain)
    } 
    return null;
  }

  clearAction(): void {
    localStorage.removeItem(this.actionKey);
  }

  private setWithExpiry<T>(key: string, data: T): void {
    const payload: StorageWithExpiry<T> = {
      data,
      expiresAt: Date.now() + this.ttlMs,
    };

    localStorage.setItem(key, JSON.stringify(payload));
  }

  private getWithExpiry<T>(key: string): T | null {
    const raw = localStorage.getItem(key);

    if (!raw) {
      return null;
    }

    try {
      const payload = JSON.parse(raw) as StorageWithExpiry<T>;

      if (Date.now() > payload.expiresAt) {
        localStorage.removeItem(key);
        return null;
      }

      return payload.data;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  }
}