import { Component, ViewChild} from "@angular/core";
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
import { catchError, combineLatest, concatMap, finalize, forkJoin, map, of, retry, skip, Subscription, take, tap } from "rxjs";
import { ConfirmationService, MessageService } from "primeng/api";
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { Popover, PopoverModule } from 'primeng/popover';
import { RdfConverterService } from "../../services/rdfConverter.service";
import { AuthService } from "@eo4geo/ngx-bok-utils";

interface AuthState {
  logged: boolean;
  nameInitial: string;
  uid: string;
}

@Component({
  standalone: true,
  selector: 'material-page',
  templateUrl: './materialPage.component.html',
  styleUrls: ['./materialPage.component.css'],
  imports: [CommonModule, ProgressSpinnerModule, ButtonModule, TagModule, PanelModule, TabsModule, DividerModule, ConfirmDialogModule, ToastModule, PopoverModule],
  providers: [ConfirmationService, MessageService]
})
export class MaterialPageComponent {
  material: TrainingMaterial | undefined;

  deprecatedConcepts: string[] = [];
  currentConcepts: string[] = [];
  knowledgeAreas: string[] = [];
  customSubjects: string[] = [];
  
  selectedConceptsColor: Map<string, string> = new Map();
  selectedConceptsTooltip: Map<string, string> = new Map();  

  imagePlaceholder: string;

  private userOrgIdsSubscription!: Subscription;
  private userOrgIds: string[] = [];

  private authStateSubscription!: Subscription;
  private authState: AuthState | undefined = undefined;

  @ViewChild('op') op!: Popover;

  constructor(private route: ActivatedRoute, private router: Router, private trainingMaterialService: TrainingMaterialService,  private authService: AuthService,
              private utilsService: UtilsService, private bokInfo: BokInformationService, private firebaseService: FirebaseService,
              private confirmationService: ConfirmationService,private messageService: MessageService, private rdfConverter: RdfConverterService) {
                this.imagePlaceholder = this.utilsService.imagePlaceholder;
              }

  ngOnInit() {
    const routeData$ = combineLatest([
      this.route.paramMap,
      this.route.queryParams
    ]).pipe(
      map(([paramMap, queryParams]) => {
        const materialName = paramMap.get('dynamicValue') || '';
        const submited = queryParams['submited'] === 'true' || queryParams['submited'] === true;
        return { materialName, submited };
      }),
      concatMap(({ materialName, submited }) =>
        this.trainingMaterialService.getTrainingMaterial(materialName).pipe(
          tap((material) => {
            if (submited && !material) throw new Error('Material not found');
          }),
          retry({count: 1, delay: 500}),
          catchError(() => of(undefined))
        )
      ),
      take(1),
    );

    const orgIds$ = this.firebaseService.getUserOrganizationList().pipe(
      map(orgs => orgs.map(o => o._id)),
      tap(orgIds => this.userOrgIds = orgIds),
      take(1)
    );

    const userState$ = this.authService.getUserState().pipe(
      tap(authState => this.authState = authState),
      take(1)
    )

    forkJoin([routeData$, orgIds$, userState$]).subscribe(([newMaterial, _, userData]) => {
      const isMaterialMissing = !newMaterial;
      const isNotPublic = newMaterial && !newMaterial.isPublic;
      const belongsToUserOrg = newMaterial?.orgId && this.userOrgIds.includes(newMaterial.orgId);
      const belongsToUser = newMaterial && userData && newMaterial.userId === userData.uid;

      if (isMaterialMissing || (isNotPublic && !(belongsToUserOrg || belongsToUser))) {
          this.router.navigate(['not_found']);
      }
      else this.loadMaterial(newMaterial);
    });

    this.userOrgIdsSubscription = this.firebaseService.getUserOrganizationList().pipe(
      skip(1),
      map(orgs => orgs.map(o => o._id))
    ).subscribe(ids => {
      this.userOrgIds = ids;
    });

    this.authStateSubscription = this.authService.getUserState().pipe(skip(1)).subscribe(authState => this.authState = authState);
  }

