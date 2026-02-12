import { ChangeDetectorRef, Component, ElementRef, Input, ViewChild} from "@angular/core";
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { PopoverModule } from 'primeng/popover';
import { CommonModule } from "@angular/common";
import { TooltipModule } from 'primeng/tooltip';
import { UtilsService } from "../../services/utils.service";
import { Router } from "@angular/router";
import { TrainingItem } from "../../model/trainingItem";
import { TrainingMaterial } from "../../model/trainingMaterial";
import { SkillTagComponent, Tag } from "@eo4geo/ngx-bok-utils";
import { defaultIfEmpty, forkJoin } from "rxjs";
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  standalone: true,
  selector: 'card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css'],
  imports: [CommonModule, CardModule, SkillTagComponent, DividerModule, PopoverModule, TooltipModule, SkeletonModule],
})
export class CardComponent {
  @Input() trainingItem!: TrainingItem;

  @ViewChild('container') containerElement!: ElementRef;
  @ViewChild('subjects') subjectsElement!: ElementRef;

  @ViewChild('titleRef') titleRef!: ElementRef;
  @ViewChild('orgRef') orgRef!: ElementRef;

  concepts: Tag[] = [];
  visibleConcepts: Tag[] = [];
  conceptsLoaded: boolean = false;
  conceptsOverflowChecked: boolean = false;

  overflow: boolean = false;
  compactConcepts: boolean = false;
  showTitleTooltip: boolean = false;
  showOrgTooltip: boolean = false;

  imagePlaceholder: string;

  isMaterial: boolean = true;

  skeletonElements: number[] = [];
  showSkelleton: boolean = true;

  constructor(private utilsService: UtilsService, private cdr: ChangeDetectorRef, private router: Router) {
    this.imagePlaceholder = this.utilsService.imagePlaceholder;
    this.skeletonElements = Array(10).fill(null);
  }

  ngOnInit() {
    this.isMaterial = this.trainingItem instanceof TrainingMaterial;
    
    const bokSubjects: string[] = [];
    this.trainingItem.subject.forEach(subject => {
      if (this.utilsService.codeToKnowledgeArea.has(subject)) bokSubjects.push(subject);
    })

    forkJoin([
      this.utilsService.stringToTag(this.trainingItem.concepts, 'bok').pipe(defaultIfEmpty([])),
      this.utilsService.stringToTag(bokSubjects, 'bok').pipe(defaultIfEmpty([]))
    ]).subscribe(results => {
      this.concepts = [...this.concepts, ...results[0], ...results[1]];
      this.concepts.sort((a, b) => a.label.localeCompare(b.label));
      this.visibleConcepts = [...this.concepts];
      this.conceptsLoaded = true;
    });
  }

  ngAfterViewInit() {
    const titleEl = this.titleRef.nativeElement;
    const orgEl = this.orgRef.nativeElement;
    this.showTitleTooltip = titleEl.scrollHeight > titleEl.clientHeight;
    this.showOrgTooltip = orgEl.scrollWidth > orgEl.clientWidth;
    this.cdr.detectChanges();
  }

  ngAfterViewChecked() {
    if (!this.conceptsOverflowChecked && this.conceptsLoaded) {
      this.compactConcepts = this.checkOverflow();
      this.showSkelleton = this.compactConcepts;
      this.conceptsOverflowChecked = true;
      this.cdr.detectChanges();
    }
  }

  tagsChanged() {
    this.overflow = this.checkOverflow();
    if (this.overflow) {
      this.hideOverflowElements();
    }
    this.showSkelleton = false;
  }

  checkOverflow(): boolean {
    const containerHeight = this.containerElement.nativeElement.clientHeight;
    const subjectsHeight = this.subjectsElement.nativeElement.scrollHeight;
    return (subjectsHeight > containerHeight);
  }

  hideOverflowElements() {
    const containerRect = this.containerElement.nativeElement.getBoundingClientRect();
    const subjectChildren: HTMLElement[] = this.subjectsElement.nativeElement.querySelectorAll(
      'skill-tags > div > div'
    );
    const hiddenElements: number[] = [];
  
    Array.from(subjectChildren).forEach((child: HTMLElement, index: number) => {
      const childRect = child.getBoundingClientRect();
      const isVisible = childRect.top >= containerRect.top && childRect.bottom <= containerRect.bottom;

      if (!isVisible) {
        hiddenElements.push(index);
      }
    });

    this.visibleConcepts = this.concepts.filter(
      (_, index) => !hiddenElements.includes(index)
    );
    
    this.visibleConcepts.pop();
  }

  onClickTitle(event: MouseEvent) {
    event.preventDefault();
    if (this.isMaterial) {
      this.router.navigate(['material/' + this.trainingItem._id]);
    }
    else {
      this.router.navigate(['action/' + this.trainingItem._id]);
    }
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = this.imagePlaceholder;
    img.onerror = null;  // Prevent loops
  }
}