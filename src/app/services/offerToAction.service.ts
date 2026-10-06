import { inject, Injectable } from "@angular/core";
import { collection, CollectionReference, deleteDoc, doc, docData, Firestore } from "@angular/fire/firestore";
import { map, Observable, tap } from "rxjs";
import { TrainingAction } from "../model/trainingAction";

@Injectable({
    providedIn: 'root',
})
export class OfferToActionService {
  private db: Firestore = inject(Firestore);
  private offerToActionCollection: CollectionReference;

  constructor() { 
    this.offerToActionCollection = collection(this.db, 'OfferToAction');
  }

  public getActionDraft(id: string): Observable<TrainingAction> {
    const docRef = doc(this.offerToActionCollection, id);
    return (docData(docRef) as Observable<TrainingAction>).pipe(
      map(value => this.formatTrainingAction(value)),
      tap(() => deleteDoc(docRef))
    );
  }

  private formatTrainingAction(item: TrainingAction): TrainingAction {
    const newItem = new TrainingAction(item);
    newItem.concepts = this.formatFirestoreConcepts(newItem.concepts);
    if (newItem.updatedAt && !(newItem.updatedAt instanceof Date)) newItem.updatedAt = newItem.updatedAt.toDate();
    if (newItem.created) newItem.created = newItem.created.toDate();
    newItem.timing = 
      newItem.timing
        .map(value => ({start: value.start.toDate(), end: value.end ? value.end.toDate() : undefined, showTime: value.showTime}))
        .sort((a, b) => a.start.getTime() - b.start.getTime());
    return newItem;
  }

  private formatFirestoreConcepts(concepts: string[]) {
    const regex = /\[(.*?)\]/;
    return concepts.map(concept => concept.match(regex)?.[1])
    .filter(Boolean) as string[];
  }
}