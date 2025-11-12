import { Component, ElementRef, NgZone, ViewChild } from "@angular/core";
import { SkeletonModule } from 'primeng/skeleton';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { CardComponent } from "../card/card.component";
import { TrainingMaterial } from "../../model/trainingMaterial";
import { CommonModule, Location } from "@angular/common";
import { TrainingMaterialService } from "../../services/trainingMaterial.service";
import { concatMap, filter, take, tap } from "rxjs";
import { FiltersComponent } from "../filters/filters.component";
import { FilterOption } from "../../model/filterOption";
import { CardFilterService } from "../../services/cardFilter.service";
import { FirebaseService } from "../../services/firebase.service";
import { ToastModule } from 'primeng/toast';
import { MessageService } from "primeng/api";
import { ActivatedRoute, Router } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { ButtonGroupModule } from 'primeng/buttongroup';
import { TabsModule } from 'primeng/tabs';
import { TrainingItem } from "../../model/trainingItem";
import { TrainingAction } from "../../model/trainingAction";
import { CardSortingService } from "../../services/cardSorting.service";
import { TrainingActionService } from "../../services/trainingAction.service";

@Component({
  standalone: true,
  selector: 'item-explorer',
  templateUrl: './itemExplorer.component.html',
  styleUrls: ['./itemExplorer.component.css'],
  imports: [CardComponent, FiltersComponent, SkeletonModule, CommonModule, PaginatorModule, ToastModule, ButtonModule, MenuModule, ButtonGroupModule, TabsModule],
  providers: [MessageService]
})
export class ItemExplorerComponent {
  trainingMaterials: TrainingMaterial[] = [];
  trainingActions: TrainingAction[] = [];

  trainingItems: TrainingItem[] = [];
  filteredTrainingItems: TrainingItem[] = [];

  filterOptions: FilterOption[] = [];
  advancedMaterialFilterOptions: FilterOption[] = [];
  showAdvancedFilters: boolean = false;
  searchValue: string = '';
  searchOption: string = "Title";
  bokConcepts: string[] = [];
  loading: boolean = true;

  filterUserItemOptions: any[] = [];
  filterByUserItem: boolean = false;

  skelletonElements: number[] = [];

  first: number = 0;
  rows: number = 16;
  paginationTrainingItems: TrainingItem[] = [];

  @ViewChild('container') containerRef!: ElementRef;
  showButton = true;
  buttonBottom = 32;

  sortOptions: MenuItem[] | undefined;
  selectedSortOption: string = "Title";
  sortAsc: boolean = false;

  tabs = [
    { id: 0, label: 'Training Materials', icon: 'pi pi-book', disabled: false },
    { id: 1, label: 'Training Actions', icon: 'pi pi-folder-open', disabled: false },
  ];
  selectedTab: string | number = 0;

  constructor(private trainingMaterialService: TrainingMaterialService, private filterService: CardFilterService, private router: Router, private location: Location, private trainingActionsService: TrainingActionService,
              private firebase: FirebaseService, private messageService: MessageService, private route: ActivatedRoute, private ngZone: NgZone, private sortingSerice: CardSortingService) {
    this.skelletonElements = Array(16).fill(null);
    this.sortOptions = [{ label: 'Title' }, { label: 'Date' }, {label: 'EQF'}];
  }

  ngOnInit() {
    // Define selected tab based on lastSuccessfulNavigation
    if (this.router.lastSuccessfulNavigation?.initialUrl.toString() === '/action') this.selectedTab = 1;
    else this.selectedTab = 0;

    // Load filters values from FilterService
    this.filterOptions = this.filterService.getGeneralMaterialFilterOptions();
    this.advancedMaterialFilterOptions = this.filterService.getAdvancedMaterialFilterOptions();
    this.showAdvancedFilters = this.filterService.showAdvancedFilters;

    // Load Training Items & filters state from FilterService
    this.trainingMaterialService.getTrainingMaterialsArray().pipe(
      filter(value => value !== undefined),
      tap((newValue: TrainingMaterial[]) => this.trainingMaterials = newValue),
      concatMap(() => this.trainingActionsService.getTrainingActionsArray()),
      filter(value => value !== undefined),
      tap((newValue: TrainingAction[]) => this.trainingActions = newValue)
    ).subscribe(() => {
      this.searchValue = this.filterService.searchValue;
      this.searchOption = this.filterService.searchOption;
      this.filterByUserItem = this.filterService.userItemFilter;
      this.sortAsc = this.sortingSerice.sortAsc;
      this.selectedSortOption = this.sortingSerice.sortOption;
      this.setSelectedTab(this.selectedTab);
      if(this.filterService.paginatorState.rows && this.filterService.paginatorState.rows) {
        this.onPageChange(this.filterService.paginatorState);
      }
      this.loading = false;
    });
  }

  ngAfterViewInit() {
    this.route.queryParams.subscribe(params => {
      const submited: boolean = params['submited'];
      const mode: string = params['mode'];
      if (submited){
        switch (mode){
          case 'delete':
            this.messageService.add({ 
              severity: 'info', 
              summary: 'Info', 
              detail: `Material deleted without problems.`,
              life: 3000, 
              closable: true 
            }); 
            break
        }
      }
    });

    window.addEventListener('scroll', this.updateButtonPosition);
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
  }

