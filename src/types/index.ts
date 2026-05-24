// Core Type Definitions for Opus-Quality

// ============================================================================
// AUTHENTICATION & SECURITY TYPES
// ============================================================================

export interface JWTPayload {
  sub: string; // user:id or service:name
  iss: string; // issuer
  aud: string; // audience
  exp: number; // expiration timestamp
  iat: number; // issued at
  scope: string; // space-separated scopes
  org_id: string;
  roles: UserRole[];
  mfa_verified: boolean;
  session_id: string;
}

export enum UserRole {
  ADMIN = 'admin',
  ENGINEER = 'engineer',
  QA_MANAGER = 'quality-manager',
  SECURITY_OFFICER = 'security-officer',
  VIEWER = 'viewer',
}

export interface ApiKeyCredentials {
  client_id: string;
  client_secret: string; // Only visible on creation
  created_at: ISO8601;
  expires_at?: ISO8601;
  scopes: string[];
  rotated_at: ISO8601;
}

export interface AuditLogEntry {
  id: string; // UUID
  timestamp: ISO8601;
  event_type: AuditEventType;
  actor: {
    user_id: string;
    service: string;
    ip_address: string;
    mfa_verified: boolean;
  };
  resource: {
    type: string;
    id: string;
    sensitive: boolean;
  };
  action: 'READ' | 'WRITE' | 'DELETE' | 'EXECUTE';
  status: 'SUCCESS' | 'FAILURE';
  details: Record<string, unknown>;
  data_accessed: string[]; // PII types accessed
  hash: string; // SHA-256 for integrity
}

export enum AuditEventType {
  REQUIREMENT_ANALYZED = 'REQUIREMENT_ANALYZED',
  ENVIRONMENT_PROVISIONED = 'ENVIRONMENT_PROVISIONED',
  TEST_EXECUTED = 'TEST_EXECUTED',
  DATA_ACCESSED = 'DATA_ACCESSED',
  SETTING_CHANGED = 'SETTING_CHANGED',
  USER_AUTHENTICATED = 'USER_AUTHENTICATED',
  DATA_MASKED = 'DATA_MASKED',
  TOKEN_CREATED = 'TOKEN_CREATED',
}

// ============================================================================
// REQUIREMENT SYNTHESIZER TYPES
// ============================================================================

export interface RequirementAnalysisRequest {
  source: 'jira' | 'linear' | 'github' | 'prd';
  source_id: string;
  title: string;
  description: string;
  acceptance_criteria?: string[];
  user_stories?: string[];
}

export interface RequirementAnalysisResponse {
  requirement_id: string;
  testability_score: number; // 0-100
  missing_specifications: string[];
  suggested_acceptance_criteria: string[];
  gherkin_scenarios: GherkinScenario[];
  gaps: RequirementGaps;
  risk_profile: RiskProfile;
}

export interface GherkinScenario {
  scenario_id: string;
  title: string;
  background?: string[];
  given: string[];
  when: string[];
  then: string[];
  data_inputs: Record<string, unknown>;
  expected_outputs: Record<string, unknown>;
  acceptance_criteria_mapped: string[];
}

export interface RequirementGaps {
  happy_paths: string[];
  sad_paths: string[];
  edge_cases: string[];
  data_constraints: string[];
}

export interface RiskProfile {
  category: 'HIGH' | 'MEDIUM' | 'LOW';
  score: number; // 0-100
  rationale: string;
  factors?: {
    code_complexity: number;
    test_coverage: number;
    deployment_frequency: number;
    historical_failure_rate: number;
    environment_drift: number;
  };
}

// ============================================================================
// ENVIRONMENT TWIN & MIRROR ENGINE TYPES
// ============================================================================

export interface EnvironmentProvisionRequest {
  pr_id: string;
  source_repo: string;
  target_branch: string;
  base_environment: 'staging' | 'production';
  isolation_level: IsolationLevel;
  ttl_minutes: number;
  with_synthetic_data: boolean;
  include_services: string[];
  resource_limits: ResourceLimits;
}

export type IsolationLevel = 'FULL' | 'PARTIAL' | 'SHARED';

export interface ResourceLimits {
  cpu_cores: number;
  memory_gb: number;
  storage_gb: number;
}

export interface EnvironmentProvisionResponse {
  environment_id: string;
  status: EnvironmentStatus;
  container_endpoints: ContainerEndpoints;
  credentials: EnvironmentCredentials;
  estimated_ready_time: number; // seconds
  cost_estimate: number;
}

export enum EnvironmentStatus {
  PROVISIONING = 'PROVISIONING',
  READY = 'READY',
  ERROR = 'ERROR',
  DESTROYING = 'DESTROYING',
}

export interface ContainerEndpoints {
  api_url: string;
  database_host: string;
  database_port: number;
  cache_url: string;
  message_queue_url: string;
}

export interface EnvironmentCredentials {
  db_username: string;
  db_password: string; // Tokenized in vault
  vault_token: string;
}

export interface MaskingPolicy {
  column_name: string;
  column_type: string;
  pii_category: PIICategory;
  masking_type: MaskingType;
  token_vault?: string;
  format?: string;
  preserve_format?: boolean;
}

