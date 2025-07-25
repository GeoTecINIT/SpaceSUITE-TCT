import { Injectable } from '@angular/core';
import { TrainingMaterial } from '../model/trainingMaterial';
import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root'
})
export class RdfConverterService {

  constructor(private utilsService: UtilsService) {}
  
  getRdfXmlUrl(material: TrainingMaterial): string {
    const blob = new Blob([this.convertModelToRdfXml(material)], { type: 'text/xml' });
    return window.URL.createObjectURL(blob);
  }

  getRdfTtlUrl(material: TrainingMaterial): string {
    const blob = new Blob([this.convertModelToTurtle(material)], { type: 'text/ttl' });
    return window.URL.createObjectURL(blob);
  }

  getRdfaUrl(material: TrainingMaterial): string {
    const blob = new Blob([this.convertModelToRDFa(material)], { type: 'text/html' });
    return window.URL.createObjectURL(blob);
  }

  private convertModelToTurtle(model: TrainingMaterial): string {
    let additionalObjects = '';
    let ttl = `@prefix dcterms: <http://purl.org/dc/terms/> .\n@prefix lrmi: <http://purl.org/dcx/lrmi-terms/> . \n` + 
              `@prefix bok: <https://bok.eo4geo.eu/> . \n@prefix elm: <http://data.europa.eu/snb/model/elm> . \n@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> . \n` + 
              `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> . \n\n`;

    ttl += `_:TrainingMaterial rdf:type rdfs:Class . \n\n`;

    ttl += `<${model.url}> \n`;
    ttl += `  rdf:type _:TrainingMaterial ;\n`;
    if (model.title) ttl += `  dcterms:title "${model.title}" ;\n`;
    if (model.creators) {
      model.creators.forEach((creator: string, index: number) => {
        ttl += `  dcterms:creator _:CREATOR${index} ;\n`;
        additionalObjects += `_:CREATOR${index}\n`;
        additionalObjects += `  rdf:type dcterms:Agent ;\n`;
        additionalObjects += `  dcterms:title "${creator}" .\n\n`
      });
    }
    if (model.subject && Array.isArray(model.subject)) {
      model.subject.forEach((subj: string) => {
        if (this.utilsService.codeToKnowledgeArea.has(subj)) {
          ttl += `  dcterms:subject bok:${subj} ;\n`;
        }
        else {
          ttl += `  dcterms:subject "${subj}" ;\n`;
        }
      });
    }
    if (model.description) ttl += `  dcterms:description "${model.description}" ;\n`;
    if (model.abstract) ttl += `  dcterms:abstract "${model.abstract}" ;\n`;
    if (model.learningOutcomes) {
      model.learningOutcomes.forEach((outcome: string, index: number) => {
        ttl += `  elm:learningOutcome _:LO${index} ;\n`;
        additionalObjects += `_:LO${index}\n`;
        additionalObjects += `  rdf:type elm:LearningOutcome ;\n`;
        additionalObjects += `  dcterms:description "${outcome}" .\n\n`
      });
    }
    if (model.audience) {
      model.audience.forEach((audience: string, index: number) => {
        ttl += `  dcterms:audience _:AUDIENCE${index} ;\n`;
        additionalObjects += `_:AUDIENCE${index}\n`;
        additionalObjects += `  rdf:type dcterms:AgentClass ;\n`;
        additionalObjects += `  dcterms:title "${audience}" .\n\n`
      });
    }
    if (model.created) ttl += `  dcterms:created "${model.created instanceof Date ? model.created.toISOString() : model.created}" ;\n`;
    if (model.materialType) {
      model.materialType.forEach((type: string, index: number) => {
        ttl += `  dcterms:type _:TYPE${index} ;\n`;
        additionalObjects += `_:TYPE${index}\n`;
        additionalObjects += `  rdf:type rdfs:Class ;\n`;
        additionalObjects += `  dcterms:title "${type}" .\n\n`
      });
    } 
    if (model.interactivityType) ttl += `  lrmi:interactivityType "${model.interactivityType}" ;\n`;
    if (model.publisher) {
      ttl += `  elm:providedBy _:PROVIDER ;\n`;
      additionalObjects += `_:PROVIDER\n`;
      additionalObjects += `  rdf:type dcterms:Agent ;\n`;
      additionalObjects += `  dcterms:title "${model.publisher}" .\n\n`;
    }
    if (model.contributors) {
      model.contributors.forEach((contributor: string, index: number) => {
        ttl += `  dcterms:contributor _:CONTRIBUTOR${index} ;\n`;
        additionalObjects += `_:CONTRIBUTOR${index}\n`;
        additionalObjects += `  rdf:type dcterms:Agent ;\n`;
        additionalObjects += `  dcterms:title "${contributor}" .\n\n`;
      });
    }
    if (model.url) ttl += `  dcterms:identifier <${model.url}> ;\n`;
    if (model.language) ttl += `  dcterms:language <https://id.loc.gov/vocabulary/iso639-1/${model.language.toLowerCase()}> ;\n`;
    if (model.source) ttl += `  dcterms:source "${model.source}" ;\n`;
    if (model.license) ttl += `  dcterms:license "${model.license}" ;\n`;
    if (model.educationLevel) {
      model.educationLevel.forEach((eqfLevel: string) => {
        ttl += `  elm:EQFLevel "${eqfLevel}" ;\n`;
      });
    }
    if (model.tableOfContents) ttl += `  dcterms:tableOfContents "${model.tableOfContents.join(', ')}" ;\n`;
    if (model.workload) {
      ttl += `  elm:creditPoint _:ECTS ;\n`;
      ttl += `  elm:creditReceived "${model.workload}" ;\n`;
      additionalObjects += `_:ECTS\n`;
      additionalObjects += `  rdf:type elm:CreditPoint ;\n`;
      additionalObjects += `  dcterms:title "ECTS" .\n\n`;
    }
    if (model.prerequisites) {
      model.prerequisites.forEach((prerequisite: string, index: number) => {
        ttl += `  elm:entryRequirement _:PREREQUISITE${index} ;\n`;
        additionalObjects += `_:PREREQUISITE${index}\n`;
        additionalObjects += `  rdf:type elm:Note ;\n`;
        additionalObjects += `  dcterms:description "${prerequisite}" .\n\n`;
      });
    }
    if (model.assessment) {
      model.assessment.forEach((assessment: string, index: number) => {
        ttl += `  elm:entryRequirement _:ASSESSMENT${index} ;\n`;
        additionalObjects += `_:ASSESSMENT${index}\n`;
        additionalObjects += `  rdf:type elm:LearningAssessment ;\n`;
        additionalObjects += `  dcterms:description "${assessment}" .\n\n`;
      });
    }
    if (model.concepts) {
      model.concepts.forEach((concept: string) => {
        ttl += `  dcterms:relation bok:${concept} ;\n`;
      });
    }

    ttl = ttl.trim().replace(/;$/, '.') + '\n\n';
    ttl += additionalObjects;

    return ttl;
  }