  setSelectedTab(newValue: string | number) {
    this.selectedTab = newValue;
    switch(this.selectedTab) {
      case 0:
        this.trainingItems = [...this.trainingMaterials];
        this.filterUserItemOptions = [{ label: 'My Materials', value: true, icon: 'pi pi-user' },{ label: 'All Materials', value: false, icon: 'pi pi-globe' }]
        this.filterOptions = this.filterService.getGeneralMaterialFilterOptions();
        this.advancedMaterialFilterOptions = this.filterService.getAdvancedMaterialFilterOptions();
        this.location.replaceState('material');
        break;
      case 1:
        this.trainingItems = [...this.trainingActions];
        this.filterUserItemOptions = [{ label: 'My Actions', value: true, icon: 'pi pi-user' },{ label: 'All Actions', value: false, icon: 'pi pi-globe' }]
        this.filterOptions = this.filterService.getGeneralActionFilterOptions();
        this.advancedMaterialFilterOptions = this.filterService.getAdvancedActionFilterOptions();
        this.location.replaceState('action');
        break;
    }
    this.filterPipeline()
    this.ngZone.onStable.pipe(take(1)).subscribe(() => {
      this.updateButtonPosition();
    });
  }

  switchSortOrientation() {
    this.sortAsc = !this.sortAsc;
    this.sortingSerice.sortAsc = this.sortAsc;
    this.filterPipeline();
  }

  setSortOption(option: string) {
    this.selectedSortOption = option;
    this.sortingSerice.sortOption = option;
    this.filterPipeline()
  }

  setSearchOption(option: string) {
    this.searchOption = option;
    this.filterService.searchOption = option;
    this.filterPipeline()
  }

  setSearchValue(option: string) {
    this.searchValue = option;
    this.filterService.searchValue = option;
    this.filterPipeline()
  }

  setFilterByUserMaterial(newValue: boolean) {
    this.filterByUserItem = newValue;
    this.filterService.userItemFilter = newValue;
    this.filterPipeline()
  }

  setBoKConcepts(filterConcepts: string[]) {
    this.bokConcepts = filterConcepts;
    this.filterService.bokConcepts = filterConcepts;
    this.filterPipeline();
  }

  setShowAdvancedFilters(showAdvancedFilters: boolean) {
    this.showAdvancedFilters = showAdvancedFilters;
    this.filterService.showAdvancedFilters = showAdvancedFilters;
  }

  filterPipeline() {
    const sortedItems = this.sortItems(this.trainingItems);
    const searchedItems = this.searchItems(sortedItems);
    const filteredItems = this.filterItems(searchedItems);
    this.filteredTrainingItems = this.filterByBoKConcept(filteredItems);
    this.paginationTrainingItems = this.filteredTrainingItems.slice(this.first, this.first + this.rows)
  }

  sortItems(inputItems: TrainingItem[]): TrainingItem[] {
    return this.sortingSerice.sortItems(inputItems);
  }

  searchItems(sortedItems: TrainingItem[]) {
    const newSearch: TrainingItem[] = [];
    switch (this.searchOption) {
      case "Title":
        sortedItems.forEach( material => {
          if (material.title.toLowerCase().includes(this.searchValue.toLowerCase())) newSearch.push(material);
        });
        break;
      case "Description":
        sortedItems.forEach( material => {
          if (material.description.toLowerCase().includes(this.searchValue.toLowerCase())) newSearch.push(material);
        });
        break;
      case "Learning Outcome":
        sortedItems.forEach( material => {
          if (material.learningOutcomes.join(';').toLowerCase().includes(this.searchValue.toLowerCase())) newSearch.push(material);
        });
        break;
      default:
        console.log("Invalid Search Option");
    }
    return newSearch;
  }

  filterItems(searchedItems: TrainingItem[]) {
    const allFilters = [...this.filterOptions, ...this.advancedMaterialFilterOptions];
    const userId = this.firebase.getUserData()?.uid;
    const noFilters = allFilters.every(f => !f.selection || f.selection.length === 0);

    let materials = [...searchedItems];

    if (!this.filterByUserItem && noFilters) {
      materials = materials.filter(m =>
        userId ? (m.isPublic || m.userId === userId) : m.isPublic
      );
    } else {
      if (this.filterByUserItem && userId) {
        materials = materials.filter(m => m.userId === userId);
      } else if (userId) {
        materials = materials.filter(m => m.isPublic || m.userId === userId);
      } else {
        materials = materials.filter(m => m.isPublic);
      }

      materials = materials.filter(m =>
        allFilters.every(f =>
          !f.selection || f.selection.length === 0 || this.filterService.checkItem(m, f)
        )
      );
    }
    return materials;
  }

  filterByBoKConcept(filteredItems: TrainingItem[]): TrainingItem[] {
    if (!this.bokConcepts || this.bokConcepts.length == 0) {
      return filteredItems;
    }
    return filteredItems.filter(item => this.bokConcepts.some(concept => item.concepts.includes(concept)));
  }

  isLogged(): boolean {
    return this.firebase.getUserData() != null;
  }

  onPageChange(event: PaginatorState) {
      this.first = event.first ?? 0;
      this.rows = event.rows ?? 16;
      this.filterService.paginatorState = event;
      this.paginationTrainingItems = this.filteredTrainingItems.slice(this.first, this.first + this.rows)
  }

  createTrainingItem() {
    if (this.selectedTab === 0) {
      this.router.navigate(['material/new']);
    }
    else {
      this.router.navigate(['action/new']);
    }
  }

  trackById(index: number, item: any): string | number {
    return item._id ?? item.id ?? index;
  }

}