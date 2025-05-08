
import React from 'react';

const PhoneMockup = () => {
  return (
    <div className="relative w-[300px] h-[600px] mx-auto">
      {/* Phone frame */}
      <div className="absolute inset-0 bg-black rounded-[40px] p-3 shadow-xl">
        {/* Screen */}
        <div className="bg-white h-full w-full rounded-[32px] overflow-hidden">
          {/* Status bar */}
          <div className="bg-white h-6 flex justify-between items-center px-6">
            <div className="text-xs font-semibold">9:41</div>
            <div className="flex space-x-1">
              <div className="w-4 h-3 bg-black rounded-sm"></div>
              <div className="w-3 h-3 bg-black rounded-full"></div>
              <div className="w-3 h-3 bg-black rounded-full"></div>
            </div>
          </div>
          
          {/* Notch */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[40%] h-7 bg-black rounded-b-2xl"></div>
          
          {/* App content */}
          <div className="pt-8 px-4">
            <div className="flex justify-between items-center mb-4">
              <button className="p-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 12H5" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 19L5 12L12 5" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button className="p-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6H21" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 12H21" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 18H21" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            
            <h2 className="text-xl font-bold mb-4">My Itinerary</h2>
            
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="flex items-center">
                  <div className="font-bold">June</div>
                  <svg className="w-4 h-4 ml-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 9L12 15L18 9" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="text-xs text-gray-500">2023</div>
              </div>
              
              <div className="flex space-x-2">
                <button className="p-1 rounded-full border border-gray-200">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 18L9 12L15 6" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button className="p-1 rounded-full border border-gray-200">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 18L15 12L9 6" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Date selector */}
            <div className="flex justify-between mb-6">
              <div className="border border-black rounded-lg p-2 w-20 text-center">
                <div className="text-lg font-bold">27</div>
                <div className="text-xs text-gray-500">Monday</div>
              </div>
              <div className="border border-gray-200 rounded-lg p-2 w-20 text-center">
                <div className="text-lg">28</div>
                <div className="text-xs text-gray-500">Tuesday</div>
              </div>
              <div className="border border-gray-200 rounded-lg p-2 w-20 text-center">
                <div className="text-lg">29</div>
                <div className="text-xs text-gray-500">Wednesday</div>
              </div>
            </div>
            
            {/* Schedule */}
            <div className="mb-4">
              <div className="text-xs font-semibold text-gray-500 mb-2">MORNING</div>
              
              {/* Event 1 */}
              <div className="flex items-start mb-4">
                <div className="flex flex-col items-center mr-3">
                  <div className="text-xs text-gray-500">08:00</div>
                  <div className="h-full w-px bg-gray-200 my-1"></div>
                  <div className="text-xs text-gray-500">9:00</div>
                </div>
                
                <div className="flex-1 bg-gray-50 rounded-lg p-3 relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-blue-500"></div>
                  <div className="flex justify-between">
                    <div>
                      <div className="font-medium">Baguett's Café</div>
                      <div className="text-xs text-gray-500">08:00 AM - 9:00 AM</div>
                    </div>
                    <button className="text-gray-400">⋮</button>
                  </div>
                </div>
              </div>
              
              {/* Event 2 */}
              <div className="flex items-start">
                <div className="flex flex-col items-center mr-3">
                  <div className="text-xs text-gray-500">09:30</div>
                  <div className="h-full w-px bg-gray-200 my-1"></div>
                  <div className="text-xs text-gray-500">10:30</div>
                </div>
                
                <div className="flex-1 bg-gray-50 rounded-lg p-3 relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-orange-500"></div>
                  <div className="flex justify-between">
                    <div>
                      <div className="font-medium">Louvre Museum</div>
                      <div className="text-xs text-gray-500">09:30 AM - 10:30 AM</div>
                    </div>
                    <button className="text-gray-400">⋮</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhoneMockup;
