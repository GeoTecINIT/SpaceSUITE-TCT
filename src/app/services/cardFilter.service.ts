import { Injectable } from "@angular/core";
import { FilterOption } from "../model/filterOption";
import { TrainingMaterial } from "../model/trainingMaterial";
import { LanguageService } from "./language.service";
import { UtilsService } from "./utils.service";
import { PaginatorState } from "primeng/paginator";
import { TrainingMaterialService } from "./trainingMaterial.service";
import { TrainingItem } from "../model/trainingItem";
import { HttpClient } from "@angular/common/http";
import { concatMap, take } from "rxjs";

@Injectable({
    providedIn: 'root',
})
export class CardFilterService {
  private filterOptions: FilterOption[] = [];

  public searchValue: string = '';
  public searchOption: string = 'Title';
  public bokConcepts: string[] = [];
  public userItemFilter: boolean = false;
  public paginatorState: PaginatorState = {}
  public showAdvancedFilters: boolean = false;
  public sortOption: string = 'Title';
  public sortAsc: boolean = false;

  constructor(private readonly languageService: LanguageService, private readonly materialService: TrainingMaterialService, private readonly utilsService: UtilsService, private readonly http: HttpClient){
    http.get<FilterOption[]>('/assets/filters.json').pipe(
      take(1),
      concatMap((filters: FilterOption[]) => {
        this.filterOptions = filters;
        return this.materialService.getMaterialsOrganizations();
      })
    ).subscribe( organizations => this.filterOptions[this.filterOptions.length - 1].values = organizations);
  }

  public getGeneralMaterialFilterOptions(): FilterOption[] {
    const generalFilters = ['Subject', 'Language', 'Training Material Type', 'Target Audience']
    return generalFilters.map( value => this.getOptionByLabel(value))
  }

  public getAdvancedMaterialFilterOptions(): FilterOption[] {
    const generalFilters = ['EQF Level', 'Type of Assessment', 'Interactivity Type', 'License', 'Organizations']
    return generalFilters.map( value => this.getOptionByLabel(value))
  }

  public getGeneralActionFilterOptions(): FilterOption[] {
    const generalFilters = ['Subject', 'Language', 'Training Action Type', 'Target Audience']
    return generalFilters.map( value => this.getOptionByLabel(value))
  }

  public getAdvancedActionFilterOptions(): FilterOption[] {
    const generalFilters = ['EQF Level', 'Organizations']
    return generalFilters.map( value => this.getOptionByLabel(value))
  }

  public checkItem(item: TrainingItem, filter: FilterOption): boolean {
    if (item instanceof TrainingMaterial) return this.checkMaterial(item, filter);
    else return false;
  }

  public checkMaterial(material: TrainingMaterial, filter: FilterOption): boolean {
    switch(filter.label) {
      case 'EQF Level':
        return filter.selection.some(selection => material.educationLevel.includes(selection.slice(-1)));
      case 'Training Material Type':
        return filter.selection.some(selection => {
          if (selection === 'Other') {
            const validTags = filter.values.filter(value => value != 'Other');
            return material.materialType.some(value => !validTags.includes(value));
          }
          return material.materialType.includes(selection);
        });
      case 'Subject':
        return filter.selection.some(selection => {
          if (selection === 'Other') {
            const validOptions = filter.values.filter(value => value != 'Other');
            const validTags = validOptions.map(value => this.utilsService.knowledgeAreaToCode.get(value) || value);
            return material.subject.some(value => !validTags.includes(value));
          }
          const formatedSelection = this.utilsService.knowledgeAreaToCode.get(selection) || selection;
          return material.subject.includes(formatedSelection)
        });
      case 'Type of Assessment':
        return filter.selection.some(selection => {
          if (selection === 'Other') {
            const validTags = filter.values.filter(value => value != 'Other');
            return material.assessment.some(value => !validTags.includes(value));
          }
          return material.assessment.includes(selection)
        });
      case 'Target Audience':
        return filter.selection.some(selection => {
          if (selection === 'Other') {
            const validTags = filter.values.filter(value => value != 'Other');
            return material.audience.some(value => !validTags.includes(value));
          }
          return material.audience.includes(selection)
        });
      case 'Interactivity Type':
        return filter.selection.some(selection => {
          if (selection === 'Other') {
            const validTags = filter.values.filter(value => value != 'Other');
            return !validTags.includes(material.interactivityType || '')
          }
          return material.interactivityType == selection
        });
      case 'License':
        return filter.selection.some(selection => {
          if (selection === 'Other') {
            const validTags = filter.values.filter(value => value != 'Other');
            return !validTags.includes(material.license || '')
          }
          return material.license == selection
        });
      case 'Language':
        return filter.selection.some(selection => material.language?.toLowerCase() == this.languageService.getIsoCode(selection));
      case 'Organizations':
        return filter.selection.some(selection => material.orgName?.toLowerCase() == selection.toLowerCase());
      default:
        return true;
    }
  }

  public getOptionByLabel(label: string): FilterOption {
    const option = this.filterOptions.filter( option => option.label == label)
    if (option.length > 0) return option[0];
    return {
      label: label,
      values: [],
      selection: []
    };
  }
}