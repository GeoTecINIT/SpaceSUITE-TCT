import { Injectable } from '@angular/core';

import { TimePeriod, TrainingAction } from '../model/trainingAction';
import { TrainingMaterial } from '../model/trainingMaterial';

@Injectable({
  providedIn: 'root',
})
export class DraftStorageService {
  private readonly materialKey = 'training-material-draft';
  private readonly actionKey = 'training-action-draft';

  saveMaterial(item: TrainingMaterial): void {
    this.setDraft(this.materialKey, item.toPlain());
  }

  loadMaterial(): TrainingMaterial | null {
    const plain = this.getDraft<TrainingMaterial>(this.materialKey);
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
    this.setDraft(this.actionKey, item.toPlain());
  }

  loadAction(): TrainingAction | null {
    const plain = this.getDraft<TrainingAction>(this.actionKey);
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

  private setDraft<T>(key: string, data: T): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  private getDraft<T>(key: string): T | null {
    const raw = localStorage.getItem(key);

    if (!raw) {
      return null;
    }

    try {
      const payload = JSON.parse(raw) as T;
      return payload;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  }
}