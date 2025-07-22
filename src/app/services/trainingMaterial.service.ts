import { Injectable } from "@angular/core";
import { TrainingMaterial } from "../model/trainingMaterial";
import { BehaviorSubject, concatMap, filter, forkJoin, map, Observable, of, take, tap } from "rxjs";
import { FirebaseService } from "./firebase.service";
import { LanguageService } from "./language.service";
import { BokInformationService } from "@eo4geo/ngx-bok-visualization";

export type ValidationError = {
  field: string;
  message: string;
};

@Injectable({
  providedIn: 'root',
})
export class TrainingMaterialService {
  private trainingMaterialMap: BehaviorSubject<Map<string, TrainingMaterial> | undefined> = new BehaviorSubject<Map<string, TrainingMaterial> | undefined>(undefined);

  constructor(private firebaseService: FirebaseService, private languageService: LanguageService, private bokInfoService: BokInformationService) {}

  public validate(material: TrainingMaterial): Map<string, string | undefined> {
    const urlRegex = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+(:\d+)?(\/\S*)?\/?$/;
    const errors: Map<string, string | undefined> = new Map();
  
    const setError = (field: string, condition: boolean, message: string) => {
      errors.set(field, condition ? message : undefined);
    };
  
    // String fields
    setError('title', !material.title.trim(), 'Title is required.');
    setError('publisher', !material.publisher.trim(), 'Publisher is required.');
    setError('created', !material.created, 'Creation date is required.');
    if (material.created && isNaN(Date.parse(material.created.toISOString()))) {
      errors.set('created', 'Creation date format is invalid.');
    }
  
    setError('workload', material.workload == 0, 'Workload must be greater than zero');
    setError('language', !material.language?.trim(), 'Language is required.');
    setError('description', !material.description.trim(), 'Description is required.');
    setError('abstract', !material.abstract.trim(), 'Abstract is required.');
    setError('userId', !material.userId.trim(), 'User ID is required.');
    setError('organization', !material.orgId?.trim(), 'Organization is required.');
    setError('interactivityType', !material.interactivityType?.trim(), 'Interactivity type is required.');
    setError('url', !material.url.trim(), 'URL is required.');
    if (!errors.get('url')) setError('url', !urlRegex.test(material.url), 'Invalid URL format.');
    setError('license', !material.license?.trim(), 'License is required.');
  
    // Array fields
    setError('creators', material.creators.length === 0, 'At least one creator is required.');
    setError('concepts', material.concepts.length === 0, 'At least one BoK concept is required.');
    setError('learningOutcomes', material.learningOutcomes.length === 0, 'At least one learning outcome is required.');
    setError('audience', material.audience.length === 0, 'At least one audience is required.');
    setError('type', material.materialType.length === 0, 'At least one type is required.');
    setError('educationLevel', material.educationLevel.length === 0, 'Education level is required.');
    setError('assessment', material.assessment.length === 0, 'At least one assessment is required.');
    setError('subject', material.subject.length === 0, 'At least one subject is required.');
  
    return errors;
  }

  public submitMaterial(material: TrainingMaterial, image: File | undefined, update: boolean = false): Observable<string> {
    const newMaterial = new TrainingMaterial(material);
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
    return this.checkTrainingMaterials().pipe(concatMap(() => {
      return this.trainingMaterialMap.asObservable().pipe(
        map(map => map ? Array.from(map.values()) : undefined)
      );
    }))
  }

  public getTrainingMaterialsMap(): Observable<Map<string, TrainingMaterial> | undefined> {
    return this.checkTrainingMaterials().pipe(concatMap(() => {
      return this.trainingMaterialMap.asObservable();
    }))
  }

  private checkTrainingMaterials(): Observable<void> {
    let currentTrainingMaterials: Map<string, TrainingMaterial> | undefined = this.trainingMaterialMap.value;
    let currentTrainingMaterialsArray = currentTrainingMaterials ? Array.from(currentTrainingMaterials.values()) : [];
    if (currentTrainingMaterialsArray.length == 0) {
      return this.firebaseService.getTrainingMaterial().pipe(map( newTrainingMaterials => {
        const cleanedMaterials = this.formatTrainingMaterials(newTrainingMaterials);
        const newTrainignMaterialMap: Map<string, TrainingMaterial> = new Map();
        cleanedMaterials.forEach( material => newTrainignMaterialMap.set(material._id, material));
        this.trainingMaterialMap.next(newTrainignMaterialMap)
      }));
    }
    else return of(undefined)
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

  private formatTrainingMaterials(trainingMaterials: TrainingMaterial[]): TrainingMaterial[] {
    return trainingMaterials.map(material => {
      const newMaterial = new TrainingMaterial(material);
      newMaterial.concepts = this.formatFirestoreConcepts(newMaterial.concepts);
      if (!newMaterial.created) newMaterial.created = newMaterial.updatedAt.toDate();
      else newMaterial.created = newMaterial.created.toDate();
      return newMaterial;
    });
  }

  private formatFirestoreConcepts(concepts: string[]){
    const regex = /\[(.*?)\]/;
    return concepts.map(concept => concept.match(regex)?.[1])
    .filter(Boolean) as string[];
  }

  public deleteTrainingMaterial(material: TrainingMaterial): Observable<void> {
    return this.firebaseService.deleteTrainingMaterial(material);
  }
}