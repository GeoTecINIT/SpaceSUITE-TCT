import { Component, ElementRef, ViewChild } from "@angular/core";
import { SkeletonModule } from 'primeng/skeleton';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { CardComponent } from "../card/card.component";
import { TrainingMaterial } from "../../model/trainingMaterial";
import { CommonModule } from "@angular/common";
import { TrainingMaterialService } from "../../services/trainingMaterial.service";
import { filter } from "rxjs";
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

@Component({
  standalone: true,
  selector: 'material-explorer',
  templateUrl: './materialExplorer.component.html',
  styleUrls: ['./materialExplorer.component.css'],
  imports: [CardComponent, FiltersComponent, SkeletonModule, CommonModule, PaginatorModule, ToastModule, ButtonModule, MenuModule, ButtonGroupModule, TabsModule],
  providers: [MessageService]
})
export class MaterialExplorerComponent {
  trainingMaterialArray: TrainingMaterial[] = [];
  searchedTrainingMaterial: TrainingMaterial[] = [];
  filteredTrainingMaterial: TrainingMaterial[] = [];
  finalTrainingMaterial: TrainingMaterial[] = [];
  filterOptions: FilterOption[] = [];
  advancedFilterOptions: FilterOption[] = [];
  filterByUserMaterial: boolean = false;
  loading: boolean = true;
  skelletonElements: number[] = [];

  searchOption: string = "Title";

  first: number = 0;
  rows: number = 16;
  paginationTrainingMaterial: TrainingMaterial[] = [];

  @ViewChild('container') containerRef!: ElementRef;
  showButton = true;
  buttonBottom = 32;

  sortOptions: MenuItem[] | undefined;
  selectedSortOption: string = "Title"
  sortAsc: boolean = false;

  tabs = [
        { id: 0, label: 'Training Materials', icon: 'pi pi-home', disabled: false },
        { id: 1, label: 'Training Actions', icon: 'pi pi-chart-line', disabled: true },
    ];

  constructor(private trainingMaterialService: TrainingMaterialService, private filterService: CardFilterService, private router: Router,
              private firebase: FirebaseService, private messageService: MessageService, private route: ActivatedRoute) {
    this.skelletonElements = Array(16).fill(null);
    this.sortOptions = [{ label: 'Title' }, { label: 'Date' }, {label: 'EQF'}];
  }

  ngOnInit() {
    this.filterOptions = this.filterService.getGeneralFilterOptions();
    this.advancedFilterOptions = this.filterService.getAdvancedFilterOptions();
    this.trainingMaterialService.getTrainingMaterialsArray().pipe(
      filter(value => value !== undefined)
    ).subscribe(
    (newValue: TrainingMaterial[]) => {
      this.trainingMaterialArray = newValue;
      this.filterByUserMaterial = this.filterService.userMaterialFilter;
      this.sortAsc = this.filterService.sortAsc;
      this.setSortOption(this.filterService.sortOption);
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

    if (bottomOverlap >= 32) {
      this.buttonBottom = bottomOverlap
    } else {
      this.buttonBottom = 32;
    }
  };

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.updateButtonPosition);
  }

  setSearchOption(option: string) {
    this.searchOption = option;
    this.filterService.searchOption = option;
    this.searchTrainingMaterial(this.filterService.searchValue);
  }

