import { Component } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { LanguageService } from "../../services/language.service";
import { UtilsService } from "../../services/utils.service";
import { FirebaseService } from "../../services/firebase.service";
import { concat, concatMap } from "rxjs";
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
export class EditActionPageComponent {
  action: TrainingAction | undefined;

  constructor(private trainingActionService: TrainingActionService, private route: ActivatedRoute, private router: Router, private languageService: LanguageService,
              private utilsService: UtilsService, private firebase: FirebaseService, private exitWithoutSavingService: ExitWithoutSavingService) {}

  ngOnInit() {
    this.route.paramMap.pipe(
      concatMap(params => {
        const actionName = params.get('dynamicValue') || '';
        return this.trainingActionService.getTrainingAction(actionName);
      }),
      concatMap( (action: TrainingAction | undefined) => {
        if (action) this.loadMaterial(action);
        return this.firebase.getUserOrganizationList();
      })
    ).subscribe(
      (orgsList: {_id: string, name: string}[]) => {
        const userData = this.firebase.getUserData();
        const userOrgIds = orgsList.map(org => org._id);
        if (!this.action || !((this.action.orgId && userOrgIds.includes(this.action.orgId)) || (userData && this.action.userId === userData.uid))) {
          this.exitWithoutSavingService.bypassGuard.next(true);
          this.router.navigate(['/not_found']);
        }
      }
    );
  }

  private loadMaterial(newAction: TrainingAction) {
    this.action = new TrainingAction(newAction);
    this.action.educationLevel = this.action.educationLevel.map( value => 'EQF ' + value);
    this.action.language = this.action.language ? this.languageService.getLanguage(this.action.language!) : undefined;
    this.action.subject = this.action.subject.map(subject => this.utilsService.codeToKnowledgeArea.get(subject) || subject);
  }
}