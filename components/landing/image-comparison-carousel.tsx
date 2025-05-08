import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Image as ImageIcon, GitCompareArrows } from 'lucide-react';

const imageData = [
  {
    id: 'nike',
    title: 'Nike App',
    beforeSrc: '/results/nike_before.jpg',
    afterSrc: '/results/nike_after.png',
  },
  {
    id: 'duolingo',
    title: 'Duolingo Notifications',
    beforeSrc: '/results/duolingo_before.jpeg',
    afterSrc: '/results/duolingo_after.png',
  },
  {
    id: 'topup',
    title: 'Mobile Top-Up Page',
    beforeSrc: '/results/topup_before.png',
    afterSrc: '/results/topup_after.png',
  },
  {
    id: 'wpay',
    title: 'Payment Success Page',
    beforeSrc: '/results/wpay_before.png',
    afterSrc: '/results/wpay_after.png',
  },
];

// Component to display a single pair of before/after images with a slider
const CarouselSlideDisplay = ({ title, beforeSrc, afterSrc }: { title: string; beforeSrc: string; afterSrc: string }) => {
  const [sliderPosition, setSliderPosition] = useState(50); // Initial position at 50%
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSliderPosition(Number(event.target.value));
  };

  // Style for the range input for a more custom look
  const rangeInputStyle: React.CSSProperties = {
    WebkitAppearance: 'none',
    appearance: 'none',
    width: 'calc(100% + 10px)', // Extend slightly to align thumb with edges
    height: '2px',
    background: 'rgba(255, 255, 255, 0.3)',
    outline: 'none',
    cursor: 'ew-resize',
    position: 'absolute',
    margin: '0 -5px', // Offset the extension
    // Thumb styling will be handled by ::-webkit-slider-thumb and ::-moz-range-thumb in global CSS or a style tag if necessary for more complex styling
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-4 sm:p-6 md:p-8">
      <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 text-center tracking-tight">{title}</h3>
      
      <div 
        ref={imageContainerRef} 
        className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[550px] rounded-lg overflow-hidden select-none group border border-slate-300 shadow-inner bg-slate-100"
      >
        {/* Before Image (Bottom Layer) */}
        <div className="absolute inset-0">
          <Image 
            src={beforeSrc} 
            alt={`${title} - Before`} 
            layout="fill" 
            objectFit="contain"
            className="rounded-lg"
            draggable={false}
            priority // Prioritize loading current slide images
          />
          <span className="absolute top-2 left-2 bg-black/60 text-white text-xs sm:text-sm px-2 py-1 rounded-md font-semibold">BEFORE</span>
        </div>

        {/* After Image (Top Layer, Clipped) */}
        <div 
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <Image 
            src={afterSrc} 
            alt={`${title} - After`} 
            layout="fill" 
            objectFit="contain"
            className="rounded-lg"
            draggable={false}
            priority
          />
          <span className="absolute top-2 right-2 bg-black/60 text-white text-xs sm:text-sm px-2 py-1 rounded-md font-semibold">AFTER</span>
        </div>

        {/* Slider Control Line */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white/80 shadow-md cursor-ew-resize pointer-events-none z-20 group-hover:bg-white transition-colors duration-150"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-xl border-2 border-indigo-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <GitCompareArrows size={18} className="text-indigo-600" />
          </div>
        </div>

        {/* Range Input for Slider */}
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={sliderPosition}
          onChange={handleSliderChange}
          className="absolute top-0 left-0 w-full h-full opacity-0 cursor-ew-resize z-10"
          aria-label={`Compare ${title} before and after`}
        />
      </div>
      <p className="text-center text-sm text-gray-500 mt-4">Slide the bar to compare before and after versions.</p>
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
    <div className="max-w-5xl mx-auto mt-20 sm:mt-24 px-4 sm:px-6">
      {/* Section header */}
      <div className="text-center mb-10 sm:mb-12">
        <div className="inline-flex items-center justify-center px-3 sm:px-4 py-1.5 mb-4 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-medium text-xs sm:text-sm">
          <ImageIcon className="w-4 h-4 mr-2" />
          <span>UI Element Detection & UX Annotation</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Before & After Showcase</h2>
        <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
        See the results with a side-by-side comparison.
        </p>
      </div>

      {/* Carousel Body */}
      <div className="relative">
        <CarouselSlideDisplay
          key={currentSlide.id} // Add key here to reset slider state when slide changes
          title={currentSlide.title}
          beforeSrc={currentSlide.beforeSrc}
          afterSrc={currentSlide.afterSrc}
        />

        {/* Navigation Buttons */}
        {imageData.length > 1 && (
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

      {/* Dot Indicators */}
      {imageData.length > 1 && (
        <div className="flex justify-center space-x-2 sm:space-x-2.5 mt-8 sm:mt-10">
          {imageData.map((_, index) => (
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
    </div>
  );
} 