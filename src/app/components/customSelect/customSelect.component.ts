import { Component, ElementRef, EventEmitter, Input, Output, SimpleChanges, ViewChild} from "@angular/core";
import { FloatLabelModule } from "primeng/floatlabel";
import { FormsModule } from "@angular/forms";
import { IconFieldModule } from 'primeng/iconfield';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { CommonModule } from "@angular/common";
import { Select, SelectModule } from "primeng/select";
import { CardFilterService } from "../../services/cardFilter.service";

@Component({
  standalone: true,
  selector: 'custom-select',
  templateUrl: './customSelect.component.html',
  styleUrls: ['./customSelect.component.css'],
  imports: [FloatLabelModule, FormsModule, IconFieldModule, ButtonModule, ChipModule, CommonModule, SelectModule],
})
export class CustomSelectComponent {

  @Input() selection?: string;
  @Input() optionsName: string = "";
  @Input() dynamicOptionName: string = "";
  @Output() selectionChange: EventEmitter<string> = new EventEmitter();

  currentText: string = '';
  selectOptions: any[] = [];

  private dynamicOptions: Map<string, string[]> = new Map();

  @Input() fieldName: string = 'Field Name';
  @Input() icon: string = 'pi pi-users';
  @Input() error: boolean = false;
  @Input() filter: boolean = true;

  @ViewChild('pselect', { read: Select }) multiSelectEl!: Select;

  constructor(private filterService: CardFilterService) {}

  ngOnInit() {
    this.filterService.getOptionByLabel(this.optionsName).subscribe( filterOption => {
      if (filterOption.dynamicValues && filterOption.valuesMap) {
        this.dynamicOptions = filterOption.valuesMap;
        this.selectOptions = filterOption.valuesMap.get(this.dynamicOptionName)?.map(x => ({ id: x, value: x})) ?? [];
      }
      else this.selectOptions = filterOption.values.filter(value => value != 'Other').map(x => ({ id: x, value: x}));
      if (this.selection && this.selection != '' && !this.selectOptions.map(value => value.value).includes(this.selection)){
        this.selectOptions = this.selectOptions.concat({ id: this.selection, value: this.selection})
      }
    })
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dynamicOptionName'] && !changes['dynamicOptionName'].firstChange) {
      if (this.dynamicOptions) {
        this.selectionChange.emit(undefined)
        this.selectOptions = this.dynamicOptions.get(changes['dynamicOptionName'].currentValue)?.map(x => ({ id: x, value: x})) ?? [];
      }
    }
  }

  onDropdownOpen() {
    setTimeout(() => {
      const input = document.querySelector('.p-select-filter') as HTMLInputElement | null;
      if (input) {
        const keyHandler = (event: KeyboardEvent) => {
          if (event.key === 'Enter') {
            input.removeEventListener('keyup', keyHandler);
            this.clickButton();
          }
        };
        input.addEventListener('keyup', keyHandler);
      }
    }, 20);
  }

  clickButton() {
    const inputValue: string = this.currentText.trim();
    if (inputValue != ''){
      if (!this.selectOptions.map(value => value.value).includes(inputValue)) {
        this.selectOptions = this.selectOptions.concat({ id: inputValue, value: inputValue})
      }
      this.selectionChange.emit(inputValue);
    }
    this.currentText = '';
    this.multiSelectEl.hide()
  }
}