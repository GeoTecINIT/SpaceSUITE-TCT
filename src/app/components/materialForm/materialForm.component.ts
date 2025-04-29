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

@Component({
  standalone: true,
  selector: 'material-form',
  templateUrl: './materialForm.component.html',
  styleUrls: ['./materialForm.component.css'],
  imports: [InputTextModule, FloatLabelModule, FormsModule, InputIconModule, IconFieldModule, TextareaModule, SelectModule,
    StepperModule, ButtonModule, DatePickerModule, MultiSelectModule, TextChipsComponent, InputNumberModule, BokModalComponent],
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

  constructor(private cardFilterService: CardFilterService, private firebaseService: FirebaseService) {
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

  loadDivisions() {
    this.material.division = '';
    this.firebaseService.getOrganizationDivisions(this.material.organization!).subscribe(divisions => this.divisionSelector.tags = divisions);
  }
}