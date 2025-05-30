

export interface PatientInfo {
  patientName: string | null;
  patientDOB: string | null;
  surgeryDate: string | null;
  procedureName: string | null;
  doctorName: string | null;
}

export interface MaterialUsed {
  description: string;
  quantity: number;
  code: string | null;
  lotNumber?: string | null;
  observation?: string | null; // Added for user/AI provided observations
}

export interface ExtractedData extends PatientInfo {
  materialsUsed: MaterialUsed[];
}

// MaterialStockInfo removed as per request to remove stock control

export interface ReplenishmentMaterial extends MaterialUsed {
  totalConsumedQuantity: number; 
  replenishQuantity: number; 
  sourceDocumentIds: string[]; 
  replenishmentSuggestionNote?: string; // For system-generated replenishment notes (now simplified)
  // observation is inherited from MaterialUsed
}

export enum Hospital { // Predefined hospitals, can be used for initial seeding or specific logic
  ARA = "ARA",
  CAR = "CAR",
  FAX = "FAX",
  SM = "SM",
  FOZ = "FOZ",
  FRG = "FRG",
  CAS = "CAS",
  GUA = "GUA"
}

export interface ProcessedDocumentEntry {
  id: string; 
  fileName: string;
  file: File;
  status: 'pending' | 'processing' | 'success' | 'error';
  extractedData: ExtractedData | null;
  errorMessage?: string | null;
  imagePreviewUrl?: string; 
}

export interface SourceDocumentInfoForPdf {
  id: string;
  fileName: string;
  status: 'pending' | 'processing' | 'success' | 'error'; 
  errorMessage?: string | null; 
  patientName?: string | null;
  surgeryDate?: string | null; // Added surgeryDate
}

export interface ConsolidatedOrderData {
  orderId: string; 
  hospital: string; // Changed from Hospital enum to string
  orderDate: string; 
  sourceDocumentsProcessed: SourceDocumentInfoForPdf[];
  materialsToReplenish: ReplenishmentMaterial[];
  generationTimestamp: string;
}

export enum AppState {
  SELECTING_HOSPITAL,
  MANAGING_DOCUMENTS, 
  PROCESSING_DOCUMENTS,
  DATA_CORRECTION_AI_FEEDBACK, 
  REVIEW_AND_EDIT,      
  REPORT_GENERATED,
  VIEW_HISTORY, 
  MANAGE_MATERIAL_DATABASE, 
}

export interface HospitalOption {
  id: string; // Changed from Hospital enum to string for dynamic addition
  name: string;
}

export interface OrderRequest extends PatientInfo {
  id: string; 
  materialsToReplenish: ReplenishmentMaterial[]; 
  originalMaterialsConsumed?: MaterialUsed[]; 
}

// CorrectedMaterialItem is still needed for sending specific changes to the DB.
export interface CorrectedMaterialItem {
  originalDescription: string;
  originalCode: string | null;
  correctedDescription: string;
  correctedCode: string | null;
}

// Type for items in the material database
export interface MaterialDatabaseItem {
    id: string;
    description: string;
    code: string; // Can be empty string if no code
}

// Type for the global material consumption report PDF
export interface GlobalMaterialConsumptionRow {
  materialDescription: string;
  materialCode: string | null;
  hospitalName: string;
  consumedQuantity: number;
}