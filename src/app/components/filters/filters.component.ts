import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FormsModule } from '@angular/forms';
import { DividerModule } from "primeng/divider";
import { InputIcon } from 'primeng/inputicon';
import { ButtonModule } from "primeng/button";
import { IconField } from 'primeng/iconfield';
import { InputTextModule } from 'primeng/inputtext'
import { MultiSelectModule } from 'primeng/multiselect';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { FilterOption } from "../../model/filterOption";
import { BokModalComponent } from "../bokModal/bokModal.component";
import { CardFilterService } from "../../services/cardFilter.service";
import { Router } from "@angular/router";

@Component({
  standalone: true,
  selector: 'filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.css'],
  imports: [CommonModule, FormsModule, DividerModule, InputIcon, IconField, InputTextModule, MultiSelectModule, BokModalComponent, ButtonModule, ToggleButtonModule],
})
export class FiltersComponent {
  @Input() multiSelectOptions: FilterOption[] = [];
  @Output() multiSelectOptionsChange: EventEmitter<FilterOption[]> = new EventEmitter();

  @Input() loading: boolean = false;

  searchValue: string;
  @Output() searchValueChange: EventEmitter<string> = new EventEmitter();

  @Output() bokConceptsChange: EventEmitter<string[]> = new EventEmitter();

  filterUserMaterial: boolean = false;
  @Output() filterUserMaterialChange: EventEmitter<boolean> = new EventEmitter();

  @Input() logged: boolean = false;

  constructor(private filterService: CardFilterService, private router: Router) {
    this.searchValue = filterService.searchOption;
    this.filterUserMaterial = filterService.userMaterialFilter;
  }

  updateOptions() {
    this.multiSelectOptionsChange.emit(this.multiSelectOptions);
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

  createTrainingMaterial() {
    this.router.navigate(['new'], {replaceUrl: true});
  }

}