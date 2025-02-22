'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-b from-primary/10 to-background">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Find & Review Home Builders
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Make informed decisions about your future home. Read reviews from real homeowners
            and share your own building experience.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="text"
                placeholder="Search for builders by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <Button size="lg">
              Search
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose HomeRatings?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-card rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Detailed Reviews</h3>
              <p className="text-muted-foreground">
                Get comprehensive insights with ratings across 9 key areas including build quality,
                materials, and specific room features.
              </p>
            </div>
            
            <div className="p-6 bg-card rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Verified Builders</h3>
              <p className="text-muted-foreground">
                Connect with verified builders who can respond to reviews and showcase
                their portfolio of work.
              </p>
            </div>
            
            <div className="p-6 bg-card rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Make Better Decisions</h3>
              <p className="text-muted-foreground">
                Compare builders, read authentic reviews, and choose the right builder
                for your dream home.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}