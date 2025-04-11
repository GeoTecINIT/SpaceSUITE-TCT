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

@Component({
  standalone: true,
  selector: 'material-page',
  templateUrl: './materialPage.component.html',
  styleUrls: ['./materialPage.component.css'],
  imports: [CommonModule, ProgressSpinnerModule, ButtonModule, TagModule, PanelModule, TabsModule, DividerModule],
})
export class MaterialPageComponent {

  material: TrainingMaterial | undefined;

  deprecatedConcepts: string[] = [];
  currentConcepts: string[] = [];
  
  selectedConceptsColor: Map<string, string> = new Map();
  selectedConceptsTooltip: Map<string, string> = new Map();  

  constructor(private route: ActivatedRoute, private router: Router, private trainingMaterialService: TrainingMaterialService, private utilsService: UtilsService, private bokInfo: BokInformationService) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
        const materialName = params.get('dynamicValue') || 'GIST';
        this.trainingMaterialService.getTrainingMaterial(materialName).subscribe(
          (newMaterial: TrainingMaterial | undefined) => {
            if (newMaterial) {
              this.material = newMaterial;
              this.material.relation = this.material.relation.map(element => element.replace(/^eo4geo:/, ""));
              this.material.relation.forEach(concept => {
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
  }

  goToMainPage() {
    this.router.navigate([''], { replaceUrl: true });
  }

  onClickConcept(code: string) {
    window.open('https://bok.eo4geo.eu/' + code)
  }
}