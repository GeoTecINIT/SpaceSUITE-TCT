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

@Component({
  standalone: true,
  selector: 'material-form',
  templateUrl: './materialForm.component.html',
  styleUrls: ['./materialForm.component.css'],
  imports: [InputTextModule, FloatLabelModule, FormsModule, InputIconModule, IconFieldModule, TextareaModule, 
    StepperModule, ButtonModule, DatePickerModule, MultiSelectModule, TextChipsComponent, InputNumberModule],
})
export class MaterialFormComponent {

  @Input() material: TrainingMaterial = new TrainingMaterial();

  languageSelector: FilterOption;
  typeSelector: FilterOption;
  formatSelector: FilterOption;
  eqfSelector: FilterOption;
  licenseSelector: FilterOption;

  constructor(private cardFilterService: CardFilterService) {
    this.languageSelector = this.cardFilterService.getOptionByLabel('Language');
    this.typeSelector = this.cardFilterService.getOptionByLabel('Course Type');
    this.formatSelector = this.cardFilterService.getOptionByLabel('Course Format');
    this.eqfSelector = this.cardFilterService.getOptionByLabel('EQF Level');
    this.licenseSelector = this.cardFilterService.getOptionByLabel('License');
  }  
}