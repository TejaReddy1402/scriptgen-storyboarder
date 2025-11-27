import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- API Configuration ---

const ai = new GoogleGenAI({
  apiKey: process.env.API_KEY || "", 
});

// --- Icons (SVG) ---
const FilmIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="2.18" ry="2.18"/><path d="M7 2v20"/><path d="M17 2v20"/><path d="M2 12h20"/><path d="M2 7h5"/><path d="M2 17h5"/><path d="M17 17h5"/><path d="M17 7h5"/></svg>
);

const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
);

const RefreshIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
);

const ClapperboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.2 6 3 11l-.9-2.4c-.5-1.1.2-2.4 1.3-2.9l13.2-4.8c1.1-.5 2.4.2 2.9 1.3l.7 1.8z"/><path d="m6.2 5.3 3.1 3.9"/><path d="m12.4 3.4 3.1 4"/><path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8Z"/></svg>
);

const WandIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8 19 13"/><path d="M15 9h0"/><path d="M17.8 6.2 19 5"/><path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/></svg>
);

const MoveIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="5 9 2 12 5 15" /><polyline points="9 5 12 2 15 5" /><polyline points="19 9 22 12 19 15" /><polyline points="15 19 12 22 9 19" /><line x1="2" x2="22" y1="12" y2="12" /><line x1="12" x2="12" y1="2" y2="22" /></svg>
);

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
);

// --- Types ---
interface Shot {
  id: string;
  shotNumber: number;
  action: string;
  visualPrompt: string;
  cameraAngle: string;
  shotType: string;
  cameraMovement: string;
  lighting: string;
  imageUrl?: string;
  isGeneratingImage: boolean;
  error?: boolean; 
}

const DEFAULT_SCRIPT = `INT. SPACESHIP COCKPIT - NIGHT

The cockpit is a mess of sparking wires and flashing red alarms. 

COMMANDER ZARA (30s, fierce determination) struggles with the yoke. Sweat drips down her forehead.

Through the viewport, a massive PURPLE NEBULA swirls violently.

ZARA
Hold together, old girl...

She slams a glowing blue lever. The ship shudders violently.
External view: The sleek silver ship dives straight into the heart of the nebula.`;

// --- Helpers ---

// Converting File to Base64 for Gemini
const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// --- API Logic ---

// 1. Analyzes the uploaded reference image
const analyzeReferenceImage = async (base64Image: string): Promise<string> => {
    const prompt = "Describe the physical appearance of the main subject in this image in detail (clothing, face, colors, style) so it can be used as a character description for an image generation prompt. Keep it under 50 words.";
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType: "image/jpeg", data: base64Image } }
                    ]
                }
            ]
        });
        return response.text || "";
    } catch (e) {
        console.error("Image analysis failed", e);
        return "";
    }
}