  private convertModelToRdfXml(model: TrainingMaterial): string {
    const ns = {
      rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
      dc: 'http://purl.org/dc/elements/1.1/',
      dcterms: 'http://purl.org/dc/terms/',
      bok: 'https://bok.eo4geo.eu/' // Adjust to your actual namespace
    };

    let rdf = `<?xml version="1.0"?>\n`;
    rdf += `<rdf:RDF xmlns:rdf="${ns.rdf}" xmlns:dc="${ns.dc}" xmlns:dcterms="${ns.dcterms}" xmlns:bok="${ns.bok}">\n`;
    rdf += `  <rdf:Description rdf:about="${model.url}">\n`;

    if (model.title) rdf += `    <dc:title>${this.escapeXml(model.title)}</dc:title>\n`;
    if (model.creators) {
      model.creators.forEach((creator: string) => {
        rdf += `    <dc:creator>${this.escapeXml(creator)}</dc:creator>\n`;
      });
    }
    if (model.subject && Array.isArray(model.subject)) {
      model.subject.forEach((subj: string) => {
        rdf += `    <dc:subject>${this.escapeXml(subj)}</dc:subject>\n`;
      });
    }
    if (model.description) rdf += `    <dc:description>${this.escapeXml(model.description)}</dc:description>\n`;
    if (model.publisher) rdf += `    <dc:publisher>${this.escapeXml(model.publisher)}</dc:publisher>\n`;
    if (model.contributors) {
      model.contributors.forEach((contributor: string) => {
        rdf += `    <dc:contributor>${this.escapeXml(contributor)}</dc:contributor>\n`;
      });
    }
    if (model.materialType) {
      model.materialType.forEach((type: string) => {
        rdf += `    <dc:type>${this.escapeXml(type)}</dc:type>\n`;
      });
    }
    if (model.interactivityType) rdf += `    <dc:format>${this.escapeXml(model.interactivityType)}</dc:format>\n`;
    if (model.language) rdf += `    <dc:language>${this.escapeXml(model.language)}</dc:language>\n`;
    if (model.concepts) {
      model.concepts.forEach((concept: string) => {
        rdf += `    <dc:relation rdf:resource="${ns.bok}${this.escapeXml(concept)}"/>\n`;
      });
    }
    if (model.license) rdf += `    <dc:rights>${this.escapeXml(model.license)}</dc:rights>\n`;
    if (model.abstract) rdf += `    <dcterms:abstract>${this.escapeXml(model.abstract)}</dcterms:abstract>\n`;
    if (model.audience) {
      model.audience.forEach((aud: string) => {
        rdf += `    <dcterms:audience>${this.escapeXml(aud)}</dcterms:audience>\n`;
      });
    }
    if (model.created) rdf += `    <dcterms:created>${model.created instanceof Date ? model.created.toISOString() : model.created}</dcterms:created>\n`;
    if (model.educationLevel) {
      model.educationLevel.forEach((level: string) => {
        rdf += `    <dcterms:educationLevel>EQF ${level}</dcterms:educationLevel>\n`;
      });
    }
    if (model.tableOfContents) {
      rdf += `    <dcterms:tableOfContents>${this.escapeXml(model.tableOfContents.join(', '))}</dcterms:tableOfContents>\n`;
    }

    /* TODO

      - Source
      - Training Program
      - Location (URL)
      - Prerequisites
      - Workload
      - BoK Links (???)
      - Learning outcomes
      - Certification
      - Type of assessment
      - Title of the micro-credential (???)
      - Micro-credential awarding body (???)
    */

    rdf += `  </rdf:Description>\n`;
    rdf += `</rdf:RDF>\n`;

    return rdf;
  }

