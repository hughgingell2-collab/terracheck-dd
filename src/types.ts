export type DocumentClassification = 'environmental_report' | 'planning_permit' | 'zoning_filing' | 'native_title_search' | 'mining_tenement_search' | 'other';

export interface UploadedDocument {
  id: string;
  name: string;
  content: string;
  classification?: DocumentClassification;
  summary?: string;
}

export interface ExtractedFacts {
  documentTitle: string;
  dates: string[];
  addresses: string[];
  parties: string[];
  zoningClasses: string[];
  contaminationFindings: string[];
  complianceDeadlines: string[];
  nativeTitleClaims?: string[];
  miningTenements?: string[];
  rawExtractedFacts: string;
}

export interface RiskCheck {
  category: 'contamination' | 'zoning' | 'permits' | 'compliance' | 'proximity' | 'native_title' | 'mining_tenement';
  severity: 'High' | 'Medium' | 'Low' | 'None';
  justification: string;
}

export interface MemoFinding {
  id: string;
  title: string;
  category: string;
  severity: 'High' | 'Medium' | 'Low';
  explanation: string;
  citationDocument: string;
  citationQuote: string;
  mitigation: string;
}

export interface DueDiligenceMemo {
  executiveSummary: string;
  findings: MemoFinding[];
}

export type PipelineStageId = 'intake' | 'extraction' | 'risk' | 'memo';

export interface PipelineStage {
  id: PipelineStageId;
  name: string;
  description: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  message?: string;
}

export interface PipelineResult {
  documents: UploadedDocument[];
  extractedFacts?: ExtractedFacts[];
  risks?: RiskCheck[];
  memo?: DueDiligenceMemo;
}
