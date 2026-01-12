/**
 * Unit Tests for Job Validation
 * Tests specific examples and edge cases for job data validation
 */

import { 
  validateJobData, 
  sanitizeJobInput, 
  DEPARTMENTS, 
  EMPLOYMENT_TYPES,
  isValidJobStatus,
  getFieldValidationRules
} from './job-validation.js';

describe('Job Validation Unit Tests', () => {

  describe('validateJobData', () => {
    
    test('should validate complete valid job data', () => {
      const validJob = {
        title: 'Senior Software Engineer',
        department: 'engineering',
        type: 'full-time',
        location: 'San Francisco, CA',
        salary: '$120k - $150k',
        description: 'We are looking for a senior software engineer to join our team and help build amazing products that users love.',
        requirements: 'Bachelor\'s degree in Computer Science or related field. 5+ years of experience in software development.'
      };

      const result = validateJobData(validJob);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate job data without optional salary', () => {
      const validJob = {
        title: 'Product Designer',
        department: 'design',
        type: 'contract',
        location: 'Remote',
        description: 'Join our design team to create beautiful and intuitive user experiences for our products.',
        requirements: 'Portfolio demonstrating strong design skills. Experience with Figma and user research.'
      };

      const result = validateJobData(validJob);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject job with missing required fields', () => {
      const incompleteJob = {
        title: 'Marketing Manager',
        department: 'marketing'
        // Missing type, location, description, requirements
      };

      const result = validateJobData(incompleteJob);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      const errorFields = result.errors.map(e => e.field);
      expect(errorFields).toContain('type');
      expect(errorFields).toContain('location');
      expect(errorFields).toContain('description');
      expect(errorFields).toContain('requirements');
    });

    test('should reject job with empty string required fields', () => {
      const jobWithEmptyFields = {
        title: '',
        department: 'sales',
        type: 'full-time',
        location: '',
        description: 'Valid description that meets minimum length requirements for testing purposes.',
        requirements: 'Valid requirements that meet minimum length requirements for testing purposes.'
      };

      const result = validateJobData(jobWithEmptyFields);
      expect(result.isValid).toBe(false);
      
      const errorCodes = result.errors.map(e => e.code);
      expect(errorCodes).toContain('TITLE_REQUIRED');
      expect(errorCodes).toContain('LOCATION_REQUIRED');
    });

    test('should reject job with invalid department', () => {
      const jobWithInvalidDepartment = {
        title: 'Data Scientist',
        department: 'invalid-department',
        type: 'full-time',
        location: 'New York, NY',
        description: 'Work with large datasets to extract meaningful insights and drive business decisions.',
        requirements: 'PhD in Statistics, Mathematics, or related field. Experience with Python and R.'
      };

      const result = validateJobData(jobWithInvalidDepartment);
      expect(result.isValid).toBe(false);
      
      const departmentError = result.errors.find(e => e.field === 'department');
      expect(departmentError).toBeDefined();
      expect(departmentError.code).toBe('DEPARTMENT_INVALID_VALUE');
    });

    test('should reject job with invalid employment type', () => {
      const jobWithInvalidType = {
        title: 'DevOps Engineer',
        department: 'engineering',
        type: 'invalid-type',
        location: 'Austin, TX',
        description: 'Manage infrastructure and deployment pipelines for our cloud-based applications.',
        requirements: 'Experience with AWS, Docker, and Kubernetes. Strong scripting skills in Python or Bash.'
      };

      const result = validateJobData(jobWithInvalidType);
      expect(result.isValid).toBe(false);
      
      const typeError = result.errors.find(e => e.field === 'type');
      expect(typeError).toBeDefined();
      expect(typeError.code).toBe('TYPE_INVALID_VALUE');
    });

    test('should reject job with title too short', () => {
      const jobWithShortTitle = {
        title: 'PM', // Too short (min 3 characters)
        department: 'product',
        type: 'full-time',
        location: 'Seattle, WA',
        description: 'Lead product development and work closely with engineering and design teams.',
        requirements: 'MBA or equivalent experience. Strong analytical and communication skills.'
      };

      const result = validateJobData(jobWithShortTitle);
      expect(result.isValid).toBe(false);
      
      const titleError = result.errors.find(e => e.field === 'title');
      expect(titleError).toBeDefined();
      expect(titleError.code).toBe('TITLE_TOO_SHORT');
    });

    test('should reject job with description too short', () => {
      const jobWithShortDescription = {
        title: 'Sales Representative',
        department: 'sales',
        type: 'full-time',
        location: 'Chicago, IL',
        description: 'Short description', // Too short (min 50 characters)
        requirements: 'Bachelor\'s degree preferred. Excellent communication skills and sales experience.'
      };

      const result = validateJobData(jobWithShortDescription);
      expect(result.isValid).toBe(false);
      
      const descriptionError = result.errors.find(e => e.field === 'description');
      expect(descriptionError).toBeDefined();
      expect(descriptionError.code).toBe('DESCRIPTION_TOO_SHORT');
    });

    test('should reject job with requirements too short', () => {
      const jobWithShortRequirements = {
        title: 'Content Writer',
        department: 'marketing',
        type: 'part-time',
        location: 'Remote',
        description: 'Create engaging content for our blog, social media, and marketing materials.',
        requirements: 'Writing skills' // Too short (min 50 characters)
      };

      const result = validateJobData(jobWithShortRequirements);
      expect(result.isValid).toBe(false);
      
      const requirementsError = result.errors.find(e => e.field === 'requirements');
      expect(requirementsError).toBeDefined();
      expect(requirementsError.code).toBe('REQUIREMENTS_TOO_SHORT');
    });

    test('should reject job with fields too long', () => {
      const longString = 'A'.repeat(101); // Exceeds 100 character limit
      const veryLongString = 'A'.repeat(2001); // Exceeds 2000 character limit
      
      const jobWithLongFields = {
        title: longString,
        department: 'engineering',
        type: 'full-time',
        location: longString,
        salary: 'A'.repeat(51), // Exceeds 50 character limit
        description: veryLongString,
        requirements: veryLongString
      };

      const result = validateJobData(jobWithLongFields);
      expect(result.isValid).toBe(false);
      
      const errorCodes = result.errors.map(e => e.code);
      expect(errorCodes).toContain('TITLE_TOO_LONG');
      expect(errorCodes).toContain('LOCATION_TOO_LONG');
      expect(errorCodes).toContain('SALARY_TOO_LONG');
      expect(errorCodes).toContain('DESCRIPTION_TOO_LONG');
      expect(errorCodes).toContain('REQUIREMENTS_TOO_LONG');
    });

    test('should reject job with invalid title characters', () => {
      const jobWithInvalidTitle = {
        title: 'Software Engineer <script>alert("xss")</script>',
        department: 'engineering',
        type: 'full-time',
        location: 'Boston, MA',
        description: 'Develop and maintain web applications using modern JavaScript frameworks.',
        requirements: 'Bachelor\'s degree in Computer Science. Experience with React and Node.js.'
      };

      const result = validateJobData(jobWithInvalidTitle);
      expect(result.isValid).toBe(false);
      
      const titleError = result.errors.find(e => e.field === 'title');
      expect(titleError).toBeDefined();
      expect(titleError.code).toBe('TITLE_INVALID_CHARACTERS');
    });

    test('should reject job with invalid location characters', () => {
      const jobWithInvalidLocation = {
        title: 'UX Designer',
        department: 'design',
        type: 'full-time',
        location: 'San Francisco <script>',
        description: 'Design user interfaces and experiences for our mobile and web applications.',
        requirements: 'Portfolio showcasing UX/UI design work. Proficiency in design tools like Sketch or Figma.'
      };

      const result = validateJobData(jobWithInvalidLocation);
      expect(result.isValid).toBe(false);
      
      const locationError = result.errors.find(e => e.field === 'location');
      expect(locationError).toBeDefined();
      expect(locationError.code).toBe('LOCATION_INVALID_CHARACTERS');
    });

    test('should handle null input gracefully', () => {
      const result = validateJobData(null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('DATA_REQUIRED');
    });

    test('should handle undefined input gracefully', () => {
      const result = validateJobData(undefined);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('DATA_REQUIRED');
    });

    test('should handle non-object input gracefully', () => {
      const result = validateJobData('not an object');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('DATA_REQUIRED');
    });

    test('should validate all department options', () => {
      DEPARTMENTS.forEach(department => {
        const job = {
          title: 'Test Position',
          department: department,
          type: 'full-time',
          location: 'Test Location',
          description: 'This is a test job description that meets the minimum length requirements.',
          requirements: 'These are test requirements that meet the minimum length requirements.'
        };

        const result = validateJobData(job);
        expect(result.isValid).toBe(true);
      });
    });

    test('should validate all employment type options', () => {
      EMPLOYMENT_TYPES.forEach(type => {
        const job = {
          title: 'Test Position',
          department: 'engineering',
          type: type,
          location: 'Test Location',
          description: 'This is a test job description that meets the minimum length requirements.',
          requirements: 'These are test requirements that meet the minimum length requirements.'
        };

        const result = validateJobData(job);
        expect(result.isValid).toBe(true);
      });
    });

  });

  describe('sanitizeJobInput', () => {

    test('should sanitize valid job input', () => {
      const input = {
        title: '  Senior Developer  ',
        department: 'engineering',
        type: 'full-time',
        location: '  San Francisco, CA  ',
        salary: '  $100k - $120k  ',
        description: '  Great opportunity to work on exciting projects.  ',
        requirements: '  Bachelor\'s degree and 3+ years experience.  '
      };

      const sanitized = sanitizeJobInput(input);
      
      expect(sanitized.title).toBe('Senior Developer');
      expect(sanitized.department).toBe('engineering');
      expect(sanitized.type).toBe('full-time');
      expect(sanitized.location).toBe('San Francisco, CA');
      expect(sanitized.salary).toBe('$100k - $120k');
      expect(sanitized.description).toBe('Great opportunity to work on exciting projects.');
      expect(sanitized.requirements).toBe('Bachelor\'s degree and 3+ years experience.');
    });

    test('should remove HTML tags from input', () => {
      const input = {
        title: 'Developer <script>alert("xss")</script>',
        department: 'engineering<>',
        type: 'full-time',
        location: 'San Francisco<br>',
        description: 'Great <b>opportunity</b> to work.',
        requirements: 'Bachelor\'s <i>degree</i> required.'
      };

      const sanitized = sanitizeJobInput(input);
      
      expect(sanitized.title).toBe('Developer scriptalert("xss")/script');
      expect(sanitized.department).toBe('engineering');
      expect(sanitized.location).toBe('San Franciscobr');
      expect(sanitized.description).toBe('Great bopportunity/b to work.');
      expect(sanitized.requirements).toBe('Bachelor\'s idegree/i required.');
    });

    test('should handle empty salary field', () => {
      const input = {
        title: 'Developer',
        department: 'engineering',
        type: 'full-time',
        location: 'Remote',
        salary: '',
        description: 'Great opportunity.',
        requirements: 'Experience required.'
      };

      const sanitized = sanitizeJobInput(input);
      expect(sanitized.salary).toBeUndefined();
    });

    test('should handle null salary field', () => {
      const input = {
        title: 'Developer',
        department: 'engineering',
        type: 'full-time',
        location: 'Remote',
        salary: null,
        description: 'Great opportunity.',
        requirements: 'Experience required.'
      };

      const sanitized = sanitizeJobInput(input);
      expect(sanitized.salary).toBeUndefined();
    });

    test('should handle non-string input fields', () => {
      const input = {
        title: 123,
        department: true,
        type: ['full-time'],
        location: { city: 'SF' },
        salary: 100000,
        description: null,
        requirements: undefined
      };

      const sanitized = sanitizeJobInput(input);
      
      expect(sanitized.title).toBe('');
      expect(sanitized.department).toBe('');
      expect(sanitized.type).toBe('');
      expect(sanitized.location).toBe('');
      expect(sanitized.salary).toBe('');
      expect(sanitized.description).toBe('');
      expect(sanitized.requirements).toBeUndefined();
    });

    test('should handle null input', () => {
      const sanitized = sanitizeJobInput(null);
      expect(sanitized).toEqual({});
    });

    test('should handle undefined input', () => {
      const sanitized = sanitizeJobInput(undefined);
      expect(sanitized).toEqual({});
    });

    test('should handle non-object input', () => {
      const sanitized = sanitizeJobInput('not an object');
      expect(sanitized).toEqual({});
    });

    test('should limit field lengths for security', () => {
      const longString = 'A'.repeat(2000);
      const veryLongString = 'A'.repeat(10000);
      
      const input = {
        title: longString,
        department: longString,
        type: longString,
        location: longString,
        salary: longString,
        description: veryLongString,
        requirements: veryLongString
      };

      const sanitized = sanitizeJobInput(input);
      
      // String fields limited to 1000 characters
      expect(sanitized.title.length).toBeLessThanOrEqual(1000);
      expect(sanitized.department.length).toBeLessThanOrEqual(1000);
      expect(sanitized.type.length).toBeLessThanOrEqual(1000);
      expect(sanitized.location.length).toBeLessThanOrEqual(1000);
      expect(sanitized.salary.length).toBeLessThanOrEqual(1000);
      
      // Text fields limited to 5000 characters
      expect(sanitized.description.length).toBeLessThanOrEqual(5000);
      expect(sanitized.requirements.length).toBeLessThanOrEqual(5000);
    });

  });

  describe('isValidJobStatus', () => {

    test('should validate active status', () => {
      expect(isValidJobStatus('active')).toBe(true);
    });

    test('should validate inactive status', () => {
      expect(isValidJobStatus('inactive')).toBe(true);
    });

    test('should validate closed status', () => {
      expect(isValidJobStatus('closed')).toBe(true);
    });

    test('should reject invalid status', () => {
      expect(isValidJobStatus('invalid')).toBe(false);
      expect(isValidJobStatus('pending')).toBe(false);
      expect(isValidJobStatus('')).toBe(false);
      expect(isValidJobStatus(null)).toBe(false);
      expect(isValidJobStatus(undefined)).toBe(false);
    });

  });

  describe('getFieldValidationRules', () => {

    test('should return rules for valid fields', () => {
      const titleRules = getFieldValidationRules('title');
      expect(titleRules).toBeDefined();
      expect(titleRules.required).toBe(true);
      expect(titleRules.minLength).toBe(3);
      expect(titleRules.maxLength).toBe(100);
    });

    test('should return null for invalid fields', () => {
      const invalidRules = getFieldValidationRules('invalidField');
      expect(invalidRules).toBeNull();
    });

    test('should return correct rules for all fields', () => {
      const fields = ['title', 'department', 'type', 'location', 'salary', 'description', 'requirements'];
      
      fields.forEach(field => {
        const rules = getFieldValidationRules(field);
        expect(rules).toBeDefined();
        expect(typeof rules.required).toBe('boolean');
      });
    });

  });

});