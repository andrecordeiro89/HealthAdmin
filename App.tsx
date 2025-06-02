import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AppState, ProcessedDocumentEntry, ExtractedData, ConsolidatedOrderData, ReplenishmentMaterial, MaterialUsed, HospitalOption, SourceDocumentInfoForPdf, CorrectedMaterialItem, MaterialDatabaseItem, GlobalMaterialConsumptionRow } from './types';
import { INITIAL_SIMULATED_MATERIAL_DATABASE, UI_TEXT, INITIAL_HOSPITAL_OPTIONS } from './constants';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Spinner } from './components/Spinner';
import { Alert, AlertType } from './components/Alert';
import { HospitalSelector } from './components/HospitalSelector';
import { DocumentManager } from './components/DocumentManager';
import { MaterialCorrectionScreen } from './components/MaterialCorrectionScreen';
import { ExtractionReviewScreen } from './components/ExtractionReviewScreen';
import { Modal } from './components/Modal';
import { OrderForm } from './components/OrderForm';
import { OrderHistoryScreen } from './components/OrderHistoryScreen';
import { MaterialDatabaseManagerScreen } from './components/MaterialDatabaseManagerScreen'; 
import { extractOrderDetailsFromText } from './services/geminiService';
import { generateConsolidatedOrderPdf, generateGlobalMaterialConsumptionPdf } from './services/pdfService';

const LOCAL_STORAGE_ORDER_HISTORY_KEY = 'healthAdminAppOrderHistory';
const LOCAL_STORAGE_HOSPITAL_OPTIONS_KEY = 'healthAdminAppHospitalOptions';
const LOCAL_STORAGE_MATERIAL_DB_KEY = 'healthAdminAppMaterialDb';

// Palavras-chave para observações críticas
const OBSERVATION_KEYWORDS = [
  'contaminado', 'alterado', 'danificado', 'espanado', 'estragado', 'não utilizado', 'nao utilizado', 'defeito', 'quebrado', 'não implantado', 'nao implantado'
];

