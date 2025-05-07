
import React from 'react';
import PhoneMockup from './phone-mock-up';
import TravelCard from './travel-card';
// import SearchBar from './SearchBar';
import { Plane } from 'lucide-react';

const Hero = () => {
  return (
    <div className="relative w-full overflow-hidden pt-10 pb-20">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-white to-gray-50 -z-10"></div>
      
      <div className="container mx-auto px-4">
        {/* Hero content */}
        <div className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto mb-10">
          <h1 className="text-4xl md:text-6xl font-bold text-travelwise-dark mb-6">
            Rediscover the joy
            <div className="inline-flex items-center">
              <span className="mr-2">of the</span>
              <span className="inline-block text-travelwise-blue relative">
                <Plane className="h-8 w-8 md:h-12 md:w-12 text-travelwise-blue rotate-45" />
              </span>
              <span className="ml-2">journey</span>
            </div>
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            One destination to plan your next Paris adventure.
          </p>
          {/* <SearchBar /> */}
        </div>
        
        {/* Phone with floating cards */}
        <div className="relative mt-16">
          {/* Center phone */}
          <div className="relative z-20 flex justify-center animate-float">
            <PhoneMockup />
          </div>
          
          {/* Decorative curved line */}
          <div className="absolute top-[15%] left-[5%] right-[5%] h-[70%] -z-10 gradient-bg rounded-[100%/50%]"></div>
          
          {/* Left side cards */}
          <div className="absolute top-[20%] -left-[5%] z-10 animate-float-delay">
            <TravelCard 
              imageUrl="/lovable-uploads/d075041a-997d-47e7-b305-36f86a71b8b5.png" 
              className="card-rotate-left shadow-xl mb-4"
            />
          </div>
          <div className="absolute top-[45%] left-[5%] z-0 animate-float">
            <TravelCard 
              imageUrl="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop&ixlib=rb-4.0.3" 
              className="card-rotate-left shadow-xl"
            />
          </div>
          
          {/* Right side cards */}
          <div className="absolute top-[15%] right-[5%] z-0 animate-float">
            <TravelCard 
              imageUrl="https://images.unsplash.com/photo-1500313830540-7b6650a74fd0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3" 
              className="card-rotate-right shadow-xl"
            />
          </div>
          <div className="absolute top-[50%] -right-[5%] z-10 animate-float-delay">
            <TravelCard 
              imageUrl="https://images.unsplash.com/photo-1499856871958-5b9357976b82?q=80&w=2020&auto=format&fit=crop&ixlib=rb-4.0.3" 
              className="card-rotate-right shadow-xl"
            />
          </div>
          
          {/* Paris label */}
          <div className="absolute top-[15%] right-[10%] bg-white px-4 py-2 rounded-full shadow-md flex items-center z-30">
            <div className="w-4 h-4 bg-travelwise-blue rounded-full mr-2"></div>
            <span className="font-medium">Paris</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
