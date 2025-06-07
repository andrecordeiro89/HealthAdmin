import jsPDF from 'jspdf';
import 'jspdf-autotable'; // Import for side effects, patches jsPDF.prototype
import { ConsolidatedOrderData, SourceDocumentInfoForPdf, ReplenishmentMaterial, GlobalMaterialConsumptionRow } from '../types';
import { COMPANY_NAME, UI_TEXT } from '../constants'; // Import company name and UI_TEXT

const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (dateString.includes('T') || dateString.includes('Z')) {
        } else {
            const parts = dateString.split(/[\/\-T]/); 
            if (parts.length === 3 && parts[0].length === 4) { 
                 const adjustedDate = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
                 return adjustedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
            } else if (parts.length === 3 && parts[2].length === 4) { 
                 const adjustedDate = new Date(Date.UTC(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])));
                 return adjustedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
            }
        }
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(date.getTime() + userTimezoneOffset); 
        return adjustedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    } catch (e) {
        if (typeof dateString === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
            const [day, month, year] = dateString.split('/');
            const reformattedDate = new Date(`${year}-${month}-${day}T00:00:00`); 
            if (!isNaN(reformattedDate.getTime())) {
                 return reformattedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            }
        }
        return dateString; 
    }
};

const formatDateTime = (dateTimeString: string): string => {
    if (!dateTimeString) return 'N/A';
    try {
        const date = new Date(dateTimeString);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return dateTimeString;
    }
};

const titleCase = (str: string): string => {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};


const drawPdfHeader = (
    doc: jsPDF, 
    mainReportTitle: string, 
    reportSubTitle: string | null, 
    pageWidth: number, 
    topMargin: number
): number => { // Returns yPos after the first separator and its padding
    let yPos = topMargin;

    // Company Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(79, 70, 229); // Indigo-600 (Tailwind Blue-600 is #2563EB, Indigo-600 is #4F46E5) - Sticking to previous Indigo
    doc.text(COMPANY_NAME, pageWidth / 2, yPos, { align: 'center' });
    yPos += 8; // Space after company name

    // Main Report Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(51, 65, 85); // Slate-700
    doc.text(mainReportTitle, pageWidth / 2, yPos, { align: 'center' });
    yPos += 7; // Space after main title
    
    // Optional Report Subtitle
    if (reportSubTitle) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105); // Slate-600
        doc.text(reportSubTitle, pageWidth / 2, yPos, { align: 'center' });
        yPos += 6; // Space after subtitle
    }

    // First Horizontal Line
    doc.setDrawColor(203, 213, 225); // Slate-300
    doc.line(topMargin, yPos, pageWidth - topMargin, yPos); 
    yPos += 5; // Space after first line (this is where details will start)

    return yPos; 
};

const drawPdfFooter = (doc: jsPDF, pageNum: number, totalPages: number, generationTimestamp: string, pageWidth: number, pageHeight: number, bottomMargin: number) => {
    const footerStartY = pageHeight - bottomMargin + 5; 
    
    doc.setFont('helvetica', 'italic'); 
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139); // Slate-500

    const disclaimerMessage = "Atenção: As informações deste documento são extraídas por Inteligência Artificial e podem conter imprecisões. Recomenda-se a verificação dos documentos originais em nossa lista do SharePoint.";
    
    const disclaimerLines = doc.splitTextToSize(disclaimerMessage, pageWidth - (2 * bottomMargin));

    let disclaimerTextY = footerStartY + 3.5; 
    doc.text(disclaimerLines, pageWidth / 2, disclaimerTextY, { align: 'center' }); 
    
    const lineY = footerStartY; 

    doc.setDrawColor(203, 213, 225); // Slate-300
    doc.line(bottomMargin, lineY, pageWidth - bottomMargin, lineY); 
    
    const generationAndPageY = lineY - 3; 

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85); // Slate-700
    const generatedByText = `Gerado por ${COMPANY_NAME} em: ${formatDateTime(generationTimestamp)}`;
    doc.text(generatedByText, bottomMargin, generationAndPageY);
    const pageNumText = `Página ${pageNum} de ${totalPages}`;
    doc.text(pageNumText, pageWidth - bottomMargin - doc.getStringUnitWidth(pageNumText) * doc.getFontSize() / doc.internal.scaleFactor, generationAndPageY);
};


