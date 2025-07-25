import { Component, ElementRef, EventEmitter, Input, Output, ViewChild} from "@angular/core";
import { FloatLabelModule } from "primeng/floatlabel";
import { FormsModule } from "@angular/forms";
import { IconFieldModule } from 'primeng/iconfield';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { CommonModule } from "@angular/common";
import { MultiSelect, MultiSelectModule } from "primeng/multiselect";
import { CardFilterService } from "../../services/cardFilter.service";

@Component({
  standalone: true,
  selector: 'multiselect-chips',
  templateUrl: './multiselectChips.component.html',
  styleUrls: ['./multiselectChips.component.css'],
  imports: [FloatLabelModule, FormsModule, IconFieldModule, ButtonModule, ChipModule, CommonModule, MultiSelectModule],
})
export class MultiselectChipsComponent {

  @Input() chips: string[] = [];
  @Input() optionsName: string = "";
  @Output() chipsChange: EventEmitter<string[]> = new EventEmitter();
  currentText: string = '';
  multiSelection: string[] = []
  multiselectOptions: any[] = [];

  @Input() fieldName: string = 'Field Name';
  @Input() icon: string = 'pi pi-users';

  @Input() error: boolean = false;

  @Input() filter: boolean = true;

  @ViewChild('pmulti', { read: MultiSelect }) multiSelectEl!: MultiSelect;

  constructor(private filterService: CardFilterService) {}

  ngOnInit() {
    const filterOption = this.filterService.getOptionByLabel(this.optionsName);
    this.multiselectOptions = filterOption.tags.filter(value => value != 'Other').map(x => ({ id: x, value: x}));
  }

  onDropdownOpen() {
    setTimeout(() => {
      const input = document.querySelector('.p-multiselect-filter-container .p-inputtext') as HTMLInputElement | null;
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
      this.chipsChange.emit(this.chips.concat(inputValue));
    }
    this.currentText = '';
    this.multiSelectEl.hide()
  }

  deleteElement(element: string) {
    this.multiSelection = this.multiSelection.filter(value => value != element)
    this.chipsChange.emit(this.chips.filter(value => value != element));
  }

  multiselectChange(values: string[]) {
    this.multiSelection = values || [];
    const include = this.multiSelection.filter(value => !this.chips.includes(value));
    const exclude = this.chips.filter(value => !this.multiSelection.includes(value) && this.multiselectOptions.map(x => x.value).includes(value));
    this.chipsChange.emit(this.chips.concat(include).filter(value => !exclude.includes(value)));
  }
}