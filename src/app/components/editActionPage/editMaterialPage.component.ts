import { Component } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { LanguageService } from "../../services/language.service";
import { UtilsService } from "../../services/utils.service";
import { FirebaseService } from "../../services/firebase.service";
import { concatMap } from "rxjs";
import { ExitWithoutSavingService } from "@eo4geo/ngx-bok-utils";
import { ActionFormComponent } from "../actionForm/actionForm.component";
import { TrainingAction } from "../../model/trainingAction";
import { TrainingActionService } from "../../services/trainingAction.service";

@Component({
  standalone: true,
  selector: 'edit-material-page',
  template: '<action-form *ngIf="action" [inputAction]="action" pageName="Edit Action">',
  imports: [ActionFormComponent, CommonModule],
})
export class EditMaterialPageComponent {
  action: TrainingAction | undefined;

  constructor(private trainingActionService: TrainingActionService, private route: ActivatedRoute, private router: Router, private languageService: LanguageService,
              private utilsService: UtilsService, private firebase: FirebaseService, private exitWithoutSavingService: ExitWithoutSavingService) {}

  ngOnInit() {
    this.route.paramMap.pipe(
      concatMap(params => {
        const actionName = params.get('dynamicValue') || '';
        return this.trainingActionService.getTrainingAction(actionName);
      })
    ).subscribe(
      (newAction: TrainingAction | undefined) => {
        if (newAction && newAction.userId == this.firebase.getUserData()?.uid) {
          this.loadMaterial(newAction);
        }
        else {
          this.exitWithoutSavingService.bypassGuard.next(true);
          this.router.navigate(['/not_found']);
        }
      }
    );
  }

  private loadMaterial(newAction: TrainingAction) {
    this.action = new TrainingAction(newAction);
    this.action.educationLevel = this.action.educationLevel.map( value => 'EQF ' + value);
    this.action.language = this.languageService.getLanguage(this.action.language!);
    this.action.subject = this.action.subject.map(subject => this.utilsService.codeToKnowledgeArea.get(subject) || subject);
  }
}