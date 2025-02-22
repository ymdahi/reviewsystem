'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Star, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  const [submitted, setSubmitted] = useState(false);
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [selectedBuilder, setSelectedBuilder] = useState('');
  const [isBuilderLocked, setIsBuilderLocked] = useState(false);
  const [comment, setComment] = useState('');
  const [ratings, setRatings] = useState({
    build_quality: 0,
    material_quality: 0,
    bathrooms: 0,
    bedrooms: 0,
    kitchen: 0,
    exterior: 0,
    windows_doors: 0,
    electrical: 0,
    plumbing: 0,
  });
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>(
    {}
  );

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

  useEffect(() => {
    if (submitted) {
      const errors = [];
      if (!selectedBuilder) {
        errors.push('Please select a builder');
      }
      if (!Object.values(ratings).every(rating => rating > 0)) {
        errors.push('Please provide ratings for all categories');
      }
      if (!comment.trim()) {
        errors.push('Please provide an overall comment');
      }
      setError(errors.join('. '));
    }
  }, [ratings, selectedBuilder, comment, submitted]);

  const handleRatingChange = (category: string, value: number) => {
    setRatings((prev) => ({
      ...prev,
      [category]: value,
    }));
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    if (newPhotos.length + newFiles.length > 5) {
      setError('Maximum 5 photos allowed');
      return;
    }

    // Check file sizes
    for (const file of newFiles) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Each photo must be under 5MB');
        return;
      }
    }

    setNewPhotos((prev) => [...prev, ...newFiles]);
    setError('');
  };

  const removeNewPhoto = (index: number) => {
    setNewPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadPhoto = async (file: File, builderId: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('builderId', builderId);

    const response = await fetch('/api/uploads', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload photo');
    }

    const data = await response.json();
    return data.path;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    // Validate all required fields
    const errors = [];
    if (!selectedBuilder) {
      errors.push('Please select a builder');
    }
    if (!Object.values(ratings).every(rating => rating > 0)) {
      errors.push('Please provide ratings for all categories');
    }
    if (!comment.trim()) {
      errors.push('Please provide an overall comment');
    }

    if (errors.length > 0) {
      setError(errors.join('. '));
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      // Upload photos
      const uploadedPhotos: string[] = [];
      for (let i = 0; i < newPhotos.length; i++) {
        try {
          setUploadProgress(prev => ({ ...prev, [i]: 0 }));
          const path = await uploadPhoto(newPhotos[i], selectedBuilder);
          if (path) {
            uploadedPhotos.push(path);
          }
          setUploadProgress(prev => ({ ...prev, [i]: 100 }));
        } catch (error) {
          console.error('Error uploading photo:', error);
          setError('Failed to upload one or more photos');
          setIsSaving(false);
          return;
        }
      }

      // Create review
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          builderId: selectedBuilder,
          buildQuality: ratings.build_quality,
          materialQuality: ratings.material_quality,
          bathrooms: ratings.bathrooms,
          bedrooms: ratings.bedrooms,
          kitchen: ratings.kitchen,
          exterior: ratings.exterior,
          windowsDoors: ratings.windows_doors,
          electrical: ratings.electrical,
          plumbing: ratings.plumbing,
          overallComment: comment,
          photos: uploadedPhotos,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create review');
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to create review');
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

  const ratingCategories = [
    { key: 'build_quality', label: 'Build Quality' },
    { key: 'material_quality', label: 'Material Quality' },
    { key: 'bathrooms', label: 'Bathrooms' },
    { key: 'bedrooms', label: 'Bedrooms' },
    { key: 'kitchen', label: 'Kitchen' },
    { key: 'exterior', label: 'Exterior' },
    { key: 'windows_doors', label: 'Windows & Doors' },
    { key: 'electrical', label: 'Electrical' },
    { key: 'plumbing', label: 'Plumbing' },
  ];

  // Calculate average rating
  const averageRating = Object.values(ratings).reduce((sum, rating) => sum + rating, 0) / Object.values(ratings).length;
  const displayRating = averageRating === 0 ? '-' : averageRating.toFixed(1);

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-3xl font-bold mb-8">New Review</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
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
              <SelectTrigger className={submitted && !selectedBuilder ? 'border-red-500 bg-red-50' : ''}>
                <SelectValue placeholder="Select a builder" />
              </SelectTrigger>
              <SelectContent>
                {builders.map((builder) => (
                  <SelectItem key={builder.id} value={builder.id}>
                    {builder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {submitted && !selectedBuilder && (
              <p className="text-sm text-red-500 mt-2">Required</p>
            )}
          </CardContent>
        </Card>

        {/* Ratings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Ratings</CardTitle>
              <CardDescription>
                Rate each category from 1 (poor) to 5 (excellent)
              </CardDescription>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                <span className="text-2xl font-bold">{displayRating}</span>
              </div>
              <span className="text-sm text-gray-500">total score</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {ratingCategories.map(({ key, label }) => {
                const rating = ratings[key as keyof typeof ratings];
                const isInvalid = submitted && rating === 0;
                
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className={isInvalid ? 'text-red-500' : ''}>
                        {label}
                        <span className="text-red-500 ml-1">*</span>
                      </Label>
                      {isInvalid && (
                        <span className="text-sm text-red-500">Required</span>
                      )}
                    </div>
                    <div className={`flex items-center gap-1 p-2 rounded-md ${
                      isInvalid ? 'bg-red-50 border border-red-200' : ''
                    }`}>
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleRatingChange(key, value)}
                          className="p-1 focus:outline-none"
                        >
                          <Star
                            className={`h-6 w-6 ${
                              value <= rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : isInvalid 
                                  ? 'text-red-200'
                                  : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            {submitted && !Object.values(ratings).every(rating => rating > 0) && (
              <p className="mt-4 text-sm text-red-500">
                Please rate all categories before submitting
              </p>
            )}
          </CardContent>
        </Card>

        {/* Photos */}
        <Card>
          <CardHeader>
            <CardTitle>Photos (Optional)</CardTitle>
            <CardDescription>
              Add up to 5 photos of the builder's work. Each photo must be under 5MB.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* New Photos */}
                {newPhotos.map((photo, index) => (
                  <div
                    key={`new-${index}`}
                    className="relative aspect-square border rounded-lg overflow-hidden"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Upload preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewPhoto(index)}
                      className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/75 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    {uploadProgress[index] !== undefined && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10">
                        <div
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${uploadProgress[index]}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}

                {/* Upload Button */}
                {newPhotos.length < 5 && (
                  <label className="relative aspect-square border-2 border-dashed rounded-lg hover:border-gray-400 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoSelect}
                      className="sr-only"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-500">
                      <Upload className="h-8 w-8" />
                      <span className="text-sm text-center px-2">
                        Click to add photos
                      </span>
                    </div>
                  </label>
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

        {/* Comment */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Comment</CardTitle>
            <CardDescription>
              Share your overall experience with this builder
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className={submitted && !comment.trim() ? 'text-red-500' : ''}>
                  Comment
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                {submitted && !comment.trim() && (
                  <span className="text-sm text-red-500">Required</span>
                )}
              </div>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={5}
                placeholder="Share your experience with this builder..."
                className={submitted && !comment.trim() ? 'border-red-500 bg-red-50' : ''}
              />
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
            type="submit"
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
      </form>
    </div>
  );
}
