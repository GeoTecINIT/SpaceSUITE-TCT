import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, SkillTagComponent, Tag } from '@eo4geo/ngx-bok-utils';
import { BokInformationService } from '@eo4geo/ngx-bok-visualization';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DividerModule } from 'primeng/divider';
import { PanelModule } from 'primeng/panel';
import { Popover, PopoverModule } from 'primeng/popover';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TabsModule } from 'primeng/tabs';
import { ToastModule } from 'primeng/toast';
import {
  catchError,
  combineLatest,
  concatMap,
  finalize,
  forkJoin,
  map,
  of,
  retry,
  skip,
  Subscription,
  take,
  tap,
} from 'rxjs';
import { TrainingAction } from '../../model/trainingAction';
import { FirebaseService } from '../../services/firebase.service';
import { RdfConverterService } from '../../services/rdfConverter.service';
import { TrainingActionService } from '../../services/trainingAction.service';
import { UtilsService } from '../../services/utils.service';
import { TooltipModule } from 'primeng/tooltip';
import { PdfService } from '../../services/pdf.service';

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
  imports: [
    CommonModule,
    ProgressSpinnerModule,
    ButtonModule,
    PanelModule,
    TabsModule,
    DividerModule,
    ConfirmDialogModule,
    ToastModule,
    PopoverModule,
    SkillTagComponent,
    TooltipModule
  ],
  providers: [ConfirmationService, MessageService],
})
export class ActionPageComponent {
  action: TrainingAction | undefined;

  currentConcepts: Tag[] = [];
  knowledgeAreas: Tag[] = [];
  customSubjects: Tag[] = [];

  imagePlaceholder: string;

  private userOrgIdsSubscription!: Subscription;
  private userOrgIds: string[] = [];

  private authStateSubscription!: Subscription;
  private authState: AuthState | undefined = undefined;

  @ViewChild('op') op!: Popover;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private trainingActionService: TrainingActionService,
    private authService: AuthService,
    private utilsService: UtilsService,
    private firebaseService: FirebaseService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private rdfConverter: RdfConverterService,
    private pdfService: PdfService
  ) {
    this.imagePlaceholder = this.utilsService.imagePlaceholder;
  }

  ngOnInit() {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 0);
    const routeData$ = combineLatest([
      this.route.paramMap,
      this.route.queryParams,
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
          retry({ count: 1, delay: 500 }),
          catchError(() => of(undefined)),
        ),
      ),
      take(1),
    );

    const orgIds$ = this.firebaseService.getUserOrganizationList().pipe(
      map((orgs) => orgs.map((o) => o._id)),
      tap((orgIds) => (this.userOrgIds = orgIds)),
      take(1),
    );

    const userState$ = this.authService.getUserState().pipe(
      tap((authState) => (this.authState = authState)),
      take(1),
    );

    forkJoin([routeData$, orgIds$, userState$]).subscribe(
      ([newAction, _, userData]) => {
        const isActionMissing = !newAction;
        const isNotPublic = newAction && !newAction.isPublic;
        const belongsToUserOrg =
          newAction?.orgId && this.userOrgIds.includes(newAction.orgId);
        const belongsToUser =
          newAction && userData && newAction.userId === userData.uid;

        if (
          isActionMissing ||
          (isNotPublic && !(belongsToUserOrg || belongsToUser))
        ) {
          this.router.navigate(['not_found']);
        } else this.loadAction(newAction);
      },
    );

    this.userOrgIdsSubscription = this.firebaseService
      .getUserOrganizationList()
      .pipe(
        skip(1),
        map((orgs) => orgs.map((o) => o._id)),
      )
      .subscribe((ids) => {
        this.userOrgIds = ids;
      });

    this.authStateSubscription = this.authService
      .getUserState()
      .pipe(skip(1))
      .subscribe((authState) => (this.authState = authState));
  }

  ngAfterViewInit() {
    this.route.queryParams.subscribe((params) => {
      const submited: boolean = params['submited'];
      const mode: string = params['mode'];
      if (submited) {
        switch (mode) {
          case 'update':
            this.messageService.add({
              severity: 'info',
              summary: 'Info',
              detail: `Action successfully updated!`,
              life: 3000,
              closable: true,
            });
            break;
          case 'create':
            this.messageService.add({
              severity: 'info',
              summary: 'Info',
              detail: `Action successfully created!`,
              life: 3000,
              closable: true,
            });
            break;
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
    this.knowledgeAreas = [];
    this.customSubjects = [];

    this.utilsService
      .stringToTag(this.action.concepts.sort(), 'bok')
      .subscribe((tags) => (this.currentConcepts = tags));

    const knowledgeAreasStrings: string[] = [];
    const customSubjectsStrings: string[] = [];

    this.action.subject.forEach((subject) => {
      if (this.utilsService.codeToKnowledgeArea.has(subject))
        knowledgeAreasStrings.push(subject);
      else customSubjectsStrings.push(subject);
    });

    this.utilsService
      .stringToTag(knowledgeAreasStrings.sort(), 'bok')
      .subscribe((tags) => (this.knowledgeAreas = tags));

    this.utilsService
      .stringToTag(customSubjectsStrings.sort())
      .subscribe((tags) => (this.customSubjects = tags));
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
      reject: () => {},
    });
  }

  deleteAction() {
    let deleteError = false;
    this.trainingActionService
      .deleteTrainingAction(this.action!)
      .pipe(
        take(1),
        catchError((error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail:
              error.message ??
              'Something went wrong. Try again later or contact the administrator.',
            life: 3000,
            closable: true,
          });
          deleteError = true;
          return of(null);
        }),
        finalize(() => {
          if (!deleteError)
            this.router.navigate(['action'], {
              queryParams: { submited: true, mode: 'delete' },
            });
        }),
      )
      .subscribe();
  }

  checkUser() {
    return this.authState?.uid == this.action?.userId;
  }

  checkOrganizations() {
    return this.action?.orgId && this.userOrgIds.includes(this.action?.orgId);
  }

  onClickConcept(code: string) {
    window.open('https://geospacebok.eu/' + code);
  }

  toggle(event: any) {
    this.op.toggle(event);
  }

  downloadMaterialPDF() {
    document.body.style.cursor = 'wait';
    this.op.hide();

    this.pdfService
      .generateItemPdf(new TrainingAction(this.action))
      .subscribe((pdf) => {
        this.downloadURI(pdf.url, pdf.filename);
        document.body.style.cursor = '';
      });
  }

  downloadMaterialJSON() {
    this.op.hide();

    const fileName = (this.action!.title || 'default_name')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^\w_-]/g, '')
      .toLowerCase();

    const plainProfile = this.action?.toPlain();
    if (plainProfile) {
      delete plainProfile['_id'];
      delete plainProfile['userId'];
      delete plainProfile['orgId'];
    }
    const jsonStr = JSON.stringify(plainProfile, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);

    this.downloadURI(url, fileName + '_profile.json');
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
    let link = document.createElement('a');
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
      closable: true,
    });
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = this.imagePlaceholder;
    img.onerror = null; // Prevent loops
  }

  getActionDates(): string {
    if (this.action && this.action.timing.length > 0) {
      const timing = this.action.timing;
      const startDate = timing[0].start.toLocaleDateString('en-UK');
      const endDate = timing[timing.length -1].end?.toLocaleDateString('en-UK') ?? timing[timing.length -1].start.toLocaleDateString('en-UK');
      if (startDate == endDate) return startDate;
      return startDate + ' - ' + endDate;
    }
    return 'Not Defined';
  }
}
