import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

const imageData = [
  {
    id: 'nike',
    title: 'Nike App',
    beforeSrc: '/results/nike_before.jpg',
    afterSrc: '/results/nike_after.png',
  },
  {
    id: 'duolingo',
    title: 'Duolingo Notification Page',
    beforeSrc: '/results/duolingo_before.jpeg',
    afterSrc: '/results/duolingo_after.png',
  },
  {
    id: 'topup',
    title: 'Mobile Top-Up Flow',
    beforeSrc: '/results/topup_before.png',
    afterSrc: '/results/topup_after.png',
  },
  {
    id: 'wpay',
    title: 'WPay Interface',
    beforeSrc: '/results/wpay_before.png',
    afterSrc: '/results/wpay_after.png',
  },
];

// Component to display a single pair of before/after images
const CarouselSlideDisplay = ({ title, beforeSrc, afterSrc }: { title: string; beforeSrc: string; afterSrc: string }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 md:p-8">
      <h3 className="text-2xl font-bold text-gray-800 mb-8 text-center tracking-tight">{title}</h3>
      <div className="relative">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Before Image Column */}
          <div className="flex-1 flex flex-col items-center w-full">
            <h4 className="text-lg font-semibold text-gray-700 mb-3 tracking-tight">Before</h4>
            <div className="relative w-full h-[300px] sm:h-[400px] md:h-[450px] rounded-lg shadow-inner overflow-hidden border border-slate-200 bg-slate-50">
              <Image 
                src={beforeSrc} 
                alt={`${title} - Before`} 
                layout="fill" 
                objectFit="contain" 
                className="rounded-lg"
              />
            </div>
          </div>
          {/* After Image Column */}
          <div className="flex-1 flex flex-col items-center w-full">
            <h4 className="text-lg font-semibold text-gray-700 mb-3 tracking-tight">After</h4>
            <div className="relative w-full h-[300px] sm:h-[400px] md:h-[450px] rounded-lg shadow-inner overflow-hidden border border-slate-200 bg-slate-50">
              <Image 
                src={afterSrc} 
                alt={`${title} - After`} 
                layout="fill" 
                objectFit="contain" 
                className="rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ImageComparisonCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? imageData.length - 1 : prevIndex - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex === imageData.length - 1 ? 0 : prevIndex + 1));
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  if (imageData.length === 0) {
    return null;
  }

  const currentSlide = imageData[currentIndex];

  return (
    <div className="max-w-6xl mx-auto mt-24 px-4 sm:px-6">
      {/* Section header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center px-4 py-1.5 mb-4 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-medium text-sm">
          <ImageIcon className="w-4 h-4 mr-2" />
          <span>Visual Transformations</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Before & After Showcase</h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Witness the evolution: from initial UI to enhanced UX with our intelligent annotation.
        </p>
      </div>

      {/* Carousel Body */}
      <div className="relative">
        <CarouselSlideDisplay
          title={currentSlide.title}
          beforeSrc={currentSlide.beforeSrc}
          afterSrc={currentSlide.afterSrc}
        />

        {/* Navigation Buttons */}
        {imageData.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-0 md:-left-5 top-1/2 transform -translate-y-1/2 bg-white hover:bg-indigo-50 text-indigo-600 p-3 rounded-full shadow-md border border-slate-300 hover:border-indigo-300 transition-all duration-150 ease-in-out z-10"
              aria-label="Previous slide"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-0 md:-right-5 top-1/2 transform -translate-y-1/2 bg-white hover:bg-indigo-50 text-indigo-600 p-3 rounded-full shadow-md border border-slate-300 hover:border-indigo-300 transition-all duration-150 ease-in-out z-10"
              aria-label="Next slide"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}
      </div>

      {/* Dot Indicators */}
      {imageData.length > 1 && (
        <div className="flex justify-center space-x-2.5 mt-10">
          {imageData.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`w-2.5 h-2.5 rounded-full transition-colors duration-150 ease-in-out ${
                currentIndex === index ? 'bg-indigo-600 scale-110' : 'bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
} 