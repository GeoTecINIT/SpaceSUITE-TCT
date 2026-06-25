/// <reference lib="webworker" />

import jsPDF from 'jspdf';
import { PdfWorkerPayload } from '../model/pdfWorkerPayload';
import { TrainingItem } from '../model/trainingItem';
import { TrainingMaterial } from '../model/trainingMaterial';
import { TrainingAction } from '../model/trainingAction';

addEventListener('message', ({data}: {data: PdfWorkerPayload}) => {
  const { item, assets, scaleFactor } = data;
  const doc = new jsPDF();

  if (!assets.watermark) assets.watermark = '';

  addWatermark(doc, assets.watermark);
  let y = 25;

  if (assets.poppinsRegular) {
    doc.addFileToVFS('Poppins-Regular.ttf', assets.poppinsRegular);
    doc.addFont('Poppins-Regular.ttf', 'Poppins', 'normal');
  }
  if (assets.poppinsBold) {
    doc.addFileToVFS('Poppins-Bold.ttf', assets.poppinsBold);
    doc.addFont('Poppins-Bold.ttf', 'Poppins', 'bold');
  } 
  if (assets.poppinsItalic) {
    doc.addFileToVFS('Poppins-Italic.ttf', assets.poppinsItalic);
    doc.addFont('Poppins-Italic.ttf', 'Poppins', 'italic');
  }

  doc.setLineHeightFactor(scaleFactor);

  const hydratedItem = rehydrate(item);

  applyMetadata(doc, hydratedItem);
  y = renderHeader(doc, hydratedItem, y, assets);
  y = renderCurriculumNodes(doc, hydratedItem, y, assets);
  renderFooter(doc, assets);

  const blob = doc.output('blob');

  postMessage({
    blob,
    filename: buildFilename(hydratedItem)
  });
});

/* ============================
    METADATA
============================ */

function applyMetadata(doc: jsPDF, item: TrainingItem) {
  doc.setProperties({
    title: `${item.title}`,
    subject: getSubjectMetadata(item),
    author: 'SpaceSuite',
    creator: 'SpaceSuite Training Catalogue',
    keywords: 'spacesuite, training catalogue, training material, training action',
  });
}

function getSubjectMetadata(item: TrainingItem) {
  const isMaterial = item instanceof TrainingMaterial;
  let subject = '@prefix dc: <http://purl.org/dc/terms/> . @prefix geospacebok: <https://geospacebok.eu/> . ';
  subject = subject + '<> dc:type "' + (isMaterial ? 'Training Material' : 'Training Action') +'"; <> dc:title "' + item.title + '"';
  item.subject.forEach(subject => {
    const bokCode = subject.split(']', 1)[0].split('[', 2)[1];
    if (bokCode) {
      subject = subject + '; dc:relation geospacebok:' + bokCode;
    }
  });
  item.concepts.forEach(know => {
    const bokCode = know.split(']', 1)[0].split('[', 2)[1];
    if (bokCode) {
      subject = subject + '; dc:relation geospacebok:' + bokCode;
    }
  });
  subject = subject + '  .';
  return subject;
}

/* ============================
    HEADER
============================ */

