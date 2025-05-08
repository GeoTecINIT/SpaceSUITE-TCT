import { ChangeDetectorRef, Component, ElementRef, Input, ViewChild} from "@angular/core";
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { PopoverModule } from 'primeng/popover';
import { TrainingMaterial } from "../../model/trainingMaterial";
import { CommonModule } from "@angular/common";
import { BokInformationService } from "@eo4geo/ngx-bok-visualization";
import { TooltipModule } from 'primeng/tooltip';
import { UtilsService } from "../../services/utils.service";
import { Router } from "@angular/router";

@Component({
  standalone: true,
  selector: 'card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css'],
  imports: [CommonModule, CardModule, TagModule, DividerModule, PopoverModule, TooltipModule],
})
export class CardComponent {
  @Input() trainingMaterial!: TrainingMaterial;
  @ViewChild('container') containerElement!: ElementRef;
  @ViewChild('subjects') subjectsElement!: ElementRef;


  concepts: string[] = [];
  visibleConcepts: string[] = [];
  selectedConceptsColor: Map<string, string> = new Map();
  selectedConceptsTooltip: Map<string, string> = new Map();
  overflow: boolean = false;

  imagePlaceholder: string = "https://www.esri.com/content/dam/esrisites/en-us/home/homepage-what-is-gis-static-dynamic.jpg";

  constructor(private bokInfo: BokInformationService, private utilsService: UtilsService, private cdr: ChangeDetectorRef, private router: Router) {}

  ngOnInit() {
    this.trainingMaterial.concepts.forEach(concept => {
      this.concepts.push(concept)
      this.bokInfo.getConceptColor(concept).subscribe(
        color => {
          const softColor = color ? this.utilsService.convertHexToRgba(color, 0.5) : '';
          this.selectedConceptsColor.set(concept, softColor)
        }
      );
      this.bokInfo.getConceptName(concept).subscribe(
        tooltip => this.selectedConceptsTooltip.set(concept, tooltip ? tooltip : 'Deprecated concept')
      );
    })
    this.visibleConcepts = [...this.concepts];
  }

  ngAfterViewInit() {
    this.checkOverflow();
    if (this.overflow) {
      this.hideOverflowElements();
      this.cdr.detectChanges();
    }
  }

  checkOverflow() {
    const containerHeight = this.containerElement.nativeElement.clientHeight;
    const subjectsHeight = this.subjectsElement.nativeElement.scrollHeight;
    this.overflow = (subjectsHeight > containerHeight);
  }

  hideOverflowElements() {
    const containerRect = this.containerElement.nativeElement.getBoundingClientRect();
    const subjectChildren: HTMLElement[] = this.subjectsElement.nativeElement.children;
    const hiddenElements: string[] = [];
  
    Array.from(subjectChildren).forEach((child: HTMLElement) => {
      const childRect = child.getBoundingClientRect();
      const isVisible = childRect.top >= containerRect.top && childRect.bottom <= containerRect.bottom;

      if (!isVisible) {
        hiddenElements.push(child.textContent!);
      }
    });
  
    this.visibleConcepts = this.concepts.filter(item => !hiddenElements.includes(item));
    this.visibleConcepts.pop();
  }

  onClickConcept(code: string) {
    window.open('https://bok.eo4geo.eu/' + code);
  }

  onClickTitle(event: MouseEvent) {
    event.preventDefault(); 
    this.router.navigate([this.trainingMaterial._id], { replaceUrl: true });
  }

  getTooltipClass(tooltipContent: string): string {
    if (tooltipContent == 'Deprecated concept') return 'custom-p-tooltip-text';
    return '';
  }

}