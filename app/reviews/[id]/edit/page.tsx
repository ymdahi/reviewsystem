'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ReviewData {
  id: string;
  builder_id: string;
  builder_name: string;
  builder_logo: string | null;
  build_quality: number;
  material_quality: number;
  bathrooms: number;
  bedrooms: number;
  kitchen: number;
  exterior: number;
  windows_doors: number;
  electrical: number;
  plumbing: number;
  overall_comment: string;
  images: string[];
}

interface PageProps {
  params: {
    id: string;
  };
}

export default function EditReviewPage({ params }: PageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [review, setReview] = useState<ReviewData | null>(null);
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
  const [comment, setComment] = useState('');
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchReview() {
      try {
        const response = await fetch(`/api/reviews/${params.id}`);
        if (response.status === 401) {
          router.push('/auth/login');
          return;
        }
        if (response.status === 403) {
          router.push('/dashboard');
          return;
        }
        if (!response.ok) {
          throw new Error('Failed to fetch review');
        }

        const data = await response.json();
        console.log('Fetched review data:', data);
        
        if (!data.review) {
          throw new Error('Review data is missing');
        }

        setReview(data.review);
        setRatings({
          build_quality: data.review.build_quality,
          material_quality: data.review.material_quality,
          bathrooms: data.review.bathrooms,
          bedrooms: data.review.bedrooms,
          kitchen: data.review.kitchen,
          exterior: data.review.exterior,
          windows_doors: data.review.windows_doors,
          electrical: data.review.electrical,
          plumbing: data.review.plumbing,
        });
        setComment(data.review.overall_comment);
        setExistingImages(Array.isArray(data.review.images) ? data.review.images : []);
      } catch (error) {
        console.error('Error fetching review:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch review');
        router.push('/dashboard');
      } finally {
        setIsLoading(false);
      }
    }

    fetchReview();
  }, [params.id, router]);

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
    if (existingImages.length + newPhotos.length + newFiles.length > 5) {
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

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
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
    if (!review) return;

    setIsSaving(true);
    setError('');

    try {
      // Upload new photos
      const uploadedPhotos: string[] = [];
      for (let i = 0; i < newPhotos.length; i++) {
        try {
          setUploadProgress(prev => ({ ...prev, [i]: 0 }));
          const path = await uploadPhoto(newPhotos[i], review.builder_id);
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

      // Combine existing and new photos, filtering out any empty values
      const allPhotos = [...existingImages, ...uploadedPhotos].filter(url => url && url.trim());

      console.log('Saving review with photos:', allPhotos);

      // Update review
      const response = await fetch(`/api/reviews/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...ratings,
          overall_comment: comment,
          images: allPhotos,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update review');
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to update review');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError('');

    try {
      const response = await fetch(`/api/reviews/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete review');
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete review');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-2xl py-8">
        <h1 className="text-3xl font-bold mb-8">Edit Review</h1>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="container max-w-2xl py-8">
        <h1 className="text-3xl font-bold mb-8">Edit Review</h1>
        <div className="text-center p-8">
          <p className="text-gray-600">Review not found.</p>
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

  const totalPhotos = (existingImages || []).length + newPhotos.length;

  // Calculate average rating
  const averageRating = Object.values(ratings).reduce((sum, rating) => sum + rating, 0) / Object.values(ratings).length;
  const displayRating = averageRating === 0 ? '-' : averageRating.toFixed(1);


  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-3xl font-bold mb-8">Edit Review</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Builder Info */}
        <Card>
          <CardHeader>
            <CardTitle>Builder</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 border rounded-lg bg-gray-50">
              <div className="font-medium">{review.builder_name}</div>
            </div>
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
              {ratingCategories.map(({ key, label }) => (
                <div key={key} className="space-y-2">
                  <Label>{label}</Label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          handleRatingChange(key, value)
                        }
                        className="p-1 focus:outline-none"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            value <= ratings[key as keyof typeof ratings]
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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
                {/* Existing Images */}
                {(existingImages || []).map((image, index) => (
                  <div
                    key={`existing-${index}`}
                    className="relative aspect-square border rounded-lg overflow-hidden"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image}
                      alt={`Review photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(index)}
                      className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/75 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}

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
                {totalPhotos < 5 && (
                  <label className="relative aspect-square border-2 border-dashed rounded-lg hover:border-gray-400 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoSelect}
                      className="sr-only"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                      <Upload className="h-8 w-8 mb-2" />
                      <span className="text-sm">Add Photo</span>
                    </div>
                  </label>
                )}
              </div>
              <p className="text-sm text-gray-500">
                Supported formats: JPEG, PNG, WebP. Maximum 5 photos.
              </p>
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
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              placeholder="Share your experience with this builder..."
            />
          </CardContent>
        </Card>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <div className="flex items-center gap-4">
          <Button
            type="submit"
            disabled={isSaving || isDeleting}
            className="flex-1"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
                disabled={isSaving || isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Review'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your
                  review and all associated photos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard')}
            disabled={isSaving || isDeleting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