function renderHeader(doc: jsPDF, p: TrainingItem, y: number,  assets: {
    poppinsRegular?: string | undefined;
    poppinsBold?: string | undefined;
    poppinsItalic?: string | undefined;
    watermark?: string | undefined;
    euLogo?: string | undefined;
    spaceSuiteLogo?: string | undefined;
  }): number {
  doc.setFontSize(26).setFont('Poppins', 'bold');
  doc.setTextColor('#0e145d');

  const lines = doc.splitTextToSize(p.title, 170);
  const linesSize = lines.length * 10.4 * 1.35;
  y = checkEnd(doc, y, linesSize, assets);
  doc.text(lines, 20, y);
  y += linesSize;

  doc.setFontSize(10);
  doc.setFont('Poppins', 'italic');
  doc.text(
    [
      p.division ? p.orgName + ', ' + p.division : p.orgName, 
    ].filter(Boolean).join(' | '),
    20,
    y
  );
  doc.setFont('Poppins', 'normal');
  y += 4 * 1.35;

  y += 4 * 1.35;
  doc.text(
    [
      p instanceof TrainingMaterial ? 'Material' : 'Action',
      'Provided by: ' + (p.publisher ?? '-'),
    ].filter(Boolean).join(' | '),
    20,
    y
  );
  y += 4 * 1.35;

  doc.text(
    [
      'Language: ' + (p.language ?? '-'),
      'EQF ' + (p.educationLevel.length > 0 ? p.educationLevel : '-'),
      (p.workload ?? '-') + ' ' + p.workloadUnit,
    ].filter(Boolean).join(' | '),
    20,
    y
  );
  y += 4 * 1.35;

  doc.text(
    [
      'Created: ' + p.created.toLocaleDateString('en-UK'),
      p.updatedAt ? 'Updated: ' + p.updatedAt.toLocaleDateString('en-UK') : undefined,
      'Visibility: ' + (p.isPublic ? 'Public' : 'Private')
    ].filter(Boolean).join(' | '),
    20,
    y
  );
  y += 4 * 1.35;

  if (p.creators.length > 0) {
    doc.setFont('Poppins', 'italic');
    y += 4 * 1.35;
    doc.text(
      p.creators.join(', '),
      20,
      y
    );
    y += 4 * 1.35;
    doc.setFont('Poppins', 'normal');
  }

  if (p.url != '') {
    doc.setFont('Poppins', 'italic');
    y += 4 * 1.35;
    doc.setTextColor('#3fb3f8');
    doc.textWithLink(
      'Link to training item',
      20,
      y,
      {url: p.url}
    );
    doc.setTextColor('#0e145d');
    y += 4 * 1.35;
    doc.setFont('Poppins', 'normal');
  }

  return y;
}

/* ============================
  FOOTER
============================ */

function renderFooter(doc: jsPDF, assets: {
    poppinsRegular?: string | undefined;
    poppinsBold?: string | undefined;
    poppinsItalic?: string | undefined;
    watermark?: string | undefined;
    euLogo?: string | undefined;
    spaceSuiteLogo?: string | undefined;
  }, y = 275): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const footerHeight = doc.internal.pageSize.getHeight() - y;

  doc.setFillColor('#0e145d');
  doc.rect(0, y, pageWidth, footerHeight, 'F');

  const page = doc.getCurrentPageInfo().pageNumber;
  doc.setFontSize(9).setFont('Poppins', 'normal');
  doc.setTextColor('#ffffff');
  doc.text(page.toString(), pageWidth / 2, y + footerHeight / 2 + 1) // + 1 
  doc.setFontSize(10).setFont('Poppins', 'normal');
  doc.setTextColor('#0e145d');

  if (assets.euLogo) {
    const props = doc.getImageProperties(assets.euLogo);
    const imgWidthPx = props.width;
    const imgHeightPx = props.height
    const targetWidth = 30;
    const ratio = imgHeightPx / imgWidthPx;
    const targetHeight = targetWidth * ratio;
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.addImage(
      assets.euLogo,
      'PNG',
      pageWidth - targetWidth - 20,
      y + footerHeight / 2 - targetHeight / 2,
      targetWidth,
      targetHeight,
      undefined,
      'FAST'
    );
  }

  if (assets.spaceSuiteLogo) {
    const props = doc.getImageProperties(assets.spaceSuiteLogo);
    const imgWidthPx = props.width;
    const imgHeightPx = props.height
    const targetWidth = 30;
    const ratio = imgHeightPx / imgWidthPx;
    const targetHeight = targetWidth * ratio;
    doc.addImage(
      assets.spaceSuiteLogo,
      'PNG',
      20,
      y + footerHeight / 2 - targetHeight / 2,
      targetWidth,
      targetHeight,
      undefined,
      'FAST'
    );
  }
}


/* ============================
    CURRICULUM NODE
============================ */

