import { Component, ViewChild} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { TrainingActionService } from "../../services/trainingAction.service";
import { TrainingAction } from "../../model/trainingAction";
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
  selector: 'action-page',
  templateUrl: './actionPage.component.html',
  styleUrls: ['../materialPage/materialPage.component.css'],
  imports: [CommonModule, ProgressSpinnerModule, ButtonModule, TagModule, PanelModule, TabsModule, DividerModule, ConfirmDialogModule, ToastModule, PopoverModule],
  providers: [ConfirmationService, MessageService]
})
export class ActionPageComponent {
  action: TrainingAction | undefined;

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

  constructor(private route: ActivatedRoute, private router: Router, private trainingActionService: TrainingActionService, private authService: AuthService,
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
        const actionName = paramMap.get('dynamicValue') || '';
        const submited: boolean = queryParams['submited'];
        return { actionName, submited };
      }),
      concatMap(({ actionName, submited }) =>
        this.trainingActionService.getTrainingAction(actionName).pipe(
          tap((action) => {
            if (submited && !action) throw new Error('Material not found');
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
    
    forkJoin([routeData$, orgIds$,userState$]).subscribe(([newAction, _, userData]) => {
      const isActionMissing = !newAction;
      const isNotPublic = newAction && !newAction.isPublic;
      const belongsToUserOrg = newAction?.orgId && this.userOrgIds.includes(newAction.orgId);
      const belongsToUser = newAction && userData && newAction.userId === userData.uid;

      if (isActionMissing || (isNotPublic && !(belongsToUserOrg || belongsToUser))) {
          this.router.navigate(['not_found']);
      }
      else this.loadAction(newAction);
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
              detail: `Action successfully updated!`,
              life: 3000, 
              closable: true 
            }); 
            break
          case 'create':
            this.messageService.add({ 
              severity: 'info', 
              summary: 'Info', 
              detail: `Action successfully created!`,
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

  private loadAction(newAction: TrainingAction) {
    this.action = newAction;
    this.currentConcepts = [];
    this.deprecatedConcepts = [];
    this.knowledgeAreas = [];
    this.customSubjects = [];
    this.action.concepts.forEach(concept => {
      this.bokInfo.getConceptColor(concept).pipe(take(1)).subscribe(
        color => {
          const softColor = color ? this.utilsService.convertHexToRgba(color, 0.5) : '';
          this.selectedConceptsColor.set(concept, softColor)
        }
      );
      this.bokInfo.getConceptName(concept).pipe(take(1)).subscribe(
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
    this.action.subject.forEach(subject => {
      if (this.utilsService.codeToKnowledgeArea.has(subject)) {
        this.bokInfo.getConceptColor(subject).pipe(take(1)).subscribe(
          color => {
            const softColor = color ? this.utilsService.convertHexToRgba(color, 0.5) : '';
            this.selectedConceptsColor.set(subject, softColor)
          }
        );
        this.bokInfo.getConceptName(subject).pipe(take(1)).subscribe(
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
    this.router.navigate(['action']);
  }

  editAction() {
    this.router.navigate(['action/edit/' + this.action?._id]);
  }

  deleteModal(event: Event) {
    this.confirmationService.confirm({
        target: event.target as EventTarget,
        message: 'Do you want to delete this training action?',
        header: 'Delete Action',
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
          this.deleteAction();
        },
        reject: () => {
        },
    });
  }

  deleteAction() {
    let deleteError = false;
    this.trainingActionService.deleteTrainingAction(this.action!).pipe(
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
        if (!deleteError) this.router.navigate(['action'], {queryParams: { submited: true, mode: 'delete' }});
      })
    ).subscribe();
  }

  checkUser() {
    return (this.authState?.uid == this.action?.userId);
  }

  checkOrganizations() {
    return (this.action?.orgId && this.userOrgIds.includes(this.action?.orgId));
  }

  onClickConcept(code: string) {
    window.open('https://geospacebok.eu/' + code)
  }

  toggle(event: any) {
    this.op.toggle(event);
  }

  downloadMaterialXML() {
    const url = this.rdfConverter.getRdfXmlUrl(this.action!);
    this.downloadURI(url, this.action?._id + '_metadata.xml');
    this.op.hide();
  }

  downloadMaterialTTL() {
    const url = this.rdfConverter.getRdfTtlUrl(this.action!);
    this.downloadURI(url, this.action?._id + '_metadata.ttl');
    this.op.hide();
  }

  downloadMaterialRDFa() {
    const url = this.rdfConverter.getRdfaUrl(this.action!);
    this.downloadURI(url, this.action?._id + '_metadata.html');
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
      detail: `You copied the action url to clipboard!`,
      life: 3000, 
      closable: true 
    });
  }
}