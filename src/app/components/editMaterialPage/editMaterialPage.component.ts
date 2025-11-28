import { Component, NgZone } from "@angular/core";
import { TrainingMaterial } from "../../model/trainingMaterial";
import { TrainingMaterialService } from "../../services/trainingMaterial.service";
import { MaterialFormComponent } from "../materialForm/materialForm.component";
import { ActivatedRoute, Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { LanguageService } from "../../services/language.service";
import { UtilsService } from "../../services/utils.service";
import { FirebaseService } from "../../services/firebase.service";
import { concatMap } from "rxjs";
import { ExitWithoutSavingService } from "@eo4geo/ngx-bok-utils";

@Component({
  standalone: true,
  selector: 'edit-material-page',
  template: '<material-form *ngIf="material" [inputMaterial]="material" pageName="Edit Material">',
  imports: [MaterialFormComponent, CommonModule],
})
export class EditMaterialPageComponent {
  material: TrainingMaterial | undefined;

  constructor(private trainingMaterialService: TrainingMaterialService, private route: ActivatedRoute, private router: Router, private languageService: LanguageService,
              private utilsService: UtilsService, private firebase: FirebaseService, private exitWithoutSavingService: ExitWithoutSavingService) {}

  ngOnInit() {
    this.route.paramMap.pipe(
      concatMap(params => {
        const materialName = params.get('dynamicValue') || '';
        return this.trainingMaterialService.getTrainingMaterial(materialName);
      }),
      concatMap( (material: TrainingMaterial | undefined) => {
        if (material) this.loadMaterial(material);
        return this.firebase.getUserOrganizationList();
      })
    ).subscribe(
      (orgsList: {_id: string, name: string}[]) => {
        const userData = this.firebase.getUserData();
        const userOrgIds = orgsList.map(org => org._id);
        if (!this.material || !((this.material.orgId && userOrgIds.includes(this.material.orgId)) || (userData && this.material.userId === userData.uid))) {
          this.exitWithoutSavingService.bypassGuard.next(true);
          this.router.navigate(['/not_found']);
        }
      }
    );
  }

  private loadMaterial(newMaterial: TrainingMaterial) {
    this.material = new TrainingMaterial(newMaterial);
    this.material.educationLevel = this.material.educationLevel.map( value => 'EQF ' + value);
    this.material.language = this.languageService.getLanguage(this.material.language!);
    this.material.subject = this.material.subject.map(subject => this.utilsService.codeToKnowledgeArea.get(subject) || subject);
  }
}