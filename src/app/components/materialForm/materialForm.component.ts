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
import { catchError, of, take } from "rxjs";
import { FileUploadHandlerEvent, FileUploadModule } from 'primeng/fileupload';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from "primeng/tooltip";

@Component({
  standalone: true,
  selector: 'material-form',
  templateUrl: './materialForm.component.html',
  styleUrls: ['./materialForm.component.css'],
  imports: [InputTextModule, FloatLabelModule, FormsModule, InputIconModule, IconFieldModule, TextareaModule, SelectModule, CommonModule, DividerModule,
    StepperModule, ButtonModule, DatePickerModule, MultiSelectModule, TextChipsComponent, InputNumberModule, BokModalComponent, ToastModule, FileUploadModule,
    TooltipModule],
  providers: [MessageService]
})
export class MaterialFormComponent {

  @Input() pageName: string = 'Create New Material';
  @Input() inputMaterial?: TrainingMaterial;
  material: TrainingMaterial = new TrainingMaterial();

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

  uploadedImage: File | undefined;
  uploadedImageB64: string | undefined;

  constructor(private cardFilterService: CardFilterService, private firebaseService: FirebaseService, private messageService: MessageService,
              private trainingMaterialService: TrainingMaterialService, private router: Router) {
    this.languageSelector = this.cardFilterService.getOptionByLabel('Language');
    this.typeSelector = this.cardFilterService.getOptionByLabel('Course Type');
    this.formatSelector = this.cardFilterService.getOptionByLabel('Course Format');
    this.eqfSelector = this.cardFilterService.getOptionByLabel('EQF Level');
    this.licenseSelector = this.cardFilterService.getOptionByLabel('License');

    this.material.userId = this.firebaseService.getUserData()?.uid!;
    this.organizationSelector.tags = [];
    this.firebaseService.getUserOrganizationList().subscribe(organizations => organizations.forEach(organization =>
      this.organizationSelector.tags.push({label: organization.name, value: organization._id})
    ));
  }

  ngOnInit() {
    if (this.inputMaterial) {
      this.material = this.inputMaterial;
      if (this.material.division == '') this.material.division = undefined;
      this.firebaseService.getOrganizationDivisions(this.material.orgId!).pipe(take(1)).subscribe(divisions => this.divisionSelector.tags = divisions);
    }
  }

  loadDivisions(newValue: {label: string, value: string}) {
    this.material.orgId = newValue.value;
    this.material.orgName = newValue.label;
    this.material.division = undefined;
    this.firebaseService.getOrganizationDivisions(this.material.orgId!).subscribe(divisions => this.divisionSelector.tags = divisions);
  }

  getUserName() {
    const userData = this.firebaseService.getUserData();
    if (userData) {
      if (userData.displayName) return userData.displayName;
      else return userData.email
    }
    else {
      return '';
    }
  }

  submitMaterial() {
    this.errorMap = this.trainingMaterialService.validate(this.material)
    const allValid: boolean = Array.from(this.errorMap.values()).every(value => value === undefined);
    if (allValid) {
      if (this.material.division == undefined) this.material.division = '';
      this.trainingMaterialService.submitMaterial(this.material, this.uploadedImage, this.inputMaterial != undefined).pipe(
        take(1),
        catchError( () => {
          this.messageService.add({ 
            severity: 'error', 
            summary: 'Error', 
            detail: 'Something went wrong. Try again later or contact the administrator.', 
            life: 3000, 
            closable: true 
          });
          return of(null)
        })
      ).subscribe(materialId => {
        if (materialId != null) {
          this.router.navigate(
            [materialId], 
            { 
              queryParams: { 
                submited: true, 
                mode: this.inputMaterial != undefined ? 'update' : 'create' 
              } 
            }
          );
        }
      });
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

  onFileSelected(input: FileUploadHandlerEvent) {
    if (input.files.length == 1) {
      const file = input.files[0];
      if (!file.type.includes('image/')) return;
      this.uploadedImage = file;
      const reader = new FileReader();
      reader.readAsDataURL(file); 
      reader.onload = (_event) => { 
          this.uploadedImageB64 = reader.result?.toString() ?? undefined; 
      }
    }
  }

  onFileDeleted() {
    this.uploadedImageB64 = undefined;
    this.uploadedImage = undefined;
    this.material.image = '';
  }

  returnToHomepage() {
    this.router.navigate(['']);
  }
}