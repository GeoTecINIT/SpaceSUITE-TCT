import { Component } from "@angular/core";
import { TrainingMaterial } from "../../model/trainingMaterial";
import { TrainingMaterialService } from "../../services/trainingMaterial.service";
import { MaterialFormComponent } from "../materialForm/materialForm.component";
import { ActivatedRoute, Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { LanguageService } from "../../services/language.service";


@Component({
  standalone: true,
  selector: 'edit-page',
  template: '<material-form *ngIf="material" [inputMaterial]="material" pageName="Edit Material">',
  imports: [MaterialFormComponent, CommonModule],
})
export class EditPageComponent {
  material!: TrainingMaterial;

  constructor(private trainingMaterialService: TrainingMaterialService, private route: ActivatedRoute, private router: Router, private languageService: LanguageService) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const materialName = params.get('dynamicValue') || '';
      this.trainingMaterialService.getTrainingMaterial(materialName).subscribe(
        (newMaterial: TrainingMaterial | undefined) => {
          if (newMaterial) {
            this.material = new TrainingMaterial(newMaterial);
            this.material.educationLevel = this.material.educationLevel.map( value => 'EQF ' + value);
            this.material.language = this.languageService.getLanguage(this.material.language!);
          }
          else this.router.navigate(['not_found'], { replaceUrl: true });
        }
      )
    });
  }
}