import { Injectable } from "@angular/core";
import { FilterOption } from "../model/filterOption";
import { TrainingMaterial } from "../model/trainingMaterial";
import { LanguageService } from "./language.service";
import { BokInformationService } from "@eo4geo/ngx-bok-visualization";
import { FirebaseService } from "./firebase.service";

@Injectable({
    providedIn: 'root',
})
export class CardFilterService {
  private filterOptions: FilterOption[] = [
    {
      label: 'EQF Level',
      tags: [
        'EQF 1',
        'EQF 2',
        'EQF 3',
        'EQF 4',
        'EQF 5',
        'EQF 6',
        'EQF 7',
        'EQF 8'
      ],
      selection: []
    },
    {
      label: 'Course Type',
      tags: [
        'Self-learning material',
        'Teaching material'
      ],
      selection: []
    },
    {
      label: 'Course Format',
      tags: [
        'MP4 Video',
        'MP3 Audio',
        'PDF File',
        'HTML Document',
        'PPTX Slides'
      ],
      selection: []
    },
    {
      label: 'Language',
      tags: [
        "English",
        "Spanish",
        "French",
        "German",
        "Italian",
        "Portuguese",
        "Dutch",
        "Russian",
        "Greek",
        "Polish",
        "Swedish",
        "Norwegian",
        "Finnish",
        "Danish",
        "Czech",
        "Hungarian",
        "Ukrainian",
        "Romanian",
        "Bulgarian",
        "Serbian",
        "Croatian",
        "Slovak",
        "Slovenian",
        "Lithuanian",
        "Latvian",
        "Estonian"      
      ],
      selection: []
    },
    {
      label: 'License',
      tags: [
        'CC BY',
        'CC BY-SA',
        'CC BY-NC',
        'CC BY-ND',
        'CC BY-NC-SA',
        'CC BY-NC-ND',
        'GNU FDL',
        'MIT License',
        'Apache 2.0',
        'All Rights Reserved',
        'Public Domain',
        'OER-Compatible',
      ],
      selection: []
    }
  ];

  private userFilterOptions: FilterOption[] = [
    {
      label: 'User Organizations',
      tags: [],
      selection: []
    }
  ];

  public searchOption: string = '';
  public bokConcepts: string[] = [];
  public userMaterialFilter: boolean = false;

  constructor(private readonly languageService: LanguageService, private readonly firebase: FirebaseService){
    this.firebase.getUserOrganizationList().subscribe( organizations => this.userFilterOptions[0].tags = organizations.map(value => value.name));
  }

  public getFilterOptions(): FilterOption[] {
    return this.filterOptions;
  }

  public getUserFilterOptions(): FilterOption[] {
    return this.userFilterOptions;
  }

  public checkMaterial(material: TrainingMaterial, filter: FilterOption): boolean {
    switch(filter.label) {
      case 'EQF Level':
        return filter.selection.some(selection => material.educationLevel.includes(selection.slice(-1)));
      case 'Course Type':
        return filter.selection.some(selection => material.materialType?.toLowerCase().includes(selection.toLowerCase()));
      case 'Course Format':
        // TODO
        return true;
      case 'Language':
        return filter.selection.some(selection => material.language?.toLowerCase().includes(this.languageService.getIsoCode(selection)));
      case 'User Organizations':
        return filter.selection.some(selection => material.orgId?.toLowerCase().includes(selection.toLowerCase()));
      default:
        return true;
    }
  }

  public getOptionByLabel(label: string): FilterOption {
    const option = this.filterOptions.filter( option => option.label == label)
    if (option.length > 0) return option[0];
    return {
      label: '',
      tags: [],
      selection: []
    };
  }
}