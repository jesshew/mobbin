
import { InformativeInfoGraphic,cardData} from './RenderInfoGraphic';
// More informativeand self-explanatory infographic component for each card

// Main component for displaying feature cards
export default function FeatureCards() {
  // Data for each feature card
  
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
        
        {/* Grid layout for feature cards */}
        <div className="grid grid-cols-1 gap-6">
          {cardData.map((card, index) => (
            // Individual feature card container
            <div 
              key={index} 
              className="bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition overflow-hidden group"
            >
              {/* Gradient bar at the top of the card */}
              <div className={`h-2 bg-gradient-to-r ${card.gradient}`}></div>
              {/* Card content area */}
              <div className="p-6">
                {/* Flex container for card content, responsive layout */}
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Left side: Icon, title, and description */}
                  <div className="w-full md:w-1/2">
                    <div className="flex items-center mb-4">
                      <div className={`w-10 h-10 ${card.iconBg} rounded-lg flex items-center justify-center group-hover:${card.iconHoverBg} transition`}>
                        {card.icon}
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 ml-3">{card.title}</h3>
                    </div>
                    <p className="text-gray-600">{card.description}</p>
                  </div>
                  {/* Right side: Informative infographic */}
                  <div className="w-full md:w-1/2">
                    <InformativeInfoGraphic type={card.type} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}