/**
 * Tests for Pipeline Stage Management
 * Validates: Requirements 8.6, 2.1, 2.3
 */

import { PIPELINE_STAGES } from '../candidate-models.js';
import { PipelineService } from '../pipeline-service.js';

describe('Pipeline Stage Management Integration Tests', () => {
  
  test('should validate pipeline service methods exist', () => {
    const pipelineService = new PipelineService();
    
    expect(typeof pipelineService.updateCandidateStage).toBe('function');
    expect(typeof pipelineService.getStageHistory).toBe('function');
    expect(typeof pipelineService.validateStageTransition).toBe('function');
    expect(typeof pipelineService.getValidNextStages).toBe('function');
  });

  test('should validate stage transitions correctly', () => {
    const pipelineService = new PipelineService();
    
    // Valid transitions
    expect(pipelineService.validateStageTransition(PIPELINE_STAGES.APPLIED, PIPELINE_STAGES.SCREENING)).toBe(true);
    expect(pipelineService.validateStageTransition(PIPELINE_STAGES.SCREENING, PIPELINE_STAGES.INTERVIEW)).toBe(true);
    expect(pipelineService.validateStageTransition(PIPELINE_STAGES.INTERVIEW, PIPELINE_STAGES.OFFER)).toBe(true);
    expect(pipelineService.validateStageTransition(PIPELINE_STAGES.OFFER, PIPELINE_STAGES.HIRED)).toBe(true);
    
    // Same stage transitions (allowed)
    expect(pipelineService.validateStageTransition(PIPELINE_STAGES.APPLIED, PIPELINE_STAGES.APPLIED)).toBe(true);
    
    // Invalid transitions
    expect(pipelineService.validateStageTransition(PIPELINE_STAGES.APPLIED, PIPELINE_STAGES.HIRED)).toBe(false);
    expect(pipelineService.validateStageTransition(PIPELINE_STAGES.SCREENING, PIPELINE_STAGES.HIRED)).toBe(false);
  });

  test('should return correct valid next stages', () => {
    const pipelineService = new PipelineService();
    
    expect(pipelineService.getValidNextStages(PIPELINE_STAGES.APPLIED)).toEqual([PIPELINE_STAGES.SCREENING]);
    expect(pipelineService.getValidNextStages(PIPELINE_STAGES.HIRED)).toEqual([]);
    
    const interviewNextStages = pipelineService.getValidNextStages(PIPELINE_STAGES.INTERVIEW);
    expect(interviewNextStages).toContain(PIPELINE_STAGES.OFFER);
    expect(interviewNextStages).toContain(PIPELINE_STAGES.SCREENING);
  });

  test('should handle invalid stages gracefully', () => {
    const pipelineService = new PipelineService();
    
    expect(pipelineService.getValidNextStages('INVALID_STAGE')).toEqual([]);
    expect(pipelineService.getValidNextStages(null)).toEqual([]);
    expect(pipelineService.getValidNextStages(undefined)).toEqual([]);
    expect(pipelineService.getValidNextStages('')).toEqual([]);
  });

  test('should have all required pipeline stages', () => {
    const stages = Object.values(PIPELINE_STAGES);
    
    expect(stages).toContain('Applied');
    expect(stages).toContain('Screening');
    expect(stages).toContain('Interview');
    expect(stages).toContain('Offer');
    expect(stages).toContain('Hired');
    expect(stages).toHaveLength(5);
  });
});