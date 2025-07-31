import { Hospital, HospitalOption, MaterialDatabaseItem } from './types';

export const COMPANY_NAME = "HealthAdmin";
export const GEMINI_MODEL_TEXT = 'gemini-2.5-flash';

// INITIAL_SIMULATED_MATERIAL_DATABASE is the seed data.
// App.tsx will manage the live material database in localStorage.
export const INITIAL_SIMULATED_MATERIAL_DATABASE: MaterialDatabaseItem[] = [
  { id: 'mat001', description: 'Parafuso Titanium SuperLock 5.0mm x 30mm', code: 'P-205' },
  { id: 'mat002', description: 'Cimento Ósseo OrthoBond', code: 'CB-100' },
  { id: 'mat003', description: 'Placa de Reconstrução Pélvica LCP', code: 'PL-088' },
  { id: 'mat004', description: 'Fio Guia K-Wire 1.5mm', code: 'KW-015' },
  { id: 'mat005', description: 'Stent Vascular 10mm', code: 'SV-010' },
  { id: 'mat006', description: 'Cateter Angiográfico 5F', code: 'CA-005' },
  { id: 'mat007', description: 'Endoprótese Aórtica 26mm', code: 'EA-026'},
  { id: 'mat008', description: 'Sistema de Fixação Pedicular Universal', code: 'FP-U01'},
  { id: 'mat009', description: 'Componente Acetabular Não Cimentado 52mm', code: 'ACNC-52'},
  { id: 'mat010', description: 'Gaze Estéril 10x10cm (Pacote com 100)', code: 'GZ-100'},
];


// Sample OCR text is less relevant now as primary input is image, but can be kept for reference or testing geminiService
export const SAMPLE_OCR_TEXT = ` 
HOSPITAL CENTRAL - FICHA DE CONSUMO OPME
PACIENTE: João Silva
DATA NASC.: 10/03/1975
DATA CIRURGIA: 15/05/2024
PROCEDIMENTO: Artroplastia de Quadril
MÉDICO RESP.: Dra. Ana Costa
MATERIAIS UTILIZADOS:
- Parafuso Titanium SuperLock 5.0mm x 30mm (COD: P-205) - Quantidade: 2
- Cimento Ósseo OrthoBond (COD: CB-100) - Qtd: 1
`;

// Initial list of hospitals. This will be used to seed the state in App.tsx
export const INITIAL_HOSPITAL_OPTIONS: HospitalOption[] = [
  { id: Hospital.ARA, name: "Hospital ARA" },
  { id: Hospital.CAR, name: "Hospital CAR" },
  { id: Hospital.FAX, name: "Hospital FAX" },
  { id: Hospital.SM, name: "Hospital SM" },
  { id: Hospital.FOZ, name: "Hospital FOZ" },
  { id: Hospital.FRG, name: "Hospital FRG" },
  { id: Hospital.CAS, name: "Hospital CAS" },
  { id: Hospital.GUA, name: "Hospital GUA" },
];