function renderCurriculumNodes(doc: jsPDF, p: TrainingItem, y: number, assets: {
    poppinsRegular?: string | undefined;
    poppinsBold?: string | undefined;
    poppinsItalic?: string | undefined;
    watermark?: string | undefined;
    euLogo?: string | undefined;
    spaceSuiteLogo?: string | undefined;
  }): number {
  y = sectionTitle(doc, 'Subjects', y, assets);

  y += 4 * 1.35;
  p.subject.forEach((subject) => {
    const lines = doc.splitTextToSize(subject, 170);
    for (let i = 0; i < lines.length; i++) {
      if (i == 0) lines[i] = '• ' + lines[i];
      else lines[i] = '   ' + lines[i];
    }
    const linesSize = lines.length * 4 * 1.35;
    y = checkEnd(doc, y, linesSize, assets);
    const match = subject.match(/^\[([^\]]+)\]/);
    if (match) {
      doc.setTextColor('#3fb3f8');
      doc.textWithLink(lines, 20, y, {url: 'https://geospacebok.eu/' + match[1]});
      doc.setTextColor('#0e145d');
    }
    else doc.text(lines, 20, y);
    y += linesSize;
  });

  y = sectionTitle(doc, 'Knowledge', y, assets);

  y += 4 * 1.35;
  p.concepts.forEach((concept) => {
    const lines = doc.splitTextToSize(concept, 170);
    for (let i = 0; i < lines.length; i++) {
      if (i == 0) lines[i] = '• ' + lines[i];
      else lines[i] = '   ' + lines[i];
    }
    const linesSize = lines.length * 4 * 1.35;
    y = checkEnd(doc, y, linesSize, assets);
    const match = concept.match(/^\[([^\]]+)\]/);
    if (match) {
      doc.setTextColor('#3fb3f8');
      doc.textWithLink(lines, 20, y, {url: 'https://geospacebok.eu/' + match[1]});
      doc.setTextColor('#0e145d');
    }
    else doc.text(lines, 20, y);
    y += linesSize;
  });

  y = sectionTitle(doc, 'Abstract', y, assets);

  y += 4 * 1.35;
  const abstractLines = doc.splitTextToSize(p.abstract, 170);
  const abstractLinesSize = abstractLines.length * 4 * 1.35;
  y = checkEnd(doc, y, abstractLinesSize, assets);
  doc.text(abstractLines, 20, y);
  y += abstractLinesSize;

  y = sectionTitle(doc, 'Description', y, assets);

  y += 4 * 1.35;
  const descriptionLines = doc.splitTextToSize(p.description, 170);
  const descriptionLinesSize = descriptionLines.length * 4 * 1.35;
  y = checkEnd(doc, y, descriptionLinesSize, assets);
  doc.text(descriptionLines, 20, y);
  y += descriptionLinesSize;

  y = sectionTitle(doc, 'Table of Contents', y, assets);

  y += 4 * 1.35;
  p.tableOfContents.forEach((content) => {
    const lines = doc.splitTextToSize(content, 170);
    for (let i = 0; i < lines.length; i++) {
      if (i == 0) lines[i] = '• ' + lines[i];
      else lines[i] = '   ' + lines[i];
    }
    const linesSize = lines.length * 4 * 1.35;
    y = checkEnd(doc, y, linesSize, assets);
    doc.text(lines, 20, y);
    y += linesSize;
  });

  if(p instanceof TrainingAction) {
    y = sectionTitle(doc, 'Action Detail', y, assets);

    y += 4 * 1.35;
    y = checkEnd(doc, y, 0, assets);
    doc.setFont('Poppins', 'italic');
    doc.text('Related Materials:', 20, y);
    doc.setFont('Poppins', 'normal')
    y += 4 * 1.35;
    if (p.relatedMaterials.length > 0) {
      p.relatedMaterials.forEach((mat) => {
        const lines = doc.splitTextToSize(mat, 170);
        for (let i = 0; i < lines.length; i++) {
          if (i == 0) lines[i] = '• ' + lines[i];
          else lines[i] = '   ' + lines[i];
        }
        const linesSize = lines.length * 4 * 1.35;
        y = checkEnd(doc, y, linesSize, assets);
        doc.setTextColor('#3fb3f8');
        doc.textWithLink(lines, 20, y, { url: mat });
        doc.setTextColor('#0e145d');
        y += linesSize;
      });
    }
    else {
      y = checkEnd(doc, y, 0, assets);
      doc.text('Undefined', 20, y);
      y += 4 * 1.35;
    }

    y += 4 * 1.35;
    y = checkEnd(doc, y, 0, assets);
    doc.setFont('Poppins', 'italic');
    doc.text('Certification:', 20, y);
    doc.setFont('Poppins', 'normal')
    y += 4 * 1.35;
    doc.text(p.certification ?? 'Undefined', 20, y);
    y += 4 * 1.35;

    if (p.certification && p.certification === 'Micro-credential') {
      y += 4 * 1.35;
      y = checkEnd(doc, y, 0, assets);
      doc.setFont('Poppins', 'italic');
      doc.text('Microcredential Awarding Body:', 20, y);
      doc.setFont('Poppins', 'normal')
      y += 4 * 1.35;
      y = checkEnd(doc, y, 0, assets);
      doc.text(p.microcredentialAwardingBody ?? 'Undefined', 20, y);
      y += 4 * 1.35;
    }
  }
  else if (p instanceof TrainingMaterial) {
    y = sectionTitle(doc, 'Material Detail', y, assets);

    y += 4 * 1.35;
    y = checkEnd(doc, y, 0, assets);
    doc.setFont('Poppins', 'italic');
    doc.text('Training Material Type:', 20, y);
    doc.setFont('Poppins', 'normal')
    y += 4 * 1.35;
    if (p.materialType.length > 0) {
      p.materialType.forEach((type) => {
        const lines = doc.splitTextToSize(type, 170);
        for (let i = 0; i < lines.length; i++) {
          if (i == 0) lines[i] = '• ' + lines[i];
          else lines[i] = '   ' + lines[i];
        }
        const linesSize = lines.length * 4 * 1.35;
        y = checkEnd(doc, y, linesSize, assets);
        doc.text(lines, 20, y);
        y += linesSize;
      });
    }
    else {
      y = checkEnd(doc, y, 0, assets);
      doc.text('Undefined', 20, y);
      y += 4 * 1.35;
    }

    y += 4 * 1.35;
    y = checkEnd(doc, y, 0, assets);
    doc.setFont('Poppins', 'italic');
    doc.text('Interactivity Type:', 20, y);
    doc.setFont('Poppins', 'normal')
    y += 4 * 1.35;
    doc.text(p.interactivityType ?? 'Undefined', 20, y);
     y += 4 * 1.35;
  }

  y += 4 * 1.35;
  y = checkEnd(doc, y, 0, assets);
  doc.setFont('Poppins', 'italic');
  doc.text('Prerequisites:', 20, y);
  doc.setFont('Poppins', 'normal')
  y += 4 * 1.35;
  if (p.prerequisites.length > 0) {
    p.prerequisites.forEach((pre) => {
      const lines = doc.splitTextToSize(pre, 170);
      for (let i = 0; i < lines.length; i++) {
        if (i == 0) lines[i] = '• ' + lines[i];
        else lines[i] = '   ' + lines[i];
      }
      const linesSize = lines.length * 4 * 1.35;
      y = checkEnd(doc, y, linesSize, assets);
      doc.text(lines, 20, y);
      y += linesSize;
    });
  }
  else {
    y = checkEnd(doc, y, 0, assets);
    doc.text('Undefined', 20, y);
    y += 4 * 1.35;
  }

  y += 4 * 1.35;
  y = checkEnd(doc, y, 0, assets);
  doc.setFont('Poppins', 'italic');
  doc.text('Learning Outcomes:', 20, y);
  doc.setFont('Poppins', 'normal')
  y += 4 * 1.35;
  if (p.learningOutcomes.length > 0) {
    p.learningOutcomes.forEach((outcome) => {
      const lines = doc.splitTextToSize(outcome, 170);
      for (let i = 0; i < lines.length; i++) {
        if (i == 0) lines[i] = '• ' + lines[i];
        else lines[i] = '   ' + lines[i];
      }
      const linesSize = lines.length * 4 * 1.35;
      y = checkEnd(doc, y, linesSize, assets);
      doc.text(lines, 20, y);
      y += linesSize;
    });
  }
  else {
    y = checkEnd(doc, y, 0, assets);
    doc.text('Undefined', 20, y);
    y += 4 * 1.35;
  }

  y += 4 * 1.35;
  y = checkEnd(doc, y, 0, assets);
  doc.setFont('Poppins', 'italic');
  doc.text('Type of Assessment:', 20, y);
  doc.setFont('Poppins', 'normal')
  y += 4 * 1.35;
  if (p.assessment.length > 0) {
    p.assessment.forEach((assessment) => {
      const lines = doc.splitTextToSize(assessment, 170);
      for (let i = 0; i < lines.length; i++) {
        if (i == 0) lines[i] = '• ' + lines[i];
        else lines[i] = '   ' + lines[i];
      }
      const linesSize = lines.length * 4 * 1.35;
      y = checkEnd(doc, y, linesSize, assets);
      doc.text(lines, 20, y);
      y += linesSize;
    });
  }
  else {
    y = checkEnd(doc, y, 0, assets);
    doc.text('Undefined', 20, y);
    y += 4 * 1.35;
  }

  y = sectionTitle(doc, 'Additional Information', y, assets);

  y += 4 * 1.35;
  y = checkEnd(doc, y, 0, assets);
  doc.setFont('Poppins', 'italic');
  doc.text('Sources:', 20, y);
  doc.setFont('Poppins', 'normal')
  y += 4 * 1.35;
  const lines = doc.splitTextToSize((p.source && p.source != '') ? p.source : 'Undefined', 170);
  const linesSize = lines.length * 4 * 1.35;
  y = checkEnd(doc, y, linesSize, assets);
  doc.text(lines, 20, y);
  y += linesSize;

  y += 4 * 1.35;
  y = checkEnd(doc, y, 0, assets);
  doc.setFont('Poppins', 'italic');
  doc.text('Audience:', 20, y);
  doc.setFont('Poppins', 'normal')
  y += 4 * 1.35;
  if (p.audience.length > 0) {
    p.audience.forEach((audience) => {
      const lines = doc.splitTextToSize(audience, 170);
      for (let i = 0; i < lines.length; i++) {
        if (i == 0) lines[i] = '• ' + lines[i];
        else lines[i] = '   ' + lines[i];
      }
      const linesSize = lines.length * 4 * 1.35;
      y = checkEnd(doc, y, linesSize, assets);
      doc.text(lines, 20, y);
      y += linesSize;
    });
  }
  else {
    y = checkEnd(doc, y, 0, assets);
    doc.text('Undefined', 20, y);
    y += 4 * 1.35;
  }

  if(p instanceof TrainingAction) {
    y += 4 * 1.35;
    y = checkEnd(doc, y, 0, assets);
    doc.setFont('Poppins', 'italic');
    doc.text('Action Modality:', 20, y);
    doc.setFont('Poppins', 'normal')
    y += 4 * 1.35;
    y = checkEnd(doc, y, 0, assets);
    doc.text(p.actionModality ?? 'Undefined', 20, y);
    y += 4 * 1.35;

    
    y += 4 * 1.35;
    y = checkEnd(doc, y, 0, assets);
    doc.setFont('Poppins', 'italic');
    doc.text('Location:', 20, y);
    doc.setFont('Poppins', 'normal')
    y += 4 * 1.35;
    if(p.actionModality && p.actionModality != 'Online' && p.location.name != '') {
      const locationLines = doc.splitTextToSize(p.location.name, 170);
      const locationLinesSize = locationLines.length * 4 * 1.35;
      y = checkEnd(doc, y, locationLinesSize, assets);
      doc.setTextColor('#3fb3f8');
      doc.textWithLink(locationLines, 20, y, { url: p.location.getGoogleMapURI() });
      doc.setTextColor('#0e145d');
      y += locationLinesSize;
    }
    else {
      y = checkEnd(doc, y, 0, assets);
      doc.text('Undefined', 20, y);
      y += 4 * 1.35;
    }

    y += 4 * 1.35;
    y = checkEnd(doc, y, 0, assets);
    doc.setFont('Poppins', 'italic');
    doc.text('Timing:', 20, y);
    doc.setFont('Poppins', 'normal')
    y += 4 * 1.35;
    if (p.timing.length > 0) {
      p.timing.forEach((period) => {
        let periodString: string;
        if(period.showTime) {
          periodString = period.start.toLocaleString('en-UK', {dateStyle: 'short', timeStyle: 'short'}) + (period.end ? ' - ' + period.end.toLocaleString('en-UK', {dateStyle: 'short', timeStyle: 'short'}) : '');
        }
        else {
          periodString = period.start.toLocaleDateString('en-UK') + (period.end ? ' - ' + period.end.toLocaleDateString('en-UK') : '');
        }
        const lines = doc.splitTextToSize(periodString, 170);
        for (let i = 0; i < lines.length; i++) {
          if (i == 0) lines[i] = '• ' + lines[i];
          else lines[i] = '   ' + lines[i];
        }
        const linesSize = lines.length * 4 * 1.35;
        y = checkEnd(doc, y, linesSize, assets);
        doc.text(lines, 20, y);
        y += linesSize;
      });
    }
    else {
      y = checkEnd(doc, y, 0, assets);
      doc.text('Undefined', 20, y);
      y += 4 * 1.35;
    }
  }
  else if (p instanceof TrainingMaterial) {
    y += 4 * 1.35;
    y = checkEnd(doc, y, 0, assets);
    doc.setFont('Poppins', 'italic');
    doc.text('Contributors:', 20, y);
    doc.setFont('Poppins', 'normal')
    y += 4 * 1.35;
    const contributorLines = doc.splitTextToSize(p.contributors.join(', '), 170);
    const contributorLinesSize = contributorLines.length * 4 * 1.35;
    y = checkEnd(doc, y, contributorLinesSize, assets);
    doc.text(contributorLines, 20, y);
    y += contributorLinesSize;

    y += 4 * 1.35;
    y = checkEnd(doc, y, 0, assets);
    doc.setFont('Poppins', 'italic');
    doc.text('License:', 20, y);
    doc.setFont('Poppins', 'normal')
    y += 4 * 1.35;
    y = checkEnd(doc, y, 0, assets);
    doc.text(p.license ?? 'Undefined', 20, y);
    y += 4 * 1.35;
  }

  return y;
}


