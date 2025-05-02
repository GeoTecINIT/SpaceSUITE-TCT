export class OldTrainingMaterial {
    _id: string;
    abstract: string;
    collection: string;
    collectionDisplay: string;
    concepts: string[];
    contributors: string[];
    creators: string[];
    description: string;
    eqf: string;
    hasMetadata: string;
    isPublic: true;
    name: string;
    orgId?: string;
    orgName?: string;
    title: string;
    type: number;
    updatedAt: any;
    url: string;
    userId: string;
  
    constructor(data?: Partial<OldTrainingMaterial>) {
      this._id = data?._id ?? '';
      this.abstract = data?.abstract ?? '';
      this.collection = data?.collection ?? 'TrainingMaterials';
      this.collectionDisplay = data?.collectionDisplay ?? 'TrainingMaterials';
      this.concepts = data?.concepts ?? [];
      this.contributors = data?.contributors ?? [];
      this.creators = data?.creators ?? [];
      this.description = data?.description ?? '';
      this.eqf = data?.eqf ?? '';
      this.hasMetadata = data?.hasMetadata ?? 'True';
      this.isPublic = data?.isPublic ?? true;
      this.name = data?.name ?? '';
      this.orgId = data?.orgId;
      this.orgName = data?.orgName;
      this.title = data?.title ?? '';
      this.type = data?.type ?? 4;
      this.updatedAt = data?.updatedAt ?? undefined;
      this.url = data?.url ?? '';
      this.userId = data?.userId ?? '';
    }
  
    toPlain(): Record<string, any> {
      return {
        _id: this._id,
        abstract: this.abstract,
        collection: this.collection,
        collectionDisplay: this.collectionDisplay,
        concepts: this.concepts,
        contributors: this.contributors,
        creators: this.creators,
        description: this.description,
        eqf: this.eqf,
        hasMetadata: this.hasMetadata,
        isPublic: this.isPublic,
        name: this.name,
        orgId: this.orgId,
        orgName: this.orgName,
        title: this.title,
        type: this.type,
        updatedAt: this.updatedAt,
        url: this.url,
        userId: this.userId,
      };
    }
  }