  ngAfterViewInit() {
    this.route.queryParams.subscribe(params => {
      const submited: boolean = params['submited'];
      const mode: string = params['mode'];
      if (submited){
        switch (mode){
          case 'update':
            this.messageService.add({ 
              severity: 'info', 
              summary: 'Info', 
              detail: `Material successfully updated!`,
              life: 3000, 
              closable: true 
            }); 
            break
          case 'create':
            this.messageService.add({ 
              severity: 'info', 
              summary: 'Info', 
              detail: `Material successfully created!`,
              life: 3000, 
              closable: true 
            }); 
            break
        }
      }
    });
  }

  ngOnDestroy() {
    this.authStateSubscription.unsubscribe();
    this.userOrgIdsSubscription.unsubscribe();
  }

  private loadMaterial(newMaterial: TrainingMaterial) {
    this.material = newMaterial;
    this.currentConcepts = [];
    this.deprecatedConcepts = [];
    this.knowledgeAreas = [];
    this.customSubjects = [];
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
    });
    this.material.subject.forEach(subject => {
      if (this.utilsService.codeToKnowledgeArea.has(subject)) {
        this.bokInfo.getConceptColor(subject).subscribe(
          color => {
            const softColor = color ? this.utilsService.convertHexToRgba(color, 0.5) : '';
            this.selectedConceptsColor.set(subject, softColor)
          }
        );
        this.bokInfo.getConceptName(subject).subscribe(
          tooltip => {
            this.selectedConceptsTooltip.set(subject, tooltip);
            this.knowledgeAreas.push(subject);
          }
        );
      }
      else this.customSubjects.push(subject);
    });
  }

  goToMainPage() {
    this.router.navigate(['material']);
  }

  editMaterial() {
    this.router.navigate(['material/edit/' + this.material?._id]);
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
    let deleteError = false;
    this.trainingMaterialService.deleteTrainingMaterial(this.material!).pipe(
      take(1),
      catchError((error) => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: error.message ?? 'Something went wrong. Try again later or contact the administrator.', 
          life: 3000, 
          closable: true 
        });
        deleteError = true;
        return of(null)
      }),
      finalize(() => {
        if (!deleteError) this.router.navigate(['material'], {queryParams: { submited: true, mode: 'delete' }});
      })
    ).subscribe();
  }

  checkUser() {
    return (this.authState?.uid == this.material?.userId);
  }

  checkOrganizations() {
    return (this.material?.orgId && this.userOrgIds.includes(this.material?.orgId));
  }

  onClickConcept(code: string) {
    window.open('https://geospacebok.eu/' + code)
  }

  toggle(event: any) {
    this.op.toggle(event);
  }

  downloadMaterialXML() {
    const url = this.rdfConverter.getRdfXmlUrl(this.material!);
    this.downloadURI(url, this.material?._id + '_metadata.xml');
    this.op.hide();
  }

  downloadMaterialTTL() {
    const url = this.rdfConverter.getRdfTtlUrl(this.material!);
    this.downloadURI(url, this.material?._id + '_metadata.ttl');
    this.op.hide();
  }

  downloadMaterialRDFa() {
    const url = this.rdfConverter.getRdfaUrl(this.material!);
    this.downloadURI(url, this.material?._id + '_metadata.html');
    this.op.hide();
  }

  private downloadURI(uri: string, name: string) {
    let link = document.createElement("a");
    link.download = name;
    link.href = uri;
    link.click();
  }

  copyURIToClipboard() {
    navigator.clipboard.writeText(window.location.href);
    this.messageService.add({ 
      severity: 'info', 
      summary: 'Info', 
      detail: `You copied the material url to clipboard!`,
      life: 3000, 
      closable: true 
    });
  }
}