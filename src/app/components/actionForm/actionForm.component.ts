import { Component, Input} from "@angular/core";
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
import { AutoCompleteCompleteEvent, AutoCompleteModule } from 'primeng/autocomplete';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { BokModalComponent } from "../bokModal/bokModal.component";
import { FirebaseService } from "../../services/firebase.service";
import { Router } from "@angular/router";
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MenuItem, MessageService } from "primeng/api";
import { CommonModule } from "@angular/common";
import { catchError, EMPTY, finalize, map, of, Subscription, take } from "rxjs";
import { FileUploadHandlerEvent, FileUploadModule } from 'primeng/fileupload';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from "primeng/tooltip";
import { MultiselectChipsComponent } from "../multiselectChips/multiselectChips.component";
import { CustomSelectComponent } from "../customSelect/customSelect.component";
import { AuthService, ExitWithoutSavingService } from "@eo4geo/ngx-bok-utils";
import { ConfirmDialog } from "primeng/confirmdialog";
import { SelectButton } from 'primeng/selectbutton';
import { TrainingAction } from "../../model/trainingAction";
import { TrainingActionService } from "../../services/trainingAction.service";
import { OpenrouteService } from "../../services/openroute.service";
import { ActionLocation } from "../../model/actionLocation";
import { DurationInputComponent } from "../durationInput/durationInput.component";
import { InputGroupModule } from "primeng/inputgroup";
import { InputGroupAddonModule } from "primeng/inputgroupaddon";
import { MenuModule } from "primeng/menu";
import { WorkloadUnit } from "../../model/trainingItem";
import { DraftStorageService } from "../../services/draftStorage.service";

@Component({
  standalone: true,
  selector: 'action-form',
  templateUrl: './actionForm.component.html',
  styleUrls: ['../materialForm/materialForm.component.css'],
  imports: [InputTextModule, FloatLabelModule, FormsModule, InputIconModule, IconFieldModule, TextareaModule, SelectModule, CommonModule, DividerModule,
    StepperModule, ButtonModule, DatePickerModule, MultiSelectModule, TextChipsComponent, InputNumberModule, BokModalComponent, ToastModule, FileUploadModule, MenuModule,
    TooltipModule, MultiselectChipsComponent, CustomSelectComponent, ConfirmDialog, SelectButton, AutoCompleteModule, DurationInputComponent, InputGroupModule, InputGroupAddonModule],
  providers: [MessageService, ConfirmationService]
})
export class ActionFormComponent {

  @Input() pageName: string = 'Create New Action';
  @Input() inputAction?: TrainingAction;
  action: TrainingAction = new TrainingAction();

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

  locationSuggestions: ActionLocation[] = [];

  wrokloadUnitOptions: MenuItem[] = [
    { label: WorkloadUnit.ECTS },
    { label: WorkloadUnit.Hours }
  ];

  constructor(private exitWithoutSavingService: ExitWithoutSavingService, private firebaseService: FirebaseService, private messageService: MessageService, 
              private openrouteService: OpenrouteService, private trainingActionService: TrainingActionService, private router: Router, 
              private confirmationService: ConfirmationService, private authService: AuthService, private draftService: DraftStorageService) {}

  ngOnInit() {
    this.authSubscription = this.authService.getUserState().subscribe(state => {
      if (state?.logged) {
        if (this.inputAction === undefined) this.action.userId = state.uid;
      }
      else {
        this.exitWithoutSavingService.bypassGuard.next(true);
        this.router.navigate(['action']);
      }
    })
    
    this.userOrgsSubscription = this.firebaseService.getUserOrganizationList().subscribe(organizations => {
      this.organizationSelector.values = [];
      organizations.forEach(organization =>
        this.organizationSelector.values.push({label: organization.name, value: organization._id})
      )
    });

    const formDraft: TrainingAction | null = this.draftService.loadAction();
    if (formDraft && (!this.inputAction || formDraft._id == this.inputAction._id)) {
      this.action = formDraft;
    }
    else if (this.inputAction) {
      this.action = this.inputAction;
      
    }
    if (this.action.division == '') this.action.division = undefined;
    if (this.action.orgId) this.firebaseService.getOrganizationDivisions(this.action.orgId).pipe(take(1)).subscribe(divisions => this.divisionSelector.values = divisions);

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
    this.saveDraft()
    this.action.orgId = newValue.value;
    this.action.orgName = newValue.label;
    this.action.division = undefined;
    this.firebaseService.getOrganizationDivisions(this.action.orgId!).subscribe(divisions => this.divisionSelector.values = divisions);
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

  submitAction() {
    let submitted: boolean = false;
    this.errorMap = this.trainingActionService.validate(this.action)
    const allValid: boolean = Array.from(this.errorMap.values()).every(value => value === undefined);
    if (allValid) {
      this.exitWithoutSavingService.bypassGuard.next(true);
      if (this.action.division == undefined) this.action.division = '';
      this.trainingActionService.submitAction(this.action, this.uploadedImage, this.inputAction != undefined).pipe(
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
              ['action/' + this.action._id], 
              { 
                queryParams: { 
                  submited: true, 
                  mode: this.inputAction != undefined ? 'update' : 'create' 
                } 
              }
            );
          }
        })
      ).subscribe(actionId => {
        submitted = true;
        this.action._id = actionId;
        this.draftService.clearAction();
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
    this.action.image = '';
  }

  returnToHomepage() {
    if (this.inputAction != undefined) this.router.navigate(['action/' + this.inputAction._id]);
    else this.router.navigate(['action']);
  }

  goToNextStep(callback: (nextStepValue: number) => void, index: number) {
    callback(index);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 0);
  }

  saveDraft() {
    this.draftService.saveAction(this.action);
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
        this.draftService.clearAction();
        this.exitWithoutSavingService.exitSubject.next(true);
      },
      reject: () => this.exitWithoutSavingService.exitSubject.next(false),
    });
  }

  searchLocation(input: AutoCompleteCompleteEvent) {
    this.openrouteService.getRecommendations(input.query).pipe(
      take(1),
      map(values => this.locationSuggestions = values)
    ).subscribe()
  }

  onLocationChange(value: string | ActionLocation) {
    if (value instanceof ActionLocation) this.action.location = value;
    else this.action.location.name = value;
  }

  onActionModalityChange(value: string) {
    if (value === 'Online') this.action.location = new ActionLocation();
  }

  setWorkloadUnit(value: WorkloadUnit) {
    this.saveDraft();
    this.action.workloadUnit = value;
  }
}