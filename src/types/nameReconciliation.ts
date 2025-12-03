/**
 * Types for AI-powered Name Reconciliation and Conflicts Check
 */

export interface NameEntity {
  id?: string;
  name: string;
  entityType: 'client' | 'matter_party' | 'contact' | 'opposing_counsel';
  additionalInfo?: {
    email?: string;
    phone?: string;
    address?: string;
    organization?: string;
  };
}

export interface NameMatch {
  existingId: string;
  existingName: string;
  entityType: string;
  matchScore: number; // 0-100 confidence score
  matchReason: string; // AI explanation of why it matched
  suggestedAction: 'merge' | 'create_new' | 'review';
  additionalData?: {
    email?: string;
    phone?: string;
    lastModified?: string;
    createdBy?: string;
  };
}

export interface ReconciliationRequest {
  entities: NameEntity[];
  threshold?: number; // Minimum match score to consider (default: 70)
  includeConflictsCheck?: boolean;
}

export interface ReconciliationResponse {
  results: ReconciliationResult[];
  conflictsReport?: ConflictsReport;
  processingTime: number;
}

export interface ReconciliationResult {
  inputEntity: NameEntity;
  matches: NameMatch[];
  recommendation: 'use_existing' | 'create_new' | 'needs_review';
  selectedMatch?: NameMatch; // Auto-selected best match if confidence is high
}

export interface ConflictsReport {
  hasConflicts: boolean;
  conflicts: ConflictItem[];
  riskLevel: 'high' | 'medium' | 'low' | 'none';
  generatedAt: string;
  reportUrl?: string;
}

export interface ConflictItem {
  conflictType: 'direct' | 'positional' | 'business' | 'prior_representation';
  description: string;
  affectedParties: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  recommendedAction: string;
}

export interface NameReconciliationDecision {
  entityName: string;
  action: 'create_new' | 'merge_with_existing';
  selectedMatchId?: string;
  notes?: string;
}
