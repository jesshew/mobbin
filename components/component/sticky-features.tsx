import { useState, useEffect } from 'react';
import { MessageSquare, Layers, Image, Users, FileText, Activity, Monitor } from 'lucide-react';
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { InformativeInfoGraphic, cardData } from '../landing/render-info-graphics';
// More informativeand self-explanatory infographic component for each card

// Main component for displaying feature cards
export default function FeatureCards() {
  const scrollContainerRef = useRef(null);
  const numCards = cardData.length;

  const { scrollYProgress } = useScroll({
    target: scrollContainerRef,
    offset: ["start start", "end end"] // Progress from 0 to 1 as container scrolls past
  });

  // Animation parameters
  const animDuration = 0.4; // How long each card's main animation phase lasts (in terms of scroll progress)
  // Calculate step to ensure animations are spread out across the scroll range [0,1]
  // If numCards is 1, step is 0, card animates from 0 to animDuration.
  const animStep = numCards > 1 ? (1.0 - animDuration) / (numCards - 1) : 0;

  return (
    <>
      {/* Section for feature highlights */}
      <div className="max-w-6xl mx-auto mt-24">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center px-4 py-1.5 mb-4 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-medium text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span>Project Highlights</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Advanced UX Annotation Features</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">Leveraging cutting-edge ML technology to transform UI screenshots into detailed annotations</p>
        </div>
        
        {/* Scroll container for feature cards */}
        {/* Removed "grid grid-cols-1 gap-6" class, using style for height and relative positioning */}
        <div 
          ref={scrollContainerRef} 
          style={{ 
            height: numCards > 0 ? `${numCards * 70}vh` : 'auto', // Ensure height for scroll, or 'auto' if 0 cards
            position: "relative" 
          }}
        >
          {cardData.map((card, index) => {
            const currentCardStartProgress = index * animStep;
            const currentCardEndProgress = currentCardStartProgress + animDuration;

            // Define animation points within the card's duration for smoother transitions
            const firstQuarterPoint = currentCardStartProgress + animDuration * 0.25;
            const thirdQuarterPoint = currentCardStartProgress + animDuration * 0.75;

            const y = useTransform(scrollYProgress,
              [currentCardStartProgress, firstQuarterPoint, thirdQuarterPoint, currentCardEndProgress],
              ["20vh", "0vh", "0vh", "-20vh"] // Card moves from 20vh below center, to center, then to 20vh above center
            );
            const opacity = useTransform(scrollYProgress,
              [currentCardStartProgress, firstQuarterPoint, thirdQuarterPoint, currentCardEndProgress],
              [0, 1, 1, 0] // Fade in, stay full, fade out
            );
            const scale = useTransform(scrollYProgress,
              [currentCardStartProgress, firstQuarterPoint, thirdQuarterPoint, currentCardEndProgress],
              [0.9, 1, 1, 0.9] // Scale up from 0.9, stay at 1, scale down to 0.9
            );

            return (
              <motion.div
                key={card.title || index} // Use card.title for key, fallback to index
                style={{
                  position: "fixed",
                  top: "50%", // Anchor in viewport center
                  left: "50%",
                  translateX: "-50%", // Center horizontally
                  translateY: "-50%", // Center vertically (base for animated y)
                  width: "min(90%, 700px)", // Responsive card width
                  zIndex: 10 + index, // Stacking order ensures current card is on top
                  // Animated properties directly applied
                  opacity,
                  y, // This applies a translateY, effectively combining with the initial -50%
                  scale,
                }}
              >
                {/* Original card structure and styling are preserved here */}
                <div 
                  className="bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition overflow-hidden group"
                >
                  <div className={`h-2 bg-gradient-to-r ${card.gradient}`}></div>
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="w-full md:w-1/2">
                        <div className="flex items-center mb-4">
                          <div className={`w-10 h-10 ${card.iconBg} rounded-lg flex items-center justify-center group-hover:${card.iconHoverBg} transition`}>
                            {card.icon}
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 ml-3">{card.title}</h3>
                        </div>
                        <p className="text-gray-600">{card.description}</p>
                      </div>
                      <div className="w-full md:w-1/2">
                        <InformativeInfoGraphic type={card.type} />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </>
  );
}