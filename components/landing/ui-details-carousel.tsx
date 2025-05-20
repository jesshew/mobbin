import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

// Carousel data: each slide highlights a subtle UI detail
const uiDetailsData = [
  {
    id: 'duolingo-speech-bubble',
    title: 'Building Trust with Friendly Prompts',
    imageSrc: '/details/duolingo_after_detail1.png',
    alt: 'Duolingo speech bubble UI',
    caption: 'A candid speech bubble reduces friction and communicates trust, making users feel comfortable and understood during onboarding.'
  },
  {
    id: 'duolingo-allow-arrow',
    title: 'Gentle Guidance for User Choices',
    imageSrc: '/details/duolingo_after_detail2.png',
    alt: 'Duolingo allow notifications arrow UI',
    caption: 'A small arrow subtly nudges users toward the recommended action—"Allow Notifications"—helping them make the right choice without pressure.'
  },
  {
    id: 'topup-fee-transparency',
    title: 'Clear Communication for Informed Decisions',
    imageSrc: '/details/top-up-success.png',
    alt: 'Mobile top-up fee detail UI',
    caption: 'Specifying which virtual card is being topped up eliminates confusion and builds trust in the transaction process.'
  },
  {
    id: 'wpay-fee-detail',
    title: 'Transparency in Transaction Fees',
    imageSrc: '/details/payment-fee-detail.png',
    alt: 'Payment fee detail UI',
    caption: 'A clear section communicates payment fees, ensuring users are informed and reinforcing transparency at every step.'
  },
];

// Main carousel component
export default function UIDetailsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Navigate to previous slide
  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? uiDetailsData.length - 1 : prevIndex - 1));
  };

  // Navigate to next slide
  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex === uiDetailsData.length - 1 ? 0 : prevIndex + 1));
  };

  // Jump to a specific slide
  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  const currentSlide = uiDetailsData[currentIndex];

  return (
    <section className="max-w-5xl mx-auto mt-24 px-4 sm:px-6 lg:px-8">
      {/* Section header */}
      <div className="text-center mb-10 sm:mb-12">
        <div className="inline-flex items-center justify-center px-3 sm:px-4 py-1.5 mb-4 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-medium text-xs sm:text-sm">
          <ImageIcon className="w-4 h-4 mr-2" />
          <span>Invisible Effort in UI Design</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Small Touches, Big Difference
        </h2>
        <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Thoughtful details shape seamless, trustworthy experiences, often in ways we don't even notice. Here are some real-world examples of small, but impactful touches.
        </p>
      </div>

      {/* Carousel body */}
      <div className="relative bg-white rounded-2xl border border-slate-200 shadow-xl p-4 sm:p-6 md:p-8 flex flex-col items-center">
        {/* Slide image */}
        <div className="relative w-full h-[340px] sm:h-[420px] md:h-[500px] lg:h-[540px] rounded-lg overflow-hidden border border-slate-300 bg-slate-100 flex items-center justify-center">
          <Image
            src={currentSlide.imageSrc}
            alt={currentSlide.alt}
            layout="fill"
            objectFit="contain"
            className="rounded-lg"
            priority
            draggable={false}
          />
        </div>
        {/* Slide title */}
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mt-6 mb-2 text-center tracking-tight">
          {currentSlide.title}
        </h3>
        {/* Slide caption */}
        <p className="text-sm sm:text-base text-gray-500 text-center mb-2 max-w-xl mx-auto">
          {currentSlide.caption}
        </p>

        {/* Navigation buttons */}
        {uiDetailsData.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-0 sm:-left-3 md:-left-5 top-1/2 transform -translate-y-1/2 bg-white hover:bg-indigo-50 text-indigo-600 p-2.5 sm:p-3 rounded-full shadow-md border border-slate-300 hover:border-indigo-300 transition-all duration-150 ease-in-out z-30"
              aria-label="Previous slide"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-0 sm:-right-3 md:-right-5 top-1/2 transform -translate-y-1/2 bg-white hover:bg-indigo-50 text-indigo-600 p-2.5 sm:p-3 rounded-full shadow-md border border-slate-300 hover:border-indigo-300 transition-all duration-150 ease-in-out z-30"
              aria-label="Next slide"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}
      </div>

      {/* Dot indicators */}
      {uiDetailsData.length > 1 && (
        <div className="flex justify-center space-x-2 sm:space-x-2.5 mt-8 sm:mt-10">
          {uiDetailsData.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-150 ease-in-out ${
                currentIndex === index ? 'bg-indigo-600 scale-125' : 'bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
} 