'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Home, Star, Building2, Settings, Camera, User2 } from 'lucide-react';
import { ReviewModal } from "@/components/review-modal";
import { toBuilderSlug } from '@/lib/utils';

interface User {
  id: string;
  email: string;
  role: 'HOMEOWNER' | 'BUILDER' | 'ADMIN';
  full_name: string | null;
}

interface Review {
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
  user_name: string;
}

interface DashboardStats {
  totalBuilders: number;
  totalReviews: number;
  totalUsers: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalBuilders: 0,
    totalReviews: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch user data
        const userResponse = await fetch('/api/auth/me');
        if (!userResponse.ok) {
          throw new Error('Not authenticated');
        }
        const userData = await userResponse.json();
        setUser(userData.user);

        // If admin, fetch dashboard stats
        if (userData.user.role === 'ADMIN') {
          const statsResponse = await fetch('/api/admin/stats');
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            setStats(statsData);
          }
        }

        // Fetch user's reviews
        const reviewsResponse = await fetch('/api/user/reviews');
        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json();
          setReviews(reviewsData.reviews);
        }
      } catch (error) {
        console.error('Error:', error);
        router.push('/auth/login');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

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

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Admin Cards */}
      {user.role === 'ADMIN' && (
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Builders
              </CardTitle>
              <CardDescription>Manage all builders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">{stats.totalBuilders}</div>
              <Button
                className="w-full"
                onClick={() => router.push('/admin/builders')}
              >
                View Builders
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Reviews
              </CardTitle>
              <CardDescription>Manage all reviews</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">{stats.totalReviews}</div>
              <Button
                className="w-full"
                onClick={() => router.push('/admin/reviews')}
              >
                View Reviews
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User2 className="h-5 w-5" />
                Users
              </CardTitle>
              <CardDescription>Manage all users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">{stats.totalUsers}</div>
              <Button
                className="w-full"
                onClick={() => router.push('/admin/users')}
              >
                View Users
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Existing Dashboard Content */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {user.role === 'HOMEOWNER' ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>My Reviews</CardTitle>
                <CardDescription>
                  {reviews.length === 0
                    ? "You haven't written any reviews yet"
                    : `You have written ${reviews.length} review${
                        reviews.length === 1 ? '' : 's'
                      }`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <Button
                    onClick={() => router.push('/new/review')}
                    className="w-full"
                  >
                    <Star className="mr-2 h-4 w-4" />
                    Write Your First Review
                  </Button>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <Card key={review.id} className="overflow-hidden">
                        <CardContent
                          className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => setSelectedReview(review)}
                        >
                          <div className="flex items-start gap-6">
                            {review.builder_logo ? (
                              <div className="relative w-12 h-12 flex-shrink-0 cursor-pointer">
                                <Image
                                  src={review.builder_logo}
                                  alt={review.builder_name}
                                  fill
                                  className="object-contain"
                                />
                              </div>
                            ) : (
                              <Building2 className="h-12 w-12 text-gray-400 cursor-pointer" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-4 mb-2">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">
                                    {review.builder_name}
                                  </div>
                                  
                                </div>
                                <div className="flex items-center gap-1">
                                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                  <span className="font-medium">
                                    {calculateAverageRating(review).toFixed(1)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span>{new Date(review.created_at).toLocaleDateString()}</span>
                              {review.images.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <Camera className="h-4 w-4" />
                                  {review.images.length}
                                </span>
                              )}
                            </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    <Button
                      onClick={() => router.push('/new/review')}
                      variant="outline"
                      className="w-full"
                    >
                      <Star className="mr-2 h-4 w-4" />
                      Write Another Review
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Find Builders</CardTitle>
                <CardDescription>
                  Search and compare home builders in your area
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => router.push('/builders')} className="w-full">
                  <Building2 className="mr-2 h-4 w-4" />
                  Browse Builders
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your profile and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => router.push('/settings')}
                  variant="outline"
                  className="w-full"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  View Settings
                </Button>
              </CardContent>
            </Card>
          </>
        ) : (
          // Builder dashboard content
          <Card>
            <CardHeader>
              <CardTitle>Builder Dashboard</CardTitle>
              <CardDescription>
                View and manage your builder profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push(`/builders/${user.id}`)} className="w-full">
                <Building2 className="mr-2 h-4 w-4" />
                View My Profile
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      <ReviewModal
        review={selectedReview}
        onClose={() => setSelectedReview(null)}
      />
    </div>
  );
}