  convertModelToRDFa(model: TrainingMaterial): string {
    const ns = {
      dc: 'http://purl.org/dc/elements/1.1/',
      dcterms: 'http://purl.org/dc/terms/',
      bok: 'https://bok.eo4geo.eu/',
    };

    let rdfa = `<div prefix="dc: ${ns.dc} dcterms: ${ns.dcterms} bok: ${ns.bok}" about="${model.url}">\n`;

    if (model.title) rdfa += `  <span property="dc:title">${this.escapeHtml(model.title)}</span><br/>\n`;
    if (model.creators) {
      model.creators.forEach((creator: string) => {
        rdfa += `  <span property="dc:creator">${this.escapeHtml(creator)}</span><br/>\n`;
      });
    }
    if (model.subject && Array.isArray(model.subject)) {
      model.subject.forEach((subj: string) => {
        rdfa += `  <span property="dc:subject">${this.escapeHtml(subj)}</span><br/>\n`;
      });
    }
    if (model.description) rdfa += `  <span property="dc:description">${this.escapeHtml(model.description)}</span><br/>\n`;
    if (model.publisher) rdfa += `  <span property="dc:publisher">${this.escapeHtml(model.publisher)}</span><br/>\n`;
    if (model.contributors) {
      model.contributors.forEach((contributor: string) => {
        rdfa += `  <span property="dc:contributor">${this.escapeHtml(contributor)}</span><br/>\n`;
      });
    }
    if (model.materialType) {
      model.materialType.forEach((type: string) => {
        rdfa += `  <span property="dc:type">${this.escapeHtml(type)}</span><br/>\n`;
      });
    }
    if (model.interactivityType) rdfa += `  <span property="dc:format">${this.escapeHtml(model.interactivityType)}</span><br/>\n`;
    if (model.language) rdfa += `  <span property="dc:language">${this.escapeHtml(model.language)}</span><br/>\n`;
    if (model.concepts) {
      model.concepts.forEach((concept: string) => {
        rdfa += `  <a property="dc:relation" href="${ns.bok}${this.escapeHtml(concept)}">${this.escapeHtml(concept)}</a><br/>\n`;
      });
    }
    if (model.license) rdfa += `  <span property="dc:rights">${this.escapeHtml(model.license)}</span><br/>\n`;
    if (model.abstract) rdfa += `  <span property="dcterms:abstract">${this.escapeHtml(model.abstract)}</span><br/>\n`;
    if (model.audience) {
      model.audience.forEach((aud: string) => {
        rdfa += `  <span property="dcterms:audience">${this.escapeHtml(aud)}</span><br/>\n`;
      });
    }
    if (model.created) rdfa += `  <time property="dcterms:created" datetime="${model.created.toISOString()}">${model.created.toISOString()}</time><br/>\n`;
    if (model.educationLevel) {
      model.educationLevel.forEach((level: string) => {
        rdfa += `  <span property="dcterms:audience">EQF ${this.escapeHtml(level)}</span><br/>\n`;
      });
    }
    if (model.tableOfContents) {
      rdfa += `  <span property="dcterms:tableOfContents">${this.escapeHtml(model.tableOfContents.join(', '))}</span><br/>\n`;
    }

    /* TODO

      - Source
      - Training Program
      - Location (URL)
      - Prerequisites
      - Workload
      - BoK Links (???)
      - Learning outcomes
      - Certification
      - Type of assessment
      - Title of the micro-credential (???)
      - Micro-credential awarding body (???)
    */

    rdfa += `</div>\n`;

    return rdfa;
  }

  private escapeXml(str: string): string {
    return str.replace(/[<>&'"]/g, c => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }

  private escapeHtml(str: string): string {
    return str.replace(/[<>&]/g, c => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        default: return c;
      }
    });
  }
}