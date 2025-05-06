
// Form field validation utility
export type ValidationRules = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  email?: boolean;
};

export type ValidationError = string | null;

export const validateField = (
  value: any,
  rules: ValidationRules,
  fieldName: string
): ValidationError => {
  // Normalize field name for error messages
  const displayName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);

  // Check if field is required
  if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return `${displayName} is required`;
  }

  // Skip other validations if empty and not required
  if (!value && !rules.required) {
    return null;
  }

  // Validate based on type
  if (typeof value === 'string') {
    // Check min length
    if (rules.minLength && value.length < rules.minLength) {
      return `${displayName} must be at least ${rules.minLength} characters`;
    }

    // Check max length
    if (rules.maxLength && value.length > rules.maxLength) {
      return `${displayName} cannot exceed ${rules.maxLength} characters`;
    }

    // Check pattern (like email format)
    if (rules.pattern && !rules.pattern.test(value)) {
      return `${displayName} has an invalid format`;
    }

    // Email validation
    if (rules.email && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
      return `${displayName} must be a valid email address`;
    }
  }

  // Number validation
  if (typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)))) {
    const numValue = Number(value);
    
    // Check min value
    if (rules.min !== undefined && numValue < rules.min) {
      return `${displayName} must be at least ${rules.min}`;
    }
    
    // Check max value
    if (rules.max !== undefined && numValue > rules.max) {
      return `${displayName} cannot exceed ${rules.max}`;
    }
  }

  return null; // No validation errors
};

// Validate entire form
export const validateForm = (
  formData: Record<string, any>,
  validationRules: Record<string, ValidationRules>
): Record<string, ValidationError> => {
  const errors: Record<string, ValidationError> = {};
  
  Object.entries(validationRules).forEach(([field, rules]) => {
    const error = validateField(formData[field], rules, field);
    if (error) {
      errors[field] = error;
    }
  });
  
  return errors;
};