/* ============================
    HELPERS
============================ */

function sectionTitle(doc: jsPDF, title: string, y: number, assets: {
    poppinsRegular?: string | undefined;
    poppinsBold?: string | undefined;
    poppinsItalic?: string | undefined;
    watermark?: string | undefined;
    euLogo?: string | undefined;
    spaceSuiteLogo?: string | undefined;
  }): number {
  y += 8 * 1.35;
  y = checkEnd(doc, y, 0, assets);  
  doc.setFontSize(14).setFont('Poppins', 'bold');
  doc.setTextColor('#0e145d');
  doc.text(title, 20, y);
  doc.setFontSize(10).setFont('Poppins', 'normal');
  doc.setTextColor('#0e145d');
  return y + 2 * 1.35;
}

function checkEnd(doc: jsPDF, y: number, contentSize: number = 0, assets: {
    poppinsRegular?: string | undefined;
    poppinsBold?: string | undefined;
    poppinsItalic?: string | undefined;
    watermark?: string | undefined;
    euLogo?: string | undefined;
    spaceSuiteLogo?: string | undefined;
  }): number {
  if (y + contentSize > 265) {
    renderFooter(doc, assets);
    doc.addPage();
    addWatermark(doc, assets.watermark || '');
    return 20;
  }
  return y;
}

function addWatermark(doc: jsPDF, watermark: string): void {
  if (watermark) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.addImage(watermark, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
  }
}

function buildFilename(p: TrainingItem): string {
  return `${p.title.replace(/\s+/g, '_')}_Educational_Offer.pdf`;
}

function rehydrate(data: TrainingItem) {
  if ("materialType" in data) {
    return new TrainingMaterial(data as TrainingMaterial);
  }
  return new TrainingAction(data as TrainingAction);
}