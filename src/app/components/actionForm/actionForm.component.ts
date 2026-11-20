import { Component, Input, signal, WritableSignal} from "@angular/core";
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
import { ActivatedRoute, Router } from "@angular/router";
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MenuItem, MessageService, TreeNode } from "primeng/api";
import { CommonModule } from "@angular/common";
import { catchError, EMPTY, finalize, map, of, Subscription, switchMap, take } from "rxjs";
import { FileUploadHandlerEvent, FileUploadModule } from 'primeng/fileupload';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from "primeng/tooltip";
import { MultiselectChipsComponent } from "../multiselectChips/multiselectChips.component";
import { CustomSelectComponent } from "../customSelect/customSelect.component";
import { AuthService, ExitWithoutSavingService, PermissionService } from "@eo4geo/ngx-bok-utils";
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
import { OfferToActionService } from "../../services/offerToAction.service";
import { UtilsService } from "../../services/utils.service";
import { LearningOutcomesSelectComponent } from "../learningOutcomesSelect/learningOutcomesSelect.component";
import { BokInformationService } from "@eo4geo/ngx-bok-visualization";
import { BloomSkill } from "../../model/bloomSkill";

@Component({
  standalone: true,
  selector: 'action-form',
  templateUrl: './actionForm.component.html',
  styleUrls: ['../materialForm/materialForm.component.css'],
  imports: [InputTextModule, FloatLabelModule, FormsModule, InputIconModule, IconFieldModule, TextareaModule, SelectModule, CommonModule, DividerModule, LearningOutcomesSelectComponent,
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
    selection: [],
    dynamicValues: false
  };
  divisionSelector: FilterOption = {
    label: 'Division',
    values: [],
    selection: [],
    dynamicValues: false
  };

  errorMap: Map<string, string | undefined> = new Map();

  uploadedImage: File | undefined;
  uploadedImageB64: string | undefined;

  selectedOrgCanPublish: WritableSignal<boolean> = signal(false);

  private authSubscription!: Subscription
  private userOrgsSubscription!: Subscription

  visibilityFieldOptions: any[] = [{ label: 'Public', value: true },{ label: 'Private', value: false }];

  locationSuggestions: ActionLocation[] = [];

  wrokloadUnitOptions: MenuItem[] = [
    { label: WorkloadUnit.ECTS },
    { label: WorkloadUnit.Hours }
  ];

  public showCustomSkills: boolean = false;
  public skillOptions: WritableSignal<TreeNode[]> = signal([]);
  public skillSelection: WritableSignal<TreeNode[]> = signal([]);

  constructor(private exitWithoutSavingService: ExitWithoutSavingService, private firebaseService: FirebaseService, private messageService: MessageService, 
              private openrouteService: OpenrouteService, private trainingActionService: TrainingActionService, private router: Router, 
              private confirmationService: ConfirmationService, private authService: AuthService, private draftService: DraftStorageService,
              private permissionService: PermissionService, private route: ActivatedRoute, private offerToActionService: OfferToActionService,
              private utilsService: UtilsService, private bokInfoService: BokInformationService) {}

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
      if (organizations.length == 0) {
        this.exitWithoutSavingService.bypassGuard.next(true);
        this.router.navigate(['action']);
      }
      else {
        this.organizationSelector.values = [];
        organizations.forEach(organization =>
          this.organizationSelector.values.push({label: organization.name, value: organization._id})
        )
      }
    });

    this.route.queryParamMap.pipe(
      take(1),
      map( paramMap => paramMap.get('offerId')),
      switchMap(id => {
        if (id != null) {
          return this.offerToActionService.getActionDraft(id);
        }
        else return of(null);
      }),
      map((curriculumAction: TrainingAction | null) => {
        const formDraft: TrainingAction | null = this.draftService.loadAction();
        if (formDraft && (!this.inputAction || formDraft._id == this.inputAction._id) && !curriculumAction) {
          this.action = formDraft;
        }
        else if (this.inputAction) {
          this.action = this.inputAction;
        }
        else if (curriculumAction) {
          this.action = new TrainingAction(curriculumAction);
          this.action.educationLevel = this.action.educationLevel.map( value => 'EQF ' + value);
          this.action.subject = this.action.subject.map(subject => this.utilsService.codeToKnowledgeArea.get(subject) || subject);
        }
        if (this.action.division == '') this.action.division = undefined;
        if (this.action.orgId) {
          this.firebaseService.getOrganizationDivisions(this.action.orgId).pipe(take(1)).subscribe(divisions => this.divisionSelector.values = divisions);
          this.permissionService.organizationHasPermission(this.action.orgId, 'tct').pipe(take(1)).subscribe(hasPermission => this.selectedOrgCanPublish.set(hasPermission));
        }
        this.skillSelection.set(this.action.learningOutcomes.map(skill => {
          return ({
            key: `${skill.level}-${skill.concept}-${skill.verb}`,
            label: skill.label,
            children: [],
            leaf: true,
            expanded: false,
            type: 'leaf',
            data: skill
          })
        }));

        this.buildSkillOptions();
      })
    ).subscribe();

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
    this.permissionService.organizationHasPermission(this.action.orgId, 'tct').pipe(take(1)).subscribe(hasPermission => {
      this.selectedOrgCanPublish.set(hasPermission);
      if (!hasPermission) {
        this.action.isPublic = false;
      }
    });
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

  wordCounter(input: string) : number {
    return input.split(" ").filter(value => value != '').length;
  }

  limitInputByWordsLimit(input: string, maxWords: number): number | null {
    if (this.wordCounter(input) >= maxWords) return input.length;
    else return null
  }

  onLearningObjectivesChange(newSkills: TreeNode[]) {
    this.action.learningOutcomes = newSkills.filter(skill => skill.data).map(skill => skill.data);
    this.saveDraft();
  }

  buildSkillOptions() {
    const tempTree: TreeNode[] = [];
    const conceptSet: Set<string> = new Set();
    this.action.learningOutcomes.forEach(learningObj => conceptSet.add(learningObj.concept));
    this.action.concepts.forEach(concept => conceptSet.add(concept));
    this.action.subject.forEach(subj => {
      const code = this.utilsService.knowledgeAreaToCode.get(subj);
      if(code) conceptSet.add(code)
    });
    conceptSet.forEach(concept => {
      const conceptTree: TreeNode[] = [
        {
          label: "Level 1: Remember",
          key: concept + '-1',
          expanded: false,
          leaf: false
        },
        {
          label: "Level 2: Understand",
          key: concept + '-2',
          expanded: false,
          leaf: false
        },
        {
          label: "Level 3: Apply",
          key: concept + '-3',
          expanded: false,
          leaf: false
        },
        {
          label: "Level 4: Analyze",
          key: concept + '-4',
          expanded: false,
          leaf: false
        },
        {
          label: "Level 5: Evaluate",
          key: concept + '-5',
          expanded: false,
          leaf: false
        },
        {
          label: "Level 6: Create",
          key: concept + '-6',
          expanded: false,
          leaf: false
        },
        {
          label: "Unclassified",
          key: concept + '-0',
          expanded: false,
          leaf: false
        }
      ]
      this.bokInfoService.getConceptSkills(concept).pipe(
        switchMap(skills => {
          skills.forEach(skill => {
            const levelNode: TreeNode | undefined = conceptTree.at(skill.bloomLevel - 1);
            if (!levelNode) return
            levelNode.children ??= [];
            levelNode.children.push({
              key: `${skill.bloomLevel}-${concept}-${skill.bloomVerb}`,
              label: skill.name,
              children: [],
              leaf: true,
              expanded: false,
              type: 'leaf',
              data: new BloomSkill({ 
                level: skill.bloomLevel,
                verb: skill.bloomVerb, 
                label: skill.name,
                concept: concept
              })
            })
          })
          return this.bokInfoService.getConceptName(concept)
        }),
        take(1)
      ).subscribe(conceptName => {
        tempTree.push({
          label: `[${concept}] ${conceptName}`,
          key: concept,
          expanded: true,
          leaf: false,
          children: conceptTree,
          selectable: false
        })
      });
    })
    tempTree.forEach(levelNode => {
      levelNode.children = this.getSortedArray(levelNode.children ?? []);
    })
    this.skillOptions.set(tempTree);
    this.saveDraft();
  }
  
  private getSortedArray(values: TreeNode[]) {
    if (values.length > 0) {
      return [...values].sort((a, b) =>
        (a.label || '').localeCompare(b.label || '')
      );
    }
    return values;
  }
}