  setSortOption(option: string) {
    this.selectedSortOption = option;
    this.filterService.sortOption = option;
    switch(this.selectedSortOption) {
      case 'Title':
        if (this.sortAsc) {
          this.trainingMaterialArray = this.trainingMaterialArray.sort((a, b) => b.title.localeCompare(a.title));
        }
        else {
          this.trainingMaterialArray = this.trainingMaterialArray.sort((a, b) => a.title.localeCompare(b.title));
        }
        break;
      case 'Date':
        if (this.sortAsc) {
          this.trainingMaterialArray = this.trainingMaterialArray.sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime());
        }
        else {
          this.trainingMaterialArray = this.trainingMaterialArray.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
        }
        break;
      case 'EQF':
        if (this.sortAsc) {
          this.trainingMaterialArray = this.trainingMaterialArray.sort((a, b) => {
            const lastAIndex: number = a.educationLevel.length - 1;
            const lastBIndex: number = b.educationLevel.length - 1;
            const minLen: number = Math.min(lastAIndex, lastBIndex);
            for (let i = 0; i <= minLen; i++) {
              const valA = parseInt(a.educationLevel[lastAIndex - i] ?? '0');
              const valB = parseInt(b.educationLevel[lastBIndex - i] ?? '0');
              if (valA !== valB) return valA - valB;
            }
            return a.educationLevel.length - b.educationLevel.length;
          });
        }
        else {
          this.trainingMaterialArray = this.trainingMaterialArray.sort((a, b) => {
            const lastAIndex: number = a.educationLevel.length - 1;
            const lastBIndex: number = b.educationLevel.length - 1;
            const minLen: number = Math.min(lastAIndex, lastBIndex);
            for (let i = 0; i <= minLen; i++) {
              const valA = parseInt(a.educationLevel[lastAIndex - i] ?? '0');
              const valB = parseInt(b.educationLevel[lastBIndex - i] ?? '0');
              if (valA !== valB) return valB - valA;
            }
            return b.educationLevel.length - a.educationLevel.length;
          });
        }
        break;
    }
    this.setSearchOption(this.filterService.searchOption);
  }

  switchSortOrientation() {
    this.sortAsc = !this.sortAsc;
    this.filterService.sortAsc = this.sortAsc;
    this.setSortOption(this.filterService.sortOption);
  }

  searchTrainingMaterial(searchvalue: string) {
    this.filterService.searchValue = searchvalue;
    let newSearch: TrainingMaterial[] = [];
    switch (this.searchOption) {
      case "Title":
        this.trainingMaterialArray.forEach( material => {
          if (material.title.toLowerCase().includes(searchvalue.toLowerCase())) newSearch.push(material);
        });
        break;
      case "Description":
        this.trainingMaterialArray.forEach( material => {
          if (material.description.toLowerCase().includes(searchvalue.toLowerCase())) newSearch.push(material);
        });
        break;
      case "Learning Outcome":
        this.trainingMaterialArray.forEach( material => {
          if (material.learningOutcomes.join(';').toLowerCase().includes(searchvalue.toLowerCase())) newSearch.push(material);
        });
        break;
      default:
        console.log("Invalid Search Option");
    }
    this.searchedTrainingMaterial = newSearch;
    this.filterTrainingMaterial();
  }

  filterTrainingMaterial() {
    const allFilters = this.filterOptions.concat(this.advancedFilterOptions);
    if (allFilters.every(filter => !filter.selection || filter.selection.length === 0) && !this.filterByUserMaterial) {
      this.filteredTrainingMaterial = this.searchedTrainingMaterial;
    }
    else{
      let newFilteredMaterial = [...this.searchedTrainingMaterial];
      const userId = this.firebase.getUserData()?.uid
      if (this.filterByUserMaterial && userId) {
        newFilteredMaterial = newFilteredMaterial.filter(material => material.userId == userId)
      }
      newFilteredMaterial = newFilteredMaterial.filter(material => 
        allFilters.every(filter => 
          !filter.selection || filter.selection.length === 0|| this.filterService.checkMaterial(material, filter)
        ) 
      );
      this.filteredTrainingMaterial = newFilteredMaterial;
    }
    this.filterByBoKConcept(this.filterService.bokConcepts);
  }

  filterByBoKConcept(filterConcepts: string[]) {
    this.filterService.bokConcepts = filterConcepts;
    if (!filterConcepts || filterConcepts.length == 0) {
      this.finalTrainingMaterial = this.filteredTrainingMaterial;
      this.paginationTrainingMaterial = this.finalTrainingMaterial.slice(this.first, this.first + this.rows)
      return;
    }
    this.finalTrainingMaterial = this.filteredTrainingMaterial.filter(material =>
      filterConcepts.some(filterConcept => material.concepts.includes(filterConcept))
    );
    this.paginationTrainingMaterial = this.finalTrainingMaterial.slice(this.first, this.first + this.rows)
  }

  filterByUserMaterialChange(newValue: boolean) {
    this.filterByUserMaterial = newValue;
    this.filterService.userMaterialFilter = newValue;
    this.searchTrainingMaterial(this.filterService.searchValue);
  }

  isLogged(): boolean {
    return this.firebase.getUserData() != null;
  }

  onPageChange(event: PaginatorState) {
      this.first = event.first ?? 0;
      this.rows = event.rows ?? 8;
      this.filterService.paginatorState = event;
      this.paginationTrainingMaterial = this.finalTrainingMaterial.slice(this.first, this.first + this.rows)
  }

  createTrainingMaterial() {
    this.router.navigate(['new']);
  }

}