export const UI_TEXT = {
  appName: `${COMPANY_NAME} - Sistema de Reposição OPME`,
  selectHospitalPrompt: "Selecione o Hospital",
  confirmHospitalButton: "Confirmar Hospital e Adicionar Documentos",
  documentManagementTitle: (hospitalName: string) => hospitalName,
  addDocumentButton: "Adicionar Documentos (Imagens)",
  processAllDocumentsButton: "Processar Documentos",
  processingDocumentsMessage: "Processando documentos... Por favor, aguarde.",
  generateAndDownloadPdfButton: "Gerar e Baixar PDF Consolidado",
  pdfGenerationSuccessMessage: "Relatório PDF gerado e download iniciado com sucesso!",
  startNewBatchButton: "Iniciar Novo Lote (Outro Hospital/Dia)",
  startNewBatchAfterPdfButton: "Iniciar Novo Lote de Reposição",
  noDocumentsAdded: "Nenhum documento adicionado. Clique em 'Adicionar Documentos' para começar.",
  documentStatusPending: "Pendente",
  documentStatusProcessing: "Processando...",
  documentStatusSuccess: "Sucesso",
  documentStatusError: "Erro",
  patientInfoSection: "Informações do Paciente e Cirurgia",
  materialsUsedSection: "Materiais Utilizados (Consumido)",
  uploadInstructions: "Envie até 25 imagens (JPG, PNG) dos formulários de consumo de uma vez.",
  uploadTitle: "Carregar Documento(s)",
  reviewAndGenerateButton: "Revisar e Gerar Pedido", 
  orderSummarySection: "Resumo do Pedido", 
  replenishmentDetails: "Detalhes da Reposição", 
  confirmSubmitButton: "Confirmar e Enviar",
  editExtractedDataTitle: "Editar Dados Extraídos do Documento",
  saveChangesButton: "Salvar Alterações",
  cancelButton: "Cancelar",
  reviewExtractedDataTitle: "Revisar Dados Extraídos e Gerar Relatório",
  patientGroupHeader: (patientName: string | null) => patientName || "Paciente Não Identificado",
  editButtonLabel: "Editar Dados",
  confirmAndGenerateReportButton: "Confirmar Dados e Gerar Relatório PDF",
  backToDocumentManagementButton: "Voltar ao Gerenciamento de Documentos",
  maxFilesError: (max: number) => `Você pode selecionar no máximo ${max} arquivos por vez.`,
  noSuccessfullyProcessedDocsForReview: "Nenhum documento foi processado com sucesso para revisão.",
  allDocsProcessedOrErrorGoToReview: "Todos os documentos foram processados ou resultaram em erro. Avance para revisar os dados.",
  proceedToReviewButton: "Revisar Dados Extraídos",
  generalErrorProcessing: "Ocorreu um erro no processamento. Tente novamente.",
  modalTitleEditData: (fileName: string) => `Editando Dados de: ${fileName}`,
  backToHospitalSelectionButton: "Voltar para Seleção de Hospital",
  removePatientGroupButton: "Remover Paciente e Documentos",
  removePatientConfirmTitle: "Confirmar Remoção de Paciente",
  removePatientConfirmMessage: (groupKey: string) => `Tem certeza que deseja remover o paciente/grupo '${groupKey}' e todos os seus documentos associados? Esta ação não pode ser desfeita.`,
  confirmRemoveButton: "Sim, Remover",
  // Order History UI Text
  orderHistoryTitle: "Histórico de Pedidos de Reposição",
  viewOrderHistoryButton: "Ver Histórico de Pedidos",
  noOrdersInHistory: "Nenhum pedido de reposição foi gerado nesta sessão.",
  reprintPdfButton: "Reimprimir PDF",
  backToHospitalSelectionFromHistoryButton: "Voltar para Seleção de Hospital",
  orderIdLabel: "ID do Pedido",
  hospitalLabel: "Hospital",
  orderDateLabel: "Data do Pedido",
  actionsLabel: "Ações",
  pdfReprintSuccessMessage: "PDF do pedido reimpresso com sucesso!",
  pdfReprintErrorMessage: "Falha ao reimprimir PDF do pedido.",
  // AI Feedback Message
  aiCorrectionFeedbackNote: "Suas correções são valiosas! Ao ajustar os dados, você nos ajuda a aprimorar a precisão da inteligência artificial para futuras extrações.",
  // Material Correction Screen UI Text
  aiCorrectionScreenTitle: "Aprimorar IA: Corrigir Materiais Extraídos",
  aiCorrectionScreenIntro: (hospitalName: string) => `Revise os materiais extraídos pela IA de todos os documentos para o ${hospitalName}. Suas correções ajudam a melhorar a precisão do sistema.`,
  aiExtractedLabel: "Extraído pela IA:",
  yourCorrectionLabel: "Sua Correção / Confirmação:",
  materialDescriptionLabel: "Descrição do Material",
  materialCodeLabel: "Código do Material (se aplicável)",
  totalConsumedAcrossDocsLabel: "Total Consumido (neste lote):",
  originalDocumentsLabel: "Documento(s) de Origem:",
  saveCorrectionsButton: "Salvar Correções e Continuar para Revisão",
  skipCorrectionsButton: "Pular Correção e Ir para Revisão Detalhada",
  noMaterialsToCorrect: "Nenhum material extraído com sucesso para correção nesta etapa.",
  correctionsSavedSuccessfully: "Correções salvas! Os dados dos documentos foram atualizados e o sistema aprendeu com suas informações.",
  correctionsSkipped: "Etapa de correção de materiais pulada.",
  proceedToMaterialCorrectionButton: "Corrigir Materiais",
  processingCompletedGoToCorrection: "Processamento concluído. Revise e corrija os materiais abaixo para aprimorar a IA.",
  viewDocumentButtonLabel: "Visualizar",
  modalTitleViewDocument: (fileName: string) => `Visualizando Documento: ${fileName}`,

  // Material Database Management Screen UI Text
  manageMaterialDbTitle: "Gerenciar Base de Dados de Materiais (Aprendizado IA)",
  manageMaterialDbIntro: "Adicione, edite ou remova materiais da base de conhecimento do sistema. Isso melhora a precisão da IA.",
  addNewMaterialSectionTitle: "Adicionar Novo Material à Base",
  descriptionInputLabel: "Descrição do Material*",
  codeInputLabel: "Código do Material (Opcional)",
  addButtonLabel: "Adicionar Material",
  materialAddedSuccess: "Material adicionado à base de dados com sucesso!",
  materialUpdatedSuccess: "Material atualizado na base de dados com sucesso!",
  materialDeletedSuccess: "Material removido da base de dados com sucesso!",
  errorRequiredField: (field: string) => `O campo '${field}' é obrigatório.`,
  errorMaterialExists: "Um material com esta descrição ou código já existe na base.",
  searchMaterialsPlaceholder: "Buscar por descrição ou código...",
  noMaterialsInDb: "Nenhum material cadastrado na base de dados.",
  confirmDeleteMaterialTitle: "Confirmar Remoção de Material",
  confirmDeleteMaterialMessage: (desc: string, code?: string) => `Tem certeza que deseja remover o material "${desc}" ${code ? `(Cód: ${code})` : ''} da base de dados? Esta ação não pode ser desfeita.`,
  editMaterialButtonLabel: "Editar",
  deleteMaterialButtonLabel: "Remover",
  saveMaterialChangesButtonLabel: "Salvar",
  cancelEditButtonLabel: "Cancelar Edição",
  currentMaterialsSectionTitle: "Materiais Cadastrados na Base",
  manageMaterialDbButtonLabel: "Gerenciar Base de Dados de Materiais",

  // Import Materials UI Text
  importMaterialsSectionTitle: "Importar Materiais de Arquivo",
  selectFileLabel: "Selecione um arquivo (.csv ou .txt):",
  fileInputLabel: "Escolher arquivo",
  csvFormatInstruction: "Formato CSV: Coluna 1: Código (opcional), Coluna 2: Descrição (obrigatória). Separador: vírgula (,).",
  txtFormatInstruction: "Formato TXT: Linha: CÓDIGO;DESCRIÇÃO (Código opcional, ex: ;Nova Descrição). Separador: ponto e vírgula (;).",
  csvHasHeaderLabel: "Primeira linha do CSV é cabeçalho (ignorar)",
  importButtonLabel: "Processar Arquivo e Importar Materiais",
  importSuccessMessage: (added: number, skipped: number, errors: number) => 
    `Importação Concluída: ${added} materiais adicionados. ${skipped} duplicatas/inválidos ignorados. ${errors > 0 ? `${errors} linhas com erro.` : ''}`,
  importNoFileSelected: "Nenhum arquivo selecionado para importação.",
  importInvalidFileType: "Tipo de arquivo inválido. Selecione .csv ou .txt.",
  importFileReadError: "Erro ao ler o arquivo.",
  importProcessing: "Processando arquivo e importando materiais...",
  importErrorLineDetail: (line: number, message: string) => `Linha ${line}: ${message}`,
  errorMaterialExistsInFile: "Um material com esta descrição ou código já existe no arquivo de importação.",

  // Add New Hospital UI Text
  addNewHospitalButtonLabel: "Adicionar Novo Hospital",
  modalTitleAddNewHospital: "Adicionar Novo Hospital",
  hospitalNameInputLabel: "Nome do Novo Hospital*",
  hospitalAddedSuccessMessage: (name: string) => `Hospital '${name}' adicionado com sucesso!`,
  errorHospitalNameExists: "Um hospital com este nome já existe.",
  errorHospitalNameRequired: "O nome do hospital é obrigatório.",

  // Global Consumption Report UI Text
  generateGlobalConsumptionReportButton: "Gerar Relatório de Consumo Global",
  globalConsumptionReportTitle: "Relatório Global de Consumo de Materiais",
  globalConsumptionReportSubTitle: "Consumo Agregado por Hospital",
  globalConsumptionReportPeriodAll: "Período: Histórico Completo",
  globalConsumptionReportPeriod30Days: "Período: Últimos 30 dias",
  globalConsumptionMaterialDesc: "Material (Descrição)",
  globalConsumptionMaterialCode: "Código",
  globalConsumptionHospital: "Hospital",
  globalConsumptionQtyConsumed: "Qtd. Consumida",
  noDataForGlobalReport: "Não há dados de histórico de pedidos para gerar o relatório de consumo global.",
  generatingGlobalConsumptionReportMessage: "Gerando relatório de consumo global...",
};