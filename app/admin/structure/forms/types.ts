export type FormFieldType = 
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'star-rating';

export interface FormField {
  id: string;
  name: string;
  type: FormFieldType;
  description?: string;
  required: boolean;
  placeholder?: string;
  defaultValue?: any;
}

export interface Form {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  createdAt: Date;
  updatedAt: Date;
}
