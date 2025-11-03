import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output, SimpleChanges } from "@angular/core";
import { FormsModule } from '@angular/forms';
import { DividerModule } from "primeng/divider";
import { InputTextModule } from 'primeng/inputtext'
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FilterOption } from "../../model/filterOption";
import { BokModalComponent } from "../bokModal/bokModal.component";
import { CardFilterService } from "../../services/cardFilter.service";
import { TooltipModule } from "primeng/tooltip";
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from "primeng/button";

@Component({
  standalone: true,
  selector: 'filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.css'],
  imports: [CommonModule, FormsModule, DividerModule, InputTextModule, MultiSelectModule, BokModalComponent, SelectButtonModule, TooltipModule,
            InputGroupModule, InputGroupAddonModule, MenuModule, ButtonModule],
})
export class FiltersComponent {
  @Input() multiSelectOptions: FilterOption[] = [];
  @Output() multiSelectOptionsChange: EventEmitter<FilterOption[]> = new EventEmitter();

  @Input() advancedMultiSelectOptions: FilterOption[] = [];
  @Output() advancedMultiSelectOptionsChange: EventEmitter<FilterOption[]> = new EventEmitter();
  showAdvancedFilters: boolean = false;

  @Input() loading: boolean = false;

  searchValue: string;
  @Output() searchValueChange: EventEmitter<string> = new EventEmitter();

  searchOptions: MenuItem[] | undefined;
  @Input() selectedOption: string = "Title"
  @Output() selectedOptionChange: EventEmitter<string> = new EventEmitter();

  bokConcepts: string[] = []
  @Output() bokConceptsChange: EventEmitter<string[]> = new EventEmitter();

  filterUserMaterialOptions: any[] = [{ label: 'My Materials', value: true, icon: 'pi pi-user' },{ label: 'All Materials', value: false, icon: 'pi pi-globe' }];
  filterUserMaterial: boolean = false;
  @Output() filterUserMaterialChange: EventEmitter<boolean> = new EventEmitter();

  @Input() logged: boolean = false;

  constructor(private filterService: CardFilterService) {
    this.searchValue = filterService.searchValue;
    this.filterUserMaterial = filterService.userMaterialFilter;
    this.bokConcepts = filterService.bokConcepts;
    this.showAdvancedFilters = filterService.showAdvancedFilters;
    this.searchOptions = [{ label: 'Title' }, { label: 'Description' }, { label: 'Learning Outcome' }];
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes["logged"] && !changes["logged"].isFirstChange() && changes['logged'].currentValue == false) { 
      this.filterUserMaterial = false;
    }
  }

  getMultiselectOptions(filterOption: FilterOption): {id: string, value: string}[] {
    if (filterOption.values) {
      return filterOption.values.filter(value => value != 'Other').map((x, i) => ({ id: filterOption.tags[i], value: x }));
    }
    return filterOption.tags.filter(value => value != 'Other').map(x => ({ id: x, value: x}));
  }

  updateOptions() {
    this.multiSelectOptionsChange.emit(this.multiSelectOptions);
  }

  updateAdvancedOptions() {
    this.advancedMultiSelectOptionsChange.emit(this.advancedMultiSelectOptions);
  }

  updateSearchValue() {
    this.searchValueChange.emit(this.searchValue);
  }

  updateFilterUserMaterial() {
    this.filterUserMaterialChange.emit(this.filterUserMaterial);
  }

  clearOptions(label: string) {
    let currentOption = this.multiSelectOptions.find(option => option.label === label);
    if (currentOption) currentOption.selection = [];
    this.updateOptions();
  }

  clearAdvancedOptions(label: string) {
    let currentOption = this.advancedMultiSelectOptions.find(option => option.label === label);
    if (currentOption) currentOption.selection = [];
    this.updateAdvancedOptions();
  }

  setSearchOption(option: string) {
    this.selectedOptionChange.emit(option);
  }

  changeAdvancedFiltersState() {
    this.showAdvancedFilters = !this.showAdvancedFilters;
    this.filterService.showAdvancedFilters = this.showAdvancedFilters;
    if (!this.showAdvancedFilters) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

}