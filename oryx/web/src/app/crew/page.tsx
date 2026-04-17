// src/app/crew/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PublicPageFrame from '@/components/public/PublicPageFrame';
import Image from 'next/image'; // Assuming Image component is used for category icons

// Placeholder interfaces for crew categories and booking inquiry
interface CrewCategory {
  id: string;
  name: string;
  description: string;
  icon: string; // URL or path to icon image
  link: string; // Link to a specific category page or search results
}

interface BookingInquiry {
  city: string;
  eventDate: string;
  eventType: string;
  category: string;
  budget: string;
  duration: string;
  equipmentNotes: string;
  audienceSize: string;
  specialRequirements: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}

const CrewPage = () => {
  const [bookingInquiry, setBookingInquiry] = useState<BookingInquiry>({
    city: '',
    eventDate: '',
    eventType: '',
    category: '',
    budget: '',
    duration: '',
    equipmentNotes: '',
    audienceSize: '',
    specialRequirements: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const crewCategories: CrewCategory[] = [
    { id: 'djs', name: 'DJs', description: 'Spinning the best beats for your event.', icon: '/icons/dj.svg', link: '/crew/djs' },
    { id: 'producers', name: 'Music Producers', description: 'Crafting unique soundscapes.', icon: '/icons/producer.svg', link: '/crew/producers' },
    { id: 'photographers', name: 'Photographers', description: 'Capturing every moment.', icon: '/icons/camera.svg', link: '/crew/photographers' },
    { id: 'bartenders', name: 'Bartenders', description: 'Crafting signature cocktails.', icon: '/icons/bartender.svg', link: '/crew/bartenders' },
    { id: 'acts', name: 'Musical Acts', description: 'Live performances to enchant your guests.', icon: '/icons/microphone.svg', link: '/crew/acts' },
    { id: 'dancers', name: 'Dancers', description: 'Adding energy and flair.', icon: '/icons/dancer.svg', link: '/crew/dancers' },
    { id: 'comedians', name: 'Comedians', description: 'Bringing laughter to your night.', icon: '/icons/comedian.svg', link: '/crew/comedians' },
    { id: 'vendors', name: 'Food Vendors', description: 'Delicious catering options.', icon: '/icons/food.svg', link: '/crew/vendors' },
    { id: 'creators', name: 'Content Creators', description: 'Capturing your event for social media.', icon: '/icons/creator.svg', link: '/crew/creators' },
    { id: 'videographers', name: 'Videographers', description: 'Documenting your event in motion.', icon: '/icons/video.svg', link: '/crew/videographers' },
    { id: 'hosts', name: 'Hosts', description: 'EVNTSZN Network Hosts.', icon: '/icons/host.svg', link: '/hosts' }, // Link to host program
  ];

  const handleBookingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBookingInquiry((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSubmissionSuccess(false);

    // Basic validation for required fields
    if (!bookingInquiry.city || !bookingInquiry.eventDate || !bookingInquiry.category || !bookingInquiry.contactEmail) {
      setError("City, Event Date, Category, and Contact Email are required.");
      setIsSubmitting(false);
      return;
    }

    // TODO: Implement actual booking inquiry submission logic (API call)
    console.log("Submitting Booking Inquiry:", bookingInquiry);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSubmissionSuccess(true);
      // Optionally reset form
      setBookingInquiry({
        city: '', eventDate: '', eventType: '', category: '', budget: '', duration: '',
        equipmentNotes: '', audienceSize: '', specialRequirements: '', contactName: '',
        contactEmail: '', contactPhone: '',
      });
    } catch (err) {
      console.error("Booking inquiry submission error:", err);
      setError("Failed to submit booking inquiry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicPageFrame
      title="EVNTSZN Crew: Talent & Services Marketplace"
      description="Find and book the perfect talent and services for your event."
      heroImage="/public/hero-crew.jpg" // Placeholder
      seo={{
        title: "EVNTSZN Crew | Book DJs, Photographers, Bartenders & More",
        description: "Discover and book talented professionals for your events. DJs, photographers, bartenders, performers, and more.",
      }}
    >
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0">
          <Image
            src="/public/hero-crew-background.jpg" // Placeholder background
            alt="Crew marketplace background"
            layout="fill"
            objectFit="cover"
            className="opacity-30"
          />
        </div>
        <div className="mx-auto max-w-7xl px-4 py-20 md:px-6 lg:px-8 relative">
          <h1 className="text-5xl font-bold mb-4 text-white text-center max-w-4xl mx-auto">
            Your Event's Dream Team: Find & Book Talent with EVNTSZN Crew
          </h1>
          <p className="text-xl text-gray-300 text-center max-w-3xl mx-auto mt-6">
            From electrifying DJs to captivating performers, find the right crew to make your event unforgettable.
          </p>
          <div className="mt-12 flex justify-center">
            <Link href="#booking-inquiry" className="ev-button-primary px-8 py-3 text-lg">
              Book Talent Now
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-center mb-12 text-white">Explore Crew Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {crewCategories.map((category) => (
            <Link key={category.id} href={category.link} className="ev-panel p-6 rounded-2xl hover:border-purple-500 transition-colors duration-300">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-white/5 p-3 mr-4">
                  <Image src={category.icon} alt={category.name} width={48} height={48} />
                </div>
                <h3 className="text-2xl font-bold text-white">{category.name}</h3>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">{category.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section id="booking-inquiry" className="mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8">
        <div className="ev-panel p-8 rounded-3xl">
          <h2 className="text-4xl font-bold text-center mb-12 text-white">Need Specific Talent?</h2>
          <p className="text-lg text-white/70 text-center mb-8 max-w-3xl mx-auto">
            Submit a detailed inquiry, and we'll help you find the perfect match from our network of professionals.
          </p>

          <form onSubmit={handleBookingSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="city" className="block text-sm font-semibold mb-2 text-white/70">City</label>
                <input type="text" id="city" name="city" value={bookingInquiry.city} onChange={handleBookingChange} className="ev-field" placeholder="Where is the event?" required />
              </div>
              <div>
                <label htmlFor="eventDate" className="block text-sm font-semibold mb-2 text-white/70">Event Date</label>
                <input type="date" id="eventDate" name="eventDate" value={bookingInquiry.eventDate} onChange={handleBookingChange} className="ev-field" required />
              </div>
              <div>
                <label htmlFor="eventType" className="block text-sm font-semibold mb-2 text-white/70">Event Type</label>
                <select id="eventType" name="eventType" value={bookingInquiry.eventType} onChange={handleBookingChange} className="ev-field" required>
                  <option value="">Select Event Type</option>
                  <option value="party">Party</option>
                  <option value="wedding">Wedding</option>
                  <option value="corporate">Corporate Event</option>
                  <option value="concert">Concert</option>
                  <option value="festival">Festival</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-semibold mb-2 text-white/70">Talent Category</label>
                <select id="category" name="category" value={bookingInquiry.category} onChange={handleBookingChange} className="ev-field" required>
                  <option value="">Select Talent Category</option>
                  {crewCategories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="budget" className="block text-sm font-semibold mb-2 text-white/70">Budget</label>
                <select id="budget" name="budget" value={bookingInquiry.budget} onChange={handleBookingChange} className="ev-field">
                  <option value="">Select Budget Range</option>
                  <option value="<1000">$1,000 -</option>
                  <option value="1000-2500">$1,000 - $2,500</option>
                  <option value="2500-5000">$2,500 - $5,000</option>
                  <option value="5000+">$5,000+</option>
                </select>
              </div>
              <div>
                <label htmlFor="duration" className="block text-sm font-semibold mb-2 text-white/70">Duration</label>
                <input type="text" id="duration" name="duration" value={bookingInquiry.duration} onChange={handleBookingChange} className="ev-field" placeholder="e.g., 4 hours, Full night" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="equipmentNotes" className="block text-sm font-semibold mb-2 text-white/70">Equipment Needs</label>
                <textarea id="equipmentNotes" name="equipmentNotes" value={bookingInquiry.equipmentNotes} onChange={handleBookingChange} rows={3} className="ev-field" placeholder="Any specific sound, lighting, or equipment requirements?" />
              </div>
              <div>
                <label htmlFor="specialRequirements" className="block text-sm font-semibold mb-2 text-white/70">Special Requirements</label>
                <textarea id="specialRequirements" name="specialRequirements" value={bookingInquiry.specialRequirements} onChange={handleBookingChange} rows={3} className="ev-field" placeholder="Any specific requests or details?" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="contactName" className="block text-sm font-semibold mb-2 text-white/70">Your Name</label>
                <input type="text" id="contactName" name="contactName" value={bookingInquiry.contactName} onChange={handleBookingChange} className="ev-field" placeholder="Your full name" required />
              </div>
              <div>
                <label htmlFor="contactEmail" className="block text-sm font-semibold mb-2 text-white/70">Your Email</label>
                <input type="email" id="contactEmail" name="contactEmail" value={bookingInquiry.contactEmail} onChange={handleBookingChange} className="ev-field" placeholder="Your email address" required />
              </div>
              <div>
                <label htmlFor="contactPhone" className="block text-sm font-semibold mb-2 text-white/70">Your Phone</label>
                <input type="tel" id="contactPhone" name="contactPhone" value={bookingInquiry.contactPhone} onChange={handleBookingChange} className="ev-field" placeholder="Your phone number" />
              </div>
               <div>
                <label htmlFor="audienceSize" className="block text-sm font-semibold mb-2 text-white/70">Estimated Audience Size</label>
                <input type="text" id="audienceSize" name="audienceSize" value={bookingInquiry.audienceSize} onChange={handleBookingChange} className="ev-field" placeholder="e.g., 150 guests" />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm mb-4">{error}</div>
            )}
            {submissionSuccess && (
              <div className="text-green-400 text-sm mb-4">Booking inquiry submitted successfully! We'll be in touch soon.</div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto px-8 py-3 rounded-lg font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                         bg-gradient-to-br from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600"
            >
              {isSubmitting ? 'Submitting Inquiry...' : 'Send Inquiry'}
            </button>
          </form>
        </div>
      </section>
    </PublicPageFrame>
  );
};

export default CrewPage;