// Função utilitária para processamento em batches
async function processInBatches<T, R>(items: T[], batchSize: number, processFn: (item: T) => Promise<R>): Promise<R[]> {
  let results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processFn));
    results = results.concat(batchResults);
  }
  return results;
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.SELECTING_HOSPITAL);
  const [hospitalOptions, setHospitalOptions] = useState<HospitalOption[]>(INITIAL_HOSPITAL_OPTIONS);
  const [selectedHospital, setSelectedHospital] = useState<string | null>(null); // Changed to string
  const [selectedHospitalName, setSelectedHospitalName] = useState<string>('');
  const [documents, setDocuments] = useState<ProcessedDocumentEntry[]>([]);
  const [lastGeneratedOrder, setLastGeneratedOrder] = useState<ConsolidatedOrderData | null>(null);
  const [orderHistory, setOrderHistory] = useState<ConsolidatedOrderData[]>([]);
  const [alert, setAlert] = useState<{ message: string, type: AlertType } | null>(null);

  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);

  const [showRemovePatientConfirmModal, setShowRemovePatientConfirmModal] = useState<boolean>(false);
  const [patientGroupKeyToRemove, setPatientGroupKeyToRemove] = useState<string | null>(null);

  const [materialDatabase, setMaterialDatabase] = useState<MaterialDatabaseItem[]>(INITIAL_SIMULATED_MATERIAL_DATABASE);

  const documentsRef = useRef(documents);
  useEffect(() => {
    documentsRef.current = documents;
  }, [documents]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(LOCAL_STORAGE_ORDER_HISTORY_KEY);
      if (storedHistory) {
        setOrderHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Error loading order history from localStorage:", error);
      setAlert({ message: "Erro ao carregar histórico de pedidos do armazenamento local.", type: AlertType.Error });
    }

    try {
      const storedOptions = localStorage.getItem(LOCAL_STORAGE_HOSPITAL_OPTIONS_KEY);
      if (storedOptions) {
        const parsedOptions = JSON.parse(storedOptions);
        if (Array.isArray(parsedOptions) && parsedOptions.length > 0) {
            setHospitalOptions(parsedOptions);
        } else {
            setHospitalOptions(INITIAL_HOSPITAL_OPTIONS); 
        }
      } else {
        setHospitalOptions(INITIAL_HOSPITAL_OPTIONS); 
      }
    } catch (error) {
      console.error("Error loading hospital options from localStorage:", error);
      setHospitalOptions(INITIAL_HOSPITAL_OPTIONS); 
      setAlert({ message: "Erro ao carregar lista de hospitais do armazenamento local.", type: AlertType.Error });
    }

    try {
      const storedMaterialDb = localStorage.getItem(LOCAL_STORAGE_MATERIAL_DB_KEY);
      if (storedMaterialDb) {
        const parsedDb = JSON.parse(storedMaterialDb);
        if (Array.isArray(parsedDb) && parsedDb.length > 0) {
            setMaterialDatabase(parsedDb);
        } else {
             setMaterialDatabase(INITIAL_SIMULATED_MATERIAL_DATABASE);
        }
      } else {
        setMaterialDatabase(INITIAL_SIMULATED_MATERIAL_DATABASE);
      }
    } catch (error) {
        console.error("Error loading material database from localStorage:", error);
        setMaterialDatabase(INITIAL_SIMULATED_MATERIAL_DATABASE);
        setAlert({ message: "Erro ao carregar base de dados de materiais do armazenamento local.", type: AlertType.Error });
    }
  }, []);

  // Save orderHistory to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_ORDER_HISTORY_KEY, JSON.stringify(orderHistory));
    } catch (error) {
      console.error("Error saving order history to localStorage:", error);
      setAlert({ message: "Erro ao salvar histórico de pedidos no armazenamento local.", type: AlertType.Error });
    }
  }, [orderHistory]);

  // Save hospitalOptions to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_HOSPITAL_OPTIONS_KEY, JSON.stringify(hospitalOptions));
    } catch (error) {
      console.error("Error saving hospital options to localStorage:", error);
      setAlert({ message: "Erro ao salvar lista de hospitais no armazenamento local.", type: AlertType.Error });
    }
  }, [hospitalOptions]);

  // Save materialDatabase to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_MATERIAL_DB_KEY, JSON.stringify(materialDatabase));
    } catch (error) {
      console.error("Error saving material database to localStorage:", error);
      setAlert({ message: "Erro ao salvar base de dados de materiais no armazenamento local.", type: AlertType.Error });
    }
  }, [materialDatabase]);


  const handleHospitalSelect = (hospitalId: string) => { 
    const hospitalDetails = hospitalOptions.find(h => h.id === hospitalId);
    setSelectedHospital(hospitalId);
    setSelectedHospitalName(hospitalDetails?.name || hospitalId);
    setAppState(AppState.MANAGING_DOCUMENTS);
    setDocuments([]);
    setLastGeneratedOrder(null);
    setAlert(null);
  };

  const handleAddNewHospital = (newHospitalName: string): boolean => {
    const trimmedName = newHospitalName.trim();
    if (!trimmedName) {
      setAlert({ message: UI_TEXT.errorHospitalNameRequired, type: AlertType.Error });
      return false;
    }
    const nameExists = hospitalOptions.some(h => h.name.toLowerCase() === trimmedName.toLowerCase());
    if (nameExists) {
      setAlert({ message: UI_TEXT.errorHospitalNameExists, type: AlertType.Error });
      return false;
    }

    const newHospitalId = `hosp-${trimmedName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const newHospital: HospitalOption = { id: newHospitalId, name: trimmedName };
    
    setHospitalOptions(prev => [...prev, newHospital].sort((a,b) => a.name.localeCompare(b.name)));
    setAlert({ message: UI_TEXT.hospitalAddedSuccessMessage(trimmedName), type: AlertType.Success });
    return true;
  };


  const handleGoBackToHospitalSelection = () => {
    setSelectedHospital(null);
    setSelectedHospitalName('');
    setDocuments([]);
    setLastGeneratedOrder(null);
    setAlert(null);
    setAppState(AppState.SELECTING_HOSPITAL);
  };

  const handleNavigateToManageMaterialDatabase = () => {
    setAlert(null);
    setAppState(AppState.MANAGE_MATERIAL_DATABASE);
  };

  const handleAddDocuments = (files: File[]) => { 
    const newDocuments: ProcessedDocumentEntry[] = files.map(file => ({
      id: `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}-${Math.random().toString(36).substring(2,7)}`,
      fileName: file.name,
      file: file,
      status: 'pending',
      extractedData: null,
      imagePreviewUrl: URL.createObjectURL(file),
    }));
    setDocuments(prev => [...prev, ...newDocuments]);
    setAlert(null);
  };

  const handleRemoveDocument = (docId: string) => {
    setDocuments(prev => prev.filter(doc => {
      if (doc.imagePreviewUrl && doc.id === docId) { 
        URL.revokeObjectURL(doc.imagePreviewUrl);
      }
      return doc.id !== docId;
    }));
  };
  
  useEffect(() => {
    return () => {
      documentsRef.current.forEach(doc => {
        if (doc.imagePreviewUrl) {
          URL.revokeObjectURL(doc.imagePreviewUrl);
        }
      });
    };
  }, []); 

  const fileToGenerativePart = async (file: File): Promise<{mimeType: string, data: string}> => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]); 
      reader.readAsDataURL(file);
    });
    return {
      mimeType: file.type,
      data: await base64EncodedDataPromise,
    };
  };


  const handleProcessAllDocuments = useCallback(async () => {
    if (documents.every(doc => doc.status === 'success' || doc.status === 'error')) {
      if (documents.some(doc => doc.status === 'success')) {
        setAlert({ message: UI_TEXT.allDocsProcessedOrErrorGoToReview, type: AlertType.Info });
      } else {
        setAlert({ message: "Todos os documentos já foram processados ou resultaram em erro. Nenhum dado para revisar.", type: AlertType.Info });
      }
      return;
    }

    setAppState(AppState.PROCESSING_DOCUMENTS);
    setAlert(null);

    let updatedDocs = [...documents];
    const docsToProcess = documents.filter(doc => doc.status === 'pending');

    // Processamento em batches de 3
    const processedResults = await processInBatches(docsToProcess, 3, async (doc) => {
      updatedDocs = updatedDocs.map(d => d.id === doc.id ? { ...d, status: 'processing' } : d);
      setDocuments([...updatedDocs]);
      try {
        const imagePart = await fileToGenerativePart(doc.file);
        const data = await extractOrderDetailsFromText(undefined, imagePart.data, imagePart.mimeType, undefined);
        return { ...doc, status: 'success' as const, extractedData: data, errorMessage: null };
      } catch (error) {
        console.error(`Error processing ${doc.fileName}:`, error);
        return { ...doc, status: 'error' as const, errorMessage: (error as Error).message || UI_TEXT.generalErrorProcessing };
      }
    });

    updatedDocs = documents.map(doc => {
      const processedVersion = processedResults.find(p => p.id === doc.id);
      return processedVersion || doc;
    }).sort((a, b) => a.fileName.localeCompare(b.fileName));

    setDocuments(updatedDocs);

    const anySuccess = processedResults.some(d => d.status === 'success');
    const anyError = processedResults.some(d => d.status === 'error');
    const successCount = processedResults.filter(d => d.status === 'success').length;
    const errorCount = processedResults.filter(d => d.status === 'error').length;

    if (anySuccess) {
      setAlert({ message: `Processamento concluído. ${successCount} documento(s) com sucesso, ${errorCount} com erro. Revise e corrija os materiais abaixo para aprimorar a IA.`, type: AlertType.Success });
      setAppState(AppState.DATA_CORRECTION_AI_FEEDBACK);
    } else if (anyError && !anySuccess) {
      setAlert({ message: "Todos os documentos pendentes falharam ao processar. Verifique os detalhes.", type: AlertType.Error });
      setAppState(AppState.MANAGING_DOCUMENTS);
    } else {
      setAlert({ message: "Nenhum documento pendente foi processado.", type: AlertType.Info });
      setAppState(AppState.MANAGING_DOCUMENTS);
    }
  }, [documents]);


  const handleConfirmMaterialCorrections = (
    updatedProcessedDocuments: ProcessedDocumentEntry[],
    correctedItemsForDb: CorrectedMaterialItem[]
  ) => {
    let currentMaterialDb = [...materialDatabase]; // Use state variable
    correctedItemsForDb.forEach(item => {
        // Normalize corrected values
        const correctedDescNormalized = item.correctedDescription.trim().toLowerCase();
        const correctedCodeNormalized = item.correctedCode?.trim().toLowerCase() || '';

        if (correctedCodeNormalized) { 
            const existingByCodeIdx = currentMaterialDb.findIndex(dbMat => dbMat.code && dbMat.code.trim().toLowerCase() === correctedCodeNormalized);
            if (existingByCodeIdx > -1) { 
                // If code exists, update its description if the new one is different (and not just a case change)
                if (currentMaterialDb[existingByCodeIdx].description.trim().toLowerCase() !== correctedDescNormalized) {
                    currentMaterialDb[existingByCodeIdx].description = item.correctedDescription.trim(); // Use original casing
                }
            } else { 
                // Code doesn't exist, check if description exists (to avoid adding a new entry if only code was added to an existing description)
                const existingByDescIdx = currentMaterialDb.findIndex(dbMat => dbMat.description.trim().toLowerCase() === correctedDescNormalized && !dbMat.code);
                if (existingByDescIdx > -1) {
                    // Description exists without a code, now we are adding a code to it.
                    currentMaterialDb[existingByDescIdx].code = item.correctedCode!.trim(); // Use original casing
                } else {
                    // Neither code nor description (as primary key) exists, add new.
                    currentMaterialDb.push({
                        id: `usercorr-code-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                        description: item.correctedDescription.trim(),
                        code: item.correctedCode!.trim(),
                    });
                }
            }
        } else { // No corrected code provided
            const existingByDescIdx = currentMaterialDb.findIndex(dbMat => dbMat.description.trim().toLowerCase() === correctedDescNormalized);
            if (existingByDescIdx > -1) {
                // Description exists. If it had a code, and now we're saying no code, clear it.
                // Or if it's just a confirmation of an existing item without code.
                if (currentMaterialDb[existingByDescIdx].code) { // It had a code, now it doesn't
                    // This case might be complex: are we removing a code or confirming a description for an item that ALSO exists with code?
                    // For simplicity, if a user corrects an item to have NO code, and an item with that description exists,
                    // we assume they are confirming/updating that description. If it had a code, it implies removing it.
                    // However, we should be careful not to create a duplicate description if an item with the same desc but *different* code exists.
                    // This logic prioritizes the user's explicit correction for *this* instance.
                    // A more robust system might flag potential conflicts.
                    // For now, if found by desc, and corrected code is empty, ensure the found item's code is also empty.
                    // This is tricky because 'learning' should ideally not overwrite distinct items.
                    // Let's assume if they clear the code, they mean this specific entry has no code.
                    // If the database item found by description already had a code, we might not want to clear it globally from one correction.
                    // This part of "learning" is the most complex.
                    // Let's refine: if a description matches, and the DB item has a code, but the correction has no code,
                    // we DON'T modify the DB item's code. We assume the user is correcting the description for an entry that should not have a code.
                    // So, if it's found by desc, and the DB item has no code, it's a match (or minor text update).
                    // If it's found by desc, and the DB item HAS a code, but corrected code is EMPTY, this implies a *new* entry
                    // for the DB that has this description but explicitly no code, *unless* the original item being corrected also had no code.

                    // Simpler: If description matches, and the DB entry has no code, we are good.
                    // If description matches, and DB entry HAS a code, but user provides NO code for correction, this correction
                    // might be for an item that is distinct from the coded one in the DB.
                    // So, only add if no exact match (desc + no code) is found.
                    const trulyNewEntry = !currentMaterialDb.some(dbMat => 
                        dbMat.description.trim().toLowerCase() === correctedDescNormalized && 
                        (dbMat.code?.trim().toLowerCase() || '') === ''
                    );
                    if (trulyNewEntry) {
                         currentMaterialDb.push({
                            id: `usercorr-desc-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                            description: item.correctedDescription.trim(),
                            code: '', // Explicitly no code
                        });
                    }

                }
                // else: description exists and has no code in DB, so it's a match or minor text update to description - already handled if desc changed.
            } else { // Description doesn't exist in DB
                 currentMaterialDb.push({
                    id: `usercorr-desc-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                    description: item.correctedDescription.trim(),
                    code: '', 
                });
            }
        }
    });
    setMaterialDatabase(currentMaterialDb.sort((a,b) => a.description.localeCompare(b.description))); 

    setDocuments(updatedProcessedDocuments);

    setAlert({ message: UI_TEXT.correctionsSavedSuccessfully, type: AlertType.Success });
    setAppState(AppState.REVIEW_AND_EDIT);
  };

  const handleSkipMaterialCorrections = () => {
    setAlert({ message: UI_TEXT.correctionsSkipped, type: AlertType.Info });
    setAppState(AppState.REVIEW_AND_EDIT);
  };


  const handleProceedToReview = () => { 
    if (documents.some(doc => doc.status === 'success')) {
      setAppState(AppState.DATA_CORRECTION_AI_FEEDBACK); 
      setAlert(null);
    } else {
      setAlert({ message: UI_TEXT.noSuccessfullyProcessedDocsForReview, type: AlertType.Warning });
    }
  };

  const handleEditDocument = (docId: string) => {
    const docToEdit = documents.find(d => d.id === docId);
    if (docToEdit && docToEdit.extractedData) {
      setEditingDocumentId(docId);
      setShowEditModal(true);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingDocumentId(null);
  };

  const handleSaveEditedDocument = (docId: string, updatedData: ExtractedData) => {
    setDocuments(prevDocs => 
      prevDocs.map(doc => 
        doc.id === docId ? { ...doc, extractedData: updatedData, status: 'success' } : doc 
      )
    );
    handleCloseEditModal();
    setAlert({ message: `Dados do documento '${documents.find(d=>d.id === docId)?.fileName}' atualizados. ${UI_TEXT.aiCorrectionFeedbackNote}`, type: AlertType.Success });
  };


  const handleGenerateConsolidatedPdf = async () => {
    if (!selectedHospital || documents.filter(d => d.status === 'success' && d.extractedData).length === 0) {
      setAlert({ message: "Nenhum hospital selecionado ou nenhum documento com dados válidos para gerar o relatório.", type: AlertType.Error });
      return;
    }
    setAlert(null);
    setAppState(AppState.PROCESSING_DOCUMENTS); 

    const successfulDocsForMaterials = documents.filter(d => d.status === 'success' && d.extractedData);
    
    const allConsumedMaterials: Array<MaterialUsed & { sourceDocId: string }> = [];
    successfulDocsForMaterials.forEach(doc => {
      doc.extractedData!.materialsUsed.forEach(mat => {
        allConsumedMaterials.push({ 
            ...mat, 
            sourceDocId: doc.id, 
        });
      });
    });

    const aggregatedMaterials = new Map<string, ReplenishmentMaterial>();

    allConsumedMaterials.forEach(consumedMat => {
      const materialBaseKey = consumedMat.code || consumedMat.description.toLowerCase();
      const lotKeyPart = consumedMat.lotNumber ? `_LOT_${consumedMat.lotNumber}` : '_NO_LOT';
      const key = `${materialBaseKey}${lotKeyPart}`;
      
      // Função para filtrar observação
      function filterObservation(obs?: string | null): string | null {
        if (!obs) return null;
        const obsLower = obs.toLowerCase();
        for (const keyword of OBSERVATION_KEYWORDS) {
          if (obsLower.includes(keyword)) {
            return obs;
          }
        }
        return null;
      }

      if (aggregatedMaterials.has(key)) {
        const existing = aggregatedMaterials.get(key)!;
        existing.totalConsumedQuantity += consumedMat.quantity;
        if (!existing.sourceDocumentIds.includes(consumedMat.sourceDocId)) {
            existing.sourceDocumentIds.push(consumedMat.sourceDocId);
        }
        const filteredObs = filterObservation(consumedMat.observation);
        if (filteredObs) {
          if (!existing.observation) {
            existing.observation = filteredObs;
          } else if (existing.observation !== filteredObs && !existing.observation.includes(filteredObs)) {
            existing.observation += ` | ${filteredObs}`;
          }
        }
      } else {
        aggregatedMaterials.set(key, {
          description: consumedMat.description,
          code: consumedMat.code,
          lotNumber: consumedMat.lotNumber,
          observation: filterObservation(consumedMat.observation),
          quantity: consumedMat.quantity,
          totalConsumedQuantity: consumedMat.quantity,
          replenishQuantity: 0,
          sourceDocumentIds: [consumedMat.sourceDocId],
        });
      }
    });
    
     aggregatedMaterials.forEach(material => {
        const totalForThisMaterialLot = allConsumedMaterials
            .filter(cm => {
                const cmBaseKey = cm.code || cm.description.toLowerCase();
                const cmLotKeyPart = cm.lotNumber ? `_LOT_${cm.lotNumber}` : '_NO_LOT';
                const cmKey = `${cmBaseKey}${cmLotKeyPart}`;
                
                const matBaseKey = material.code || material.description.toLowerCase();
                const matLotKeyPart = material.lotNumber ? `_LOT_${material.lotNumber}` : '_NO_LOT';
                const matKey = `${matBaseKey}${matLotKeyPart}`;
                return cmKey === matKey;
            })
            .reduce((sum, cm) => sum + cm.quantity, 0);
        
        material.totalConsumedQuantity = totalForThisMaterialLot;
    });


    aggregatedMaterials.forEach(material => {
        const materialDescLower = material.description.toLowerCase();
        const materialCodeLower = material.code?.toLowerCase();

        const stockItem = materialDatabase.find( 
            dbItem => {
                const dbDescLower = dbItem.description.toLowerCase();
                const dbCodeLower = dbItem.code?.toLowerCase();

                if (materialCodeLower && dbCodeLower) { // Both have codes
                    return dbCodeLower === materialCodeLower;
                }
                if (!materialCodeLower && !dbCodeLower) { // Neither has a code, compare by description
                    return dbDescLower === materialDescLower;
                }
                // One has a code, the other doesn't.
                // Consider a match if codes match (already handled) OR if DB has no code and descriptions match.
                // Or if consumed has no code but matches DB description that might or might not have a code (preferring match with code if available)
                // This part can be tricky. Let's prioritize code match. If no code on consumed, match by description.
                if (!materialCodeLower && dbDescLower === materialDescLower) {
                     // If multiple DB entries match description (one with code, one without), this might pick the one without.
                     // This needs to be an exact match or a learned alias.
                     // For now, this finds a DB item if EITHER code matches OR (if consumed has no code) description matches.
                    return true;
                }
                return false;
            }
        );

        material.replenishQuantity = material.totalConsumedQuantity; 

        if (!stockItem) {
            material.replenishmentSuggestionNote = "Sistema: Material não cadastrado na base. Reposição baseada no consumo.";
        } else {
            // Check if the description in the DB is different from consumed, despite matching code
            if (stockItem.code && material.code && stockItem.code.toLowerCase() === material.code.toLowerCase() && 
                stockItem.description.toLowerCase() !== material.description.toLowerCase()) {
                 material.replenishmentSuggestionNote = `Sistema: Código ${material.code} cadastrado como "${stockItem.description}". Consumido como "${material.description}". Verificar descrição.`;
            } else {
                material.replenishmentSuggestionNote = "Sistema: Reposição baseada no consumo.";
            }
        }
    });


    const sortedMaterials = Array.from(aggregatedMaterials.values()).sort((a, b) => {
        if (a.description.localeCompare(b.description) !== 0) {
            return a.description.localeCompare(b.description);
        }
        return (a.lotNumber || '').localeCompare(b.lotNumber || '');
    });

    const orderDate = new Date().toISOString().split('T')[0];
    
    const docsForPdfSummary: SourceDocumentInfoForPdf[] = documents.map(d => ({
      id: d.id,
      fileName: d.fileName,
      status: d.status, 
      errorMessage: d.errorMessage,
      patientName: d.extractedData?.patientName || null,
      surgeryDate: d.extractedData?.surgeryDate || null 
    }));

    const newConsolidatedOrder: ConsolidatedOrderData = {
      orderId: `${selectedHospital}-${orderDate.replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`,
      hospital: selectedHospital, 
      orderDate: orderDate,
      sourceDocumentsProcessed: docsForPdfSummary,
      materialsToReplenish: sortedMaterials,
      generationTimestamp: new Date().toISOString(),
    };

    setLastGeneratedOrder(newConsolidatedOrder);
    setOrderHistory(prevHistory => [newConsolidatedOrder, ...prevHistory]); 
    
    try {
      await generateConsolidatedOrderPdf(newConsolidatedOrder, selectedHospitalName);
      setAlert({ message: UI_TEXT.pdfGenerationSuccessMessage, type: AlertType.Success });
      setAppState(AppState.REPORT_GENERATED);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setAlert({ message: `Falha ao gerar PDF: ${(error as Error).message}`, type: AlertType.Error });
      setAppState(AppState.REVIEW_AND_EDIT); 
    }
  };

  const handleStartNew = () => {
    setSelectedHospital(null);
    setSelectedHospitalName('');
    setDocuments([]);
    setLastGeneratedOrder(null);
    setAlert(null);
    setAppState(AppState.SELECTING_HOSPITAL);
  };
  
  const handleNavigateToHistory = () => {
    setAppState(AppState.VIEW_HISTORY);
    setAlert(null);
  };

  const handleReprintPdf = async (orderToReprint: ConsolidatedOrderData) => {
    setAlert(null);
    const originalAppState = appState;
    setAppState(AppState.PROCESSING_DOCUMENTS);

    const hospitalDetails = hospitalOptions.find(h => h.id === orderToReprint.hospital);
    const hospitalNameForReprint = hospitalDetails?.name || orderToReprint.hospital;

    try {
      await generateConsolidatedOrderPdf(orderToReprint, hospitalNameForReprint);
      setAlert({ message: UI_TEXT.pdfReprintSuccessMessage, type: AlertType.Success });
    } catch (error) {
      console.error("Error reprinting PDF:", error);
      setAlert({ message: `${UI_TEXT.pdfReprintErrorMessage}: ${(error as Error).message}`, type: AlertType.Error });
    } finally {
      setAppState(originalAppState); 
    }
  };

  const handleGenerateGlobalConsumptionReport = async () => {
    if (orderHistory.length === 0) {
      setAlert({ message: UI_TEXT.noDataForGlobalReport, type: AlertType.Warning });
      return;
    }
    setAlert(null);
    const originalAppState = appState;
    setAppState(AppState.PROCESSING_DOCUMENTS); // Reuse for spinner

    const consumptionDataMap = new Map<string, GlobalMaterialConsumptionRow>();

    orderHistory.forEach(order => {
      const hospitalDetails = hospitalOptions.find(h => h.id === order.hospital);
      const hospitalName = hospitalDetails?.name || order.hospital;

      order.materialsToReplenish.forEach(material => {
        const key = `${material.description.toLowerCase()}_${(material.code || 'N/A').toLowerCase()}_${hospitalName.toLowerCase()}`;
        
        if (consumptionDataMap.has(key)) {
          const existingEntry = consumptionDataMap.get(key)!;
          existingEntry.consumedQuantity += material.totalConsumedQuantity;
        } else {
          consumptionDataMap.set(key, {
            materialDescription: material.description,
            materialCode: material.code,
            hospitalName: hospitalName,
            consumedQuantity: material.totalConsumedQuantity,
          });
        }
      });
    });

    const consumptionDataForPdf = Array.from(consumptionDataMap.values()).sort((a, b) => {
      if (a.materialDescription.localeCompare(b.materialDescription) !== 0) {
        return a.materialDescription.localeCompare(b.materialDescription);
      }
      if ((a.materialCode || '').localeCompare(b.materialCode || '') !== 0) {
        return (a.materialCode || '').localeCompare(b.materialCode || '');
      }
      return a.hospitalName.localeCompare(b.hospitalName);
    });

    try {
      await generateGlobalMaterialConsumptionPdf(consumptionDataForPdf, new Date().toISOString());
      setAlert({ message: UI_TEXT.pdfGenerationSuccessMessage, type: AlertType.Success });
    } catch (error) {
      console.error("Error generating global consumption PDF:", error);
      setAlert({ message: `Falha ao gerar PDF de consumo global: ${(error as Error).message}`, type: AlertType.Error });
    } finally {
      setAppState(originalAppState);
    }
  };


  const handleOpenRemovePatientConfirmModal = (groupKey: string) => {
    setPatientGroupKeyToRemove(groupKey);
    setShowRemovePatientConfirmModal(true);
  };

  const handleCloseRemovePatientConfirmModal = () => {
    setPatientGroupKeyToRemove(null);
    setShowRemovePatientConfirmModal(false);
  };

  const handleConfirmRemovePatientGroup = () => {
    if (!patientGroupKeyToRemove) return;

    setDocuments(prevDocs => {
        const docsToRemoveThisGroup: ProcessedDocumentEntry[] = [];
        const remainingDocs = prevDocs.filter(doc => {
            if (doc.status !== 'success' || !doc.extractedData) return true; 

            const docPatientNameKey = doc.extractedData.patientName?.trim() || UI_TEXT.patientGroupHeader(null);
            
            if (docPatientNameKey === patientGroupKeyToRemove) {
                docsToRemoveThisGroup.push(doc);
                return false; 
            }
            return true; 
        });

        docsToRemoveThisGroup.forEach(doc => {
            if (doc.imagePreviewUrl) {
                URL.revokeObjectURL(doc.imagePreviewUrl);
            }
        });
        
        return remainingDocs;
    });

    setAlert({ message: `Paciente/grupo '${patientGroupKeyToRemove}' e seus documentos foram removidos.`, type: AlertType.Success });
    handleCloseRemovePatientConfirmModal();
  };
  
  const handleMaterialDatabaseUpdate = (updatedDb: MaterialDatabaseItem[]) => {
    setMaterialDatabase(updatedDb);
  };

  const editingDoc = documents.find(doc => doc.id === editingDocumentId);

  const purpleGradientPrimary = "w-full text-white font-semibold py-2.5 px-5 rounded-lg shadow-lg bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-white transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out disabled:opacity-60 disabled:saturate-50 disabled:cursor-not-allowed disabled:transform-none";
  const purpleGradientLight = "w-full text-purple-700 font-medium py-2.5 px-5 rounded-lg shadow-sm bg-gradient-to-br from-purple-100 to-indigo-200 hover:from-purple-200 hover:to-indigo-300 border border-purple-300 hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-300 focus:ring-offset-white transition-all duration-300 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed";
  const redGradientDestructive = "text-white font-semibold py-2 px-4 rounded-lg shadow-lg bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 focus:ring-offset-white transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out disabled:opacity-60 disabled:saturate-50 disabled:cursor-not-allowed disabled:transform-none";
  const modalPurpleGradientLight = purpleGradientLight.replace("w-full ", ""); // for modal buttons not needing full width

  const renderContent = () => {
    switch (appState) {
      case AppState.SELECTING_HOSPITAL:
        return <HospitalSelector 
                    hospitals={hospitalOptions} 
                    onSelect={handleHospitalSelect} 
                    onViewHistory={orderHistory.length > 0 ? handleNavigateToHistory : undefined}
                    onManageMaterialDatabase={handleNavigateToManageMaterialDatabase}
                    onAddNewHospital={handleAddNewHospital} 
                    onGenerateGlobalConsumptionReport={orderHistory.length > 0 ? handleGenerateGlobalConsumptionReport : undefined}
               />;
      case AppState.MANAGING_DOCUMENTS:
        if (!selectedHospital) return <Alert message="Hospital não selecionado." type={AlertType.Error} />;
        return (
          <DocumentManager
            hospitalName={selectedHospitalName}
            documents={documents}
            onAddDocuments={handleAddDocuments} 
            onRemoveDocument={handleRemoveDocument}
            onProcessAll={handleProcessAllDocuments}
            processingDisabled={documents.every(doc => doc.status === 'success' || doc.status === 'error') && documents.filter(doc => doc.status === 'pending').length === 0}
            canProceedToCorrection={documents.some(doc => doc.status === 'success')}
            onProceedToCorrection={handleProceedToReview} 
            onGoBackToHospitalSelection={handleGoBackToHospitalSelection}
          />
        );
      case AppState.PROCESSING_DOCUMENTS:
         let spinnerText = UI_TEXT.processingDocumentsMessage;
         if (!selectedHospitalName && !lastGeneratedOrder && orderHistory.length > 0) {
            spinnerText = UI_TEXT.generatingGlobalConsumptionReportMessage;
         } else if (lastGeneratedOrder && !selectedHospital) { 
            spinnerText = "Gerando PDF do pedido...";
        } else if (orderHistory.length > 0 && !selectedHospital && appState === AppState.PROCESSING_DOCUMENTS) { 
             spinnerText = "Reimprimindo PDF...";
        }
        return <Spinner text={spinnerText} />;

      case AppState.DATA_CORRECTION_AI_FEEDBACK:
        return (
            <MaterialCorrectionScreen
                hospitalName={selectedHospitalName}
                processedDocuments={documents} 
                onConfirmCorrections={handleConfirmMaterialCorrections} 
                onSkip={handleSkipMaterialCorrections}
                onGoBack={() => setAppState(AppState.MANAGING_DOCUMENTS)}
            />
        );
      case AppState.REVIEW_AND_EDIT:
        return (
            <ExtractionReviewScreen
                documents={documents}
                onEditDocument={handleEditDocument}
                onConfirmAndGenerateReport={handleGenerateConsolidatedPdf}
                onGoBack={() => {
                  setAppState(AppState.DATA_CORRECTION_AI_FEEDBACK);
                }}
                hospitalName={selectedHospitalName}
                onOpenRemovePatientConfirmModal={handleOpenRemovePatientConfirmModal}
            />
        );
      case AppState.REPORT_GENERATED:
        return (
            <div className="w-full max-w-md mx-auto bg-white/90 backdrop-blur-md p-6 sm:p-8 rounded-xl shadow-2xl text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-purple-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-xl font-semibold text-slate-700 mb-2">{UI_TEXT.pdfGenerationSuccessMessage}</h2>
                {lastGeneratedOrder && <p className="text-sm text-slate-500 mb-6">ID do Pedido Gerado: {lastGeneratedOrder.orderId}</p>}
                <button
                    onClick={handleStartNew}
                    className={`${purpleGradientPrimary} mb-3`}
                >
                    {UI_TEXT.startNewBatchAfterPdfButton}
                </button>
                {orderHistory.length > 0 && (
                    <button
                        onClick={handleNavigateToHistory}
                        className={purpleGradientLight}
                    >
                        {UI_TEXT.viewOrderHistoryButton}
                    </button>
                )}
            </div>
        );
      case AppState.VIEW_HISTORY:
        return (
            <OrderHistoryScreen
                history={orderHistory}
                hospitalOptions={hospitalOptions} 
                onReprintPdf={handleReprintPdf}
                onBack={handleGoBackToHospitalSelection}
            />
        );
      case AppState.MANAGE_MATERIAL_DATABASE: 
        return (
            <MaterialDatabaseManagerScreen
                materialDbItems={materialDatabase}
                onMaterialDbUpdate={handleMaterialDatabaseUpdate}
                onBack={handleGoBackToHospitalSelection}
                setGlobalAlert={setAlert} 
            />
        );
      default:
        return <Alert message="Estado desconhecido da aplicação." type={AlertType.Error} />;
    }
  };
  
  const appBackgroundClass = "bg-gray-100";


  return (
    <div className={`min-h-screen flex flex-col ${appBackgroundClass} text-slate-700`}>
      <Header title={UI_TEXT.appName} />
      <main className="flex-grow container mx-auto px-2 sm:px-4 py-6 sm:py-8 w-full">
        {alert && <Alert message={alert.message} type={alert.type} onDismiss={() => setAlert(null)} />}
        <div className="mt-4">
          {renderContent()}
        </div>
      </main>
      <Footer />

      {showEditModal && editingDoc && editingDoc.extractedData && (
        <Modal 
            isOpen={showEditModal} 
            onClose={handleCloseEditModal} 
            title={UI_TEXT.modalTitleEditData(editingDoc.fileName)}
            size="4xl"
        >
          <OrderForm
            initialData={editingDoc.extractedData}
            onSubmit={(updatedData) => handleSaveEditedDocument(editingDoc.id, updatedData)}
            submitButtonText={UI_TEXT.saveChangesButton} 
          />
           <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button 
                    type="button" 
                    onClick={handleCloseEditModal}
                    className={modalPurpleGradientLight}
                >
                    {UI_TEXT.cancelButton}
                </button>
            </div>
        </Modal>
      )}

      {showRemovePatientConfirmModal && patientGroupKeyToRemove && (
        <Modal
            isOpen={showRemovePatientConfirmModal}
            onClose={handleCloseRemovePatientConfirmModal}
            title={UI_TEXT.removePatientConfirmTitle}
            size="md"
        >
            <p className="text-slate-600 mb-6">{UI_TEXT.removePatientConfirmMessage(patientGroupKeyToRemove)}</p>
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                    type="button"
                    onClick={handleCloseRemovePatientConfirmModal}
                    className={modalPurpleGradientLight}
                >
                    {UI_TEXT.cancelButton}
                </button>
                <button
                    type="button"
                    onClick={handleConfirmRemovePatientGroup}
                    className={redGradientDestructive}
                >
                    {UI_TEXT.confirmRemoveButton}
                </button>
            </div>
        </Modal>
      )}
    </div>
  );
};

export default App;