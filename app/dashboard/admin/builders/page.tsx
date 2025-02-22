'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Check, Loader2, Search, Star, Globe, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { toBuilderSlug } from '@/lib/utils';

interface Builder {
  id: string;
  name: string;
  location: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  logo: string | null;
  average_rating: number | null;
  total_reviews: number;
  is_verified: boolean;
  is_published: boolean;
  is_featured: boolean;
  user_email: string | null;
  user_full_name: string | null;
  created_at: string;
}

interface BuildersResponse {
  builders: Builder[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export default function AdminBuildersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState<BuildersResponse>({
    builders: [],
    total: 0,
    page: 1,
    perPage: 20,
    totalPages: 1,
  });

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      params.set('search', searchQuery);
      params.set('page', '1');
      router.push(`?${params.toString()}`);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, router]);

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/admin/builders?${searchParams.toString()}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch builders');
        }
        const data = await response.json();
        setData(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [searchParams]);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`?${params.toString()}`);
  };

  const handleStatusChange = async (
    builderId: string,
    field: 'is_published' | 'is_featured' | 'is_verified',
    value: boolean
  ) => {
    try {
      const response = await fetch(`/api/admin/builders/${builderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        throw new Error('Failed to update builder');
      }

      // Update local state
      setData((prev) => ({
        ...prev,
        builders: prev.builders.map((builder) =>
          builder.id === builderId
            ? { ...builder, [field]: value }
            : builder
        ),
      }));

      toast.success('Builder updated successfully');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update builder');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Builders</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search builders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-[300px]"
            />
          </div>
          <Button onClick={() => router.push('/new/builder')}>
            Add Builder
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-center">Reviews</TableHead>
              <TableHead className="text-center">Rating</TableHead>
              <TableHead className="text-center">Verified</TableHead>
              <TableHead className="text-center">Published</TableHead>
              <TableHead className="text-center">Featured</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : data.builders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  No builders found
                </TableCell>
              </TableRow>
            ) : (
              data.builders.map((builder) => (
                <TableRow
                  key={builder.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() =>
                    router.push(`/builders/${toBuilderSlug(builder.name)}`)
                  }
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      {builder.logo ? (
                        <div className="relative w-8 h-8">
                          <Image
                            src={builder.logo}
                            alt={builder.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-lg font-bold text-gray-400">
                            {builder.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{builder.name}</div>
                        {builder.is_featured && (
                          <div className="flex items-center gap-1 text-xs text-yellow-600">
                            <Star className="h-3 w-3 fill-yellow-400" />
                            Featured
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{builder.location || '-'}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {builder.email && (
                        <div className="text-sm">{builder.email}</div>
                      )}
                      {builder.phone && (
                        <div className="text-sm text-gray-500">
                          {builder.phone}
                        </div>
                      )}
                      {builder.website && (
                        <a
                          href={builder.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Globe className="h-3 w-3" />
                          Website
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {builder.total_reviews}
                  </TableCell>
                  <TableCell className="text-center">
                    {builder.average_rating?.toFixed(1) || '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <div
                      className="flex justify-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Switch className='data-[state=checked]:bg-green-500'
                        checked={builder.is_verified}
                        onCheckedChange={(checked) =>
                          handleStatusChange(builder.id, 'is_verified', checked)
                        }
                      />
                    </div>
                    {/* {builder.is_verified && (
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    )} */}
                  </TableCell>
                  <TableCell className="text-center">
                    <div
                      className="flex justify-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Switch className='data-[state=checked]:bg-green-500'
                        checked={builder.is_published}
                        onCheckedChange={(checked) =>
                          handleStatusChange(builder.id, 'is_published', checked)
                        }
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div
                      className="flex justify-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Switch className='data-[state=checked]:bg-green-500'
                        checked={builder.is_featured}
                        onCheckedChange={(checked) =>
                          handleStatusChange(builder.id, 'is_featured', checked)
                        }
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(builder.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data.totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <Pagination>
            <PaginationContent>
              {data.page > 1 && (
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(data.page - 1);
                    }}
                  />
                </PaginationItem>
              )}

              {Array.from({ length: data.totalPages }, (_, i) => i + 1).map(
                (page) => {
                  if (
                    page === 1 ||
                    page === data.totalPages ||
                    Math.abs(page - data.page) <= 1
                  ) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(page);
                          }}
                          isActive={page === data.page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  } else if (
                    page === 2 ||
                    page === data.totalPages - 1
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

              {data.page < data.totalPages && (
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(data.page + 1);
                    }}
                  />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
