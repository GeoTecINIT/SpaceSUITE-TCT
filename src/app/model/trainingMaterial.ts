export class TrainingMaterial {
  _id: string;
  title: string;
  publisher: string;
  created?: Date;
  language?: string;
  description: string;
  author: string[];
  type?: string;
  format: string[];
  educationLevel: string[];
  audience: string;
  assesment: string;
  prerequisites: string[];
  learningOutcomes: string[];
  tableOfContents: string[];
  SizeOrDuration: number;
  license?: string;
  source: string;
  certification: string;
  subject: string[];
  relation: string[];
  image: string;

  updatedAt: any;

  userId: string;
  orgId?: string;
  orgName?: string;
  division?: string;

  constructor(init?: Partial<TrainingMaterial>) {
    this._id = init?._id ?? '';
    this.title = init?.title ?? '';
    this.publisher = init?.publisher ?? '';
    this.created = init?.created ?? undefined;
    this.language = init?.language;
    this.description = init?.description ?? '';
    this.author = init?.author ?? [];
    this.type = init?.type;
    this.format = init?.format ?? [];
    this.educationLevel = init?.educationLevel ?? [];
    this.audience = init?.audience ?? '';
    this.assesment = init?.assesment ?? '';
    this.prerequisites = init?.prerequisites ?? [];
    this.learningOutcomes = init?.learningOutcomes ?? [];
    this.tableOfContents = init?.tableOfContents ?? [];
    this.SizeOrDuration = init?.SizeOrDuration ?? 0;
    this.license = init?.license;
    this.source = init?.source ?? '';
    this.certification = init?.certification ?? '';
    this.subject = init?.subject ?? [];
    this.relation = init?.relation ?? [];
    this.image = init?.image ?? '';
    this.updatedAt = init?.updatedAt ?? undefined;
    this.userId = init?.userId ?? '';
    this.orgId = init?.orgId ?? undefined;
    this.orgName = init?.orgName ?? undefined;
    this.division = init?.division;
  }

  toPlain() {
    return {
      _id: this._id,
      title: this.title,
      publisher: this.publisher,
      created: this.created,
      language: this.language,
      description: this.description,
      author: this.author,
      type: this.type,
      format: this.format,
      educationLevel: this.educationLevel,
      audience: this.audience,
      assesment: this.assesment,
      prerequisites: this.prerequisites,
      learningOutcomes: this.learningOutcomes,
      tableOfContents: this.tableOfContents,
      SizeOrDuration: this.SizeOrDuration,
      license: this.license,
      source: this.source,
      certification: this.certification,
      subject: this.subject,
      relation: this.relation,
      image: this.image,
      updatedAt: this.updatedAt,
      userId: this.userId,
      orgId: this.orgId,
      orgName: this.orgName,
      division: this.division
    };
  }
}