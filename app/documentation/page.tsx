import Image from 'next/image';
import Link from 'next/link';

export default function DocumentationPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Full-width header */}
      <header className="w-full bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-200">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-700">ForMobbin Documentation</h1>
          <div className="h-1 w-24 bg-gradient-to-r from-purple-500 to-indigo-600 mt-2"></div>
          <div className="flex items-center space-x-2 mt-4">
            <Link 
              href="/"
              className="text-gray-700 hover:text-purple-600 text-sm flex items-center transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
            <span className="text-gray-400">|</span>
            <Link 
              href="https://github.com/jessunited/formobbin"
              className="text-gray-700 hover:text-purple-600 text-sm flex items-center transition-all duration-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub Repository
            </Link>
          </div>
        </div>
      </header>
      
      {/* Content */}
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Project Motivation */}
          <section className="space-y-4" id="motivation">
            <h2 className="text-2xl font-semibold text-gray-800">Project Motivation</h2>
            <div className="prose prose-slate max-w-none">
              <p>
                Hey! This is Jess, and I am interested in working for <strong className="text-purple-600">Mobbin!</strong> In my attempt to stand out, 
                I decided to build a project that semi-automates this!
              </p>
              
              <div className="my-4 bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
                <p className="text-gray-500 italic">Project screenshot visualization would appear here</p>
              </div>
            </div>
          </section>
          
          <div className="border-t border-gray-200 my-8"></div>

          {/* Problem & Gaps */}
          <section className="space-y-4" id="problem">
            <h2 className="text-2xl font-semibold text-gray-800">Problem & Gaps Identified</h2>
            <div className="prose prose-slate max-w-none">
              <p>
                I have limited understanding on UX prior to this. but upon research, here's what I understand as core blockers:
              </p>

              <p className="font-medium">Manual UX annotation is <span className="text-red-500">slow, tedious, and inconsistent</span>:</p>
              
              <ul className="list-disc pl-6 space-y-2">
                <li>Humans must manually draw bounding boxes and label metadata for every element.</li>
                <li>It's easy for different people to annotate differently, making it hard to build a reliable searchable UX libraries.</li>
                <li>It's extremely repetitive and mundane, + human mistakes.</li>
              </ul>

              <p className="font-medium">This project bridges the gap:</p>
              
              <ul className="list-disc pl-6 space-y-2">
                <li>It <strong>pre-draws bounding boxes</strong> and <strong>pre-generates metadata</strong> using VLMs (Vision Language Models) and LLMs (Large Language Models).</li>
                <li>It <strong>elevates humans into a reviewer role</strong> — humans check and refine, not annotate from scratch.</li>
                <li>It allows <strong>annotations to be more consistent</strong> by grounding outputs to a structured framework (Mobbin-style references).</li>
              </ul>

              <p className="font-medium">→ make UX annotation faster, more consistent, and less mundane</p>
            </div>
          </section>
          
          <div className="border-t border-gray-200 my-8"></div>

          {/* High Level Flow + Tech Stack */}
          <section className="space-y-4" id="flow">
            <h2 className="text-2xl font-semibold text-gray-800">High Level Flow + Tech Stack</h2>
            <div className="prose prose-slate max-w-none">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300 border rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-gradient-to-r from-purple-50 to-indigo-50">
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Step</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Tool</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Description</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">1. Preprocessing</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Resize and pad screenshots to fixed 800x800 size</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">2. Extract High-Level UI</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">GPT-4.1</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Identify main UI components (cards, headers, sections)</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">3. Extract Elements</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Claude 3.7</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Break down components into inner UI elements</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">4. Optimize VLM Prompts</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Claude 3.7</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Generate spatially grounded descriptions for detection</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">5. Element Detection</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">MoonDream VLM</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Outputs coordinates of bounding boxes</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">6. Validation</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">GPT-4.1</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Verify bounding box accuracy (Currently unstable)</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">7. Metadata Extraction</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">GPT-4.1</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Extract structured UX metadata (ie: pattern, facet tags, states, flow position, interactions)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <p className="mt-6 font-medium">Built for serverless deployment with:</p>
              
              <ul className="list-disc pl-6 space-y-1 marker:text-purple-500">
                <li><strong>Next.js</strong> + <strong>ShadCN UI + V0 dev</strong></li>
                <li><strong>Vercel</strong> - deployment</li>
                <li><strong>Supabase</strong></li>
                <li><strong>Claude & OpenAI</strong> – LLMs for metadata + reasoning</li>
                <li><strong>MoonDream</strong> – VLM for bounding box detection</li>
              </ul>
            </div>
          </section>
          
          <div className="border-t border-gray-200 my-8"></div>

          {/* Key Challenges */}
          <section className="space-y-4" id="challenges">
            <h2 className="text-2xl font-semibold text-gray-800">Key Challenges I Faced</h2>
            
            <div className="space-y-8">
              {/* Challenge 1 */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                <h3 className="text-xl font-medium mb-4 flex items-center text-gray-800">
                  <span className="bg-gradient-to-r from-purple-400 to-indigo-500 text-white p-1 rounded mr-2 w-7 h-7 flex items-center justify-center">🛠</span>
                  Bounding Box Stability with Repeated UI Elements
                </h3>
                
                <div className="prose prose-slate max-w-none">
                  <p className="font-semibold text-gray-800">Problem:</p>
                  
                  <p>
                    One of the biggest headaches was getting <strong>stable, accurate bounding boxes</strong> from the VLM, 
                    especially in screens that contained <strong>repetitive visual elements</strong> — ie: quantity control buttons 
                    in carts, transaction lists, or toggles that appear multiple times in a UI.
                  </p>
                  
                  <p>
                    Because these elements are visually identical and often positioned closely, the model would either:
                  </p>
                  
                  <ul className="list-disc pl-6 marker:text-purple-500">
                    <li>Draw multiple overlapping boxes on the same component, or</li>
                    <li>highlight the wrong element.</li>
                  </ul>
                  
                  <p>This made the results unreliable and difficult to validate downstream.</p>
                  
                  <div className="my-4 bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-500 italic text-center">Before: Multiple overlapping bounding boxes</p>
                  </div>
                  
                  <p className="font-semibold text-gray-800">Solution:</p>
                  
                  <p>
                    I experimented with <strong>spatially anchored prompts</strong> — providing the VLM with 
                    <strong>contextual spatial references</strong> to disambiguate repeated items.
                  </p>
                  
                  <p>
                    <strong>BUT</strong> too much anchoring also caused the model to focus on the wrong element.
                  </p>
                  
                  <p>
                    There were a lot of trial and error, adjusting anchor granularity. Still not 100% perfect, 
                    but greatly increases the chances of detecting the right boxes.
                  </p>
                  
                  <div className="my-4 bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-500 italic text-center">After: Properly identified individual elements</p>
                  </div>
                </div>
              </div>
              
              {/* Challenge 2 */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                <h3 className="text-xl font-medium mb-4 flex items-center text-gray-800">
                  <span className="bg-gradient-to-r from-purple-400 to-indigo-500 text-white p-1 rounded mr-2 w-7 h-7 flex items-center justify-center">🛠</span>
                  VLM Capability Limitations
                </h3>
                
                <div className="prose prose-slate max-w-none">
                  <p className="font-semibold text-gray-800">Problem:</p>
                  
                  <p>
                    I used MoonDream because it's accessible & free — but it's not the most accurate or consistent model available. 
                    In complex screens, it still struggled with spatial reasoning.
                  </p>
                  
                  <p className="font-semibold text-gray-800">Solution:</p>
                  
                  <p>I worked around this by:</p>
                  
                  <ul className="list-disc pl-6 marker:text-purple-500">
                    <li><strong>Prompting MoonDream with richer context</strong></li>
                    <li><strong>Post-processing,</strong> <strong>layer LLM calls on top of VLM outputs</strong> to validate or relabel components.</li>
                  </ul>
                  
                  <p>
                    This isn't perfect, but it gives passable results for demo purposes. Long-term, replacing MoonDream with a 
                    state-of-the-art model like Qwen 2.5VL would significantly improve reliability, and would solve the problem stated above.
                  </p>
                  
                  <p>A resource I found:</p>
                  
                  <div className="my-2">
                    <Link 
                      href="https://github.com/roboflow/notebooks/blob/main/notebooks/zero-shot-object-detection-with-qwen2-5-vl.ipynb"
                      className="text-purple-600 hover:text-indigo-700 hover:underline transition-colors duration-200"
                      target="_blank"
                    >
                      https://github.com/roboflow/notebooks/blob/main/notebooks/zero-shot-object-detection-with-qwen2-5-vl.ipynb
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          <div className="border-t border-gray-200 my-8"></div>

          {/* Why This Matters */}
          <section className="space-y-4" id="why-it-matters">
            <h2 className="text-2xl font-semibold text-gray-800">Why I think this Matters for Mobbin</h2>
            
            <div className="prose prose-slate max-w-none">
              <p>
                In Mobbin's mission to build a UX reference library that is <strong className="text-purple-600">searchable, reusable, and structured</strong> in 
                a way that saves designers and builders time:
              </p>
              
              <ul className="list-disc pl-6 space-y-2 marker:text-purple-500">
                <li>High-quality annotation <strong>directly impacts search relevance</strong>, pattern discovery, and UX benchmarking.</li>
                <li>Inconsistent or incomplete labeling makes the dataset noisy and harder to filter.</li>
                <li>Scaling Mobbin's library <strong>requires a faster, more reliable way to annotate without sacrificing quality.</strong></li>
              </ul>
              
              <p>I think this project directly aligns with that need:</p>
              
              <ul className="list-disc pl-6 marker:text-purple-500">
                <li>It automates the heavy lifting, <strong>keeps humans in control</strong>, and allows <strong>higher consistency</strong> across the entire dataset.</li>
              </ul>
            </div>
          </section>
          
          <div className="border-t border-gray-200 my-8"></div>

          {/* Lessons Learned */}
          <section className="space-y-4" id="lessons">
            <h2 className="text-2xl font-semibold text-gray-800">What I Learned Building This</h2>
            
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-5 rounded-lg border border-gray-200 transition-all duration-300 hover:shadow-md">
                <h3 className="text-lg font-medium mb-2 text-gray-800">Attention to Detail is Everything</h3>
                <p>
                  Small prompt phrasing changes or minor bounding box offsets can make or break detection quality.
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-5 rounded-lg border border-gray-200 transition-all duration-300 hover:shadow-md">
                <h3 className="text-lg font-medium mb-2 text-gray-800">Supabase Buckets!</h3>
                <p>
                  This was my first time working with Supabase storage. Figuring out the flow — generating signed URLs was fun. 
                  But midway through development, I had a mini jumpscare on the amount of storage requests im sending. 😂 
                  so to fix it, I added a simple <strong>in-memory cache</strong> for signed URLs. bit overkill, but at 
                  least I im not doing 1000+ requests every few minutes :D
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center justify-center">
                    <p className="text-gray-500 italic">Supabase storage requests graph</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center justify-center">
                    <p className="text-gray-500 italic">Cache implementation</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-5 rounded-lg border border-gray-200 transition-all duration-300 hover:shadow-md">
                <h3 className="text-lg font-medium mb-2 text-gray-800">Vercel's 60-Second Serverless Timeout (Hard Lesson Learned)</h3>
                <p>
                  Didn't realize Vercel had a hard 60-second timeout on functions until I started testing directly on deployment. 
                  With multiple prompts and model calls chaining together, it was impossible to finish within the time limit.
                </p>
                <p className="mt-2">
                  I tried building a <strong>serverless queue-based API</strong> to break them into smaller chunks, but .. 
                  the AI code bloat got messy fast. After 4 hours of trying, I made the call to ditch and simplify.
                </p>
                
                <div className="mt-4 bg-white p-4 rounded-lg border border-gray-200 flex items-center justify-center">
                  <p className="text-gray-500 italic">Vercel timeout error screenshot</p>
                </div>
                
                <p className="mt-4">
                  Honestly, no live demo is painful, but, still a really good lesson.
                </p>
              </div>
            </div>
          </section>
          
          <div className="border-t border-gray-200 my-8"></div>

          {/* Future Directions */}
          <section className="space-y-4" id="future-directions">
            <h2 className="text-2xl font-semibold text-gray-800">Where I See This Going Next</h2>
            
            <div className="prose prose-slate max-w-none">
              <ul className="list-disc pl-6 space-y-4 marker:text-purple-500">
                <li>
                  <strong className="text-purple-600">Use stronger VLMs</strong>: Swap out MoonDream for Qwen 2.5 or another top-tier model for more reliable detection. 
                  If we leverage on hosting open source LLM, VLM models, this entire pipeline can be very scalable and low cost.
                </li>
                <li>
                  <strong className="text-purple-600">Integrate Mobbin's UX taxonomy</strong>: Formalize metadata extraction using Mobbin's internal guidelines. 
                  This will improve consistency → more searchable UX library
                </li>
                <li>
                  <strong className="text-purple-600">Build a collaborative CRUD UI</strong>: Let UX annotator to adjust, draw, and approve annotations directly — 
                  streamline review workflows, and generate high-quality, validated datasets for ML training.
                </li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
} 