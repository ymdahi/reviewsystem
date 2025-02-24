'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ReviewForm } from '@/components/review-form';
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

interface Review {
  id: string;
  builderId: string;
  builderName: string;
  builderLogo: string | null;
  images: string[];
  [key: string]: any;
}

export default function EditReviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [review, setReview] = useState<Review | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    async function fetchReview() {
      try {
        const response = await fetch(`/api/reviews/${params.id}`);
        if (!response.ok) {
          if (response.status === 404) {
            router.push('/404');
            return;
          }
          throw new Error('Failed to fetch review');
        }
        const data = await response.json();
        setReview(data.review);
        setExistingImages(Array.isArray(data.review.images) ? data.review.images : []);
      } catch (error) {
        console.error('Error:', error);
        setError('Failed to load review');
      } finally {
        setIsLoading(false);
      }
    }

    fetchReview();
  }, [params.id, router]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (existingImages.length + newPhotos.length + files.length > 5) {
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

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewPhoto = (index: number) => {
    setNewPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (reviewData: Record<string, any>) => {
    setIsSaving(true);
    setError('');

    try {
      // First update the review data
      const reviewResponse = await fetch(`/api/reviews/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reviewData,
          images: existingImages
        }),
      });

      if (!reviewResponse.ok) {
        throw new Error('Failed to update review');
      }

      // Then upload any new photos
      if (newPhotos.length > 0) {
        for (let i = 0; i < newPhotos.length; i++) {
          const formData = new FormData();
          formData.append('photo', newPhotos[i]);
          formData.append('reviewId', params.id);

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

      router.push(`/reviews/${params.id}`);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to update review');
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
        throw new Error('Failed to delete review');
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to delete review');
    } finally {
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

  const totalPhotos = existingImages.length + newPhotos.length;

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-3xl font-bold mb-8">Edit Review</h1>

      <form className="space-y-8">
        {/* Builder Info */}
        <Card>
          <CardHeader>
            <CardTitle>Builder</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 border rounded-lg bg-gray-50">
              <div className="font-medium">{review.builderName}</div>
            </div>
          </CardContent>
        </Card>

        {/* Review Form */}
        <Card>
          <CardHeader>
            <CardTitle>Rating & Comments</CardTitle>
            <CardDescription>
              Update your ratings and feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReviewForm
              initialValues={review}
              onSubmit={handleSubmit}
              isSubmitting={isSaving}
              submitLabel="Save Changes"
              showSubmitButton={false}
            />
          </CardContent>
        </Card>

        {/* Photos */}
        <Card>
          <CardHeader>
            <CardTitle>Photos</CardTitle>
            <CardDescription>
              Add or remove photos of the builder's work. Max 5MB per photo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Existing Images */}
                {existingImages.map((image, index) => (
                  <div
                    key={`existing-${index}`}
                    className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100"
                  >
                    <img
                      src={image}
                      alt={`Review photo ${index + 1}`}
                      className="object-cover w-full h-full"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(index)}
                      className="absolute top-1 right-1 p-1 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                {/* New Photos */}
                {newPhotos.map((photo, index) => (
                  <div
                    key={`new-${index}`}
                    className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100"
                  >
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Upload preview ${index + 1}`}
                      className="object-cover w-full h-full"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewPhoto(index)}
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
                {totalPhotos < 5 && (
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

              {totalPhotos > 0 && (
                <p className="text-sm text-gray-500">
                  {totalPhotos} of 5 photos selected
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
            onClick={() => handleSubmit(review)}
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
