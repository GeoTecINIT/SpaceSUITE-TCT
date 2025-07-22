import { OldTrainingMaterial } from "./oldTrainingMaterial";

export class TrainingMaterial extends OldTrainingMaterial {
  publisher: string;
  created: any;
  language?: string;
  materialType: string[];
  interactivityType: string | undefined;
  educationLevel: string[];
  audience: string[];
  assessment: string[];
  prerequisites: string[];
  learningOutcomes: string[];
  tableOfContents: string[];
  license?: string;
  source: string | undefined;
  subject: string[];
  image: string;
  division?: string;
  workload: number;

  constructor(data?: Partial<TrainingMaterial>) {
    super(data);
    this.publisher = data?.publisher ?? '';
    this.created = data?.created ?? new Date();
    this.language = data?.language ?? undefined;
    this.materialType = data?.materialType ?? [];
    this.interactivityType = data?.interactivityType ?? undefined;
    this.educationLevel = data?.educationLevel ?? [];
    this.audience = data?.audience ?? [];
    this.assessment = data?.assessment ?? [];
    this.prerequisites = data?.prerequisites ?? [];
    this.learningOutcomes = data?.learningOutcomes ?? [];
    this.tableOfContents = data?.tableOfContents ?? [];
    this.license = data?.license ?? undefined;
    this.source = data?.source ?? undefined;
    this.subject = data?.subject ?? [];
    this.image = data?.image ?? '';
    this.division = data?.division ?? undefined;
    this.workload = data?.workload ?? 0;
  }

  override toPlain(): Record<string, any> {
    return {
      ...super.toPlain(),
      publisher: this.publisher,
      created: this.created,
      language: this.language,
      materialType: this.materialType,
      interactivityType: this.interactivityType || "",
      educationLevel: this.educationLevel,
      audience: this.audience,
      assessment: this.assessment,
      prerequisites: this.prerequisites,
      learningOutcomes: this.learningOutcomes,
      tableOfContents: this.tableOfContents,
      license: this.license,
      source: this.source || "",
      subject: this.subject,
      image: this.image,
      division: this.division,
      workload: this.workload
    };
  }
}
