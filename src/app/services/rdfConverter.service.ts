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
              `@prefix geospacebok: <https://geospacebok.eu/> . \n@prefix elm: <http://data.europa.eu/snb/model/elm> . \n@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> . \n` + 
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
          ttl += `  dcterms:subject geospacebok:${subj} ;\n`;
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
        ttl += `  elm:used _:ASSESSMENT${index} ;\n`;
        additionalObjects += `_:ASSESSMENT${index}\n`;
        additionalObjects += `  rdf:type elm:LearningAssessment ;\n`;
        additionalObjects += `  dcterms:description "${assessment}" .\n\n`;
      });
    }
    if (model.concepts) {
      model.concepts.forEach((concept: string) => {
        ttl += `  dcterms:relation geospacebok:${concept} ;\n`;
      });
    }

    ttl = ttl.trim().replace(/;$/, '.') + '\n\n';
    ttl += additionalObjects;

    return ttl;
  }

  private convertModelToRdfXml(model: TrainingMaterial): string {
    const rdfNS = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
    const dcterms = 'http://purl.org/dc/terms/';
    const lrmi = 'http://purl.org/dcx/lrmi-terms/';
    const bok = 'https://geospacebok.eu/';
    const elm = 'http://data.europa.eu/snb/model/elm';
    const rdfs = 'http://www.w3.org/2000/01/rdf-schema#';

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<rdf:RDF xmlns:rdf="${rdfNS}" xmlns:dcterms="${dcterms}" xmlns:lrmi="${lrmi}" xmlns:geospacebok="${bok}" xmlns:elm="${elm}" xmlns:rdfs="${rdfs}">\n\n`;

    const resourceUri = model.url;

    xml += `  <rdf:Description rdf:about="${resourceUri}">\n`;
    xml += `    <rdf:type rdf:resource="${rdfs}Class"/>\n`;

    if (model.title) xml += `    <dcterms:title>${this.escapeXml(model.title)}</dcterms:title>\n`;

    if (model.creators) {
      model.creators.forEach((creator: string) => {
        xml += `    <dcterms:creator>\n`;
        xml += `      <dcterms:Agent>\n`;
        xml += `        <dcterms:title>${this.escapeXml(creator)}</dcterms:title>\n`;
        xml += `      </dcterms:Agent>\n`;
        xml += `    </dcterms:creator>\n`;
      });
    }

    if (model.subject && Array.isArray(model.subject)) {
      model.subject.forEach((subj: string) => {
        const isBok = this.utilsService.codeToKnowledgeArea.has(subj);
        if (isBok) {
          xml += `    <dcterms:subject rdf:resource="${bok}${this.escapeXml(subj)}"/>\n`;
        } else {
          xml += `    <dcterms:subject>${this.escapeXml(subj)}</dcterms:subject>\n`;
        }
      });
    }

    if (model.description) xml += `    <dcterms:description>${this.escapeXml(model.description)}</dcterms:description>\n`;
    if (model.abstract) xml += `    <dcterms:abstract>${this.escapeXml(model.abstract)}</dcterms:abstract>\n`;

    if (model.learningOutcomes) {
      model.learningOutcomes.forEach((outcome: string) => {
        xml += `    <elm:learningOutcome>\n`;
        xml += `      <elm:LearningOutcome>\n`;
        xml += `        <dcterms:description>${this.escapeXml(outcome)}</dcterms:description>\n`;
        xml += `      </elm:LearningOutcome>\n`;
        xml += `    </elm:learningOutcome>\n`;
      });
    }

    if (model.audience) {
      model.audience.forEach((audience: string) => {
        xml += `    <dcterms:audience>\n`;
        xml += `      <dcterms:AgentClass>\n`;
        xml += `        <dcterms:title>${this.escapeXml(audience)}</dcterms:title>\n`;
        xml += `      </dcterms:AgentClass>\n`;
        xml += `    </dcterms:audience>\n`;
      });
    }

    if (model.created) {
      const created = model.created instanceof Date ? model.created.toISOString() : model.created;
      xml += `    <dcterms:created>${this.escapeXml(created)}</dcterms:created>\n`;
    }

    if (model.materialType) {
      model.materialType.forEach((type: string) => {
        xml += `    <dcterms:type>\n`;
        xml += `      <rdfs:Class>\n`;
        xml += `        <dcterms:title>${this.escapeXml(type)}</dcterms:title>\n`;
        xml += `      </rdfs:Class>\n`;
        xml += `    </dcterms:type>\n`;
      });
    }

    if (model.interactivityType) {
      xml += `    <lrmi:interactivityType>${this.escapeXml(model.interactivityType)}</lrmi:interactivityType>\n`;
    }

    if (model.publisher) {
      xml += `    <elm:providedBy>\n`;
      xml += `      <dcterms:Agent>\n`;
      xml += `        <dcterms:title>${this.escapeXml(model.publisher)}</dcterms:title>\n`;
      xml += `      </dcterms:Agent>\n`;
      xml += `    </elm:providedBy>\n`;
    }

    if (model.contributors) {
      model.contributors.forEach((contributor: string) => {
        xml += `    <dcterms:contributor>\n`;
        xml += `      <dcterms:Agent>\n`;
        xml += `        <dcterms:title>${this.escapeXml(contributor)}</dcterms:title>\n`;
        xml += `      </dcterms:Agent>\n`;
        xml += `    </dcterms:contributor>\n`;
      });
    }

    xml += `    <dcterms:identifier rdf:resource="${model.url}"/>\n`;

    if (model.language) {
      const langUri = `https://id.loc.gov/vocabulary/iso639-1/${this.escapeXml(model.language.toLowerCase())}`;
      xml += `    <dcterms:language rdf:resource="${langUri}"/>\n`;
    }

    if (model.source) xml += `    <dcterms:source>${this.escapeXml(model.source)}</dcterms:source>\n`;
    if (model.license) xml += `    <dcterms:license>${this.escapeXml(model.license)}</dcterms:license>\n`;

    if (model.educationLevel) {
      model.educationLevel.forEach((level: string) => {
        xml += `    <elm:EQFLevel>${this.escapeXml(level)}</elm:EQFLevel>\n`;
      });
    }

    if (model.tableOfContents) {
      xml += `    <dcterms:tableOfContents>${this.escapeXml(model.tableOfContents.join(', '))}</dcterms:tableOfContents>\n`;
    }

    if (model.workload) {
      xml += `    <elm:creditPoint>\n`;
      xml += `      <elm:CreditPoint>\n`;
      xml += `        <dcterms:title>ECTS</dcterms:title>\n`;
      xml += `      </elm:CreditPoint>\n`;
      xml += `    </elm:creditPoint>\n`;
      xml += `    <elm:creditReceived>${model.workload}</elm:creditReceived>\n`;
    }

    if (model.prerequisites) {
      model.prerequisites.forEach((prerequisite: string) => {
        xml += `    <elm:entryRequirement>\n`;
        xml += `      <elm:Note>\n`;
        xml += `        <dcterms:description>${this.escapeXml(prerequisite)}</dcterms:description>\n`;
        xml += `      </elm:Note>\n`;
        xml += `    </elm:entryRequirement>\n`;
      });
    }

    if (model.assessment) {
      model.assessment.forEach((assessment: string) => {
        xml += `    <elm:used>\n`;
        xml += `      <elm:LearningAssessment>\n`;
        xml += `        <dcterms:description>${this.escapeXml(assessment)}</dcterms:description>\n`;
        xml += `      </elm:LearningAssessment>\n`;
        xml += `    </elm:used>\n`;
      });
    }

    if (model.concepts) {
      model.concepts.forEach((concept: string) => {
        xml += `    <dcterms:relation rdf:resource="${bok}${concept}"/>\n`;
      });
    }

    xml += `  </rdf:Description>\n`;
    xml += `</rdf:RDF>\n`;

    return xml;
  }

  private convertModelToRDFa(model: TrainingMaterial): string {
    let html = `<div vocab="http://purl.org/dc/terms/" typeof="http://www.w3.org/2000/01/rdf-schema#Class" about="${model.url}">\n`;

    if (model.title) {
      html += `  <span property="title">${this.escapeHtml(model.title)}</span><br/>\n`;
    }

    if (model.creators) {
      model.creators.forEach((creator: string) => {
        html += `  <div rel="creator">\n`;
        html += `    <span typeof="Agent">\n`;
        html += `      <span property="title">${this.escapeHtml(creator)}</span>\n`;
        html += `    </span>\n`;
        html += `  </div>\n`;
      });
    }

    if (model.subject) {
      model.subject.forEach((subj: string) => {
        if (this.utilsService.codeToKnowledgeArea.has(subj)) {
          html += `  <a property="subject" href="https://geospacebok.eu/${subj}">${subj}</a><br/>\n`;
        } else {
          html += `  <span property="subject">${this.escapeHtml(subj)}</span><br/>\n`;
        }
      });
    }

    if (model.description) {
      html += `  <p property="description">${this.escapeHtml(model.description)}</p>\n`;
    }

    if (model.abstract) {
      html += `  <p property="abstract">${this.escapeHtml(model.abstract)}</p>\n`;
    }

    if (model.learningOutcomes) {
      model.learningOutcomes.forEach((outcome: string) => {
        html += `  <div rel="http://data.europa.eu/snb/model/elm/learningOutcome">\n`;
        html += `    <div typeof="http://data.europa.eu/snb/model/elm/LearningOutcome">\n`;
        html += `      <span property="description">${this.escapeHtml(outcome)}</span>\n`;
        html += `    </div>\n`;
        html += `  </div>\n`;
      });
    }

    if (model.audience) {
      model.audience.forEach((audience: string) => {
        html += `  <div rel="audience">\n`;
        html += `    <div typeof="AgentClass">\n`;
        html += `      <span property="title">${this.escapeHtml(audience)}</span>\n`;
        html += `    </div>\n`;
        html += `  </div>\n`;
      });
    }

    if (model.created) {
      const createdDate = model.created instanceof Date ? this.escapeHtml(model.created.toISOString()) : this.escapeHtml(model.created);
      html += `  <time property="created" datetime="${createdDate}">${createdDate}</time><br/>\n`;
    }

    if (model.materialType) {
      model.materialType.forEach((type: string) => {
        html += `  <div rel="type">\n`;
        html += `    <div typeof="rdfs:Class">\n`;
        html += `      <span property="title">${this.escapeHtml(type)}</span>\n`;
        html += `    </div>\n`;
        html += `  </div>\n`;
      });
    }

    if (model.interactivityType) {
      html += `  <span property="http://purl.org/dcx/lrmi-terms/interactivityType">${this.escapeHtml(model.interactivityType)}</span><br/>\n`;
    }

    if (model.publisher) {
      html += `  <div rel="http://data.europa.eu/snb/model/elm/providedBy">\n`;
      html += `    <div typeof="Agent">\n`;
      html += `      <span property="title">${this.escapeHtml(model.publisher)}</span>\n`;
      html += `    </div>\n`;
      html += `  </div>\n`;
    }

    if (model.contributors) {
      model.contributors.forEach((contributor: string) => {
        html += `  <div rel="contributor">\n`;
        html += `    <div typeof="Agent">\n`;
        html += `      <span property="title">${this.escapeHtml(contributor)}</span>\n`;
        html += `    </div>\n`;
        html += `  </div>\n`;
      });
    }

    if (model.url) {
      html += `  <a property="identifier" href="${model.url}">${model.url}</a><br/>\n`;
    }

    if (model.language) {
      html += `  <a property="language" href="https://id.loc.gov/vocabulary/iso639-1/${model.language.toLowerCase()}">${this.escapeHtml(model.language)}</a><br/>\n`;
    }

    if (model.source) {
      html += `  <span property="source">${this.escapeHtml(model.source)}</span><br/>\n`;
    }

    if (model.license) {
      html += `  <span property="license">${this.escapeHtml(model.license)}</span><br/>\n`;
    }

    if (model.educationLevel) {
      model.educationLevel.forEach((level: string) => {
        html += `  <span property="http://data.europa.eu/snb/model/elm/EQFLevel">${this.escapeHtml(level)}</span><br/>\n`;
      });
    }

    if (model.tableOfContents) {
      html += `  <span property="tableOfContents">${this.escapeHtml(model.tableOfContents.join(', '))}</span><br/>\n`;
    }

    if (model.workload) {
      html += `  <div rel="http://data.europa.eu/snb/model/elm/creditPoint">\n`;
      html += `    <div typeof="http://data.europa.eu/snb/model/elm/CreditPoint">\n`;
      html += `      <span property="title">ECTS</span>\n`;
      html += `    </div>\n`;
      html += `  </div>\n`;
      html += `  <span property="http://data.europa.eu/snb/model/elm/creditReceived">${model.workload}</span><br/>\n`;
    }

    if (model.prerequisites) {
      model.prerequisites.forEach((prerequisite: string) => {
        html += `  <div rel="http://data.europa.eu/snb/model/elm/entryRequirement">\n`;
        html += `    <div typeof="http://data.europa.eu/snb/model/elm/Note">\n`;
        html += `      <span property="description">${this.escapeHtml(prerequisite)}</span>\n`;
        html += `    </div>\n`;
        html += `  </div>\n`;
      });
    }

    if (model.assessment) {
      model.assessment.forEach((assessment: string) => {
        html += `  <div rel="http://data.europa.eu/snb/model/elm/used">\n`;
        html += `    <div typeof="http://data.europa.eu/snb/model/elm/LearningAssessment">\n`;
        html += `      <span property="description">${this.escapeHtml(assessment)}</span>\n`;
        html += `    </div>\n`;
        html += `  </div>\n`;
      });
    }

    if (model.concepts) {
      model.concepts.forEach((concept: string) => {
        html += `  <a property="relation" href="https://geospacebok.eu/${concept}">${concept}</a><br/>\n`;
      });
    }

    html += `</div>`;
    return html;
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