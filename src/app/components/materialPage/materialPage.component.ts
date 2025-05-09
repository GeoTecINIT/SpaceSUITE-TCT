import { Component} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { TrainingMaterialService } from "../../services/trainingMaterial.service";
import { TrainingMaterial } from "../../model/trainingMaterial";
import { CommonModule } from "@angular/common";
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { PanelModule } from 'primeng/panel';
import { TabsModule } from 'primeng/tabs';
import { DividerModule } from 'primeng/divider';
import { UtilsService } from "../../services/utils.service";
import { BokInformationService } from "@eo4geo/ngx-bok-visualization";
import { FirebaseService } from "../../services/firebase.service";
import { take, tap } from "rxjs";
import { ConfirmationService, MessageService } from "primeng/api";
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';

@Component({
  standalone: true,
  selector: 'material-page',
  templateUrl: './materialPage.component.html',
  styleUrls: ['./materialPage.component.css'],
  imports: [CommonModule, ProgressSpinnerModule, ButtonModule, TagModule, PanelModule, TabsModule, DividerModule, ConfirmDialogModule, ToastModule],
  providers: [ConfirmationService, MessageService]
})
export class MaterialPageComponent {

  material: TrainingMaterial | undefined;

  deprecatedConcepts: string[] = [];
  currentConcepts: string[] = [];
  
  selectedConceptsColor: Map<string, string> = new Map();
  selectedConceptsTooltip: Map<string, string> = new Map();  

  imagePlaceholder: string;

  constructor(private route: ActivatedRoute, private router: Router, private trainingMaterialService: TrainingMaterialService, 
              private utilsService: UtilsService, private bokInfo: BokInformationService, private firebaseService: FirebaseService,
              private confirmationService: ConfirmationService,private messageService: MessageService) {
                this.imagePlaceholder = this.utilsService.imagePlaceholder;
              }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
        const materialName = params.get('dynamicValue') || '';
        this.trainingMaterialService.getTrainingMaterial(materialName).pipe(take(1)).subscribe(
          (newMaterial: TrainingMaterial | undefined) => {
            if (newMaterial) {
              this.material = newMaterial;
              this.currentConcepts = [];
              this.deprecatedConcepts = [];
              this.material.concepts.forEach(concept => {
                this.bokInfo.getConceptColor(concept).subscribe(
                  color => {
                    const softColor = color ? this.utilsService.convertHexToRgba(color, 0.5) : '';
                    this.selectedConceptsColor.set(concept, softColor)
                  }
                );
                this.bokInfo.getConceptName(concept).subscribe(
                  tooltip => {
                    if (tooltip){
                      this.selectedConceptsTooltip.set(concept, tooltip);
                      this.currentConcepts.push(concept);
                    }
                    else {
                      this.selectedConceptsTooltip.set(concept, 'Deprecated concept');
                      this.deprecatedConcepts.push(concept);
                    }
                  }
                );
              })
            }
            else this.router.navigate(['not_found'], { replaceUrl: true });
          }
        )
    });

    this.route.queryParams.subscribe(params => {
      const submited: boolean = params['submited'];
      const mode: string = params['mode'];
      if (submited){
        switch (mode){
          case 'update':
            this.messageService.add({ 
              severity: 'info', 
              summary: 'Info', 
              detail: `Material updated without problems.`,
              life: 3000, 
              closable: true 
            }); 
            break
          case 'create':
            this.messageService.add({ 
              severity: 'info', 
              summary: 'Info', 
              detail: `Material created without problems.`,
              life: 3000, 
              closable: true 
            }); 
            break
        }
      }
    });
  }

  goToMainPage() {
    this.router.navigate([''], { replaceUrl: true });
  }

  editMaterial() {
    this.router.navigate(['edit/' + this.material?._id], { replaceUrl: true });
  }

  deleteModal(event: Event) {
    this.confirmationService.confirm({
        target: event.target as EventTarget,
        message: 'Do you want to delete this training material?',
        header: 'Delete Material',
        icon: 'pi pi-info-circle',
        rejectLabel: 'Cancel',
        rejectButtonProps: {
            label: 'Cancel',
            severity: 'secondary',
        },
        acceptButtonProps: {
            label: 'Delete',
            severity: 'primary',
        },

        accept: () => {
          this.deleteMaterial();
        },
        reject: () => {
        },
    });
  }

  deleteMaterial() {
    this.trainingMaterialService.deleteTrainingMaterial(this.material!).pipe(
      tap(() => this.material = undefined),
      take(1)
    ).subscribe(() => this.goToMainPage());
  }

  checkUser() {
    return (this.firebaseService.userId == this.material?.userId);
  }

  onClickConcept(code: string) {
    window.open('https://bok.eo4geo.eu/' + code)
  }
}