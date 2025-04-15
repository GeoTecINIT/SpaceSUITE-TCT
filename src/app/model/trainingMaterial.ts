export class TrainingMaterial {
  title: string;
  creator: string[];
  publisher: string;
  subject: string[];
  abstract: string;
  tableOfContents: string;
  description: string;
  contributor: string[];
  created: string;
  type: string;
  format: string;
  language: string;
  SizeOrDuration: string;
  audience: string;
  educationLevel: string;
  source: string;
  rightsHolder: string;
  license: string;
  relation: string[];
  image: string;
  userId: string;
  organization: string;
  division: string;

  constructor(data?: Partial<TrainingMaterial>) {
    this.title = data?.title ?? '';
    this.creator = data?.creator ?? [];
    this.publisher = data?.publisher ?? '';
    this.subject = data?.subject ?? [];
    this.abstract = data?.abstract ?? '';
    this.tableOfContents = data?.tableOfContents ?? '';
    this.description = data?.description ?? '';
    this.contributor = data?.contributor ?? [];
    this.created = data?.created ?? '';
    this.type = data?.type ?? '';
    this.format = data?.format ?? '';
    this.language = data?.language ?? '';
    this.SizeOrDuration = data?.SizeOrDuration ?? '';
    this.audience = data?.audience ?? '';
    this.educationLevel = data?.educationLevel ?? '';
    this.source = data?.source ?? '';
    this.rightsHolder = data?.rightsHolder ?? '';
    this.license = data?.license ?? '';
    this.relation = data?.relation ?? [];
    this.image = data?.image ?? '';
    this.userId = data?.userId ?? '';
    this.organization = data?.organization ?? '';
    this.division = data?.division ?? '';
  }
}