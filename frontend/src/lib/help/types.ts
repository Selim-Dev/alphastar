// Help Center Content Types
// Requirements: 9.1, 9.2 - Structured TypeScript content types for maintainable documentation

import type { LucideIcon } from 'lucide-react';

// =============================================================================
// Glossary Types
// =============================================================================

/**
 * Category classification for glossary entries
 * Requirements: 4.5 - Organize entries by category tags
 */
export type GlossaryCategory = 'Operations' | 'Maintenance' | 'Finance' | 'General';

/**
 * A searchable glossary entry for aviation terms and acronyms
 * Requirements: 4.3 - Show term, definition, where it appears, calculation, importance, example
 */
export interface GlossaryEntry {
  id: string;
  term: string;
  acronym?: string;
  definition: string;
  whereItAppears: string[];
  howCalculated?: string;
  whyItMatters: string;
  exampleValue?: string;
  category: GlossaryCategory;
  relatedTerms?: string[];
}

// =============================================================================
// Quick Start Types
// =============================================================================

/**
 * A single step in the Quick Start onboarding flow
 * Requirements: 2.2 - Show step number, title, description, expected outcome, optional screenshot/icon
 */
export interface QuickStartStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  expectedOutcome: string;
  icon?: LucideIcon;
  screenshot?: string;
  navigationLink?: string;
  navigationLabel?: string;
}

/**
 * Callout boxes for common issues in Quick Start
 * Requirements: 2.4 - Include callout boxes for common issues
 */
export interface QuickStartCallout {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  description: string;
  actionLink?: string;
  actionLabel?: string;
}

/**
 * Complete Quick Start content structure
 */
export interface QuickStartContent {
  steps: QuickStartStep[];
  callouts: QuickStartCallout[];
}

// =============================================================================
// Module Guide Types
// =============================================================================

/**
 * KPI definition within a module guide
 */
export interface ModuleKPIDefinition {
  term: string;
  definition: string;
  glossaryId?: string;
}

/**
 * Required data specification for a module
 */
export interface ModuleRequiredData {
  collections: string[];
  endpoints: string[];
}

/**
 * Detailed documentation for a dashboard module
 * Requirements: 3.2 - Display purpose, required data, step-by-step usage, expected outputs, 
 *               empty-state causes, KPI definitions, export notes
 */
export interface ModuleGuide {
  id: string;
  moduleName: string;
  icon: LucideIcon;
  purpose: string;
  requiredData: ModuleRequiredData;
  stepByStepUsage: string[];
  expectedOutputs: string[];
  emptyStateCauses: string[];
  kpiDefinitions: ModuleKPIDefinition[];
  exportNotes?: string;
}

// =============================================================================
// Data Readiness Types
// =============================================================================

/**
 * Fix instruction for populating missing data
 */
export interface FixInstruction {
  method: 'ui' | 'import' | 'seed' | 'api';
  description: string;
  link?: string;
  linkLabel?: string;
}

/**
 * Required collection specification
 */
export interface RequiredCollection {
  name: string;
  description: string;
}

/**
 * Data readiness item mapping a page to its required data
 * Requirements: 6.2 - Show page name, required collections, endpoints, record count, status, fix instructions
 */
export interface DataReadinessItem {
  id: string;
  pageName: string;
  pageRoute: string;
  requiredCollections: RequiredCollection[];
  requiredEndpoints: string[];
  fixInstructions: FixInstruction[];
}

/**
 * Runtime status for a collection's data readiness
 */
export interface DataReadinessStatus {
  collectionName: string;
  count: number;
  status: 'ok' | 'warning' | 'empty';
}

// =============================================================================
// Walkthrough Types
// =============================================================================

/**
 * A single step in the demo walkthrough script
 * Requirements: 8.2 - Provide numbered steps with page to visit, features to highlight, 
 *               talking points, expected visual output
 */
export interface WalkthroughStep {
  id: string;
  stepNumber: number;
  pageToVisit: string;
  pageRoute: string;
  featuresToHighlight: string[];
  talkingPoints: string[];
  expectedVisualOutput: string;
  estimatedMinutes: number;
}

/**
 * Complete walkthrough content structure
 */
export interface WalkthroughContent {
  title: string;
  description: string;
  totalEstimatedMinutes: number;
  steps: WalkthroughStep[];
}

// =============================================================================
// Demo API Response Types
// =============================================================================

/**
 * Collection counts for demo operations
 */
export interface DemoCollectionCounts {
  aircraft: number;
  dailyStatus: number;
  dailyCounters: number;
  aogEvents: number;
  maintenanceTasks: number;
  workOrders: number;
  discrepancies: number;
  budgetPlans: number;
  actualSpend: number;
}

/**
 * Response from POST /api/demo/seed
 * Requirements: 11.5 - Return success status, message, and affected record counts
 */
export interface DemoSeedResponse {
  success: boolean;
  message: string;
  counts: DemoCollectionCounts;
  duration: number; // milliseconds
}

/**
 * Response from POST /api/demo/reset
 * Requirements: 11.5 - Return success status, message, and deleted record counts
 */
export interface DemoResetResponse {
  success: boolean;
  message: string;
  deletedCounts: DemoCollectionCounts;
}

/**
 * Response from GET /api/demo/status
 * Requirements: 7.1 - Return counts of demo records per collection
 */
export interface DemoStatusResponse {
  hasDemoData: boolean;
  counts: DemoCollectionCounts;
}

// =============================================================================
// Help Center Tab Types
// =============================================================================

/**
 * Available tabs in the Help Center
 */
export type HelpCenterTab = 
  | 'quick-start' 
  | 'module-guides' 
  | 'glossary' 
  | 'data-readiness' 
  | 'demo-mode';

/**
 * Tab configuration for Help Center navigation
 */
export interface HelpCenterTabConfig {
  id: HelpCenterTab;
  label: string;
  icon: LucideIcon;
  description: string;
}
