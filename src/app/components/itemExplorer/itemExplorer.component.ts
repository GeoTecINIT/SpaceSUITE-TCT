import { CommonModule, Location } from '@angular/common';
import { Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ButtonGroupModule } from 'primeng/buttongroup';
import { MenuModule } from 'primeng/menu';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { SkeletonModule } from 'primeng/skeleton';
import { TabsModule } from 'primeng/tabs';
import { ToastModule } from 'primeng/toast';
import {
  combineLatest,
  filter,
  forkJoin,
  map,
  Observable,
  Subscription,
  take,
  tap,
} from 'rxjs';
import { FilterOption } from '../../model/filterOption';
import { TrainingAction } from '../../model/trainingAction';
import { TrainingItem } from '../../model/trainingItem';
import { TrainingMaterial } from '../../model/trainingMaterial';
import { CardFilterService } from '../../services/cardFilter.service';
import { CardSortingService } from '../../services/cardSorting.service';
import { FirebaseService } from '../../services/firebase.service';
import { TrainingActionService } from '../../services/trainingAction.service';
import { TrainingMaterialService } from '../../services/trainingMaterial.service';
import { CardComponent } from '../card/card.component';
import { FiltersComponent } from '../filters/filters.component';

@Component({
  standalone: true,
  selector: 'item-explorer',
  templateUrl: './itemExplorer.component.html',
  styleUrls: ['./itemExplorer.component.css'],
  imports: [
    CardComponent,
    FiltersComponent,
    SkeletonModule,
    CommonModule,
    PaginatorModule,
    ToastModule,
    ButtonModule,
    MenuModule,
    ButtonGroupModule,
    TabsModule,
  ],
  providers: [MessageService],
})
export class ItemExplorerComponent {
  trainingMaterials: TrainingMaterial[] = [];
  trainingActions: TrainingAction[] = [];

  trainingItems: TrainingItem[] = [];
  filteredTrainingItems: TrainingItem[] = [];

  filterOptions: FilterOption[] = [];
  advancedFilterOptions: FilterOption[] = [];
  showAdvancedFilters: boolean = false;
  searchValue: string = '';
  searchOption: string = 'Title';
  showPrivate: boolean = false;
  dateValue?: Date[];
  bokConcepts: string[] = [];
  loadingFilters: boolean = true;
  loadingCards: boolean = true;

  filterUserItemOptions: any[] = [];
  filterByUserItem: boolean = false;

  skeletonElements: number[] = [];

  first: number = 0;
  rows: number = 16;
  paginationTrainingItems: TrainingItem[] = [];

  @ViewChild('container') containerRef!: ElementRef;
  showButton = true;
  buttonBottom = 32;

  sortOptions: MenuItem[] | undefined;
  selectedSortOption: string = 'Title';
  sortAsc: boolean = false;

  private trainingItemsSubscription!: Subscription;
  private userOrgIds: string[] = [];

  tabs = [
    { id: 0, label: 'Training Materials', icon: 'pi pi-book', disabled: false },
    {
      id: 1,
      label: 'Training Actions',
      icon: 'pi pi-folder-open',
      disabled: false,
    },
  ];
  selectedTab: string | number = 0;

  constructor(
    private trainingMaterialService: TrainingMaterialService,
    private filterService: CardFilterService,
    private router: Router,
    private location: Location,
    private trainingActionsService: TrainingActionService,
    private firebase: FirebaseService,
    private messageService: MessageService,
    private route: ActivatedRoute,
    private ngZone: NgZone,
    private sortingService: CardSortingService,
  ) {
    this.skeletonElements = Array(16).fill(null);
    this.sortOptions = [
      { label: 'Title' },
      { label: 'Date' },
      { label: 'EQF' },
    ];
  }

