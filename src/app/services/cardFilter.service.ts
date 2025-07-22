import { Injectable } from "@angular/core";
import { FilterOption } from "../model/filterOption";
import { TrainingMaterial } from "../model/trainingMaterial";
import { LanguageService } from "./language.service";
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
      selection: [],
      tootltip: 'The European Qualifications Framework, a common reference which assists in comparing qualifications systems.'
    },
    {
      label: 'Course Type',
      tags: [
        'Text-based Materials',
        'Visual Materials',
        'Interactive Training Materials',
        'Video and Audio-based Materials',
        'Online Training (E-Learning)',
        'Instructor-Led Materials',
        'Hands-on Materials',
        'Assessments & Feedback Materials',
        'Reference Materials',
        'Mobile Learning (M-Learning)',
        'Other'
      ],
      selection: []
    },
    {
      label: 'Interactivity Type',
      tags: [
        'Face To Face',
        'Online synchronous',
        'Online asynchronous',
        'Self-Paced',
        'Blended',
        'WorkBased',
        'Other'
      ],
      selection: []
    },
    {
      label: 'Target Audience',
      tags: [
        'Teachers / trainers / facilitators',
        'Lower secondary students (ages 12-14)',
        'Upper secondary students (ages 15-18)',
        'Undergraduate / tertiary students (Bachelor’s level)',
        'Graduate / postgraduate students (Master’s and Doctoral level)',
        'Vocational trainees / apprentices',
        'Adult & lifelong learners',
        'Industry professionals',
        'Jobseeker / Reskilling participant',
        'General public',
        'Learners with special‐education needs',
        'Other'
      ],
      selection: []
    },
    {
      label: 'Type of Assessment',
      tags: [
        'No assessment required',
        'Quiz',
        'Exam',
        'Simulation',
        'Peer review',
        'Self-assessment',
        'Instructor-assessed',
        'Practical assignment',
        'Project presentation',
        'Other'
      ],
      selection: []
    },
    {
      label: 'Subject',
      tags: [
        'Analytical Methods',
        'Conceptual Foundations',
        'Cartography and Visualization',
        'Design and Setup of Geographic Information Systems',
        'Data Modeling, Storage and Exploitation',
        'Geocomputation',
        'Geospatial Data',
        'GNSS',
        'GI and Society',
        'Image processing and analysis',
        'Organizational and Institutional Aspects',
        'Physical principles',
        'Platforms, sensors and digital imagery',
        'Satellite Systems',
        'Satellite Communication',
        'Thematic and application domains',
        'Web-based GI',
        'Other'
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
        'All Rights Reserved',
        'Open access,copyright retained by author/creator',
        'Creative Commons Attribution (CC BY)',
        'Creative Commons Attribution-ShareAlike (CC BY-SA)',
        'Creative Commons Attribution-NonCommercial (CC BY-NC)',
        'Creative Commons Attribution-NoDerivatives (CC BY-ND)',
        'Creative Commons Attribution-NonCommercial-ShareAlike (CC BY-NC-SA)',
        'Creative Commons Zero (CC0)',
        'Institutional license, internal use only',
        'License pending / not defined',
        'Contact author or institution for reuse',
        'Other',
      ],
      selection: []
    },
    {
      label: 'Organizations',
      tags: [],
      selection: []
    }
  ];

  public searchOption: string = '';
  public bokConcepts: string[] = [];
  public userMaterialFilter: boolean = false;

  constructor(private readonly languageService: LanguageService, private readonly firebase: FirebaseService){
    this.firebase.getOrganizationList().subscribe( organizations => this.filterOptions[this.filterOptions.length - 1].tags = organizations.map(value => value.name));
  }

  public getGeneralFilterOptions(): FilterOption[] {
    const generalFilters = ['EQF Level', 'Language', 'Interactivity Type', 'Course Type', 'Target Audience', 'License']
    return generalFilters.map( value => this.getOptionByLabel(value))
  }

  public checkMaterial(material: TrainingMaterial, filter: FilterOption): boolean {
    switch(filter.label) {
      case 'EQF Level':
        return filter.selection.some(selection => material.educationLevel.includes(selection.slice(-1)));
      case 'Course Type':
        return filter.selection.some(selection => material.materialType.includes(selection));
      case 'Subject':
        return filter.selection.some(selection => material.subject.includes(selection));
      case 'Type of Assessment':
        return filter.selection.some(selection => material.assessment.includes(selection));
      case 'Target Audience':
        return filter.selection.some(selection => material.audience.includes(selection));
      case 'Interactivity Type':
        return filter.selection.some(selection => material.interactivityType?.toLowerCase() == selection.toLowerCase());
      case 'License':
        return filter.selection.some(selection => material.license! == selection);
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
      label: '',
      tags: [],
      selection: []
    };
  }
}