import { Observable } from "rxjs";
import { TrainingAction } from "../model/trainingAction";
import { TrainingItem } from "../model/trainingItem";
import { TrainingMaterial } from "../model/trainingMaterial";

export abstract class TrainingItemService {
    public abstract getItemsOrganizations(): Observable<string[]>;

    protected abstract formatTrainingItems(trainingItems: TrainingMaterial[] | TrainingAction[]): TrainingMaterial[] | TrainingAction[];

    protected formatFirestoreConcepts(concepts: string[]){
        const regex = /\[(.*?)\]/;
        return concepts.map(concept => concept.match(regex)?.[1])
        .filter(Boolean) as string[];
    }

    public validate(item: TrainingItem): Map<string, string | undefined> {
        const isMaterial = item instanceof TrainingMaterial;
        const isAction = item instanceof TrainingAction;

        const urlRegex = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;
        const errors: Map<string, string | undefined> = new Map();
    
        const setError = (field: string, condition: boolean, message: string) => {
            errors.set(field, condition ? message : undefined);
        };
    
        // String fields
        setError('title', !item.title.trim(), 'Title is required.');
        //setError('publisher', !item.publisher.trim(), 'Publisher is required.');
        setError('created', !item.created, 'Creation date is required.');
        if (item.created && isNaN(Date.parse(item.created.toISOString()))) {
            errors.set('created', 'Creation date format is invalid.');
        }
        //if (isAction) setError('certification', !item.certification?.trim(), 'Certification is required.');
        //if (isAction && errors.get('certification')) setError('microcredentialAwardingBody', !item.microcredentialAwardingBody?.trim(), 'Awarding Body is required.');
        //setError('workload', item.workload == 0, 'Workload must be greater than zero');
        //setError('language', !item.language?.trim(), 'Language is required.');
        //setError('description', !item.description.trim(), 'Description is required.');
        //setError('abstract', !item.abstract.trim(), 'Abstract is required.');
        setError('userId', !item.userId.trim(), 'User ID is required.');
        setError('organization', !item.orgId?.trim(), 'Organization is required.');
        //if (isMaterial) setError('interactivityType', !item.interactivityType?.trim(), 'Interactivity type is required.');
        //setError('url', !item.url.trim(), 'URL is required.');
        //if (!errors.get('url')) setError('url', !urlRegex.test(item.url), 'Invalid URL format.');
        if (item.url != '') setError('url', !urlRegex.test(item.url), 'Invalid URL format.');
        //if (isMaterial) setError('license', !item.license?.trim(), 'License is required.');
    
        // Array fields
        //setError('creators', item.creators.length === 0, 'At least one creator is required.');
        //setError('concepts', item.concepts.length === 0, 'At least one BoK concept is required.');
        //setError('learningOutcomes', item.learningOutcomes.length === 0, 'At least one learning outcome is required.');
        //setError('audience', item.audience.length === 0, 'At least one audience is required.');
        //if (isMaterial) setError('type', item.materialType.length === 0, 'At least one type is required.');
        //setError('educationLevel', item.educationLevel.length === 0, 'Education level is required.');
        //setError('assessment', item.assessment.length === 0, 'At least one assessment is required.');
        //setError('subject', item.subject.length === 0, 'At least one subject is required.');
        if (isAction) setError('relatedMaterials', item.relatedMaterials.some(value => !urlRegex.test(value)), 'A related material must be a properly formatted URL.');   
        if (isAction) {
            item.timing.forEach((value, index) => {
                setError('actionPeriod'  + index, !value.start, 'Timing start date is required.');
                if (value.start){
                    setError('actionPeriod'  + index, value.end != undefined && value.start.getTime() >= value.end.getTime(), 'Timing invalid value. End date must be after start date.')
                }
            });
        }

        return errors;
    }
}