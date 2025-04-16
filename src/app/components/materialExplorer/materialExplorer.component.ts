import { Component, inject, Inject } from "@angular/core";
import { SkeletonModule } from 'primeng/skeleton';
import { ScrollTopModule } from 'primeng/scrolltop';
import { CardComponent } from "../card/card.component";
import { TrainingMaterial } from "../../model/trainingMaterial";
import { CommonModule } from "@angular/common";
import { TrainingMaterialService } from "../../services/trainingMaterial.service";
import { filter } from "rxjs";
import { FiltersComponent } from "../filters/filters.component";
import { FilterOption } from "../../model/filterOption";
import { CardFilterService } from "../../services/cardFilter.service";
import { FirebaseService } from "../../services/firebase.service";

@Component({
  standalone: true,
  selector: 'material-explorer',
  templateUrl: './materialExplorer.component.html',
  styleUrls: ['./materialExplorer.component.css'],
  imports: [CardComponent, FiltersComponent, SkeletonModule, CommonModule, ScrollTopModule],
})
export class MaterialExplorerComponent {
  trainingMaterialArray: TrainingMaterial[] = [];
  searchedTrainingMaterial: TrainingMaterial[] = [];
  filteredTrainingMaterial: TrainingMaterial[] = [];
  finalTrainingMaterial: TrainingMaterial[] = [];
  filterOptions: FilterOption[] = [];
  userFilterOptions: FilterOption[] = [];
  filterByUserMaterial: boolean = false;
  loading: boolean = true;
  skelletonElements: number[] = [];

  constructor(private trainingMaterialService: TrainingMaterialService, private filterService: CardFilterService, private firebase: FirebaseService) {
    this.skelletonElements = Array(16).fill(null);
  }

  ngOnInit() {
    this.filterOptions = this.filterService.getFilterOptions();
    this.userFilterOptions = this.filterService.getUserFilterOptions();
    this.trainingMaterialService.getTrainingMaterials().pipe(
      filter(value => value !== undefined)
    ).subscribe(
    (newValue: TrainingMaterial[]) => {
      this.trainingMaterialArray = newValue;
      this.filterByUserMaterial = this.filterService.userMaterialFilter;
      this.searchTrainingMaterial(this.filterService.searchOption);
      this.loading = false;
    });
  }

  searchTrainingMaterial(searchvalue: string) {
    this.filterService.searchOption = searchvalue;
    let newSearch: TrainingMaterial[] = [];
    this.trainingMaterialArray.forEach( material => {
      if (material.title.toLowerCase().includes(searchvalue.toLowerCase())) newSearch.push(material);
    });
    this.searchedTrainingMaterial = newSearch;
    this.filterTrainingMaterial();
  }

  filterTrainingMaterial() {
    if (this.filterOptions.every(filter => !filter.selection || filter.selection.length === 0) &&
        this.userFilterOptions.every(filter => !filter.selection || filter.selection.length === 0) &&
        !this.filterByUserMaterial) {
      this.filteredTrainingMaterial = this.searchedTrainingMaterial;
    }
    else{
      let newFilteredMaterial = [...this.searchedTrainingMaterial];
      const userId: string = this.firebase.userId
      if (this.filterByUserMaterial && userId != '') {
        newFilteredMaterial = newFilteredMaterial.filter(material => material.userId == userId)
      }
      newFilteredMaterial = newFilteredMaterial.filter(material => 
        this.filterOptions.every(filter => 
          !filter.selection || filter.selection.length === 0|| this.filterService.checkMaterial(material, filter)
        ) 
      ).filter(material => 
        this.userFilterOptions.every(filter => 
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
      return;
    }
    this.finalTrainingMaterial = [];
    for (let filterConcept of filterConcepts){
      let partialTrainingMaterial = this.filteredTrainingMaterial.filter(material =>
          material.relation.some(concept => concept.replace(/^eo4geo:/, "") === filterConcept)
      );
      this.finalTrainingMaterial = this.finalTrainingMaterial.concat(partialTrainingMaterial);
    }
  }

  filterByUserMaterialChange(newValue: boolean) {
    this.filterByUserMaterial = newValue;
    this.filterService.userMaterialFilter = newValue;
    this.filterTrainingMaterial();
  }

  isLogged(): boolean {
    return this.firebase.userId != '';
  }

}