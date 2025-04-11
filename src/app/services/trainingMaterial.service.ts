import { Injectable } from "@angular/core";
import { TrainingMaterial } from "../model/trainingMaterial";
import { BehaviorSubject, filter, map, Observable, timeout } from "rxjs";
import { HttpClient } from "@angular/common/http";

@Injectable({
    providedIn: 'root',
})
export class TrainingMaterialService {
    private trainingMaterialArray: BehaviorSubject<TrainingMaterial[] | undefined> = new BehaviorSubject<TrainingMaterial[] | undefined>(undefined);

    private jsonUrl = 'assets/data.json'; // Path to your JSON file

    constructor(private http: HttpClient) { }

    public getTrainingMaterials(): Observable<TrainingMaterial[] | undefined> {
        let currentTrainingMaterial: TrainingMaterial[] | undefined = this.trainingMaterialArray.getValue();
        if (!currentTrainingMaterial || currentTrainingMaterial.length == 0) {
            this.http.get<TrainingMaterial[]>(this.jsonUrl).subscribe(
                data => {
                    setTimeout(() => this.trainingMaterialArray.next(data), 2000);
                }
            )

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