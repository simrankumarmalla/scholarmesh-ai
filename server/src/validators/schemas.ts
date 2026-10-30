import { z } from 'zod';

export const TARGET_DOMAINS = [
  'biomedical_clinical',
  'ai_computer_science',
  'climate_sustainability',
  'economics_market',
  'legal_regulatory',
  'social_behavioral'
] as const;

export const SYNTHESIS_MODES = [
  'systematic_review',
  'contradiction_audit',
  'decision_brief',
  'gap_analysis'
] as const;

export const SOURCE_TYPES = [
  'peer_reviewed_paper',
  'technical_report',
  'raw_field_notes',
  'web_article_abstract'
] as const;

export const CLAIM_CATEGORIES = [
  'empirical_finding',
  'statistic',
  'methodology',
  'limitation',
  'hypothesis'
] as const;

export const registerSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(120),
  email: z.string().email('Please enter a valid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  institution: z.string().max(180).optional(),
  research_role: z.string().max(100).optional()
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

export const createWorkspaceSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  domain: z.enum([
    'biomedical_clinical',
    'ai_computer_science',
    'climate_sustainability',
    'economics_market',
    'legal_regulatory',
    'social_behavioral'
  ]),
  research_question: z.string().min(10, 'Research question must be at least 10 characters'),
  working_hypothesis: z.string().optional().nullable(),
  default_synthesis_mode: z.enum([
    'systematic_review',
    'contradiction_audit',
    'decision_brief',
    'gap_analysis'
  ]).default('systematic_review')
});

export const ingestSourceSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255),
  authors: z.string().max(255).optional().default('Unknown Authors'),
  publication_year: z.coerce.number().int().min(1900).max(2030).optional().default(new Date().getFullYear()),
  source_type: z.enum([
    'peer_reviewed_paper',
    'technical_report',
    'raw_field_notes',
    'web_article_abstract'
  ]).default('peer_reviewed_paper'),
  raw_content: z.string().optional()
});

export const synthesizeRequestSchema = z.object({
  source_ids: z.array(z.string().uuid()).min(2, 'Cross-source synthesis requires selecting at least 2 sources'),
  synthesis_mode: z.enum([
    'systematic_review',
    'contradiction_audit',
    'decision_brief',
    'gap_analysis'
  ]).default('systematic_review'),
  title: z.string().optional()
});

export const copilotQuestionSchema = z.object({
  question: z.string().min(5, 'Question must be at least 5 characters').max(2000, 'Question is too long')
});