  ngOnInit() {
    let generalFilterObservable: Observable<FilterOption[]>;
    let advancedFilterObservable: Observable<FilterOption[]>;

    // Define selected tab based on lastSuccessfulNavigation
    if (
      this.router.lastSuccessfulNavigation?.initialUrl.toString() === '/action'
    ) {
      this.selectedTab = 1;
      this.filterUserItemOptions = [
        { label: 'My Actions', value: true, icon: 'pi pi-user' },
        { label: 'All Actions', value: false, icon: 'pi pi-globe' },
      ];
      generalFilterObservable = this.filterService
        .getGeneralActionFilterOptions()
        .pipe(take(1));
      advancedFilterObservable = this.filterService
        .getAdvancedActionFilterOptions()
        .pipe(take(1));
    } else {
      this.selectedTab = 0;
      this.filterUserItemOptions = [
        { label: 'My Materials', value: true, icon: 'pi pi-user' },
        { label: 'All Materials', value: false, icon: 'pi pi-globe' },
      ];
      generalFilterObservable = this.filterService
        .getGeneralMaterialFilterOptions()
        .pipe(take(1));
      advancedFilterObservable = this.filterService
        .getAdvancedMaterialFilterOptions()
        .pipe(take(1));
    }

    // Load filters value from FilterService
    forkJoin({
      general: generalFilterObservable,
      advanced: advancedFilterObservable,
    }).subscribe(({ general, advanced }) => {
      this.filterOptions = general;
      this.advancedFilterOptions = advanced;
      this.showAdvancedFilters = this.filterService.showAdvancedFilters;
      this.loadingFilters = false;
    });

    // Load filters & sorting state
    this.searchValue = this.filterService.searchValue;
    this.searchOption = this.filterService.searchOption;
    this.filterByUserItem = this.filterService.userItemFilter;
    this.bokConcepts = this.filterService.bokConcepts;
    this.sortAsc = this.sortingService.sortAsc;
    this.selectedSortOption = this.sortingService.sortOption;

    if (!this.isLogged()) {
      this.showPrivate = false;
      this.filterService.showPrivate = false;
    } else {
      this.showPrivate = this.filterService.showPrivate;
    }

    // Load Training Items & User orgs
    this.trainingItemsSubscription = combineLatest([
      this.trainingMaterialService.getTrainingMaterialsArray().pipe(
        filter((value) => value !== undefined),
        tap(
          (newValue: TrainingMaterial[]) => (this.trainingMaterials = newValue),
        ),
      ),
      this.trainingActionsService.getTrainingActionsArray().pipe(
        filter((value) => value !== undefined),
        tap((newValue: TrainingAction[]) => (this.trainingActions = newValue)),
      ),
      this.firebase.getUserOrganizationList().pipe(
        map((orgs) => orgs.map((o) => o._id)),
        tap((ids) => (this.userOrgIds = ids)),
      ),
    ]).subscribe(() => {
      this.setSelectedTab(this.selectedTab);
      if (
        this.filterService.paginatorState.rows &&
        this.filterService.paginatorState.first
      ) {
        this.onPageChange(this.filterService.paginatorState);
      }
      this.loadingCards = false;
    });
  }

  ngAfterViewInit() {
    this.route.queryParams.subscribe((params) => {
      const submited: boolean = params['submited'];
      const mode: string = params['mode'];
      if (submited) {
        switch (mode) {
          case 'delete':
            this.messageService.add({
              severity: 'info',
              summary: 'Info',
              detail: `Material deleted without problems.`,
              life: 3000,
              closable: true,
            });
            break;
        }
      }
    });
    window.addEventListener('scroll', this.updateButtonPosition);
    window.addEventListener('resize', this.updateButtonPosition);
  }

