import { OldTrainingMaterial } from "./oldTrainingMaterial";

export class TrainingMaterial extends OldTrainingMaterial {
  publisher: string;
  created: any;
  language?: string;
  materialType?: string;
  materialFormat: string[];
  educationLevel: string[];
  audience: string;
  assesment: string;
  prerequisites: string[];
  learningOutcomes: string[];
  tableOfContents: string[];
  SizeOrDuration: number;
  license?: string;
  certification: string;
  subject: string[];
  image: string;
  division?: string;

  constructor(data?: Partial<TrainingMaterial>) {
    super(data);
    this.publisher = data?.publisher ?? '';
    this.created = data?.created ?? undefined;
    this.language = data?.language ?? undefined;
    this.materialType = data?.materialType ?? undefined;
    this.materialFormat = data?.materialFormat ?? [];
    this.educationLevel = data?.educationLevel ?? [];
    this.audience = data?.audience ?? '';
    this.assesment = data?.assesment ?? '';
    this.prerequisites = data?.prerequisites ?? [];
    this.learningOutcomes = data?.learningOutcomes ?? [];
    this.tableOfContents = data?.tableOfContents ?? [];
    this.SizeOrDuration = data?.SizeOrDuration ?? 0;
    this.license = data?.license ?? undefined;
    this.certification = data?.certification ?? '';
    this.subject = data?.subject ?? [];
    this.image = data?.image ?? '';
    this.division = data?.division ?? undefined;
  }

  override toPlain(): Record<string, any> {
    return {
      ...super.toPlain(),
      publisher: this.publisher,
      created: this.created,
      language: this.language,
      materialType: this.materialType,
      materialFormat: this.materialFormat,
      educationLevel: this.educationLevel,
      audience: this.audience,
      assesment: this.assesment,
      prerequisites: this.prerequisites,
      learningOutcomes: this.learningOutcomes,
      tableOfContents: this.tableOfContents,
      SizeOrDuration: this.SizeOrDuration,
      license: this.license,
      certification: this.certification,
      subject: this.subject,
      image: this.image,
      division: this.division,
    };
  }
}
