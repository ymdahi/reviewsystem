'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ReviewForm } from '@/components/review-form';

interface Builder {
  id: string;
  name: string;
}

export default function NewReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [selectedBuilder, setSelectedBuilder] = useState('');
  const [isBuilderLocked, setIsBuilderLocked] = useState(false);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/builders');
        if (!response.ok) {
          throw new Error('Failed to fetch builders');
        }
        const data = await response.json();
        setBuilders(data.builders);

        // Check for builder ID in URL and pre-select if found
        const builderId = searchParams.get('builder');
        if (builderId) {
          const builderExists = data.builders.some(
            (builder: Builder) => builder.id === builderId
          );
          if (builderExists) {
            setSelectedBuilder(builderId);
            setIsBuilderLocked(true);
          }
        }
      } catch (error) {
        console.error('Error:', error);
        setError('Failed to load builders');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [searchParams]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (newPhotos.length + files.length > 5) {
        setError('Maximum 5 photos allowed');
        return;
      }

      // Check file sizes
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          setError('Each photo must be under 5MB');
          return;
        }
      }

      setNewPhotos(prev => [...prev, ...files]);
      setError('');
    }
  };

  const removePhoto = (index: number) => {
    setNewPhotos(photos => photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (reviewData: Record<string, any>) => {
    if (!selectedBuilder) {
      setError('Please select a builder');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      // First, create the review
      const reviewResponse = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          builderId: selectedBuilder,
          ...reviewData
        }),
      });

      if (!reviewResponse.ok) {
        throw new Error('Failed to submit review');
      }

      const { reviewId } = await reviewResponse.json();

      // Then upload photos if any
      if (newPhotos.length > 0) {
        for (let i = 0; i < newPhotos.length; i++) {
          const formData = new FormData();
          formData.append('photo', newPhotos[i]);
          formData.append('reviewId', reviewId);

          const uploadResponse = await fetch('/api/reviews/photos', {
            method: 'POST',
            body: formData,
          });

          if (!uploadResponse.ok) {
            throw new Error('Failed to upload photos');
          }

          setUploadProgress(prev => ({
            ...prev,
            [i]: 100
          }));
        }
      }

      router.push(`/reviews/${reviewId}`);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to submit review');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-2xl py-8">
        <h1 className="text-3xl font-bold mb-8">New Review</h1>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-3xl font-bold mb-8">New Review</h1>

      <form className="space-y-8">
        {/* Builder Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Builder</CardTitle>
            <CardDescription>
              Select the builder you want to review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedBuilder}
              onValueChange={setSelectedBuilder}
              disabled={isBuilderLocked}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a builder" />
              </SelectTrigger>
              <SelectContent>
                {builders.map((builder) => (
                  <SelectItem key={builder.id} value={builder.id}>
                    {builder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedBuilder && (
          <>
            {/* Review Form */}
            <Card>
              <CardHeader>
                <CardTitle>Rating & Comments</CardTitle>
                <CardDescription>
                  Rate each category and provide your feedback
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReviewForm
                  onSubmit={handleSubmit}
                  isSubmitting={isSaving}
                  submitLabel="Submit Review"
                  showSubmitButton={false}
                />
              </CardContent>
            </Card>

            {/* Photos */}
            <Card>
              <CardHeader>
                <CardTitle>Photos</CardTitle>
                <CardDescription>
                  Add photos of the builder's work (optional). Max 5MB per photo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {/* New Photos */}
                    {newPhotos.map((photo, index) => (
                      <div
                        key={index}
                        className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100"
                      >
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Preview ${index + 1}`}
                          className="object-cover w-full h-full"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 p-1 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        {uploadProgress[index] !== undefined && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                            <div
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${uploadProgress[index]}%` }}
                            />
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Upload Button */}
                    {newPhotos.length < 5 && (
                      <div className="relative aspect-square">
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg hover:border-gray-400 transition-colors cursor-pointer">
                          <Upload className="h-8 w-8 text-gray-400" />
                          <div className="text-sm text-gray-600">
                            <label className="relative cursor-pointer font-medium text-primary hover:text-primary/80">
                              <span>Upload files</span>
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="sr-only"
                                onChange={handlePhotoChange}
                              />
                            </label>
                          </div>
                          <p className="text-xs text-gray-500">
                            PNG, JPG up to 5MB each
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {newPhotos.length > 0 && (
                    <p className="text-sm text-gray-500">
                      {newPhotos.length} of 5 photos selected
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex items-center gap-4">
              <Button
                type="button"
                onClick={() => handleSubmit}
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving ? 'Saving...' : 'Submit Review'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard')}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
