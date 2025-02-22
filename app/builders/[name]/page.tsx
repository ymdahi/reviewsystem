'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { notFound, useRouter } from 'next/navigation';
import { Star, MapPin, Globe, Phone, Mail, Check, PenLine, EyeOff } from 'lucide-react';
import { toBuilderSlug } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ReviewModal } from '@/components/review-modal';

interface PageProps {
  params: {
    name: string;
  };
}

interface Builder {
  id: string;
  name: string;
  logo: string | null;
  location: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  description: string | null;
  average_rating: number | null;
  total_reviews: number;
  is_verified: boolean;
  is_published: boolean;
  is_featured: boolean;
}

interface Review {
  id: string;
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
  reviewer_name: string;
  image_urls: string[];
}

interface BuilderData {
  builder: Builder;
  reviews: Review[];
  images: { url: string }[];
}

export default function BuilderProfilePage({ params }: PageProps) {
  const [builderData, setBuilderData] = useState<BuilderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function checkAdmin() {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.user.role === 'ADMIN');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    }
    checkAdmin();
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        // Get all builders to find a match by slug
        const buildersResponse = await fetch('/api/builders');
        if (!buildersResponse.ok) {
          throw new Error('Failed to fetch builders');
        }
        const buildersData = await buildersResponse.json();
        
        // Find the builder whose name matches our slug
        const matchedBuilder = buildersData.builders.find(
          (b: Builder) => toBuilderSlug(b.name) === params.name
        );

        if (!matchedBuilder) {
          throw new Error('Builder not found');
        }

        // Fetch builder details, reviews, and images
        const detailsResponse = await fetch(`/api/builders/${matchedBuilder.id}`);
        if (!detailsResponse.ok) {
          throw new Error('Failed to fetch builder details');
        }
        
        const data = await detailsResponse.json();
        setBuilderData(data);
        console.log(data);
        
      } catch (error) {
        console.error('Error:', error);
        notFound();
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [params.name]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!builderData) {
    notFound();
  }

  // Show unpublished notice for admin
  const UnpublishedNotice = () => {
    if (isAdmin && !builderData.builder.is_published) {
      return (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <EyeOff className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                This builder profile is currently unpublished and is only visible to administrators.
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const { builder, reviews, images } = builderData;

  const calculateAverageRating = (review: Review) => {
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

  // Enhance review data with builder info for the modal
  const getReviewWithBuilderInfo = (review: Review) => {
    return {
      ...review,
      builder_id: builder.id,
      builder_name: builder.name,
      builder_logo: builder.logo,
      builder_location: builder.location,
      builder_website: builder.website,
      builder_phone: builder.phone,
      builder_email: builder.email,
      builder_is_verified: builder.is_verified,
      images: review.image_urls,
    };
  };

  return (
    <div className="container py-8">
      <UnpublishedNotice />
      {/* Builder Header */}
      <div className="flex items-start gap-6 mb-8">
        {builder.logo ? (
          <div className="relative w-32 h-32 flex-shrink-0">
            <Image
              src={builder.logo}
              alt={builder.name}
              fill
              className="object-contain"
            />
          </div>
        ) : (
          <div className="w-32 h-32 bg-gray-100 flex items-center justify-center rounded-lg">
            <span className="text-4xl font-bold text-gray-400">
              {builder.name.charAt(0)}
            </span>
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{builder.name}</h1>
            {builder.is_verified && (
              <Check className="h-6 w-6 text-green-500" />
            )}
          </div>
          {builder.location && (
            <div className="flex items-center gap-2 text-gray-600 mt-2">
              <MapPin className="h-5 w-5" />
              <span>{builder.location}</span>
            </div>
          )}
          {builder.description && (
            <p className="text-gray-700 mt-2">{builder.description}</p>
          )}
          <div className="flex items-center gap-6 mt-4">
            {builder.website && (
              <a
                href={builder.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:underline"
              >
                <Globe className="h-5 w-5" />
                Website
              </a>
            )}
            {builder.phone && (
              <a
                href={`tel:${builder.phone}`}
                className="flex items-center gap-2 text-blue-600 hover:underline"
              >
                <Phone className="h-5 w-5" />
                {builder.phone}
              </a>
            )}
            {builder.email && (
              <a
                href={`mailto:${builder.email}`}
                className="flex items-center gap-2 text-blue-600 hover:underline"
              >
                <Mail className="h-5 w-5" />
                {builder.email}
              </a>
            )}
          </div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold flex items-center gap-2">
            <Star className="h-8 w-8 fill-yellow-400 text-yellow-400" />
            {builder.average_rating?.toFixed(1) || 'N/A'}
          </div>
          <div className="text-gray-600 mt-1 mb-3">
            {builder.total_reviews} {builder.total_reviews === 1 ? 'Review' : 'Reviews'}
          </div>
          <Button
            onClick={() => router.push(`/new/review?builder=${builder.id}`)}
            className="w-full"
          >
            <PenLine className="h-4 w-4 mr-2" />
            Write Review
          </Button>
        </div>
      </div>

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Gallery</h2>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {images.map((image, index) => (
              <div
                key={index}
                className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
              >
                <Image
                  src={image.url}
                  alt={`${builder.name} project ${index + 1}`}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews and Q&A Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        {/* Reviews Column */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Reviews</h2>
          {reviews.length === 0 ? (
            <div className="text-gray-500">No reviews yet</div>
          ) : (
            reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-lg shadow-sm p-6 mb-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedReview(review)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">
                      {review.reviewer_name || 'Anonymous'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star
                      className="h-5 w-5 text-yellow-400 fill-yellow-400"
                      aria-hidden="true"
                    />
                    <span className="font-medium">
                      {calculateAverageRating(review).toFixed(1)}
                    </span>
                  </div>
                </div>

                

                <div className="mt-4 text-gray-600">
                  {review.overall_comment.length > 150
                    ? `${review.overall_comment.slice(0, 150)}...`
                    : review.overall_comment}
                </div>

                {/* Review Images */}
                {review.image_urls.length > 0 && (
                  <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                    {review.image_urls.map((url, index) => (
                      <div
                        key={`${review.id}-${index}`}
                        className="relative flex-shrink-0 w-12 h-12 rounded-md overflow-hidden"
                      >
                        <Image
                          src={url}
                          alt={`Review image ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Questions and Answers Column */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Questions & Answers</h2>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-gray-500">Coming soon...</p>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <ReviewModal
        review={selectedReview ? getReviewWithBuilderInfo(selectedReview) : null}
        onClose={() => setSelectedReview(null)}
      />
    </div>
  );
}
