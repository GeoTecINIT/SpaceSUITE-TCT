import { Injectable } from "@angular/core";
import { TrainingAction } from "../model/trainingAction";
import { BehaviorSubject, concatMap, filter, forkJoin, map, Observable, of, take, tap } from "rxjs";
import { FirebaseService } from "./firebase.service";
import { LanguageService } from "./language.service";
import { BokInformationService } from "@eo4geo/ngx-bok-visualization";
import { UtilsService } from "./utils.service";
import { TrainingItemService } from "./trainingItem.service";

export type ValidationError = {
  field: string;
  message: string;
};

@Injectable({
  providedIn: 'root',
})
export class TrainingActionService extends TrainingItemService {
  private trainingActionMap: BehaviorSubject<Map<string, TrainingAction> | undefined> = new BehaviorSubject<Map<string, TrainingAction> | undefined>(undefined);

  constructor(private firebaseService: FirebaseService, private languageService: LanguageService, private bokInfoService: BokInformationService, private utilsService: UtilsService) {
    super();
    this.checkTrainingActions().subscribe()
  }

  public submitAction(action: TrainingAction, image: File | undefined, update: boolean = false): Observable<string> {
    const newAction = new TrainingAction(action);
    newAction.subject = newAction.subject.map( subject => this.utilsService.knowledgeAreaToCode.get(subject) || subject)
    newAction.language = this.languageService.getIsoCode(newAction.language!).toUpperCase();
    newAction.educationLevel = newAction.educationLevel.map(level => level.replace('EQF','').trim()).sort()
    const conceptObservables = newAction.concepts.length > 0 ? forkJoin(newAction.concepts.map(concept =>
      this.bokInfoService.getConceptName(concept).pipe(
        take(1),
        map(conceptName => `[${concept}] ${conceptName}`)
      )
    ))
    : of([]);
    return conceptObservables.pipe(
      concatMap(formatedConcepts => {
        newAction.concepts = formatedConcepts;
        if (update) return this.firebaseService.updateTrainingAction(newAction, image);
        return this.firebaseService.setTrainingAction(newAction, image);
      })
    );
  }

  public getTrainingActionsArray(): Observable<TrainingAction[] | undefined> {
    return this.trainingActionMap.asObservable().pipe(
      map(map => map ? Array.from(map.values()) : undefined)
    );
  }

  public getTrainingActionsMap(): Observable<Map<string, TrainingAction> | undefined> {
    return this.trainingActionMap.asObservable();
  }

  private checkTrainingActions(): Observable<void> {
    return this.firebaseService.getTrainingActions().pipe(map( newTrainingActions => {
      const cleanedActions = this.formatTrainingItems(newTrainingActions) as TrainingAction[];
      const newTrainignActionMap: Map<string, TrainingAction> = new Map();
      cleanedActions.forEach( action => newTrainignActionMap.set(action._id, action));
      this.trainingActionMap.next(newTrainignActionMap)
    }));
  }

  protected formatTrainingItems(trainingItems: TrainingAction[]): TrainingAction[] {
    return trainingItems.map(item => {
      const newItem = new TrainingAction(item);
      newItem.concepts = this.formatFirestoreConcepts(newItem.concepts);
      if (!newItem.created) newItem.created = newItem.updatedAt.toDate();
      else newItem.created = newItem.created.toDate();
      return newItem;
    });
  }

  public getTrainingAction(actionId: string): Observable<TrainingAction | undefined> {
    return this.trainingActionMap.asObservable().pipe(
      concatMap( value => {
        if (value == undefined) {
          return this.getTrainingActionsMap().pipe(take(1));
        }
        return of(value);
      }),
      filter(value => value != undefined),
      map(materiaMap => materiaMap.get(actionId))
    );
  }

  public deleteTrainingAction(action: TrainingAction): Observable<void> {
    return this.firebaseService.deleteTrainingAction(action);
  }

  public getItemsOrganizations(): Observable<string[]> {
    return this.trainingActionMap.asObservable().pipe(
      map(actionMap => {
        if (actionMap == undefined || actionMap.size == 0) return [];
        const orgs = Array.from(actionMap.values())
          .filter((m: TrainingAction) => !!m.orgName)
          .map(m => m.orgName!);
        return [...new Set(orgs)];
      })
    )
  }
}