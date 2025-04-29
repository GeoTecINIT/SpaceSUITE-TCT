export class TrainingMaterial {
  title: string = '';
  publisher: string = '';
  created: string = '';
  language: string | undefined;
  description: string = '';
  author: string[] = [];
  type: string | undefined;
  format: string[] = [];
  educationLevel: string[] = [];
  audience: string = '';
  assesment: string = '';
  prerequisites: string[] = [];
  learningOutcomes: string[] = [];
  tableOfContents: string[] = [];
  SizeOrDuration: number = 0;
  license: string | undefined;
  source: string = '';
  certification: string = '';
  subject: string[] = [];
  relation: string[] = [];
  image: string = '';
  
  userId: string = '';
  organization: string | undefined;
  division: string | undefined;

  constructor(init?: Partial<TrainingMaterial>) {
    Object.assign(this, init);
  }
}