// 2. Analyze Script 
const analyzeScript = async (script: string, referenceContext: string = ""): Promise<Omit<Shot, 'id' | 'isGeneratingImage' | 'error'>[]> => {
  if (!process.env.API_KEY) throw new Error("Gemini API Key is missing.");

  const referenceInstruction = referenceContext 
    ? `IMPORTANT: One of the characters or objects in the script matches this visual description: "${referenceContext}". Ensure the 'visualPrompt' for any shots involving this subject includes these details to maintain consistency.`
    : "";

  const prompt = `
    You are a world-class cinematographer and storyboard artist. 
    Analyze the following script segment and break it down into a sequence of 4-8 key visual shots for a storyboard.
    
    ${referenceInstruction}

    IMPORTANT: Return ONLY a valid JSON array.
    
    Format example:
    [{"shotNumber": 1, "action": "...", "visualPrompt": "...", "cameraAngle": "...", "shotType": "...", "cameraMovement": "...", "lighting": "..."}]

    Script:
    ${script}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        { role: "user", parts: [{ text: prompt }] }
      ],
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("No text returned from AI");

    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanText);

  } catch (e: any) {
    console.error("Script analysis error:", e);
    throw new Error(`Analysis failed: ${e.message || "Unknown error"}`);
  }
};

// 3. Generate Image (Using Pollinations.ai with FLUX-REALISM for photorealistic results)
const generateImageForShot = async (visualPrompt: string): Promise<string> => {
  try {
    // We use a random seed to ensure uniqueness
    const seed = Math.floor(Math.random() * 1000000);
    
    // Construct prompt to force photorealism
    const enhancedPrompt = `Raw 8k photo, cinematic still, hyperrealistic, highly detailed, sharp focus, dramatic lighting, shot on 35mm film, ${visualPrompt}`;
    const encodedPrompt = encodeURIComponent(enhancedPrompt);
    
    // MODEL: Using 'flux-realism' to avoid anime style
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&model=flux-realism&nologo=true&seed=${seed}`;

    // 2. Fetch the image
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Pollinations API Error: ${response.statusText}`);
    }

    // 3. Convert to Blob -> Object URL
    const imageBlob = await response.blob();
    return URL.createObjectURL(imageBlob);

  } catch (e: any) {
    console.error("Image generation error:", e);
    throw new Error("Failed to generate image");
  }
};

// --- Components ---

interface SceneCardProps {
  shot: Shot;
  onRegenerate: (id: string) => void;
}

const SceneCard: React.FC<SceneCardProps> = ({ shot, onRegenerate }) => {
  return (
    <div className="bg-neutral-800 rounded-xl overflow-hidden shadow-lg border border-neutral-700 flex flex-col h-full animate-in fade-in duration-500">
      <div className="relative w-full aspect-video bg-black group">
        {shot.imageUrl ? (
          <>
            <img 
              src={shot.imageUrl} 
              alt={`Shot ${shot.shotNumber}: ${shot.action}`} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button 
                onClick={() => onRegenerate(shot.id)}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full flex items-center gap-2 transition-colors border border-white/20"
              >
                <RefreshIcon /> Regenerate
              </button>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500 p-6 text-center border-b border-neutral-800 bg-neutral-800">
             {shot.isGeneratingImage ? (
               <>
                 <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                 <span className="text-sm animate-pulse font-medium text-amber-500">Developing Photo...</span>
               </>
             ) : shot.error ? (
               <div className="flex flex-col items-center text-red-400/80">
                  <div className="mb-2 text-xl">⚠️</div>
                  <span className="text-xs font-medium mb-2">Generation Failed</span>
                  <button 
                    onClick={() => onRegenerate(shot.id)}
                    className="text-[10px] bg-neutral-700 hover:bg-neutral-600 text-white px-2 py-1 rounded border border-neutral-600 transition-colors"
                  >
                    Retry
                  </button>
               </div>
             ) : (
               <div className="flex flex-col items-center">
                  <CameraIcon />
                  <span className="text-xs mt-2">Waiting...</span>
               </div>
             )}
          </div>
        )}
        
        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-amber-400 text-xs font-bold px-2 py-1 rounded border border-amber-500/30">
          SHOT {shot.shotNumber}
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <div className="flex items-start justify-between mb-2">
          <div className="flex gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider font-semibold bg-neutral-700 text-neutral-300 px-1.5 py-0.5 rounded">
              {shot.shotType}
            </span>
            <span className="text-[10px] uppercase tracking-wider font-semibold bg-neutral-700 text-neutral-300 px-1.5 py-0.5 rounded">
              {shot.cameraAngle}
            </span>
            <span className="text-[10px] uppercase tracking-wider font-semibold bg-indigo-900/30 text-indigo-200 border border-indigo-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
              <MoveIcon />
              {shot.cameraMovement}
            </span>
          </div>
        </div>
        
        <p className="text-sm text-neutral-200 mb-4 leading-relaxed flex-grow">
          {shot.action}
        </p>

        <div className="mt-auto pt-3 border-t border-neutral-700/50">
           <p className="text-[10px] text-neutral-500 italic line-clamp-2">
             "{shot.visualPrompt}"
           </p>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [script, setScript] = useState(DEFAULT_SCRIPT);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [shots, setShots] = useState<Shot[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Reference Image State
  const [refImage, setRefImage] = useState<string | null>(null); // Base64 for display
  const [refDescription, setRefDescription] = useState<string | null>(null); 
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const shotsRef = useRef<Shot[]>([]);

  useEffect(() => {
    shotsRef.current = shots;
  }, [shots]);

  // Queue Processing
  const processQueue = async () => {
    const MAX_CONCURRENT = 1; 
    const currentGenerating = shotsRef.current.filter(s => s.isGeneratingImage).length;
    if (currentGenerating >= MAX_CONCURRENT) return;

    const shotToProcess = shotsRef.current.find(s => !s.imageUrl && !s.isGeneratingImage && !s.error);
    
    if (shotToProcess) {
      setShots(prev => prev.map(s => s.id === shotToProcess.id ? { ...s, isGeneratingImage: true } : s));
      try {
        const imageUrl = await generateImageForShot(shotToProcess.visualPrompt);
        setShots(prev => prev.map(s => s.id === shotToProcess.id ? { ...s, imageUrl, isGeneratingImage: false } : s));
      } catch (e: any) {
        console.error("Image Gen Error:", e);
        setShots(prev => prev.map(s => s.id === shotToProcess.id ? { ...s, isGeneratingImage: false, error: true } : s));
      }
    }
  };

  useEffect(() => {
    const hasPending = shots.some(s => !s.imageUrl && !s.isGeneratingImage && !s.error);
    if (hasPending) {
      processQueue();
    }
  }, [shots]); 

  // Handle Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsAnalyzingImage(true);
      try {
          const base64 = await fileToGenerativePart(file);
          setRefImage(`data:image/jpeg;base64,${base64}`); // For Preview
          
          // Use Gemini to "read" the image
          const description = await analyzeReferenceImage(base64);
          setRefDescription(description);
      } catch (err) {
          console.error("Upload failed", err);
          setError("Failed to analyze reference image");
      } finally {
          setIsAnalyzingImage(false);
      }
  };

  const removeReference = () => {
      setRefImage(null);
      setRefDescription(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerate = async () => {
    if (!script.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    setShots([]); 
    shotsRef.current = [];
    
    try {
      // Pass the analyzed image description to the script analyzer
      const analyzedData = await analyzeScript(script, refDescription || "");
      
      const newShots: Shot[] = analyzedData.map((data, index) => ({
        ...data,
        id: `shot-${Date.now()}-${index}`,
        isGeneratingImage: false,
        error: false
      }));

      setShots(newShots);
    } catch (e: any) {
      console.error("Analysis Error:", e);
      const msg = e.message || JSON.stringify(e);
      setError(`${msg}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRegenerateImage = async (id: string) => {
    const shot = shots.find(s => s.id === id);
    if (!shot) return;
    setShots(prev => prev.map(s => s.id === id ? { ...s, imageUrl: undefined, isGeneratingImage: false, error: false } : s));
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex flex-col font-sans">
      <header className="border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 p-2 rounded-lg text-black">
            <FilmIcon />
          </div>
          <h1 className="text-xl font-bold tracking-tight">ScriptGenAI <span className="text-neutral-500 font-normal">Storyboarder</span></h1>
        </div>
        <div className="flex items-center gap-4 text-sm text-neutral-400">
          {/* Empty API Text Area */}
        </div>
      </header>

      <main className="flex-grow flex flex-col lg:flex-row overflow-hidden h-[calc(100vh-73px)]">
        <div className="w-full lg:w-[400px] xl:w-[500px] flex flex-col border-r border-neutral-800 bg-neutral-900/50">
          <div className="p-6 flex-grow flex flex-col min-h-0">
            {/* Script Input Section */}
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Script</h2>
              <button 
                onClick={() => setScript(DEFAULT_SCRIPT)} 
                className="text-xs text-amber-500 hover:text-amber-400 transition-colors"
              >
                Load Example
              </button>
            </div>
            
            <div className="relative h-[40%] mb-6 group">
              <textarea 
                value={script}
                onChange={(e) => setScript(e.target.value)}
                className="w-full h-full bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 text-sm leading-relaxed resize-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition-all font-mono text-neutral-300 placeholder-neutral-600"
                placeholder="Paste your screenplay scene here..."
              />
              <div className="absolute bottom-4 right-4 pointer-events-none text-neutral-600 opacity-50">
                <ClapperboardIcon />
              </div>
            </div>

            {/* Character Reference Upload Section */}
            <div className="flex items-center justify-between mb-2">
                 <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Character/Prop Reference</h2>
            </div>
            <div className="bg-neutral-800/50 border border-neutral-700 border-dashed rounded-xl p-4 flex flex-col items-center justify-center relative min-h-[120px]">
                {refImage ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                        <img src={refImage} alt="Reference" className="max-h-32 rounded-lg border border-neutral-600 shadow-sm" />
                        <button 
                            onClick={removeReference}
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow hover:bg-red-600 transition-colors"
                        >
                            <TrashIcon />
                        </button>
                        {isAnalyzingImage && (
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-lg backdrop-blur-sm">
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mb-2"></div>
                                <span className="text-xs text-white font-medium">Analyzing...</span>
                            </div>
                        )}
                        {!isAnalyzingImage && refDescription && (
                            <div className="absolute bottom-0 inset-x-0 bg-black/70 p-2 text-[10px] text-neutral-300 truncate rounded-b-lg">
                                AI: "{refDescription}"
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <input 
                            type="file" 
                            accept="image/*" 
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="text-neutral-500 mb-2">
                           <UploadIcon />
                        </div>
                        <p className="text-xs text-neutral-400 text-center font-medium">Click to upload an actor or object photo</p>
                        <p className="text-[10px] text-neutral-600 text-center mt-1">AI will analyze looks for consistency</p>
                    </>
                )}
            </div>
          </div>

          <div className="p-6 border-t border-neutral-800 bg-neutral-900 z-10">
             <button 
              onClick={handleGenerate}
              disabled={isAnalyzing || isAnalyzingImage || !script.trim()}
              className={`w-full py-4 rounded-xl font-bold text-black flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] ${
                isAnalyzing 
                  ? 'bg-neutral-700 cursor-not-allowed text-neutral-400' 
                  : 'bg-amber-500 hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
              }`}
             >
               {isAnalyzing ? (
                 <>
                   <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                   Analyzing Script...
                 </>
               ) : (
                 <>
                   <WandIcon />
                   Generate Storyboard
                 </>
               )}
             </button>
             {error && (
               <div className="mt-3 p-3 bg-red-900/30 border border-red-500/30 rounded text-red-200 text-xs text-left">
                  <p className="font-bold mb-1">Error:</p>
                  <p className="break-all font-mono">{error}</p>
               </div>
             )}
          </div>
        </div>

        <div className="flex-grow bg-neutral-950 overflow-y-auto p-6 lg:p-10 relative">
          {shots.length === 0 && !isAnalyzing && (
            <div className="h-full flex flex-col items-center justify-center text-neutral-600 opacity-50">
               <div className="w-24 h-24 border-4 border-neutral-800 rounded-2xl mb-6 flex items-center justify-center">
                  <FilmIcon />
               </div>
               <p className="text-lg font-medium">Ready to visualize your story</p>
               <p className="text-sm mt-2">Enter a script, upload a reference (optional), and hit generate</p>
            </div>
          )}

          {shots.length > 0 && (
             <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                 <h2 className="text-2xl font-bold text-white">Storyboard Sequence</h2>
                 <span className="text-neutral-500 text-sm">{shots.length} shots generated</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                {shots.map((shot) => (
                  <SceneCard 
                    key={shot.id} 
                    shot={shot} 
                    onRegenerate={handleRegenerateImage}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);