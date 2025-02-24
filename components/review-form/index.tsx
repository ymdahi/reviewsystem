'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ReviewField } from '@/lib/review-schema';

interface ReviewFormProps {
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  showSubmitButton?: boolean;
}

export function ReviewForm({ 
  initialValues = {}, 
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Submit Review',
  showSubmitButton = true
}: ReviewFormProps) {
  const [fields, setFields] = useState<ReviewField[]>([]);
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFields() {
      try {
        const response = await fetch('/api/review-schema');
        if (!response.ok) throw new Error('Failed to fetch review fields');
        const data = await response.json();
        setFields(data.fields);
      } catch (error) {
        console.error('Error fetching review fields:', error);
        setError('Failed to load review form structure');
      } finally {
        setIsLoading(false);
      }
    }

    fetchFields();
  }, []);

  const handleChange = (name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const missingFields = fields
      .filter(field => field.required && !values[field.name])
      .map(field => field.label);

    if (missingFields.length > 0) {
      setError(`Please provide values for: ${missingFields.join(', ')}`);
      return;
    }

    onSubmit(values);
  };

  if (isLoading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        {error}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {fields
          .sort((a, b) => a.order - b.order)
          .map((field) => {
            const value = field.type === 'number' 
              ? (values[field.name] || 0)
              : (values[field.name] || '');
            
            if (field.type === 'number') {
              return (
                <div key={field.id} className="space-y-2">
                  <Label>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => handleChange(field.name, rating)}
                        className="p-1 focus:outline-none"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            rating <= value
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              );
            }

            if (field.type === 'textarea') {
              return (
                <div key={field.id} className="space-y-2 sm:col-span-2">
                  <Label>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  <Textarea
                    value={value}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    rows={5}
                    placeholder={`Enter your ${field.label.toLowerCase()}...`}
                  />
                </div>
              );
            }

            return null;
          })}
      </div>

      {showSubmitButton && (
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Submitting...' : submitLabel}
        </Button>
      )}
    </form>
  );
}
