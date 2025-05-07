import React from 'react';
import Iphone15Pro from '../magicui/iphone-15-pro';
import WireframeMockup from './wire-frame-mockup';

const MockupInPhoneOne = () => {
  return (
    <div className="relative flex justify-center items-center z-30">
      <Iphone15Pro width={433} height={882} />
      {/* Position the content inside the phone screen area */}
      <div className="absolute top-[19.25px] left-1/2 -translate-x-1/2 w-[389.5px] h-[843.5px] overflow-hidden rounded-[55.75px] bg-white">
        {/* Apply a negative Y translation to shift the WireframeMockup up by 40px */}
        <div className="w-full h-full scale-120 -translate-y-[140px]">
          <WireframeMockup />
        </div>
      </div>
    </div>
  );
};

export default MockupInPhoneOne;