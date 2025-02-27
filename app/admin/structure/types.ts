export type FieldType = 
  | 'text'
  | 'number'
  | 'date'
  | 'boolean'
  | 'file'
  | 'relation'
  | 'select'
  | 'email'
  | 'url';

export interface ValidationRule {
  type: string;
  value: any;
  message: string;
}

export interface EntityField {
  id: string;
  name: string;
  type: FieldType;
  description?: string;
  required: boolean;
  defaultValue?: any;
  placeholder?: string;
  validationRules?: ValidationRule[];
  options?: { label: string; value: any }[];
  relation?: {
    entityId: string;
    displayField: string;
  };
}

export interface Entity {
  id: string;
  name: string;
  description?: string;
  fields: EntityField[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EntityRecord {
  id: string;
  entityId: string;
  data: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