export enum PIICategory {
  EMAIL = 'EMAIL',
  SSN = 'SSN',
  PHONE = 'PHONE',
  PAYMENT_CARD = 'PAYMENT_CARD',
  DATE_OF_BIRTH = 'DATE_OF_BIRTH',
  ADDRESS = 'ADDRESS',
  MEDICAL_RECORD = 'MEDICAL_RECORD',
}

export enum MaskingType {
  TOKENIZATION = 'TOKENIZATION',
  FORMAT_PRESERVING = 'FORMAT_PRESERVING',
  SHUFFLING = 'SHUFFLING',
  GENERALIZATION = 'GENERALIZATION',
}

// ============================================================================
// PREDICTIVE REGRESSION & CONTINUOUS RUNNER TYPES
// ============================================================================

export interface ImpactAnalysisRequest {
  commit_sha: string;
  previous_commit_sha: string;
  changed_files?: string[];
  affected_services?: string[];
}

export interface ImpactAnalysisResponse {
  impact_id: string;
  risk_level: RiskLevel;
  risk_score: number; // 0-100
  impacted_test_suites: TestSuite[];
  test_execution_plan: TestExecutionPlan;
  change_summary: ChangeSummary;
}

export enum RiskLevel {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export interface TestSuite {
  id: string;
  name: string;
  type: 'unit' | 'integration' | 'e2e' | 'performance';
  confidence_score: number; // 0-100
  estimated_duration: number; // seconds
  files_it_covers: string[];
  historical_failure_rate: number;
  last_executed: ISO8601;
  priority: number;
  command: string;
}

export interface TestExecutionPlan {
  total_tests: number;
  estimated_duration: number;
  parallelizable: boolean;
  priority_order: TestInExecutionOrder[];
}

export interface TestInExecutionOrder {
  id: string;
  name: string;
  command: string;
  priority: number;
}

export interface ChangeSummary {
  files_changed: number;
  lines_added: number;
  lines_deleted: number;
  services_affected: string[];
  areas: ChangeArea[];
}

export enum ChangeArea {
  API = 'api',
  DATABASE = 'database',
  UI = 'ui',
  INFRASTRUCTURE = 'infrastructure',
}

// ============================================================================
// SELF-HEALING AUTOMATION MAINTENANCE TYPES
// ============================================================================

export interface HealLocatorRequest {
  original_selector: string;
  action: UIAction;
  screenshot: string; // Base64
  html_snapshot: string;
  dom_tree: string; // JSON stringified
  session_id: string;
  test_context: TestContext;
}

export type UIAction = 'click' | 'fill' | 'hover' | 'scroll' | 'select';

export interface TestContext {
  test_file: string;
  test_name: string;
  timestamp: ISO8601;
  url?: string;
}

export interface HealLocatorResponse {
  status: 'SUCCESS' | 'FAILED';
  healed_selector: string;
  confidence_score: number; // 0-100
  healing_method: HealingMethod;
  pr_generated: boolean;
  pr_link?: string;
}

export enum HealingMethod {
  DOM_SEARCH = 'DOM_SEARCH',
  VISUAL_MATCHING = 'VISUAL_MATCHING',
  SEMANTIC_MATCHING = 'SEMANTIC_MATCHING',
  AI_SUGGESTION = 'AI_SUGGESTION',
}

// ============================================================================
// GRAPH DATABASE TYPES (Neo4j)
// ============================================================================

export interface GraphNode {
  id: string;
  labels: string[]; // e.g., ['File', 'Source']
  properties: Record<string, unknown>;
}

export interface GraphRelationship {
  id: string;
  type: string; // e.g., 'TESTS', 'CHANGES'
  startNode: string; // Node ID
  endNode: string; // Node ID
  properties: Record<string, unknown>;
}

// ============================================================================
// COMMON TYPES
// ============================================================================

export type ISO8601 = string; // ISO 8601 format: 2026-05-24T14:30:00Z
export type UUID = string; // UUID v4 format

export interface ApiResponse<T> {
  data: T;
  meta: {
    timestamp: ISO8601;
    request_id: string;
  };
}

export interface ApiError {
  error: string;
  message: string;
  status_code: number;
  timestamp: ISO8601;
  request_id: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface OpusConfig {
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  auth: {
    clientId: string;
    clientSecret: string;
    realm: string;
  };
  database: {
    postgres: {
      host: string;
      port: number;
      database: string;
      ssl: boolean;
    };
    neo4j: {
      host: string;
      port: number;
      auth: {
        username: string;
        password: string;
      };
    };
  };
  vault: {
    address: string;
    token: string;
    engine: string;
  };
}

// ============================================================================
// TELEMETRY & MONITORING TYPES
// ============================================================================

export interface TestExecutionMetrics {
  test_id: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  duration_ms: number;
  timestamp: ISO8601;
  error_message?: string;
  logs_url?: string;
  environment: string;
  commit_sha: string;
}

export interface RegressionMetrics {
  total_tests: number;
  passed: number;
  failed: number;
  skipped: number;
  pass_rate: number;
  avg_duration_ms: number;
  timestamp: ISO8601;
}
