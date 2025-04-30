import { Component, Input} from "@angular/core";
import { TrainingMaterial } from "../../model/trainingMaterial";
import { InputTextModule } from "primeng/inputtext";
import { FloatLabelModule } from "primeng/floatlabel";
import { FormsModule } from "@angular/forms";
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { TextareaModule } from 'primeng/textarea';
import { StepperModule } from 'primeng/stepper';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { MultiSelectModule } from 'primeng/multiselect';
import { TextChipsComponent } from "../textChips/textChips.component";
import { FilterOption } from "../../model/filterOption";
import { CardFilterService } from "../../services/cardFilter.service";
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { BokModalComponent } from "../bokModal/bokModal.component";
import { FirebaseService } from "../../services/firebase.service";
import { TrainingMaterialService } from "../../services/trainingMaterial.service";
import { Router } from "@angular/router";
import { ToastModule } from 'primeng/toast';
import { MessageService } from "primeng/api";
import { CommonModule } from "@angular/common";
import { take } from "rxjs";

@Component({
  standalone: true,
  selector: 'material-form',
  templateUrl: './materialForm.component.html',
  styleUrls: ['./materialForm.component.css'],
  imports: [InputTextModule, FloatLabelModule, FormsModule, InputIconModule, IconFieldModule, TextareaModule, SelectModule, CommonModule,
    StepperModule, ButtonModule, DatePickerModule, MultiSelectModule, TextChipsComponent, InputNumberModule, BokModalComponent, ToastModule],
  providers: [MessageService]
})
export class MaterialFormComponent {

  @Input() material: TrainingMaterial = new TrainingMaterial();

  languageSelector: FilterOption;
  typeSelector: FilterOption;
  formatSelector: FilterOption;
  eqfSelector: FilterOption;
  licenseSelector: FilterOption;
  organizationSelector = {
    label: 'Organization',
    tags: [] as any[],
    selection: []
  };
  divisionSelector: FilterOption = {
    label: 'Division',
    tags: [],
    selection: []
  };

  errorMap: Map<string, string | undefined> = new Map();

  constructor(private cardFilterService: CardFilterService, private firebaseService: FirebaseService, private messageService: MessageService,
              private trainingMaterialService: TrainingMaterialService, private router: Router) {
    this.languageSelector = this.cardFilterService.getOptionByLabel('Language');
    this.typeSelector = this.cardFilterService.getOptionByLabel('Course Type');
    this.formatSelector = this.cardFilterService.getOptionByLabel('Course Format');
    this.eqfSelector = this.cardFilterService.getOptionByLabel('EQF Level');
    this.licenseSelector = this.cardFilterService.getOptionByLabel('License');

    this.material.userId = this.firebaseService.userId;
    this.organizationSelector.tags = [];
    this.firebaseService.getUserOrganizationList().subscribe(organizations => organizations.forEach(organization =>
      this.organizationSelector.tags.push({label: organization.name, value: organization._id})
    ));
  }

  loadDivisions(newValue: {label: string, value: string}) {
    this.material.orgId = newValue.value;
    this.material.orgName = newValue.label;
    this.material.division = undefined;
    this.firebaseService.getOrganizationDivisions(this.material.orgId!).subscribe(divisions => this.divisionSelector.tags = divisions);
  }

  getUserName() {
    return this.firebaseService.getUserData()?.displayName ?? this.material.userId;
  }

  submitMaterial() {
    console.log(this.material)
    this.errorMap = this.trainingMaterialService.validate(this.material)
    const allValid: boolean = Array.from(this.errorMap.values()).every(value => value === undefined);
    if (allValid) {
      this.trainingMaterialService.submitNewMaterial(this.material).pipe(take(1)).subscribe(() => {
        this.router.navigate([''], { replaceUrl: true });
      })
    }
    else {
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'There are incomplete mandatory fields. Please review the form and try to submit again.', 
        life: 3000, 
        closable: true 
      });
    }
  }
}