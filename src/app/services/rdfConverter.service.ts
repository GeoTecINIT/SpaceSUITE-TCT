import { Injectable } from '@angular/core';
import { TrainingMaterial } from '../model/trainingMaterial';

@Injectable({
  providedIn: 'root'
})
export class RdfConverterService {
  
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
    let ttl = `@prefix dc: <http://purl.org/dc/elements/1.1/> .\n@prefix dcterms: <http://purl.org/dc/terms/> .\n@prefix bok: <https://bok.eo4geo.eu/> .\n\n`;

    ttl += `<${model.url}> ;\n`;
    if (model.title) ttl += `  dc:title "${model.title}" ;\n`;
    if (model.creators) {
      model.creators.forEach((creator: string) => {
        ttl += `  dc:creator "${creator}" ;\n`;
      });
    }
    if (model.subject && Array.isArray(model.subject)) {
      model.subject.forEach((subj: string) => {
        ttl += `  dc:subject "${subj}" ;\n`;
      });
    }
    if (model.description) ttl += `  dc:description "${model.description}" ;\n`;
    if (model.publisher) ttl += `  dc:publisher "${model.publisher}" ;\n`;
    if (model.contributors) {
      model.contributors.forEach((contributor: string) => {
        ttl += `  dc:contributor "${contributor}" ;\n`;
      });
    }
    if (model.materialType) ttl += `  dc:type "${model.materialType}" ;\n`;
    if (model.materialFormat) {
      model.materialFormat.forEach((format: string) => {
        ttl += `  dc:format "${format}" ;\n`;
      });
    }
    if (model.language) ttl += `  dc:language "${model.language}" ;\n`;
    if (model.concepts) {
      model.concepts.forEach((concept: string) => {
        ttl += `  dc:relation bok:${concept} ;\n`;
      });
    }
    if (model.license) ttl += `  dc:rights "${model.license}" ;\n`;
    if (model.abstract) ttl += `  dcterms:abstract "${model.abstract}" ;\n`;
    if (model.audience) {
      model.audience.forEach((aud: string) => {
        ttl += `  dcterms:audience "${aud}" ;\n`;
      });
    }
    if (model.created) ttl += `  dcterms:created "${model.created instanceof Date ? model.created.toISOString() : model.created}" ;\n`;
    if (model.educationLevel) {
      model.educationLevel.forEach((level: string) => {
        ttl += `  dcterms:educationLevel "EQF ${level}" ;\n`;
      });
    }
    if (model.tableOfContents) ttl += `  dcterms:tableOfContents "${model.tableOfContents.join(', ')}" ;\n`;
    if (model.SizeOrDuration) ttl += `  dcterms:extent "${this.durationToISO8601(model.SizeOrDuration)}" ;\n`;

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

    // Replace final semicolon with a period
    ttl = ttl.trim().replace(/;$/, '.') + '\n\n';

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
    if (model.materialType) rdf += `    <dc:type>${this.escapeXml(model.materialType)}</dc:type>\n`;
    if (model.materialFormat) {
      model.materialFormat.forEach((format: string) => {
        rdf += `    <dc:format>${this.escapeXml(format)}</dc:format>\n`;
      });
    }
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
    if (model.SizeOrDuration) {
      rdf += `    <dcterms:extent>${this.durationToISO8601(model.SizeOrDuration)}</dcterms:extent>\n`;
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
    if (model.materialType) rdfa += `  <span property="dc:type">${this.escapeHtml(model.materialType)}</span><br/>\n`;
    if (model.materialFormat) {
      model.materialFormat.forEach((format: string) => {
        rdfa += `  <span property="dc:format">${this.escapeHtml(format)}</span><br/>\n`;
      });
    }
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
    if (model.SizeOrDuration) {
      rdfa += `  <time property="dcterms:extent">${this.durationToISO8601(model.SizeOrDuration)}</time><br/>\n`;
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

  private durationToISO8601(duration: number): string {
    let totalSeconds = duration * 3600; // duración en segundos

    const seconds = +(totalSeconds % 60).toFixed(3); // redondeo a milisegundos
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const totalHours = Math.floor(totalMinutes / 60);
    const hours = totalHours % 24;
    const totalDays = Math.floor(totalHours / 24);
    const days = totalDays % 30;
    const totalMonths = Math.floor(totalDays / 30);
    const months = totalMonths % 12;
    const years = Math.floor(totalMonths / 12);

    return `P${years}Y${months}M${days}DT${hours}H${minutes}M${seconds}S`;
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