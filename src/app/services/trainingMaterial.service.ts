import { Injectable } from "@angular/core";
import { TrainingMaterial } from "../model/trainingMaterial";
import { BehaviorSubject, filter, map, Observable } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { FirebaseService } from "./firebase.service";

@Injectable({
    providedIn: 'root',
})
export class TrainingMaterialService {
    private trainingMaterialArray: BehaviorSubject<TrainingMaterial[] | undefined> = new BehaviorSubject<TrainingMaterial[] | undefined>(undefined);

    constructor(private http: HttpClient, private firebaseService: FirebaseService) { }

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