import { Injectable } from "@angular/core";
import { TrainingMaterial } from "../model/trainingMaterial";
import { BehaviorSubject, filter, map, Observable } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { FirebaseService } from "./firebase.service";

export type ValidationError = {
  field: string;
  message: string;
};

@Injectable({
  providedIn: 'root',
})
export class TrainingMaterialService {
  private trainingMaterialArray: BehaviorSubject<TrainingMaterial[] | undefined> = new BehaviorSubject<TrainingMaterial[] | undefined>(undefined);

  constructor(private http: HttpClient, private firebaseService: FirebaseService) { }

  validate(material: TrainingMaterial): Map<string, string | undefined> {
    const errors: Map<string, string | undefined> = new Map();
  
    const setError = (field: string, condition: boolean, message: string) => {
      errors.set(field, condition ? message : undefined);
    };
  
    // String fields
    setError('title', !material.title.trim(), 'Title is required.');
    setError('publisher', !material.publisher.trim(), 'Publisher is required.');
    setError('created', !material.created.trim(), 'Creation date is required.');
    if (material.created && isNaN(Date.parse(material.created))) {
      errors.set('created', 'Creation date format is invalid.');
    }
  
    setError('language', !material.language?.trim(), 'Language is required.');
    setError('type', !material.type?.trim(), 'Type is required.');
    setError('userId', !material.userId.trim(), 'User ID is required.');
    setError('organization', !material.organization?.trim(), 'Organization is required.');
    setError('division', !material.division?.trim(), 'Division is required.');
    setError('source', !material.source.trim(), 'Source is required.');
    setError('license', !material.license?.trim(), 'License is required.');
  
    // Array fields
    setError('format', material.format.length === 0, 'At least one format is required.');
    setError('educationLevel', material.educationLevel.length === 0, 'Education level is required.');
  
    // Numeric field
    if (typeof material.SizeOrDuration !== 'number' || material.SizeOrDuration <= 0) {
      errors.set('SizeOrDuration', 'A valid duration greater than 0 is required.');
    } else {
      errors.set('SizeOrDuration', undefined);
    }
  
    return errors;
  }

  public getTrainingMaterials(): Observable<TrainingMaterial[] | undefined> {
    let currentTrainingMaterial: TrainingMaterial[] | undefined = this.trainingMaterialArray.getValue();
    if (!currentTrainingMaterial || currentTrainingMaterial.length == 0) {
      setTimeout(() => this.trainingMaterialArray.next([]), 2000);
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
}