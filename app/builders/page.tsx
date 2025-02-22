'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Star, MapPin, Building2, Search, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { toBuilderSlug } from '@/lib/utils';

interface Builder {
  id: string;
  name: string;
  location: string | null;
  website: string | null;
  phone: string | null;
  description: string | null;
  logo: string | null;
  average_rating: number | null;
  total_reviews: number;
  is_verified: boolean;
}

interface PaginationInfo {
  total: number;
  pages: number;
  current: number;
  limit: number;
}

export default function BuildersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    pages: 0,
    current: 1,
    limit: 10,
  });
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1');
    const searchTerm = searchParams.get('search') || '';

    async function fetchBuilders() {
      try {
        const response = await fetch(
          `/api/builders?page=${page}&search=${encodeURIComponent(searchTerm)}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch builders');
        }
        const data = await response.json();
        setBuilders(data.builders);
        setPagination(data.pagination);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBuilders();
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    router.push(`/builders?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`/builders?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Home Builders</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="search"
            placeholder="Search builders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <Button type="submit">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <div className="grid gap-6">
        {builders.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No builders found</h2>
            <p className="text-gray-600">
              Try adjusting your search or browse all builders
            </p>
          </div>
        ) : (
          builders.map((builder) => (
            <Link
              key={builder.id}
              href={`/builders/${toBuilderSlug(builder.name)}`}
              className="block border rounded-lg p-6 hover:border-blue-500 transition-colors"
            >
              <div className="flex items-start gap-6">
                {builder.logo ? (
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <Image
                      src={builder.logo}
                      alt={builder.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-gray-100 flex items-center justify-center rounded-lg flex-shrink-0">
                    <span className="text-3xl font-bold text-gray-400">
                      {builder.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xl font-semibold truncate">
                      {builder.name}
                    </h2>
                    {builder.is_verified && (
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                  {builder.location && (
                    <div className="flex items-center gap-2 text-gray-600 mb-3">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{builder.location}</span>
                    </div>
                  )}
                  {builder.description && (
                    <p className="text-gray-700 line-clamp-2">
                      {builder.description}
                    </p>
                  )}
                </div>
                {builder.average_rating !== null && (
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-lg font-bold">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      {builder.average_rating.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {builder.total_reviews}{' '}
                      {builder.total_reviews === 1 ? 'review' : 'reviews'}
                    </div>
                  </div>
                )}
              </div>
            </Link>
          ))
        )}
      </div>

      {pagination.pages > 1 && (
        <Pagination className="mt-8">
          <PaginationContent>
            {pagination.current > 1 && (
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(pagination.current - 1);
                  }}
                />
              </PaginationItem>
            )}

            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
              (page) => {
                if (
                  page === 1 ||
                  page === pagination.pages ||
                  Math.abs(page - pagination.current) <= 1
                ) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(page);
                        }}
                        isActive={page === pagination.current}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                } else if (
                  page === 2 ||
                  page === pagination.pages - 1
                ) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                return null;
              }
            )}

            {pagination.current < pagination.pages && (
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(pagination.current + 1);
                  }}
                />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
