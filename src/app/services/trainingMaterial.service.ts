import { Injectable } from "@angular/core";
import { TrainingMaterial } from "../model/trainingMaterial";
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
export class TrainingMaterialService extends TrainingItemService {
  private trainingMaterialMap: BehaviorSubject<Map<string, TrainingMaterial> | undefined> = new BehaviorSubject<Map<string, TrainingMaterial> | undefined>(undefined);

  constructor(private firebaseService: FirebaseService, private languageService: LanguageService, private bokInfoService: BokInformationService, private utilsService: UtilsService) {
    super();
    this.checkTrainingMaterials().subscribe()
  }

  public submitMaterial(material: TrainingMaterial, image: File | undefined, update: boolean = false): Observable<string> {
    const newMaterial = new TrainingMaterial(material);
    newMaterial.subject = newMaterial.subject.map( subject => this.utilsService.knowledgeAreaToCode.get(subject) || subject)
    newMaterial.language = this.languageService.getIsoCode(newMaterial.language!).toUpperCase();
    newMaterial.educationLevel = newMaterial.educationLevel.map(level => level.replace('EQF','').trim()).sort()
    const conceptObservables = newMaterial.concepts.length > 0 ? forkJoin(newMaterial.concepts.map(concept =>
      this.bokInfoService.getConceptName(concept).pipe(
        take(1),
        map(conceptName => `[${concept}] ${conceptName}`)
      )
    ))
    : of([]);
    return conceptObservables.pipe(
      concatMap(formatedConcepts => {
        newMaterial.concepts = formatedConcepts;
        if (update) return this.firebaseService.updateTrainingMaterial(newMaterial, image);
        return this.firebaseService.setTrainingMaterial(newMaterial, image);
      })
    );
  }

  public getTrainingMaterialsArray(): Observable<TrainingMaterial[] | undefined> {
    return this.trainingMaterialMap.asObservable().pipe(
      map(map => map ? Array.from(map.values()) : undefined)
    );
  }

  public getTrainingMaterialsMap(): Observable<Map<string, TrainingMaterial> | undefined> {
    return this.trainingMaterialMap.asObservable();
  }

  private checkTrainingMaterials(): Observable<void> {
    return this.firebaseService.getTrainingMaterials().pipe(map( newTrainingMaterials => {
      const cleanedMaterials = this.formatTrainingItems(newTrainingMaterials) as TrainingMaterial[];
      const newTrainignMaterialMap: Map<string, TrainingMaterial> = new Map();
      cleanedMaterials.forEach( material => newTrainignMaterialMap.set(material._id, material));
      this.trainingMaterialMap.next(newTrainignMaterialMap)
    }));
  }

  private formatTrainingItems(trainingItems: TrainingMaterial[]): TrainingMaterial[] {
    return trainingItems.map(item => {
      const newItem = new TrainingMaterial(item);
      newItem.concepts = this.formatFirestoreConcepts(newItem.concepts);
      if (!newItem.created) newItem.created = newItem.updatedAt.toDate();
      else newItem.created = newItem.created.toDate();
      return newItem;
    });
    }

  public getTrainingMaterial(materialId: string): Observable<TrainingMaterial | undefined> {
    return this.trainingMaterialMap.asObservable().pipe(
      concatMap( value => {
        if (value == undefined) {
          return this.getTrainingMaterialsMap().pipe(take(1));
        }
        return of(value);
      }),
      filter(value => value != undefined),
      map(materiaMap => materiaMap.get(materialId))
    );
  }

  public deleteTrainingMaterial(material: TrainingMaterial): Observable<void> {
    return this.firebaseService.deleteTrainingMaterial(material);
  }

  public getItemsOrganizations(): Observable<string[]> {
    return this.trainingMaterialMap.asObservable().pipe(
      map(materialMap => {
        if (materialMap == undefined || materialMap.size == 0) return [];
        const orgs = Array.from(materialMap.values())
          .filter((m: TrainingMaterial) => !!m.orgName)
          .map(m => m.orgName!);
        return [...new Set(orgs)];
      })
    )
  }
}