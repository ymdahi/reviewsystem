import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Star, Building2, MapPin, Globe, Phone, Mail, Check, X, ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toBuilderSlug } from '@/lib/utils';

interface User {
  id: string;
  email: string;
  role: string;
}

interface ReviewModalProps {
  review: {
    id: string;
    user_id: string;
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
    created_at: string;
    builder_id: string;
    builder_name: string;
    builder_logo: string | null;
    builder_location: string | null;
    builder_website: string | null;
    builder_phone: string | null;
    builder_email: string | null;
    builder_is_verified: boolean;
    images: string[];
  } | null;
  onClose: () => void;
}

const ratingCategories = [
  { id: 'build_quality', label: 'Build Quality' },
  { id: 'material_quality', label: 'Material Quality' },
  { id: 'bathrooms', label: 'Bathrooms' },
  { id: 'bedrooms', label: 'Bedrooms' },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'exterior', label: 'Exterior' },
  { id: 'windows_doors', label: 'Windows & Doors' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'plumbing', label: 'Plumbing' },
];

export function ReviewModal({ review, onClose }: ReviewModalProps) {
  if (!review) return null;

  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.user);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    }
    fetchUser();
  }, []);

  const calculateAverageRating = () => {
    return (
      (review.build_quality +
        review.material_quality +
        review.bathrooms +
        review.bedrooms +
        review.kitchen +
        review.exterior +
        review.windows_doors +
        review.electrical +
        review.plumbing) /
      9
    );
  };

  return (
    <Dialog open={!!review} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Details</DialogTitle>
        </DialogHeader>

        {/* Builder Info */}
        <div className="flex items-start gap-4 border-b pb-4">
          {review.builder_logo ? (
            <div className="relative w-16 h-16 flex-shrink-0">
              <Image
                src={review.builder_logo}
                alt={review.builder_name}
                fill
                className="object-contain"
              />
            </div>
          ) : (
            <Building2 className="h-16 w-16 text-gray-400" />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Link 
                href={`/builders/${toBuilderSlug(review.builder_name)}`}
                className="hover:text-blue-600 transition-colors"
              >
                <h2 className="text-xl font-semibold">{review.builder_name}</h2>
              </Link>
              {review.builder_is_verified && (
                <Check className="h-5 w-5 text-green-500" />
              )}
            </div>
            {review.builder_location && (
              <div className="flex items-center gap-2 text-gray-600 mt-1">
                <MapPin className="h-4 w-4" />
                <span>{review.builder_location}</span>
              </div>
            )}
            <div className="flex items-center gap-4 mt-2">
              {review.builder_website && (
                <Link
                  href={review.builder_website}
                  target="_blank"
                  className="flex items-center gap-1 text-blue-600 hover:underline text-sm"
                >
                  <Globe className="h-4 w-4" />
                  Website
                </Link>
              )}
              {review.builder_phone && (
                <Link
                  href={`tel:${review.builder_phone}`}
                  className="flex items-center gap-1 text-blue-600 hover:underline text-sm"
                >
                  <Phone className="h-4 w-4" />
                  {review.builder_phone}
                </Link>
              )}
              {review.builder_email && (
                <Link
                  href={`mailto:${review.builder_email}`}
                  className="flex items-center gap-1 text-blue-600 hover:underline text-sm"
                >
                  <Mail className="h-4 w-4" />
                  {review.builder_email}
                </Link>
              )}
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-1 text-2xl font-bold">
              <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
              {calculateAverageRating().toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">
              {new Date(review.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Review Content */}
        <div className="space-y-6 py-4">
          {/* Rating Categories */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {ratingCategories.map((category) => (
              <div
                key={category.id}
                className="bg-gray-50 p-3 rounded-lg"
              >
                <div className="text-sm text-gray-600">{category.label}</div>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">
                    {review[category.id as keyof typeof review]}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Overall Comment */}
          <div>
            <h3 className="font-medium mb-2">Overall Comment</h3>
            <p className="text-gray-700 whitespace-pre-wrap">
              {review.overall_comment}
            </p>
          </div>

          {/* Images */}
          {review.images.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Photos</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {review.images.map((image, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden"
                  >
                    <Image
                      src={image}
                      alt={`Review photo ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            {currentUser && review && (currentUser.id === review.user_id || currentUser.role === 'ADMIN') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  router.push(`/reviews/${review.id}/edit`);
                }}
                className="flex items-center gap-2"
              >
                <Pencil className="h-4 w-4" />
                Edit Review
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
