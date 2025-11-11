import { Injectable } from "@angular/core";
import { TrainingItem } from "../model/trainingItem";

@Injectable({
    providedIn: 'root',
})
export class CardSortingService {
  public sortOption: string = 'Title';
  public sortAsc: boolean = false;

  public sortItems(inputItems: TrainingItem[]) {
    let sortedItems: TrainingItem[] = [...inputItems];
    switch(this.sortOption) {
      case 'Title':
        if (this.sortAsc) {
          sortedItems = sortedItems.sort((a, b) => b.title.localeCompare(a.title));
        }
        else {
          sortedItems = sortedItems.sort((a, b) => a.title.localeCompare(b.title));
        }
        break;
      case 'Date':
        if (this.sortAsc) {
          sortedItems = sortedItems.sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime());
        }
        else {
          sortedItems = sortedItems.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
        }
        break;
      case 'EQF':
        if (this.sortAsc) {
          sortedItems = sortedItems.sort((a, b) => {
            const lastAIndex: number = a.educationLevel.length - 1;
            const lastBIndex: number = b.educationLevel.length - 1;
            const minLen: number = Math.min(lastAIndex, lastBIndex);
            for (let i = 0; i <= minLen; i++) {
              const valA = parseInt(a.educationLevel[lastAIndex - i] ?? '0');
              const valB = parseInt(b.educationLevel[lastBIndex - i] ?? '0');
              if (valA !== valB) return valA - valB;
            }
            return a.educationLevel.length - b.educationLevel.length;
          });
        }
        else {
          sortedItems = sortedItems.sort((a, b) => {
            const lastAIndex: number = a.educationLevel.length - 1;
            const lastBIndex: number = b.educationLevel.length - 1;
            const minLen: number = Math.min(lastAIndex, lastBIndex);
            for (let i = 0; i <= minLen; i++) {
              const valA = parseInt(a.educationLevel[lastAIndex - i] ?? '0');
              const valB = parseInt(b.educationLevel[lastBIndex - i] ?? '0');
              if (valA !== valB) return valB - valA;
            }
            return b.educationLevel.length - a.educationLevel.length;
          });
        }
        break;
    }
    return sortedItems;
  }
}