export const generateConsolidatedOrderPdf = async (orderData: ConsolidatedOrderData, hospitalName: string): Promise<void> => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 15;
  let actualHeaderEndY = 0; // Will be set by drawPageSpecificHeader

  const drawPageSpecificHeader = () => {
    let y = drawPdfHeader(
        doc, 
        "RELATÓRIO CONSOLIDADO DE REPOSIÇÃO OPME",
        null, // No subtitle for this report type
        pageWidth, 
        margin
    );

    const detailTextSize = 9;
    const detailLineHeight = 5; // mm for spacing between lines of details

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(detailTextSize);
    doc.setTextColor(51, 65, 85); // Slate-700

    // Line 1: Hospital / Pedido ID
    const hospitalText = `Hospital: ${hospitalName}`;
    const orderIdText = `Pedido ID: ${orderData.orderId}`;
    doc.text(hospitalText, margin, y);
    const orderIdTextWidth = doc.getStringUnitWidth(orderIdText) * doc.getFontSize() / doc.internal.scaleFactor;
    doc.text(orderIdText, pageWidth - margin - orderIdTextWidth, y);
    y += detailLineHeight;

    // Line 2: Data do Pedido / Nota de Consumo
    const orderDateTextHeader = `Data do Pedido: ${formatDate(orderData.orderDate)}`;
    doc.text(orderDateTextHeader, margin, y);

    doc.setFont('helvetica', 'italic'); // Italic for consumption note
    doc.setFontSize(detailTextSize); // Ensure size consistency for italic part
    doc.setTextColor(100, 116, 139); // Slate-500 for italic note
    const consumptionText = "Reposição baseada no consumo do dia.";
    const consumptionTextWidth = doc.getStringUnitWidth(consumptionText) * doc.getFontSize() / doc.internal.scaleFactor;
    doc.text(consumptionText, pageWidth - margin - consumptionTextWidth, y);
    y += detailLineHeight;
    
    doc.setFont('helvetica', 'normal'); // Reset font

    // Second Horizontal Line (demarcating end of header)
    doc.setDrawColor(203, 213, 225); // Slate-300
    doc.line(margin, y, pageWidth - margin, y);
    y += 5; // Padding after the second line, this is where content starts
    actualHeaderEndY = y; 
  };
  
  drawPageSpecificHeader(); // Initial draw for the first page
  let currentY = actualHeaderEndY;
  
  const sortedSourceDocuments = [...orderData.sourceDocumentsProcessed].sort((a, b) => {
    const nameA = a.patientName || 'Paciente Não Identificado';
    const nameB = b.patientName || 'Paciente Não Identificado';
    if (nameA.localeCompare(nameB) !== 0) {
      return nameA.localeCompare(nameB);
    }
    return a.fileName.localeCompare(b.fileName);
  });

  const processedDocsBody = sortedSourceDocuments.map(docEntry => [
    (docEntry.patientName || 'Não Identificado').toUpperCase(),
    formatDate(docEntry.surgeryDate), 
    docEntry.status === 'success' ? 'Sucesso' : (docEntry.status === 'error' ? 'Erro' : (docEntry.status === 'pending' ? 'Pendente' : (docEntry.status === 'processing' ? 'Processando' : docEntry.status))),
    docEntry.status === 'error' ? (docEntry.errorMessage || 'Detalhe não disponível') : '-'
  ]);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(51, 65, 85);
  doc.text("Resumo do Processamento dos Documentos", margin, currentY);
  currentY += 7;

  (doc as any).autoTable({
    startY: currentY,
    head: [['Nome do Paciente', 'Data Cirurgia', 'Status', 'Detalhe (se Erro)']], 
    body: processedDocsBody,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185], textColor: [255,255,255], fontStyle: 'bold', fontSize: 9 },
    styles: { fontSize: 8, cellPadding: 1.5, textColor: [51, 65, 85] },
    columnStyles: {
        0: { cellWidth: 'auto', minCellWidth: 45 }, 
        1: { cellWidth: 20, halign: 'center' },      
        2: { cellWidth: 22, halign: 'center' },     
        3: { cellWidth: 'auto', minCellWidth: 40, overflow: 'linebreak' } 
    },
    didParseCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 2) { 
            const statusVal = data.cell.raw as string;
            if (statusVal === 'Erro') { data.cell.styles.textColor = [192, 57, 43]; data.cell.styles.fontStyle = 'bold'; }
            else if (statusVal === 'Sucesso') { data.cell.styles.textColor = [39, 174, 96]; }
            else if (statusVal === 'Processando') { data.cell.styles.textColor = [52, 152, 219];} 
            else if (statusVal === 'Pendente') { data.cell.styles.textColor = [128, 128, 128];} 
        }
        if (data.section === 'body' && data.column.index === 3 && data.row.cells[2].raw === 'Erro') { 
            data.cell.styles.textColor = [192, 57, 43];
        }
    },
    margin: { left: margin, right: margin, top: actualHeaderEndY, bottom: 25 }, // Use actualHeaderEndY for top margin
    didDrawPage: (data: any) => {
      drawPageSpecificHeader(); 
      drawPdfFooter(doc, data.pageNumber, (doc as any).internal.getNumberOfPages(), orderData.generationTimestamp, pageWidth, pageHeight, margin); 
    },
  });
  currentY = (doc as any).lastAutoTable.finalY + 10; 


  // Separar materiais contaminados e não contaminados
  const contaminatedMaterials = orderData.materialsToReplenish.filter((mat: ReplenishmentMaterial) => mat.contaminated);
  const nonContaminatedMaterials = orderData.materialsToReplenish.filter((mat: ReplenishmentMaterial) => !mat.contaminated);

  const buildMaterialsBody = (materials: ReplenishmentMaterial[]) => materials.map((mat: ReplenishmentMaterial) => {
    const patientNamesForMaterial = mat.sourceDocumentIds
      .map(docId => {
        const docInfo = orderData.sourceDocumentsProcessed.find(d => d.id === docId);
        return docInfo?.patientName ? docInfo.patientName.toUpperCase() : null; 
      })
      .filter((name): name is string => name !== null && name.trim() !== "") 
      .reduce((acc, name) => { 
          if (!acc.includes(name)) {
              acc.push(name); 
          }
          return acc;
      }, [] as string[])
      .sort((a, b) => a.localeCompare(b)); 

    const patientNamesDisplay = patientNamesForMaterial.length > 0 ? patientNamesForMaterial.join('\n') : 'N/A';
    const displayObservation = mat.observation?.trim() || "Sem observações";
    
    return [
        titleCase(mat.description),
        mat.code || 'N/A',
        mat.lotNumber || 'N/A', 
        patientNamesDisplay, 
        mat.totalConsumedQuantity.toString(),
        mat.replenishQuantity.toString(), 
        displayObservation
    ];
  });
  
  if (currentY + 12 > pageHeight - (margin + 30) ) { 
    doc.addPage();
    // Header is drawn by didDrawPage, no need to call it manually here for addPage
    currentY = actualHeaderEndY; // Reset currentY based on where content should start on a new page
  }


  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(51, 65, 85);
  doc.text("Detalhamento dos Materiais para Reposição", margin, currentY);
  currentY += 7;

  const criticalStatusKeywords = ["contaminado", "não implantado", "defeito", "danificado", "quebrado", "status importante:"];

  (doc as any).autoTable({
    startY: currentY,
    head: [['Descrição', 'Código', 'LOTE', 'Paciente(s)', 'Qtd. Cons.', 'Qtd. Repor', 'Observação']], 
    body: buildMaterialsBody(nonContaminatedMaterials),
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: [255,255,255], fontStyle: 'bold', fontSize: 9 },
    styles: { fontSize: 7.5, cellPadding: 1.5, overflow: 'linebreak', textColor: [51, 65, 85], cellHeight: 'auto' }, 
    columnStyles: {
      0: { cellWidth: 'auto', minCellWidth: 35 }, 
      1: { cellWidth: 18 },                     
      2: { cellWidth: 18 },                     
      3: { cellWidth: 'auto', minCellWidth: 35, cellHeight: 'auto' }, 
      4: { cellWidth: 15, halign: 'center' },  
      5: { cellWidth: 15, halign: 'center', fontStyle: 'bold' }, 
      6: { cellWidth: 'auto', minCellWidth: 25 }     
    },
    didParseCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 6) { 
            const note = (data.cell.raw as string || "").toLowerCase();
            let isCritical = false;
            for (const keyword of criticalStatusKeywords) {
                if (note.includes(keyword)) {
                    isCritical = true;
                    break;
                }
            }

            if (isCritical) {
                data.cell.styles.textColor = [220, 38, 38]; 
                data.cell.styles.fontStyle = 'bold';
            } else if (note === "sem observações") { 
                data.cell.styles.fontStyle = 'italic';
                data.cell.styles.textColor = [100, 116, 139]; 
            } else if (note.includes("verificar")) { 
                data.cell.styles.textColor = [234, 88, 12]; 
                data.cell.styles.fontStyle = 'italic';
            } else if (note.includes("ok")) { 
                data.cell.styles.textColor = [22, 163, 74]; 
            }
        }
        if (data.section === 'body' && data.column.index === 3) { 
            data.cell.styles.fontSize = 7; 
            data.cell.styles.cellPadding = {top: 1.5, right: 1.5, bottom: 1.5, left: 1.5}; 
        }
    },
    margin: { left: margin, right: margin, top: actualHeaderEndY, bottom: 30 }, 
    didDrawPage: (data: any) => {
      drawPageSpecificHeader();
      drawPdfFooter(doc, data.pageNumber, (doc as any).internal.getNumberOfPages(), orderData.generationTimestamp, pageWidth, pageHeight, margin);
    }, 
  });
  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Tabela de Materiais Contaminados
  if (contaminatedMaterials.length > 0) {
    if (currentY + 12 > pageHeight - (margin + 30)) {
      doc.addPage();
      currentY = actualHeaderEndY;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(220, 38, 38); // Vermelho
    doc.text("Materiais Contaminados", margin, currentY);
    currentY += 7;
    (doc as any).autoTable({
      startY: currentY,
      head: [['Descrição', 'Código', 'LOTE', 'Paciente(s)', 'Qtd. Cons.', 'Qtd. Repor', 'Observação']],
      body: buildMaterialsBody(contaminatedMaterials),
      theme: 'grid',
      headStyles: { fillColor: [239, 68, 68], textColor: [255,255,255], fontStyle: 'bold', fontSize: 9 },
      styles: { fontSize: 7.5, cellPadding: 1.5, overflow: 'linebreak', textColor: [220, 38, 38], cellHeight: 'auto' },
      columnStyles: {
        0: { cellWidth: 'auto', minCellWidth: 35 },
        1: { cellWidth: 18 },
        2: { cellWidth: 18 },
        3: { cellWidth: 'auto', minCellWidth: 35, cellHeight: 'auto' },
        4: { cellWidth: 15, halign: 'center' },
        5: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
        6: { cellWidth: 'auto', minCellWidth: 25 }
      },
      margin: { left: margin, right: margin, top: actualHeaderEndY, bottom: 30 },
      didDrawPage: (data: any) => {
        drawPageSpecificHeader();
        drawPdfFooter(doc, data.pageNumber, (doc as any).internal.getNumberOfPages(), orderData.generationTimestamp, pageWidth, pageHeight, margin);
      },
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;
    doc.setTextColor(51, 65, 85); // Reset para cor padrão
  }

  const notesTitle = "Observações Importantes sobre o Processamento de Documentos:";
  const notesContent = [
      "- Precisão da Extração de Dados: Este relatório utiliza Inteligência Artificial para extrair informações dos documentos de consumo. A precisão dos dados está diretamente ligada à qualidade (clareza e legibilidade) dos documentos originais.",
      "- Interpretação de Lotes: O sistema procura identificar e registrar os números de lote dos materiais utilizados. Recomenda-se a verificação criteriosa desta informação, especialmente para itens com rastreabilidade mandatória.",
      "- Coluna 'Observação': As anotações nesta coluna priorizam informações fornecidas pelos usuários ou status críticos identificados (ex: 'Contaminado'). Se nenhuma observação específica for fornecida, será indicado 'Sem observações'. Notas geradas pelo sistema sobre a lógica de reposição não são incluídas nesta coluna para maior clareza.",
      "- Propósito do Relatório: Este documento tem como objetivo consolidar as informações de consumo para apoiar o processo de reposição de OPME. Em caso de discrepâncias ou para fins de auditoria, os documentos originais devem ser sempre consultados.",
      "- Referência Cruzada de Pacientes: Se um mesmo material (com lote específico, se aplicável) for utilizado em procedimentos de múltiplos pacientes, os nomes correspondentes serão listados na coluna 'Paciente(s)' para facilitar a conferência."
  ];

  let notesTextHeight = doc.getTextDimensions(notesTitle).h;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  notesContent.forEach(note => {
      const splitNote = doc.splitTextToSize(note, pageWidth - (2 * margin) - 2); 
      notesTextHeight += splitNote.length * (doc.getLineHeight() * 0.352777 * 1.15); 
  });
  notesTextHeight += 5; 

  if (currentY + notesTextHeight > pageHeight - (margin + 30)) { 
    doc.addPage();
    currentY = actualHeaderEndY; // Reset Y to start of content area after header
  }
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.text(notesTitle, margin, currentY);
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105); 
  notesContent.forEach(note => {
      const splitNote = doc.splitTextToSize(note, pageWidth - (2 * margin) -2); 
      doc.text(splitNote, margin + 1, currentY); 
      currentY += splitNote.length * (doc.getLineHeight() * 0.352777 * 1.15) ; 
  });

  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    // didDrawPage from autoTable handles header/footer for table pages.
    // For pages that might only contain notes after the last table, ensure footer is drawn.
    if (i > (doc as any).lastAutoTable.pageCount) {
        drawPageSpecificHeader(); // Draw header if it's a new page after tables
    }
    drawPdfFooter(doc, i, totalPages, orderData.generationTimestamp, pageWidth, pageHeight, margin);
  }

  const filename = `${COMPANY_NAME}_Relatorio_OPME_${hospitalName.replace(/\s+/g, '_')}_${orderData.orderDate.replace(/-/g, '')}.pdf`;
  doc.save(filename);
};


