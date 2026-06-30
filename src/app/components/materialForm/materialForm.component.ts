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
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { BokModalComponent } from "../bokModal/bokModal.component";
import { FirebaseService } from "../../services/firebase.service";
import { TrainingMaterialService } from "../../services/trainingMaterial.service";
import { Router } from "@angular/router";
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MenuItem, MessageService } from "primeng/api";
import { CommonModule } from "@angular/common";
import { catchError, EMPTY, finalize, of, Subscription, take } from "rxjs";
import { FileUploadHandlerEvent, FileUploadModule } from 'primeng/fileupload';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from "primeng/tooltip";
import { MultiselectChipsComponent } from "../multiselectChips/multiselectChips.component";
import { CustomSelectComponent } from "../customSelect/customSelect.component";
import { AuthService, ExitWithoutSavingService } from "@eo4geo/ngx-bok-utils";
import { ConfirmDialog } from "primeng/confirmdialog";
import { SelectButton } from 'primeng/selectbutton';
import { MenuModule } from "primeng/menu";
import { InputGroupAddonModule } from "primeng/inputgroupaddon";
import { InputGroupModule } from "primeng/inputgroup";
import { WorkloadUnit } from "../../model/trainingItem";
import { DraftStorageService } from "../../services/draftStorage.service";

@Component({
  standalone: true,
  selector: 'material-form',
  templateUrl: './materialForm.component.html',
  styleUrls: ['./materialForm.component.css'],
  imports: [InputTextModule, FloatLabelModule, FormsModule, InputIconModule, IconFieldModule, TextareaModule, SelectModule, CommonModule, DividerModule,
    StepperModule, ButtonModule, DatePickerModule, MultiSelectModule, TextChipsComponent, InputNumberModule, BokModalComponent, ToastModule, FileUploadModule,
    TooltipModule, MultiselectChipsComponent, CustomSelectComponent, ConfirmDialog, SelectButton, MenuModule, InputGroupAddonModule, InputGroupModule],
  providers: [MessageService, ConfirmationService]
})
export class MaterialFormComponent {

  @Input() pageName: string = 'Create New Material';
  @Input() inputMaterial?: TrainingMaterial;
  material: TrainingMaterial = new TrainingMaterial();

  organizationSelector = {
    label: 'Organization',
    values: [] as any[],
    selection: []
  };
  divisionSelector: FilterOption = {
    label: 'Division',
    values: [],
    selection: []
  };

  errorMap: Map<string, string | undefined> = new Map();

  uploadedImage: File | undefined;
  uploadedImageB64: string | undefined;

  private authSubscription!: Subscription
  private userOrgsSubscription!: Subscription

  visibilityFieldOptions: any[] = [{ label: 'Public', value: true },{ label: 'Private', value: false }];

  wrokloadUnitOptions: MenuItem[] = [
      { label: WorkloadUnit.ECTS },
      { label: WorkloadUnit.Hours }
    ];

  constructor(private exitWithoutSavingService: ExitWithoutSavingService, private firebaseService: FirebaseService, private messageService: MessageService,
              private trainingMaterialService: TrainingMaterialService, private router: Router, private confirmationService: ConfirmationService, 
              private authService: AuthService, private draftService: DraftStorageService) {}

  ngOnInit() {
    this.authSubscription = this.authService.getUserState().subscribe(state => {
      if (state?.logged) {
        if (this.inputMaterial === undefined) this.material.userId = state.uid;
      }
      else {
        this.exitWithoutSavingService.bypassGuard.next(true);
        this.router.navigate(['material']);
      }
    })
    
    this.userOrgsSubscription = this.firebaseService.getUserOrganizationList().subscribe(organizations => {
      this.organizationSelector.values = [];
      organizations.forEach(organization =>
        this.organizationSelector.values.push({label: organization.name, value: organization._id})
      )
    });

    const formDraft: TrainingMaterial | null = this.draftService.loadMaterial();
    if (formDraft && (!this.inputMaterial || formDraft._id == this.inputMaterial._id)) {
      this.material = formDraft;
    }
    else if (this.inputMaterial) {
      this.material = this.inputMaterial;
    }
    if (this.material.division == '') this.material.division = undefined;
    if (this.material.orgId) this.firebaseService.getOrganizationDivisions(this.material.orgId).pipe(take(1)).subscribe(divisions => this.divisionSelector.tags = divisions);
    
    this.exitWithoutSavingService.showModalSubject.subscribe(value => {
      if (value) this.confirmExitWithoutSaving()
    })
  }

  ngAfterViewInit() {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 0);
  }

  ngOnDestroy() {
    this.authSubscription.unsubscribe();
    this.userOrgsSubscription.unsubscribe();
  }

  loadDivisions(newValue: {label: string, value: string}) {
    this.saveDraft();
    this.material.orgId = newValue.value;
    this.material.orgName = newValue.label;
    this.material.division = undefined;
    this.firebaseService.getOrganizationDivisions(this.material.orgId!).subscribe(divisions => this.divisionSelector.values = divisions);
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
    let submitted: boolean = false;
    this.errorMap = this.trainingMaterialService.validate(this.material)
    const allValid: boolean = Array.from(this.errorMap.values()).every(value => value === undefined);
    if (allValid) {
      this.exitWithoutSavingService.bypassGuard.next(true);
      if (this.material.division == undefined) this.material.division = '';
      this.trainingMaterialService.submitMaterial(this.material, this.uploadedImage, this.inputMaterial != undefined).pipe(
        take(1),
        catchError( error => {
          console.log(error)
          this.messageService.add({ 
            severity: 'error', 
            summary: 'Error', 
            detail: 'Something went wrong. Try again later or contact the administrator.', 
            life: 3000, 
            closable: true 
          });
          return EMPTY
        }),
        finalize(() => {
          if (submitted){
            this.router.navigate(
              ['material/' + this.material._id], 
              { 
                queryParams: { 
                  submited: true, 
                  mode: this.inputMaterial != undefined ? 'update' : 'create' 
                } 
              }
            );
          }
        })
      ).subscribe(materialId => {
        submitted = true;
        this.material._id = materialId;
        this.draftService.clearMaterial();
      });
    }
    else {
      for (let entry of this.errorMap.entries()) {
        if (entry[1] != undefined) {
          this.messageService.add({ 
            severity: 'error', 
            summary: 'Error', 
            detail: entry[1], 
            life: 3000, 
            closable: true 
          });
        }
      }
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
    if (this.inputMaterial != undefined) this.router.navigate(['material/' + this.inputMaterial._id]);
    else this.router.navigate(['material']);
  }

  goToNextStep(callback: (nextStepValue: number) => void, index: number) {
    callback(index);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 0);
  }

  saveDraft() {
    this.draftService.saveMaterial(this.material);
  }

  confirmExitWithoutSaving() {
    this.confirmationService.confirm({
      message: 'Are you sure that you want to exit without saving?',
      header: 'Exit Without Saving',
      icon: 'pi pi-info-circle',
      rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
      },
      acceptButtonProps: {
        label: 'Exit',
        severity: 'primary',
      },
      accept: () => {
        this.draftService.clearMaterial();
        this.exitWithoutSavingService.exitSubject.next(true);
      },
      reject: () => this.exitWithoutSavingService.exitSubject.next(false),
    });
  }

  setWorkloadUnit(value: WorkloadUnit) {
    this.material.workloadUnit = value;
    this.saveDraft();
  }
}