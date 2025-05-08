import React from 'react';
import Iphone15Pro from '../magicui/iphone-15-pro';
import TravelCard from './travel-card';

const PhoneShowcase = () => {
  return (
    <div className="relative mt-24 mb-10">
      {/* Decorative elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[70%] -z-10 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-[100%/50%] blur-md"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[60%] -z-10 bg-gradient-to-r from-blue-100/30 via-indigo-100/30 to-purple-100/30 rounded-[100%/50%]"></div>

      {/* Center phone */}
      <div className="relative z-3 flex justify-center animate-float">
        <Iphone15Pro
          width={433}
          height={882}
          src="/nike2.jpg"
          // Uncomment below and comment out src to use video instead
          // videoSrc="/demo-app-video.mp4"
        />
      </div>

      {/* <MockupInPhoneOne /> */}

      {/* Left side cards */}
      {/* <div className="absolute top-[15%] -left-[2%] z-10 animate-float-delay transform rotate-[-6deg] hover:rotate-[-3deg] transition-transform duration-500">
        <TravelCard
          imageUrl="/nike2.jpg"
          className="shadow-2xl mb-4 rounded-2xl border-2 border-white"
        />
      </div> */}
      <div className="absolute top-[50%] left-[3%] z-0 animate-float transform rotate-[-4deg] hover:rotate-[-1deg] transition-transform duration-500">
        <TravelCard
          imageUrl="./top_up_success.png"
          className="shadow-2xl rounded-2xl border-2 border-white"
        />
      </div>

      {/* Right side cards */}
      <div className="absolute top-[12%] right-[3%] z-0 animate-float transform rotate-[6deg] hover:rotate-[3deg] transition-transform duration-500">
        <TravelCard
          imageUrl="./nike2.jpg"
          className="shadow-2xl rounded-2xl border-2 border-white"
        />
      </div>
    </div>
  );
};

export default PhoneShowcase; 