export const generateGlobalMaterialConsumptionPdf = async (
    consumptionData: GlobalMaterialConsumptionRow[],
    generationTimestamp: string,
    periodText?: string
): Promise<void> => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    let actualHeaderEndY = 0;

    const drawPageSpecificHeaderForGlobal = () => {
        let y = drawPdfHeader(
            doc,
            UI_TEXT.globalConsumptionReportTitle,
            UI_TEXT.globalConsumptionReportSubTitle,
            pageWidth,
            margin
        );
        
        const detailTextSize = 9;
        const detailLineHeight = 5; // mm

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(detailTextSize);
        doc.setTextColor(51, 65, 85);

        // Line 1 for global report: Period / Generation Date
        const period = periodText || UI_TEXT.globalConsumptionReportPeriodAll; // Usa o texto customizado se fornecido
        const generationDateText = `Data de Geração: ${formatDate(generationTimestamp.split('T')[0])}`;
        doc.text(period, margin, y);
        const generationDateTextWidth = doc.getStringUnitWidth(generationDateText) * doc.getFontSize() / doc.internal.scaleFactor;
        doc.text(generationDateText, pageWidth - margin - generationDateTextWidth, y);
        y += detailLineHeight;

        // Second Horizontal Line
        doc.setDrawColor(203, 213, 225);
        doc.line(margin, y, pageWidth - margin, y);
        y += 5; // Padding after the second line
        actualHeaderEndY = y;
    };

    drawPageSpecificHeaderForGlobal(); // Initial draw
    let currentY = actualHeaderEndY;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(51, 65, 85);
    doc.text("Consumo Detalhado de Materiais por Hospital", margin, currentY);
    currentY += 7;

    const tableBody = consumptionData.map(row => [
        titleCase(row.materialDescription),
        row.materialCode || 'N/A',
        titleCase(row.hospitalName),
        row.consumedQuantity.toString()
    ]);

    (doc as any).autoTable({
        startY: currentY,
        head: [[
            UI_TEXT.globalConsumptionMaterialDesc,
            UI_TEXT.globalConsumptionMaterialCode,
            UI_TEXT.globalConsumptionHospital,
            UI_TEXT.globalConsumptionQtyConsumed
        ]],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [107, 33, 168], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 }, 
        styles: { fontSize: 8, cellPadding: 1.5, textColor: [51, 65, 85], overflow: 'linebreak' },
        columnStyles: {
            0: { cellWidth: 'auto', minCellWidth: 60 }, 
            1: { cellWidth: 25 },                    
            2: { cellWidth: 'auto', minCellWidth: 45 }, 
            3: { cellWidth: 20, halign: 'center' }    
        },
        margin: { left: margin, right: margin, top: actualHeaderEndY, bottom: 25 }, 
        didDrawPage: (data: any) => {
            drawPageSpecificHeaderForGlobal();
            drawPdfFooter(doc, data.pageNumber, (doc as any).internal.getNumberOfPages(), generationTimestamp, pageWidth, pageHeight, margin);
        },
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;

    const notesTitle = "Observações sobre o Relatório de Consumo Global:";
    const notesContent = [
        "- Este relatório agrega o consumo total de cada material em todos os hospitais, com base no histórico de pedidos de reposição gerados.",
        "- A coluna 'Qtd. Consumida' reflete a soma das quantidades de um material específico consumidas em cada hospital listado.",
        "- Para um detalhamento por paciente ou data de cirurgia, consulte os relatórios de reposição individuais de cada hospital.",
        "- A precisão deste relatório depende da exatidão dos dados extraídos e corrigidos nos relatórios de reposição originais."
    ];

    let notesTextHeight = doc.getTextDimensions(notesTitle).h;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    notesContent.forEach(note => {
        const splitNote = doc.splitTextToSize(note, pageWidth - (2 * margin) - 2);
        notesTextHeight += splitNote.length * (doc.getLineHeight() * 0.352777 * 1.15);
    });
    notesTextHeight += 5;

    if (currentY + notesTextHeight > pageHeight - (margin + 25)) { 
        doc.addPage();
        currentY = actualHeaderEndY; 
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text(notesTitle, margin, currentY);
    currentY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    notesContent.forEach(note => {
        const splitNote = doc.splitTextToSize(note, pageWidth - (2 * margin) - 2);
        doc.text(splitNote, margin + 1, currentY);
        currentY += splitNote.length * (doc.getLineHeight() * 0.352777 * 1.15);
    });
    
    const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        if (i > (doc as any).lastAutoTable.pageCount) {
            drawPageSpecificHeaderForGlobal();
        }
        drawPdfFooter(doc, i, totalPages, generationTimestamp, pageWidth, pageHeight, margin);
    }

    const filename = `${COMPANY_NAME}_Relatorio_Consumo_Global_${formatDate(generationTimestamp.split('T')[0]).replace(/\//g, '')}.pdf`;
    doc.save(filename);
};
