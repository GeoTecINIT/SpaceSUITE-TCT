import { Injectable } from "@angular/core";
import { TrainingMaterial } from "../model/trainingMaterial";
import { BehaviorSubject, concatMap, filter, forkJoin, map, Observable, of, take } from "rxjs";
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
  private trainingMaterialArray: BehaviorSubject<TrainingMaterial[] | undefined> = new BehaviorSubject<TrainingMaterial[] | undefined>(undefined);
  private imagePlaceholder: string = "https://www.esri.com/content/dam/esrisites/en-us/home/homepage-what-is-gis-static-dynamic.jpg";

  constructor(private firebaseService: FirebaseService, private languageService: LanguageService, private bokInfoService: BokInformationService) { }

  public validate(material: TrainingMaterial): Map<string, string | undefined> {
    const urlRegex = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/\S*)?$/;
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
  
    setError('language', !material.language?.trim(), 'Language is required.');
    setError('type', !material.materialType?.trim(), 'Type is required.');
    setError('userId', !material.userId.trim(), 'User ID is required.');
    setError('organization', !material.orgId?.trim(), 'Organization is required.');
    setError('division', !material.division?.trim(), 'Division is required.');
    setError('source', !material.url.trim(), 'Source is required.');
    if (!errors.get('source')) setError('source', !urlRegex.test(material.url), 'Invalid source format.');
    if (material.image) setError('image', !urlRegex.test(material.image), 'Invalid image url format.');
    setError('license', !material.license?.trim(), 'License is required.');
  
    // Array fields
    setError('format', material.materialFormat.length === 0, 'At least one format is required.');
    setError('educationLevel', material.educationLevel.length === 0, 'Education level is required.');
  
    // Numeric field
    if (typeof material.SizeOrDuration !== 'number' || material.SizeOrDuration <= 0) {
      errors.set('SizeOrDuration', 'A valid duration greater than 0 is required.');
    } else {
      errors.set('SizeOrDuration', undefined);
    }
  
    return errors;
  }

  public submitNewMaterial(newMaterial: TrainingMaterial): Observable<void> {
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
        return this.firebaseService.setTrainingMaterial(newMaterial);
      })
    );
  }

  public getTrainingMaterials(): Observable<TrainingMaterial[] | undefined> {
    let currentTrainingMaterial: TrainingMaterial[] | undefined = this.trainingMaterialArray.getValue();
    if (!currentTrainingMaterial || currentTrainingMaterial.length == 0) {
      this.firebaseService.getTrainingMaterial().subscribe( newTrainingMaterials => {
        const cleanedMaterials = this.formatTrainingMaterials(newTrainingMaterials);
        this.trainingMaterialArray.next(cleanedMaterials)
      });
    }
    return this.trainingMaterialArray.asObservable();
  }

  public getTrainingMaterial(materialName: string): Observable<TrainingMaterial | undefined> {
    return this.getTrainingMaterials().pipe(
      filter( material => material != undefined),
      map((trainingMaterials: TrainingMaterial[]) => {
        return trainingMaterials.find(material => material.title.replace(/\s+/g, '_').toLowerCase() == materialName)
      })
    );
  }

  private formatTrainingMaterials(trainingMaterials: TrainingMaterial[]): TrainingMaterial[] {
    return trainingMaterials.map(material => {
      const newMaterial = new TrainingMaterial(material);
      newMaterial.concepts = this.formatFirestoreConcepts(newMaterial.concepts);
      if (!newMaterial.image) newMaterial.image = this.imagePlaceholder;
      if (newMaterial.eqf != '') newMaterial.educationLevel.push(newMaterial.eqf);
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
}