  updateButtonPosition = () => {
    const element = this.containerRef.nativeElement;
    const rect = element.getBoundingClientRect();
    const bottomOverlap = window.innerHeight - rect.bottom;
    const newButtonBottom = Math.max(bottomOverlap, 32);
    if (this.buttonBottom !== newButtonBottom) {
      this.buttonBottom = newButtonBottom;
    }
  };

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.updateButtonPosition);
    window.removeEventListener('resize', this.updateButtonPosition);
    this.trainingItemsSubscription.unsubscribe();
  }

  setSelectedTab(newValue: string | number) {
    this.selectedTab = newValue;
    switch (this.selectedTab) {
      case 0:
        this.trainingItems = [...this.trainingMaterials];
        this.filterUserItemOptions = [
          { label: 'My Materials', value: true, icon: 'pi pi-user' },
          { label: 'All Materials', value: false, icon: 'pi pi-globe' },
        ];
        this.filterService
          .getGeneralMaterialFilterOptions()
          .pipe(take(1))
          .subscribe((value) => (this.filterOptions = value));
        this.filterService
          .getAdvancedMaterialFilterOptions()
          .pipe(take(1))
          .subscribe((value) => (this.advancedFilterOptions = value));
        this.location.replaceState('material');
        break;
      case 1:
        this.trainingItems = [...this.trainingActions];
        this.filterUserItemOptions = [
          { label: 'My Actions', value: true, icon: 'pi pi-user' },
          { label: 'All Actions', value: false, icon: 'pi pi-globe' },
        ];
        this.filterService
          .getGeneralActionFilterOptions()
          .pipe(take(1))
          .subscribe((value) => (this.filterOptions = value));
        this.filterService
          .getAdvancedActionFilterOptions()
          .pipe(take(1))
          .subscribe((value) => (this.advancedFilterOptions = value));
        this.location.replaceState('action');
        break;
    }
    this.filterPipeline();
    this.ngZone.onStable.pipe(take(1)).subscribe(() => {
      this.updateButtonPosition();
    });
  }

  switchSortOrientation() {
    this.sortAsc = !this.sortAsc;
    this.sortingService.sortAsc = this.sortAsc;
    this.filterPipeline();
  }

  setSortOption(option: string) {
    this.selectedSortOption = option;
    this.sortingService.sortOption = option;
    this.filterPipeline();
  }

  setSearchOption(option: string) {
    this.searchOption = option;
    this.filterService.searchOption = option;
    this.filterPipeline();
  }

  setSearchValue(option: string) {
    this.searchValue = option;
    this.filterService.searchValue = option;
    this.filterPipeline();
  }

  setDateValue(option: Date[]) {
    console.log(option)
    this.dateValue = option;
    //this.filterService.dateValue = option;
    this.filterPipeline();
  }

  setFilterByUserMaterial(newValue: boolean) {
    this.filterByUserItem = newValue;
    this.filterService.userItemFilter = newValue;
    this.filterPipeline();
  }

  setBoKConcepts(filterConcepts: string[]) {
    this.bokConcepts = filterConcepts;
    this.filterService.bokConcepts = filterConcepts;
    this.filterPipeline();
  }

  setShowAdvancedFilters(showAdvancedFilters: boolean) {
    this.showAdvancedFilters = showAdvancedFilters;
    this.filterService.showAdvancedFilters = showAdvancedFilters;
    this.ngZone.onStable.pipe(take(1)).subscribe(() => {
      this.updateButtonPosition();
    });
  }

  setPrivateFilter(filter: boolean): void {
    this.showPrivate = filter;
    this.filterService.showPrivate = filter;

    this.filterPipeline();
  }

  filterPipeline() {
    const changed = this.handlePrivateItems(this.trainingItems);
    const periodItems = this.filterByDate(changed);
    const sortedItems = this.sortItems(periodItems);
    const searchedItems = this.searchItems(sortedItems);
    const filteredItems = this.filterItems(searchedItems);
    this.filteredTrainingItems = this.filterByBoKConcept(filteredItems);
    this.paginationTrainingItems = this.filteredTrainingItems.slice(
      this.first,
      this.first + this.rows,
    );
  }

  handlePrivateItems(items: TrainingItem[]): TrainingItem[] {
    return this.showPrivate
      ? items
      : items.filter((item) => item.isPublic === true);
  }

  filterByDate(items: TrainingItem[]): TrainingItem[] {
    if (!this.dateValue || this.dateValue.length == 0) return items;

    const rawStart = this.dateValue[0];
    const rawEnd = this.dateValue[1] ?? null;

    const startTime = this.startOfDay(rawStart).getTime();
    const endTime = rawEnd ? this.startOfDay(rawEnd).getTime() : null;

    const inRange = (time: number): boolean => {
      if (endTime === null) {
        return time === startTime;
      }
      return time >= startTime && time <= endTime;
    };

    if (this.isTrainingActionArray(items)) {
      return items.filter(item =>
        Array.isArray(item.timing) &&
        item.timing.some(period => {
          if (!period?.start) return false;
          const periodTime = this.startOfDay(new Date(period.start)).getTime();
          return inRange(periodTime);
        })
      );
    }

    return items.filter(item => {
      if (!item?.created) return false;
      const createdTime = this.startOfDay(new Date(item.created)).getTime();
      return inRange(createdTime);
    });
  }

  private startOfDay(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }

  private isTrainingActionArray(items: TrainingItem[]): items is TrainingAction[] {
    return items.length > 0 && items.every(item => item instanceof TrainingAction);
  }

  sortItems(inputItems: TrainingItem[]): TrainingItem[] {
    return this.sortingService.sortItems(inputItems);
  }

  searchItems(sortedItems: TrainingItem[]) {
    const newSearch: TrainingItem[] = [];
    switch (this.searchOption) {
      case 'Title':
        sortedItems.forEach((material) => {
          if (
            material.title
              .toLowerCase()
              .includes(this.searchValue.toLowerCase())
          )
            newSearch.push(material);
        });
        break;
      case 'Description':
        sortedItems.forEach((material) => {
          if (
            material.description
              .toLowerCase()
              .includes(this.searchValue.toLowerCase())
          )
            newSearch.push(material);
        });
        break;
      case 'Learning Outcome':
        sortedItems.forEach((material) => {
          if (
            material.learningOutcomes
              .join(';')
              .toLowerCase()
              .includes(this.searchValue.toLowerCase())
          )
            newSearch.push(material);
        });
        break;
      default:
        console.log('Invalid Search Option');
    }
    return newSearch;
  }

  filterItems(searchedItems: TrainingItem[]): TrainingItem[] {
    const allFilters = [...this.filterOptions, ...this.advancedFilterOptions];
    const userId = this.firebase.getUserData()?.uid;
    const noFilters = allFilters.every(
      (f) => !f.selection || f.selection.length === 0,
    );

    let materials = [...searchedItems];
    if (!this.filterByUserItem && noFilters) {
      materials = materials.filter((m) =>
        userId
          ? m.isPublic ||
            m.userId === userId ||
            (m.orgId && this.userOrgIds.includes(m.orgId))
          : m.isPublic,
      );
    } else {
      if (this.filterByUserItem && userId) {
        materials = materials.filter((m) => m.userId === userId);
      } else if (userId) {
        materials = materials.filter(
          (m) =>
            m.isPublic ||
            m.userId === userId ||
            (m.orgId && this.userOrgIds.includes(m.orgId)),
        );
      } else {
        materials = materials.filter((m) => m.isPublic);
      }

      materials = materials.filter((m) =>
        allFilters.every(
          (f) =>
            !f.selection ||
            f.selection.length === 0 ||
            this.filterService.checkItem(m, f),
        ),
      );
    }
    return materials;
  }

  filterByBoKConcept(filteredItems: TrainingItem[]): TrainingItem[] {
    if (!this.bokConcepts || this.bokConcepts.length == 0) {
      return filteredItems;
    }
    return filteredItems.filter((item) =>
      this.bokConcepts.some((concept) => item.concepts.includes(concept)),
    );
  }

  isLogged(): boolean {
    return this.firebase.getUserData() != null;
  }

  onPageChange(event: PaginatorState) {
    this.first = event.first ?? 0;
    this.rows = event.rows ?? 16;
    this.filterService.paginatorState = event;
    this.paginationTrainingItems = this.filteredTrainingItems.slice(
      this.first,
      this.first + this.rows,
    );
  }

  createTrainingItem() {
    if (this.selectedTab === 0) {
      this.router.navigate(['material/new']);
    } else {
      this.router.navigate(['action/new']);
    }
  }

  trackById(index: number, item: any): string | number {
    return item._id ?? item.id ?? index;
  }

  scrollToTop(): void {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 0);
  }
}
