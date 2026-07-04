
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GoogleGenAI, Modality, Type } from "@google/genai";
import L from 'leaflet';
import 'leaflet.markercluster'; // Import markercluster to extend L
import { Language, Market, NewsArticle, NewsCategory } from './types';
import { TRANSLATIONS, MARKET_DATA, COORDINATES, CITY_STATS, RSS_FEEDS } from './constants';
import { MapPin, Globe, Play, Pause, Radio, Newspaper, Volume2, VolumeX, Search, Mic, Download, Send, MessageSquare, ChevronDown, ChevronUp, X, TrendingUp, RefreshCw, Film, Target, Calculator, Wand2, Zap, Map, Building, Clock, Users, FastForward, DownloadCloud, Settings, LogIn, Share2, Facebook, Twitter, LinkIcon, Check, Coins, Home, Store, Factory, Layers, ArrowRight, BookOpen, Info } from './components/Icons';

// --- EBOOK MOCK DATA ---
const EBOOKS_DATA = {
  VN: [
    { title: "Cha Giàu Cha Nghèo", author: "Robert Kiyosaki", cover: "https://images.unsplash.com/photo-1555449372-5b9390a845ee?auto=format&fit=crop&w=200&q=80", type: "Tư duy" },
    { title: "Luật Đất Đai 2024 (Mới)", author: "Thư Viện Pháp Luật", cover: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=200&q=80", type: "Pháp lý" },
    { title: "Bí Quyết Đầu Tư BĐS", author: "Donald Trump", cover: "https://images.unsplash.com/photo-1550399105-c4db5fb85c18?auto=format&fit=crop&w=200&q=80", type: "Chiến lược" },
    { title: "100 Lời Khuyên Đầu Tư", author: "Chuyên gia BĐS", cover: "https://images.unsplash.com/photo-1591951425328-48c1fe7179cd?auto=format&fit=crop&w=200&q=80", type: "Ebook" }
  ],
  DE: [
    { title: "Rich Dad Poor Dad", author: "Robert Kiyosaki", cover: "https://images.unsplash.com/photo-1555449372-5b9390a845ee?auto=format&fit=crop&w=200&q=80", type: "Mindset" },
    { title: "Immobilienrecht 2024", author: "Gesetzesgrundlagen", cover: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=200&q=80", type: "Recht" },
    { title: "Steuer-Tricks für Vermieter", author: "Alex Fischer", cover: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=200&q=80", type: "Steuern" },
    { title: "Der Immobilien-Investor", author: "Thomas Knedel", cover: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=200&q=80", type: "Strategie" }
  ]
};

const GAMES_DATA = [
  { id: 'g1', title: "Cashflow 101", desc: "Thoát khỏi Rat Race", img: "https://images.unsplash.com/photo-1611996575749-79a3a250f948?auto=format&fit=crop&w=200&q=80", type: "Simulation" },
  { id: 'g2', title: "Cashflow 202", desc: "Kỹ năng đầu tư nâng cao", img: "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=200&q=80", type: "Advanced" }
];

const MINI_PODCASTS = [
  { id: 'mp1', title: "Tư duy triệu phú", duration: "10 min" },
  { id: 'mp2', title: "Quản lý dòng tiền", duration: "15 min" }
];

// --- ARCHIVE VIDEO MOCK DATA ---
const ARCHIVE_VIDEOS = [
  { id: 'v1', title: 'Hội thảo: Dòng tiền 2025 đổ về đâu?', duration: '15:20', views: '12K', img: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=400&q=80', type: 'Seminar' },
  { id: 'v2', title: 'Pháp lý dự án: Những điều cần biết', duration: '08:45', views: '5.3K', img: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=400&q=80', type: 'Shorts' },
  { id: 'v3', title: 'Tư vấn: Mua nhà hay thuê nhà?', duration: '12:10', views: '8.9K', img: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80', type: 'Seminar' },
  { id: 'v4', title: 'Cảnh báo rủi ro đất nền vùng ven', duration: '05:30', views: '22K', img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80', type: 'Shorts' }
];

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const seededRandom = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  return () => {
    h = Math.imul(h ^ h >>> 16, 0x85ebca6b);
    h = Math.imul(h ^ h >>> 13, 0xc2b2ae35);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
};

const FLAG_MAP: Record<string, string> = { VN: '🇻🇳', DE: '🇩🇪', EN: '🇬🇧', VI: '🇻🇳', GB: '🇬🇧' };
const LANG_DISPLAY: Record<Language, { label: string; flag: string }> = {
  VN: { label: 'Tiếng Việt', flag: 'VN' },
  DE: { label: 'Deutsch', flag: 'DE' },
  EN: { label: 'English', flag: 'GB' }
};

type VideoResolution = '720p' | '1080p';
type VideoAspectRatio = '16:9' | '9:16';

interface VideoConfig {
  resolution: VideoResolution;
  aspectRatio: VideoAspectRatio;
}

type AiMode = 'FAST' | 'SEARCH' | 'MAPS' | 'PROJECTS' | 'TV_NEWS';
type PodcastTopic = 'GENERAL' | 'LEGAL' | 'HIGH_YIELD' | 'FORECAST';

const CATEGORIES: { id: NewsCategory, icon: React.FC<{ className?: string }>, labelKey: keyof typeof TRANSLATIONS.VN }[] = [
  { id: 'ALL', icon: Globe, labelKey: 'all' },
  { id: 'LEGAL_TAX', icon: BookOpen, labelKey: 'catLegal' },
  { id: 'INFRASTRUCTURE', icon: Factory, labelKey: 'catInfra' },
  { id: 'INTEREST_BANKS', icon: Coins, labelKey: 'catInterest' },
  { id: 'POLITICS', icon: Building, labelKey: 'catPolitics' },
  { id: 'SOCIO_ECONOMIC', icon: Users, labelKey: 'catSocio' }
];

interface SelectOption {
  value: string;
  label: string;
}

const CustomSelect = ({ 
  label, 
  value, 
  options, 
  onChange, 
  placeholder = "Search...",
  align = 'left' 
}: { 
  label: string; 
  value: string; 
  options: SelectOption[]; 
  onChange: (val: string) => void;
  placeholder?: string;
  align?: 'left' | 'right';
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = options.find(o => o.value === value)?.label || value;
  
  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-1 relative" ref={containerRef}>
        <label className="text-[8px] md:text-[9px] font-bold text-white uppercase tracking-wider pl-1 shadow-sm block select-none cursor-default">{label}</label>
        
        <button 
            onClick={() => setIsOpen(!isOpen)}
            className="w-full bg-white text-slate-900 font-bold text-xs md:text-sm pl-3 md:pl-4 pr-8 md:pr-10 py-2 md:py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-400 outline-none hover:bg-slate-50 transition-all shadow-md text-left flex items-center justify-between min-w-[120px] md:min-w-[160px]"
        >
            <span className="truncate block">{selectedLabel}</span>
            <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
            <div className={`absolute top-full ${align === 'right' ? 'right-0' : 'left-0'} mt-1 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-[5000] animate-scale-up min-w-full w-max max-w-[85vw] md:max-w-[260px]`}>
                <div className="p-2 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"/>
                        <input 
                            autoFocus
                            type="text" 
                            placeholder={placeholder}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-8 pr-3 text-xs font-bold outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-700 placeholder:text-slate-400"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
                
                <div className="max-h-[180px] md:max-h-[250px] overflow-y-auto custom-scrollbar p-1">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => { onChange(opt.value); setIsOpen(false); setSearch(''); }}
                                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-between group ${opt.value === value ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                            >
                                <span className="truncate mr-2">{opt.label}</span>
                                {opt.value === value && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0"/>}
                            </button>
                        ))
                    ) : (
                        <div className="px-4 py-6 text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Không tìm thấy</p>
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default function App() {
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('app-lang') as Language) || 'VN');
  const [market, setMarket] = useState<Market>('VN');
  const [city, setCity] = useState<string>(MARKET_DATA['VN'].cities[0]);
  const [district, setDistrict] = useState<string>(MARKET_DATA['VN'].districts["Hà Nội"]?.[0] || MARKET_DATA['VN'].districts[MARKET_DATA['VN'].cities[0]][0]);
  
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersLayerRef = useRef<any | null>(null);
  const projectMarkerRef = useRef<L.Marker | null>(null);
  const newsMarkerRef = useRef<L.Marker | null>(null);

  // Audio Context
  const audioContextRef = useRef<AudioContext | null>(null);

  // Briefing 60s States
  const [isBriefingGenerating, setIsBriefingGenerating] = useState(false);
  const [isBriefingPlaying, setIsBriefingPlaying] = useState(false);
  const [briefingProgress, setBriefingProgress] = useState(0);
  const briefingAudioRef = useRef<AudioBufferSourceNode | null>(null);
  const briefingGainRef = useRef<GainNode | null>(null);
  const [briefingVolume, setBriefingVolume] = useState(0.8);

  // Daily 30m Podcast States
  const [isPodcastGenerating, setIsPodcastGenerating] = useState(false);
  const [isPodcastPlaying, setIsPodcastPlaying] = useState(false);
  const [podcastError, setPodcastError] = useState<string | null>(null);
  const [podcastProgress, setPodcastProgress] = useState(0);
  const [podcastDuration, setPodcastDuration] = useState("30:00");
  const [podcastCurrentTime, setPodcastCurrentTime] = useState("00:00");
  const [podcastTopic, setPodcastTopic] = useState<PodcastTopic>('GENERAL');
  const [podcastSpeed, setPodcastSpeed] = useState(1);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  
  const podcastAudioRef = useRef<AudioBufferSourceNode | null>(null);
  const podcastGainRef = useRef<GainNode | null>(null);
  const [podcastVolume, setPodcastVolume] = useState(0.8);

  // News & Audio States
  const [feedNews, setFeedNews] = useState<NewsArticle[]>([]);
  const [isFeedLoading, setIsFeedLoading] = useState(false);
  const [playingNewsId, setPlayingNewsId] = useState<string | null>(null);
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  const newsAudioRef = useRef<AudioBufferSourceNode | null>(null);
  const newsGainRef = useRef<GainNode | null>(null);
  const [newsVolume, setNewsVolume] = useState(1.0);
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>('ALL');


  // Share State
  const [activeShareId, setActiveShareId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Veo Video Generation States
  const [isVeoGenerating, setIsVeoGenerating] = useState(false);
  const [veoVideoUrl, setVeoVideoUrl] = useState<string | null>(null);
  const [generatingVideoId, setGeneratingVideoId] = useState<string | null>(null);
  const [currentVideoTitle, setCurrentVideoTitle] = useState("AI Video Generator Ready");
  
  // Video Config Modal State
  const [showVideoConfigModal, setShowVideoConfigModal] = useState(false);
  const [videoConfigTarget, setVideoConfigTarget] = useState<{ type: 'MAIN' | 'NEWS', news?: NewsArticle } | null>(null);
  const [videoSettings, setVideoSettings] = useState<VideoConfig>({ resolution: '720p', aspectRatio: '16:9' });

  // Calculator Modal State
  const [showCalcModal, setShowCalcModal] = useState(false);
  const [calcIncome, setCalcIncome] = useState(5000);
  const [calcExpenses, setCalcExpenses] = useState(3000);
  const [calcSavings, setCalcSavings] = useState(0);

  // Login Modal State
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Feedback Modal State
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  // Settings Modal State
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // AI Market Intelligence States
  const [isAiPanelExpanded, setIsAiPanelExpanded] = useState(false); // Ensure it is collapsed by default
  const [userQuery, setUserQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  // Default to PROJECTS mode to auto-load content
  const [aiMode, setAiMode] = useState<AiMode>('PROJECTS');
  const [tvNewsVideoUrl, setTvNewsVideoUrl] = useState<string | null>(null);

  // Investment Goals States
  const [selectedGoals, setSelectedGoals] = useState<string[]>(() => {
    const saved = localStorage.getItem('user-investment-goals');
    return saved ? JSON.parse(saved) : [];
  });
  const [isGoalsSaved, setIsGoalsSaved] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [showGoalReminder, setShowGoalReminder] = useState(false);

  // Video Player States
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoVolume, setVideoVolume] = useState(0.8);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);

  // Dropdown & Search States
  const [showMarketDropdown, setShowMarketDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchMarketFilter, setSearchMarketFilter] = useState<'ALL' | Market>('ALL');

  const [selectedNews, setSelectedNews] = useState<NewsArticle | null>(null);

  // Price Alert / Watched properties state
  const [watchedProperties, setWatchedProperties] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('watched-properties');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  // Image Editing States
  const [imageEditPrompt, setImageEditPrompt] = useState('');
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);

  // Real-time Market Data Simulation with 4 Categories
  const [liveMetrics, setLiveMetrics] = useState({
    apt: { price: 0, rent: 0, trend: 'stable' as 'up' | 'down' | 'stable' },
    house: { price: 0, rent: 0, trend: 'stable' as 'up' | 'down' | 'stable' },
    land: { price: 0, rent: 0, trend: 'stable' as 'up' | 'down' | 'stable' },
    shophouse: { price: 0, rent: 0, trend: 'stable' as 'up' | 'down' | 'stable' },
    occupancy: 81.5
  });

  const t = TRANSLATIONS[lang];
  const currentStats = CITY_STATS[city] || (market === 'VN' ? CITY_STATS["Hà Nội"] : CITY_STATS["Berlin"]);

  // --- DERIVED STATE ---
  const currentNews = useMemo(() => {
    return feedNews.length > 0 ? feedNews : MARKET_DATA[market].news;
  }, [feedNews, market]);

  // Session Counting for Goals Reminder
  useEffect(() => {
    const count = parseInt(localStorage.getItem('app_session_count') || '0', 10);
    const newCount = count + 1;
    localStorage.setItem('app_session_count', newCount.toString());

    // Check goals
    const savedGoals = localStorage.getItem('user-investment-goals');
    // Show reminder if no goals saved AND session count > 2
    if ((!savedGoals || JSON.parse(savedGoals).length === 0) && newCount > 2) {
        setShowGoalReminder(true);
    }
  }, []);

  const getAlertBtnText = (isWatched: boolean, l: Language) => {
    if (l === 'VN') return isWatched ? '🔔 Tắt cảnh báo' : '🔔 Đặt cảnh báo giá';
    if (l === 'DE') return isWatched ? '🔔 Alarm aus' : '🔔 Preisalarm setzen';
    return isWatched ? '🔔 Remove Alert' : '🔔 Set Price Alert';
  };

  useEffect(() => {
    const handlePopupClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const btn = target.closest('.watch-prop-btn');
      if (btn) {
        const propId = btn.getAttribute('data-prop-id');
        if (propId) {
          setWatchedProperties(prev => {
            const isCurrentlyWatched = prev.includes(propId);
            const next = isCurrentlyWatched ? prev.filter(id => id !== propId) : [...prev, propId];
            localStorage.setItem('watched-properties', JSON.stringify(next));
            
            const btnEl = btn as HTMLButtonElement;
            const updatedIsWatched = !isCurrentlyWatched;
            btnEl.innerHTML = getAlertBtnText(updatedIsWatched, lang);
            if (updatedIsWatched) {
              btnEl.classList.remove('bg-slate-100', 'hover:bg-slate-200', 'text-slate-700');
              btnEl.classList.add('bg-amber-500', 'hover:bg-amber-600', 'text-white');
            } else {
              btnEl.classList.remove('bg-amber-500', 'hover:bg-amber-600', 'text-white');
              btnEl.classList.add('bg-slate-100', 'hover:bg-slate-200', 'text-slate-700');
            }
            return next;
          });
        }
      }
    };
    document.addEventListener('click', handlePopupClick);
    return () => document.removeEventListener('click', handlePopupClick);
  }, [lang]);

  // --- AUDIO CONTROL FUNCTIONS ---
  const stopBriefing = () => {
    if (briefingAudioRef.current) {
        try { briefingAudioRef.current.stop(); } catch(e) {}
        briefingAudioRef.current = null;
    }
    setIsBriefingPlaying(false);
    setBriefingProgress(0);
    setIsBriefingGenerating(false);
  };

  const stopNewsAudio = () => {
    if (newsAudioRef.current) {
        try { newsAudioRef.current.stop(); } catch(e) {}
        newsAudioRef.current = null;
    }
    setPlayingNewsId(null);
  };

  const stopPodcast = () => {
    if (podcastAudioRef.current) {
        try { podcastAudioRef.current.stop(); } catch(e) {}
        podcastAudioRef.current = null;
    }
    setIsPodcastPlaying(false);
  };

  useEffect(() => {
    localStorage.setItem('app-lang', lang);
  }, [lang]);

  // Handle outside click to close share menu
  useEffect(() => {
    const handleClickOutside = () => setActiveShareId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // --- AUTO PROJECT ANALYSIS ON LOAD ---
  useEffect(() => {
    // Only run if we are in PROJECTS mode and no response yet (initial load)
    if (aiMode === 'PROJECTS' && !aiResponse) {
        // Short timeout to ensure map and components are ready
        const timer = setTimeout(() => {
            handleProjectAnalysis();
        }, 800);
        return () => clearTimeout(timer);
    }
  }, [aiMode, city, district]); // Dependencies: if city/district changes and mode is projects, we might want to refresh manually, but here we trigger if empty.

  const handleProjectAnalysis = async () => {
     if (isAiProcessing) return;
     setIsAiProcessing(true);
     setAiResponse('');
     setAiMode('PROJECTS');
     setTvNewsVideoUrl(null); // Reset TV News if switching
     
     // Remove previous project marker
     if (projectMarkerRef.current && mapRef.current) {
        mapRef.current.removeLayer(projectMarkerRef.current);
        projectMarkerRef.current = null;
     }

     try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const fullLang = getFullLangName(lang);
        
        let promptTopic = "";
        if (market === 'VN') {
            promptTopic = `infrastructure (Roads, Bridges, Metro, Schools, Hospitals, Malls) and real estate projects`;
        } else {
            promptTopic = `infrastructure (Public Transport, Roads, Schools) and urban development projects`;
        }

        // Updated Prompt to be more comprehensive for the list
        const prompt = `Analyze the current real estate market in ${district}, ${city}. 
        List major NEW ${promptTopic} that are currently planned, approved, or under construction.
        
        Return a JSON object with:
        1. 'name': Name of ONE significant project to highlight on map.
        2. 'coordinates': { 'lat': number, 'lng': number } (Approximate location of that project).
        3. 'summary': A concise, bulleted list (max 100 words) describing 3-4 key infrastructure/projects in ${fullLang}. Use emojis like 🏗️, 🛣️, 🏫 where appropriate.
        
        Output valid JSON only.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });
        
        // PARSE and VALIDATE JSON to prevent crashes
        let result: any = {};
        try {
            const rawText = response.text || "{}";
            const cleanedText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
            result = JSON.parse(cleanedText);
        } catch(parseError) {
            console.error("AI JSON Parse Error", parseError);
            setAiResponse(lang === 'VN' ? "Lỗi phân tích dữ liệu AI." : "Fehler bei der AI-Analyse.");
            return;
        }
        
        // Handle Map Marker
        if (result.coordinates && 
            typeof result.coordinates.lat === 'number' && 
            typeof result.coordinates.lng === 'number' && 
            !isNaN(result.coordinates.lat) && 
            !isNaN(result.coordinates.lng) && 
            mapRef.current) {
            
            // Fly to location
            const { lat, lng } = result.coordinates;
            mapRef.current.flyTo([lat, lng], 15, { duration: 2 });
            
            // Add Special Marker
            const pulseIcon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div class="gps-pulse"></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });
            
            const marker = L.marker([lat, lng], { icon: pulseIcon }).addTo(mapRef.current);
            projectMarkerRef.current = marker;
        }

        // Set the text response
        if (result.summary) {
             setAiResponse(result.summary);
        } else if (result.description) {
             setAiResponse(`📍 **${result.name}**\n${result.description}`);
        } else {
             setAiResponse(lang === 'VN' ? "Không tìm thấy thông tin dự án chi tiết." : "Keine detaillierten Projektinfos gefunden.");
        }

     } catch (e: any) {
        console.warn("Project Scan Error:", e);
        // Robust Error Handling for 429 / Quota Exceeded
        const errorBody = e.error || e;
        const errorMessage = errorBody.message || JSON.stringify(errorBody);
        
        if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("quota")) {
             // FALLBACK TO MOCK DATA SO UI DOESN'T BREAK
             const mockData = lang === 'VN' 
                ? "⚠️ Hệ thống đang quá tải (Quota Exceeded). Đang hiển thị dữ liệu mẫu.\n\n📍 **Vinhomes Global Gate (Dữ liệu mẫu)**\n• Vị trí: Đông Anh, Hà Nội\n• Quy mô: 385ha\n• Loại hình: Biệt thự, Liền kề, Chung cư cao cấp\n• Tình trạng: Đang triển khai hạ tầng"
                : "⚠️ System quota exceeded. Showing demo data.\n\n📍 **Vinhomes Global Gate (Demo)**\n• Location: Dong Anh, Hanoi\n• Scale: 385ha\n• Type: Villas, Townhouses, Apartments\n• Status: Infrastructure under construction";
             
             setAiResponse(mockData);
        } else {
             setAiResponse(lang === 'VN' ? "Lỗi kết nối AI. Vui lòng thử lại." : "AI Verbindungsfehler.");
        }
     } finally {
        setIsAiProcessing(false);
     }
  };

  const handleTvNewsAnalysis = async () => {
      if (isAiProcessing) return;
      setIsAiProcessing(true);
      setAiResponse('');
      setAiMode('TV_NEWS');
      setTvNewsVideoUrl(null); // Reset video state

      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const fullLang = getFullLangName(lang);
          
          const vnChannels = ["@CAFELANDVIETNAM", "@tintuc24hvtc", "@htv-Bantinnhadat-dautu", "@daihanoi-htv"];
          const deChannels = ["@marktcheck", "@derspiegel", "@NDRInfo"];
          const channels = market === 'VN' ? vnChannels : deChannels;

          const prompt = `
            You are a TV News Editor for a Real Estate channel.
            Search specifically for the latest real estate news videos from these YouTube channels: ${channels.join(", ")}.
            Focus on news related to ${city} and ${district} if available, otherwise general market news.
            
            Task:
            1. Find the top 3 most relevant recent stories.
            2. Write a short "Breaking News" TV script (max 80 words) summarizing these stories in ${fullLang}.
            3. Use a professional, broadcast tone.
          `;

          const response = await ai.models.generateContent({
              model: "gemini-3-pro-preview",
              contents: prompt,
              config: { tools: [{ googleSearch: {} }] }
          });

          setAiResponse(response.text || "No news found.");

      } catch (e: any) {
          console.error("TV News Error:", e);
          const errorMsg = e.message || (e.error ? e.error.message : "") || JSON.stringify(e);
          if (errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
             setAiResponse(lang === 'VN' 
                ? "⚠️ Quota giới hạn. Tin tức mẫu: Thị trường BĐS đang ấm dần lên nhờ chính sách mới..." 
                : "⚠️ Quota limit. Demo news: Real estate market warming up due to new policies...");
          } else {
             setAiResponse(lang === 'VN' ? "Không thể tải tin tức TV lúc này." : "TV-News derzeit nicht verfügbar.");
          }
      } finally {
          setIsAiProcessing(false);
      }
  };

  const generateTvNewsVideo = async () => {
      if (!aiResponse || isVeoGenerating) return;
      if ((window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey) { await (window as any).aistudio.openSelectKey(); }
      }

      setIsVeoGenerating(true);
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const prompt = `A professional TV news studio background with a screen showing real estate charts and maps of ${city}. Photorealistic, 4k, broadcast quality. No text on screen.`;
          
          let operation = await ai.models.generateVideos({
              model: 'veo-3.1-fast-generate-preview',
              prompt: prompt,
              config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
          });

          while (!operation.done) {
              await new Promise(r => setTimeout(r, 5000));
              operation = await ai.operations.getVideosOperation({ operation });
          }

          const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
          if (videoUri) {
              const videoRes = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
              const blob = await videoRes.blob();
              setTvNewsVideoUrl(URL.createObjectURL(blob));
          }
      } catch (e: any) {
          console.error("Veo TV Gen Error", e);
          const errorMsg = e.message || (e.error ? e.error.message : "");
          if (errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
             alert(lang === 'VN' ? "Hệ thống Video đang bận (Quota). Vui lòng thử lại sau." : "Video System busy (Quota).");
          } else {
             alert("Lỗi tạo video TV News.");
          }
      } finally {
          setIsVeoGenerating(false);
      }
  };

  // Define handleGeneratePodcast before usage
  const handleGeneratePodcast = async () => {
    if (isPodcastGenerating) return;
    if (isPodcastPlaying) { stopPodcast(); return; }
    stopBriefing();
    stopNewsAudio();

    setIsPodcastGenerating(true);
    setPodcastError(null);
    setDownloadUrl(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const fullLang = getFullLangName(lang);
      
      const officialSources = [
        "https://vnexpress.net/bat-dong-san",
        "https://www.24h.com.vn/bat-dong-san-c792.html",
        "https://finance.vietstock.vn/nganh/60-bat-dong-san.htm",
        "YouTube: Tintuc24hVTC, VTCNewsTintuc, CafeLand Vietnam",
        "YouTube (Germany): NDR Info, Immocation, Immocation Podcast"
      ];

      let focusContext = "";
      if (podcastTopic === 'LEGAL') focusContext = "Focus HEAVILY on legal updates, new laws (Luật Đấtai 2024), and policy changes.";
      else if (podcastTopic === 'HIGH_YIELD') focusContext = "Focus on high-profit potential areas, cash flow strategies, and bargain hunting.";
      else if (podcastTopic === 'FORECAST') focusContext = "Focus on future trends, price predictions for Q3/Q4, and expert forecasts.";
      else focusContext = "General market overview, covering a bit of everything.";

      const podcastPrompt = `
        You are the Producer of "BDS Navigator Daily", a top-tier Real Estate Radio Show.
        
        TASK: Create a lively, multi-speaker dialogue script between:
        1. HOST (Name: Mai - professional, energetic)
        2. EXPERT (Name: Nam - deep voice, analytical, slightly cynical)

        CONTEXT:
        Search specifically for news from the last 24 hours in Vietnam and Germany using these sources:
        ${officialSources.join('\n')}
        
        TOPIC FOCUS: ${focusContext}

        STRUCTURE:
        1. [Intro]: Catchy radio intro with music cues (text only). Host introduces the show.
        2. [Fast News]: Host reads 3 quick headlines.
        3. [Deep Dive]: Expert analyzes the biggest story of the day based on the Topic Focus.
        4. [Debate]: Host asks a tough question, Expert gives a nuanced answer.
        5. [Outro]: Quick sign-off.

        CRITICAL: 
        - Language: STRICTLY ${fullLang}.
        - Format: Write the script clearly with "Host:" and "Expert:" prefixes.
        - Tone: Fast-paced, professional radio style.
      `;
      
      let scriptText = "";
      // RETRY LOGIC FOR QUOTA EXHAUSTED (429) ERROR
      try {
          const searchResponse = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: podcastPrompt,
            config: { tools: [{ googleSearch: {} }] }
          });
          scriptText = searchResponse.text || "";
      } catch (genError: any) {
           console.warn("Primary model failed, attempting fallback to Flash...", genError);
           // Fallback to Flash model if Pro fails (likely due to Quota/429)
           try {
               const searchResponse = await ai.models.generateContent({
                model: "gemini-3-flash-preview", 
                contents: podcastPrompt,
                config: { tools: [{ googleSearch: {} }] }
              });
              scriptText = searchResponse.text || "";
           } catch (fallbackError: any) {
               console.error("Fallback also failed", fallbackError);
               throw fallbackError; // Re-throw to be caught by main catch block
           }
      }

      if (!scriptText) scriptText = "Hiện tại các nguồn dữ liệu đang được cập nhật. Vui lòng thử lại sau ít phút.";
      
      const ttsResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: scriptText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            multiSpeakerVoiceConfig: {
                speakerVoiceConfigs: [
                    { speaker: 'Host', voiceConfig: { prebuiltVoiceConfig: { voiceName: lang === 'VN' ? 'Aoede' : 'Puck' } } },
                    { speaker: 'Expert', voiceConfig: { prebuiltVoiceConfig: { voiceName: lang === 'VN' ? 'Fenrir' : 'Kore' } } } 
                ]
            }
          }
        }
      });

      const audioData = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (audioData) {
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();

        const decoded = decodeBase64(audioData);
        const blob = new Blob([decoded], { type: 'audio/wav' });
        setDownloadUrl(URL.createObjectURL(blob));

        const buffer = await decodeAudioData(decoded, audioContextRef.current, 24000, 1);
        const source = audioContextRef.current.createBufferSource();
        const gainNode = audioContextRef.current.createGain();
        source.buffer = buffer;
        source.playbackRate.value = podcastSpeed;
        gainNode.gain.value = podcastVolume;
        source.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);
        
        source.onended = () => stopPodcast();
        source.start();
        
        podcastAudioRef.current = source;
        podcastGainRef.current = gainNode;
        setIsPodcastPlaying(true);
        
        const startTime = audioContextRef.current.currentTime;
        const duration = buffer.duration;
        const formatTime = (seconds: number) => {
          const m = Math.floor(seconds / 60);
          const s = Math.floor(seconds % 60);
          return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        };
        setPodcastDuration(formatTime(duration));
        
        const progInterval = setInterval(() => {
          if (!podcastAudioRef.current) { clearInterval(progInterval); return; }
          const elapsed = (audioContextRef.current!.currentTime - startTime) * podcastSpeed;
          setPodcastProgress(Math.min((elapsed / duration) * 100, 100));
          setPodcastCurrentTime(formatTime(Math.min(elapsed, duration)));
        }, 200);
      }
    } catch (e: any) { 
        console.error("Podcast Generation Error:", e);
        // Robust Error Extraction
        const errorBody = e.error || e;
        let errorMsg = errorBody.message || JSON.stringify(errorBody);

        // Friendly 429 Error Handler
        if (errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("quota")) {
            errorMsg = lang === 'VN' 
                ? "Hệ thống đang quá tải (Quota Exceeded). Vui lòng thử lại sau giây lát." 
                : (lang === 'DE' ? "System ausgelastet (Quota). Bitte warten Sie." : "System overloaded (Quota). Please wait.");
        }
        setPodcastError(errorMsg);
    } finally { 
        setIsPodcastGenerating(false); 
    }
  };

  // Calc Logic
  useEffect(() => {
    setCalcSavings(Math.max(0, calcIncome - calcExpenses));
  }, [calcIncome, calcExpenses]);

  // Helper Functions for Language & Voice
  const getFullLangName = (l: Language) => {
    if (l === 'VN') return 'Vietnamese';
    if (l === 'DE') return 'German';
    return 'English';
  };

  const getVoiceName = (l: Language) => {
    if (l === 'VN') return 'Aoede'; 
    if (l === 'DE') return 'Fenrir';
    return 'Puck';
  };

  const handleShare = (platform: 'facebook' | 'twitter' | 'copy', news: NewsArticle, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = news.sourceUrl;
    const text = news.title;

    if (platform === 'facebook') {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'twitter') {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'copy') {
        navigator.clipboard.writeText(url);
        setCopiedLink(news.id);
        setTimeout(() => setCopiedLink(null), 2000);
    }
    setActiveShareId(null);
  };

  const toggleShareMenu = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setActiveShareId(activeShareId === id ? null : id);
  };

  // Helper function to auto-categorize news
  const categorizeArticle = (title: string, summary: string): NewsCategory => {
    const text = (title + " " + summary).toLowerCase();
    
    // Legal & Tax
    if (text.match(/luật|thuế|nghị định|thông tư|chính sách|pháp lý|law|tax|decree|policy|gesetz|steuer|regelung/)) {
        return 'LEGAL_TAX';
    }
    // Infrastructure
    if (text.match(/quy hoạch|hạ tầng|cao tốc|sân bay|cầu|đường|metro|vành đai|infrastructure|plan|bridge|road|bau|verkehr/)) {
        return 'INFRASTRUCTURE';
    }
    // Interest & Banks
    if (text.match(/lãi suất|ngân hàng|tín dụng|vay|tỷ giá|interest|bank|credit|rate|zins|kredit/)) {
        return 'INTEREST_BANKS';
    }
    // Politics
    if (text.match(/chính phủ|thủ tướng|bộ trưởng|ủy ban|chỉ đạo|government|ministry|minister|politik|bund/)) {
        return 'POLITICS';
    }
    // Socio-Economic
    if (text.match(/dân số|thu nhập|lao động|việc làm|nhập cư|di dân|population|income|labor|demografie|einkommen/)) {
        return 'SOCIO_ECONOMIC';
    }
    
    // Default fallback
    return 'POLITICS'; 
  };

  // Robust RSS Fetching with Fallback
  const fetchRSS = async (url: string): Promise<string | null> => {
    try {
      const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error('AllOrigins failed');
      const data = await res.json();
      return data.contents;
    } catch (e) {
      try {
        const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
        if (!res.ok) throw new Error('CorsProxy failed');
        return await res.text();
      } catch (e2) {
        console.warn(`RSS Fetch failed for ${url}. Skipping.`);
        return null;
      }
    }
  };

  // Fetch RSS Feeds
  useEffect(() => {
    const fetchNewsFeed = async () => {
      setIsFeedLoading(true);
      setFeedNews([]); 
      
      const feedUrls = RSS_FEEDS[market];
      let allArticles: NewsArticle[] = [];

      try {
        const fetchPromises = feedUrls.map(async (url) => {
            const content = await fetchRSS(url);
            if (!content) return [];

            try {
              const parser = new DOMParser();
              const xml = parser.parseFromString(content, "text/xml");
              const items = xml.querySelectorAll("item");
              
              const parsedItems: NewsArticle[] = [];

              items.forEach((item, index) => {
                const title = item.querySelector("title")?.textContent || "No Title";
                const link = item.querySelector("link")?.textContent || "#";
                const pubDate = item.querySelector("pubDate")?.textContent || "";
                
                let description = item.querySelector("description")?.textContent || "";
                const tempDiv = document.createElement("div");
                tempDiv.innerHTML = description;
                const summary = tempDiv.textContent?.slice(0, 150) + "..." || "";
                const fullContent = tempDiv.innerText || description;

                let imageUrl = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80"; 
                
                const enclosure = item.querySelector("enclosure");
                if (enclosure?.getAttribute("type")?.startsWith("image")) {
                    imageUrl = enclosure.getAttribute("url") || imageUrl;
                } 
                else if (item.getElementsByTagNameNS("*", "content").length > 0) {
                   const media = item.getElementsByTagNameNS("*", "content")[0];
                   if (media.getAttribute("type")?.startsWith("image")) {
                      imageUrl = media.getAttribute("url") || imageUrl;
                   }
                }
                else {
                    const imgTag = tempDiv.querySelector("img");
                    if (imgTag) {
                        imageUrl = imgTag.src;
                    }
                }

                // Auto categorize
                const category = categorizeArticle(title, summary);

                parsedItems.push({
                  id: `${market}-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  title: title.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1'),
                  summary: summary.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1'),
                  content: fullContent.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1'),
                  imageUrl: imageUrl,
                  sourceUrl: link,
                  date: new Date(pubDate).toLocaleDateString(lang === 'VN' ? 'vi-VN' : 'de-DE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
                  category: category
                });
              });

              return parsedItems;
            } catch (err) {
              console.error(`Error parsing RSS ${url}:`, err);
              return [];
            }
        });

        const results = await Promise.all(fetchPromises);
        allArticles = results.flat().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 50);
        
        if (allArticles.length === 0) {
           setFeedNews(MARKET_DATA[market].news);
        } else {
           setFeedNews(allArticles);
        }

      } catch (error) {
        console.error("Global Feed Error:", error);
        setFeedNews(MARKET_DATA[market].news);
      } finally {
        setIsFeedLoading(false);
      }
    };

    fetchNewsFeed();
  }, [market, lang]);

  // Initialize and update live metrics based on selection
  useEffect(() => {
    const stats = CITY_STATS[city] || (market === 'VN' ? CITY_STATS["Hà Nội"] : CITY_STATS["Berlin"]);
    
    // Helper to parse "45-65", "5.5k-8k"
    const parseRawValue = (str: string) => {
        if (!str) return 0;
        // Clean string "1.2M-2.5M" -> ["1.2M", "2.5M"]
        const parts = str.split('-').map(s => s.trim());
        
        const parsePart = (p: string) => {
            let mult = 1;
            if (p.includes('k')) mult = 1000;
            if (p.includes('M')) mult = 1000000;
            let val = parseFloat(p.replace(/[kM,]/g, ''));
            return val * mult;
        };
        
        const vals = parts.map(parsePart);
        const avg = vals.reduce((a,b) => a+b, 0) / vals.length;
        return avg;
    };

    // Calculate Average per m2 or Total Price based on available data
    // VN Stats are generally Million/m2 (buying) and Million/month (renting total)
    // DE Stats are generally Euro/m2 (Apt buy/rent) or Euro Total (House/Land buy/rent)
    
    const aptPriceRaw = parseRawValue(stats.buyApt);
    const housePriceRaw = parseRawValue(stats.buyHouse);
    const landPriceRaw = parseRawValue(stats.buyLand);
    const shophousePriceRaw = parseRawValue(stats.buyShophouse);
    
    const aptRentRaw = parseRawValue(stats.rentApt);
    const houseRentRaw = parseRawValue(stats.rentHouse);
    const landRentRaw = parseRawValue(stats.rentLand);
    const shophouseRentRaw = parseRawValue(stats.rentShophouse);

    let aptPrice = 0, housePrice = 0, landPrice = 0, shophousePrice = 0;
    
    // Estimation Logic
    if (market === 'VN') {
      // VN: raw is Million/m2. Output Billion Total.
      // Apt 60m2, House 35m2, Land 80m2, Shophouse 100m2
      aptPrice = (aptPriceRaw * 60) / 1000;
      housePrice = (housePriceRaw * 35) / 1000;
      landPrice = (landPriceRaw * 80) / 1000;
      shophousePrice = (shophousePriceRaw * 100) / 1000;
    } else {
      // DE: 
      // buyApt is /m2 (e.g. 5.5k) -> Total = raw * 60
      // buyHouse is Total (e.g. 1.2M) -> Total = raw
      // buyLand is Total (e.g. 800k) -> Total = raw
      // buyShophouse is Total (e.g. 1.5M) -> Total = raw
      aptPrice = aptPriceRaw * 60;
      housePrice = housePriceRaw;
      landPrice = landPriceRaw;
      shophousePrice = shophousePriceRaw;
    }

    setLiveMetrics({
      apt: { price: aptPrice, rent: aptRentRaw, trend: 'stable' },
      house: { price: housePrice, rent: houseRentRaw, trend: 'stable' },
      land: { price: landPrice, rent: landRentRaw, trend: 'stable' },
      shophouse: { price: shophousePrice, rent: shophouseRentRaw, trend: 'stable' },
      occupancy: 81.5 + (Math.random() * 4)
    });
  }, [market, city]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveMetrics(prev => {
        const fluctuate = (val: number, volatility: number) => {
            const change = 1 + (Math.random() * volatility * 2 - volatility);
            return val * change;
        };
        
        const updateCategory = (cat: any, volPrice: number, volRent: number) => {
             const newPrice = fluctuate(cat.price, volPrice);
             const newRent = fluctuate(cat.rent, volRent);
             return {
                 price: newPrice,
                 rent: newRent,
                 trend: newPrice > cat.price ? 'up' : 'down'
             };
        };

        return {
          ...prev,
          apt: updateCategory(prev.apt, 0.003, 0.002),
          house: updateCategory(prev.house, 0.005, 0.001),
          land: updateCategory(prev.land, 0.008, 0.001),
          shophouse: updateCategory(prev.shophouse, 0.006, 0.003),
          occupancy: Math.min(98, Math.max(70, prev.occupancy + (Math.random() * 0.4 - 0.2))),
        };
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [isVideoPlaying]);

  const formatCurrency = (val: number, type: 'price' | 'rent') => {
    if (market === 'VN') {
      return val.toFixed(2);
    } else {
      if (val > 100000) return (val / 1000).toFixed(0) + 'k';
      return Math.round(val).toLocaleString();
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const initialPos = COORDINATES[district] || COORDINATES[city] || [21.0285, 105.8542];
    mapRef.current = L.map(mapContainerRef.current, { center: initialPos, zoom: 14, zoomControl: false });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(mapRef.current);
    markersLayerRef.current = (L as any).markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 50,
    });
    if (markersLayerRef.current) {
        mapRef.current.addLayer(markersLayerRef.current);
    }
    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const pos = COORDINATES[district] || COORDINATES[city];
    if (pos && typeof pos[0] === 'number' && typeof pos[1] === 'number' && !isNaN(pos[0]) && !isNaN(pos[1]) && mapRef.current) {
       mapRef.current.flyTo(pos, 15, { duration: 1.5 });
    }
  }, [market, city, district]);

  useEffect(() => {
    generateMarkers();
  }, [market, city, district, lang, watchedProperties]);

  useEffect(() => {
    let interval: any;
    if (isVideoPlaying) {
      interval = setInterval(() => {
        setVideoProgress(p => (p >= 100 ? 0 : p + 0.5));
      }, 200);
    }
    return () => clearInterval(interval);
  }, [isVideoPlaying]);

  const generateMarkers = () => {
    if (!mapRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();
    
    // Also remove project marker and news marker if they exist from previous scans
    if (projectMarkerRef.current) {
        mapRef.current.removeLayer(projectMarkerRef.current);
        projectMarkerRef.current = null;
    }
    if (newsMarkerRef.current) {
        mapRef.current.removeLayer(newsMarkerRef.current);
        newsMarkerRef.current = null;
    }

    const basePos = COORDINATES[district] || COORDINATES[city] || [21.0285, 105.8542];
    
    // VALIDATION: Ensure basePos is valid to avoid NaN errors
    if (!basePos || typeof basePos[0] !== 'number' || typeof basePos[1] !== 'number' || isNaN(basePos[0]) || isNaN(basePos[1])) {
       return;
    }

    const rng = seededRandom(`${district}-${city}`);
    const stats = CITY_STATS[city] || (market === 'VN' ? CITY_STATS["Hà Nội"] : CITY_STATS["Berlin"]);
    
    const parseValue = (str: string) => {
       const clean = str.replace(/k/g, '000').replace(/M/g, '000000').replace(/,/g, '');
       const parts = clean.split('-').map(s => parseFloat(s));
       if (parts.length === 2) return (parts[0] + parts[1]) / 2;
       return parts[0] || 0;
    };
    const basePriceUnit = parseValue(stats.buyApt);
    const baseRentUnit = parseValue(stats.rentApt);
    const markerCount = 60;

    for (let i = 0; i < markerCount; i++) {
      const latOffset = (rng() - 0.5) * 0.035; 
      const lngOffset = (rng() - 0.5) * 0.035;
      const randVal = rng();
      const type = randVal > 0.6 ? 'risk' : (randVal > 0.3 ? 'stable' : 'new');
      const color = type === 'risk' ? '#ef4444' : (type === 'stable' ? '#10b981' : '#3b82f6');
      const variance = 0.8 + (rng() * 0.4); 
      let displayPrice = "";
      let displayRent = "";

      if (market === 'VN') {
         const p = (basePriceUnit * variance * 60) / 1000;
         displayPrice = `${p.toFixed(2)} Tỷ`;
         const r = baseRentUnit * variance;
         displayRent = `${r.toFixed(1)} Tr/th`;
      } else {
         const p = basePriceUnit * variance * 60;
         displayPrice = p > 100000 ? `${(p/1000).toFixed(0)}k €` : `${p.toFixed(0)} €`;
         const r = baseRentUnit * variance * 60;
         displayRent = `${r.toFixed(0)} €`;
      }

      const statusText = type === 'risk' ? t.risk : (type === 'stable' ? t.stable : t.newPlanning);
      const statusColorClass = type === 'risk' ? 'text-red-500' : (type === 'stable' ? 'text-emerald-600' : 'text-blue-500');

      const propId = `${market}-${city}-${district}-${i}`;
      const isWatched = watchedProperties.includes(propId);

      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: isWatched 
          ? `<div style="position: relative; cursor: pointer;">
               <div style="background-color: ${color}; width: 14px; height: 14px; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
               <div style="position: absolute; top: -6px; right: -6px; background-color: #f59e0b; color: white; width: 12px; height: 12px; border-radius: 50%; border: 1px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 2px rgba(0,0,0,0.3); font-size: 8px; line-height: 1; font-weight: bold;">★</div>
             </div>`
          : `<div style="background-color: ${color}; width: 14px; height: 14px; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2); cursor: pointer;"></div>`,
        iconSize: [14, 14], iconAnchor: [7, 7]
      });
      const marker = L.marker([basePos[0] + latOffset, basePos[1] + lngOffset], { icon });

      const btnText = getAlertBtnText(isWatched, lang);
      const btnBg = isWatched ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-100 hover:bg-slate-200';
      const btnTextColor = isWatched ? 'text-white' : 'text-slate-700';

      const popupContent = `
        <div class="font-sans text-slate-800 min-w-[140px]">
          <div class="text-[10px] font-black uppercase tracking-widest mb-2 ${statusColorClass}">
             ${statusText}
          </div>
          <div class="flex justify-between items-center text-xs mb-1 border-b border-slate-100 pb-1">
             <span class="text-slate-400 font-medium">Giá:</span>
             <span class="font-bold">${displayPrice}</span>
          </div>
          <div class="flex justify-between items-center text-xs mb-2">
             <span class="text-slate-400 font-medium">Thuê:</span>
             <span class="font-bold">${displayRent}</span>
          </div>
          <button class="watch-prop-btn w-full py-1.5 px-2 rounded-lg text-[10px] font-bold text-center ${btnBg} ${btnTextColor} flex items-center justify-center gap-1 transition-all" data-prop-id="${propId}">
             ${btnText}
          </button>
        </div>
      `;
      marker.bindPopup(popupContent, {
        closeButton: false,
        offset: [0, -6],
        className: 'custom-map-popup shadow-xl rounded-xl border-0',
        autoPan: true
      });
      marker.on('click', () => {
        marker.openPopup();
      });
      markersLayerRef.current.addLayer(marker);
    }
  };

  const handleRecenter = () => {
    if (!mapRef.current) return;
    const pos = COORDINATES[district] || COORDINATES[city];
    
    // VALIDATION: Ensure pos is valid to avoid NaN errors
    if (pos && typeof pos[0] === 'number' && typeof pos[1] === 'number' && !isNaN(pos[0]) && !isNaN(pos[1])) {
        mapRef.current.flyTo(pos, 15, { duration: 1.5 });
    }
  };

  const handleMarketChange = (m: Market) => {
    setMarket(m);
    const defaultCity = MARKET_DATA[m].cities[0];
    setCity(defaultCity);
    if (MARKET_DATA[m].districts[defaultCity]) {
      setDistrict(MARKET_DATA[m].districts[defaultCity][0]);
    }
    setShowMarketDropdown(false);
  };

  const handleCityChange = (c: string) => {
    setCity(c);
    if (MARKET_DATA[market].districts[c]) {
      setDistrict(MARKET_DATA[market].districts[c][0]);
    }
    setShowCityDropdown(false);
  };

  const handleDistrictChange = (d: string) => {
    setDistrict(d);
    setShowDistrictDropdown(false);
  };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const results: { market: Market, city: string, district: string }[] = [];
    
    const markets = searchMarketFilter === 'ALL' ? (['VN', 'DE'] as Market[]) : [searchMarketFilter];
    
    markets.forEach(m => {
        const data = MARKET_DATA[m];
        Object.entries(data.districts).forEach(([c, districts]) => {
            const cityMatch = c.toLowerCase().includes(query);
            // Explicitly cast to string[] to resolve 'unknown' type error
            (districts as string[]).forEach(d => {
                if (cityMatch || d.toLowerCase().includes(query)) {
                    results.push({ market: m, city: c, district: d });
                }
            });
        });
    });
    return results.slice(0, 50);
  }, [searchQuery, searchMarketFilter]);

  const handleSearchResultClick = (loc: { market: Market, city: string, district: string }) => {
    setMarket(loc.market);
    setCity(loc.city);
    setDistrict(loc.district);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  const confirmKeepImage = (newUrl: string | null) => {
      if (newUrl && selectedNews) {
          // In a real app, we would update the feedNews state here. 
          // For now, we update the selected news locally to show reflection
          const updated = {...selectedNews, imageUrl: newUrl};
          setSelectedNews(updated);
          // Also update in feed list
          setFeedNews(prev => prev.map(n => n.id === updated.id ? updated : n));
      }
      setIsEditingImage(false);
      setEditedImageUrl(null);
  };

  const handleViewOnMap = (news: NewsArticle, e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent opening the news modal
      
      let targetCoords: [number, number] | null = null;
      
      // 1. Try to match known locations from title or summary
      const allLocations = Object.keys(COORDINATES);
      for (const loc of allLocations) {
          if (news.title.includes(loc) || news.summary.includes(loc)) {
              targetCoords = COORDINATES[loc];
              break;
          }
      }
      
      // 2. Fallback: Generate a deterministic random location around the current city center
      // This ensures the same news item always maps to the same spot, but different items map differently.
      if (!targetCoords) {
          const cityCenter = COORDINATES[city] || [21.0285, 105.8542];
          const rng = seededRandom(news.id); 
          // Spread news items within ~5km of center (0.05 degrees)
          const latOffset = (rng() - 0.5) * 0.05;
          const lngOffset = (rng() - 0.5) * 0.05;
          targetCoords = [cityCenter[0] + latOffset, cityCenter[1] + lngOffset];
      }

      if (mapRef.current && targetCoords) {
          // Fly to location
          mapRef.current.flyTo(targetCoords, 16, { duration: 1.5 });
          
          // Remove old news marker if exists
          if (newsMarkerRef.current) {
              mapRef.current.removeLayer(newsMarkerRef.current);
          }
          
          // Create animated News Marker
          // Using a red pulsing effect to differentiate from blue/green property markers
          const icon = L.divIcon({
              className: 'custom-div-icon',
              html: `
                <div class="relative group">
                  <div class="absolute -top-3 -left-3 w-14 h-14 bg-red-500/30 rounded-full animate-ping"></div>
                  <div class="relative w-8 h-8 bg-red-600 rounded-full flex items-center justify-center shadow-xl border-2 border-white text-white transform transition-transform hover:scale-110">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>
                  </div>
                  <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-3 bg-red-600"></div>
                </div>
              `,
              iconSize: [32, 48],
              iconAnchor: [16, 48],
              popupAnchor: [0, -48]
          });
          
          const marker = L.marker(targetCoords, { icon })
              .addTo(mapRef.current)
              .bindPopup(
                  `<div class="font-sans">
                      <div class="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">News Alert</div>
                      <div class="text-xs font-bold text-slate-900 leading-snug">${news.title}</div>
                   </div>`, 
                  { closeButton: false, className: 'custom-map-popup shadow-xl rounded-xl border-0' }
              )
              .openPopup();
              
          newsMarkerRef.current = marker;
          
          // Scroll to map for better mobile UX
          mapContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
  };

  const confirmGenerateVideo = async () => {
      try {
        if ((window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
            const hasKey = await (window as any).aistudio.hasSelectedApiKey();
            if (!hasKey) {
                await (window as any).aistudio.openSelectKey();
            }
        }
      } catch(e) { console.warn("AI Studio Key Check Not Available", e); }

      setIsVeoGenerating(true);
      setShowVideoConfigModal(false);
      setVeoVideoUrl(null);
      
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          
          const prompt = videoConfigTarget?.type === 'NEWS' && videoConfigTarget.news 
             ? `Create a news video about: ${videoConfigTarget.news.title}. ${videoConfigTarget.news.summary}`
             : `Cinematic real estate video of ${city}, ${district}. Modern architecture, sunny day.`;

          let operation = await ai.models.generateVideos({
              model: 'veo-3.1-fast-generate-preview',
              prompt,
              config: {
                  numberOfVideos: 1,
                  resolution: videoSettings.resolution,
                  aspectRatio: videoSettings.aspectRatio
              }
          });
          
          while (!operation.done) {
              await new Promise(r => setTimeout(r, 5000));
              operation = await ai.operations.getVideosOperation({ operation });
          }
          
          const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
          if (videoUri) {
              const videoRes = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
              const blob = await videoRes.blob();
              setVeoVideoUrl(URL.createObjectURL(blob));
              setCurrentVideoTitle(videoConfigTarget?.type === 'NEWS' ? "AI News Report" : "Veo Generated Video");
              setIsVideoPlaying(true);
          }
          
      } catch(e: any) {
          console.error("Veo Error", e);
          const errorMsg = e.message || (e.error ? e.error.message : "");
          if (errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
              alert("Quota Exceeded. Cannot generate video right now.");
          } else {
              alert("Video Generation Failed: " + errorMsg);
          }
      } finally {
          setIsVeoGenerating(false);
      }
  };

  const handlePlayBriefing = async () => {
    if (isBriefingPlaying) {
      stopBriefing();
      return;
    }
    stopPodcast();
    stopNewsAudio();

    setIsBriefingGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const summaryText = market === 'VN'
        ? `Bản tin nhanh thị trường ${city}. Giá căn hộ trung bình ${liveMetrics.apt.price.toFixed(2)} tỷ đồng. Xu hướng ${liveMetrics.apt.trend === 'up' ? 'tăng' : 'ổn định'}.`
        : `Market briefing for ${city}. Average apartment price ${(liveMetrics.apt.price / 1000).toFixed(0)}k Euro. Trend is ${liveMetrics.apt.trend === 'up' ? 'up' : 'stable'}.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: summaryText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: lang === 'VN' ? 'Aoede' : 'Fenrir' } }
          }
        }
      });

      const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (audioData) {
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();

        const buffer = await decodeAudioData(decodeBase64(audioData), audioContextRef.current, 24000, 1);
        const source = audioContextRef.current.createBufferSource();
        const gainNode = audioContextRef.current.createGain();

        source.buffer = buffer;
        gainNode.gain.value = briefingVolume;
        source.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);

        source.onended = () => setIsBriefingPlaying(false);
        source.start();

        briefingAudioRef.current = source;
        briefingGainRef.current = gainNode;
        setIsBriefingPlaying(true);
      }
    } catch (e) {
      console.error("Briefing Error", e);
    } finally {
      setIsBriefingGenerating(false);
    }
  };

  const handleAiQuery = async () => {
    if (!userQuery.trim() || isAiProcessing) return;
    setIsAiProcessing(true);
    setAiResponse('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let prompt = userQuery;
      let model = "gemini-3-flash-preview";
      let tools: any = [];

      if (aiMode === 'SEARCH') {
        model = "gemini-3-pro-preview";
        tools = [{ googleSearch: {} }];
        prompt = `Search for latest info: ${userQuery}. Context: Real Estate in ${city}, ${market}.`;
      } else if (aiMode === 'MAPS') {
        model = "gemini-2.5-flash";
        tools = [{ googleMaps: {} }];
        prompt = `Find places related to: ${userQuery} near ${city}.`;
      } else {
        prompt = `Answer this real estate question about ${city}: ${userQuery}. Keep it short and data-driven.`;
      }

      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: tools.length > 0 ? { tools } : undefined
      });

      setAiResponse(response.text || "No response.");
    } catch (e: any) {
      console.error("AI Query Error", e);
      setAiResponse("AI Service Unavailable.");
    } finally {
      setIsAiProcessing(false);
      setUserQuery('');
    }
  };

  const handleVideoSearch = async () => {
      if (!userQuery.trim() || isAiProcessing) return;
      setIsAiProcessing(true);
      setAiResponse('');
      
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Search for YouTube videos related to: "${userQuery}". 
        Context: Real Estate in ${city}, ${market}.
        List 3-5 relevant videos with titles and URLs.`;
        
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] }
        });
        
        setAiResponse(response.text || "No videos found.");
        
      } catch (e: any) {
          console.error("Video Search Error", e);
          const errorMsg = e.message || (e.error ? e.error.message : "");
          if (errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
             setAiResponse("System busy (Quota). Try again later.");
          } else {
             setAiResponse("Video Search Error.");
          }
      } finally {
          setIsAiProcessing(false);
      }
  };

  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev =>
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
    setIsGoalsSaved(false);
  };

  const saveGoals = () => {
    localStorage.setItem('user-investment-goals', JSON.stringify(selectedGoals));
    setIsGoalsSaved(true);
    setTimeout(() => setShowGoals(false), 1500);
  };

  const togglePodcastSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextSpeed = speeds[(speeds.indexOf(podcastSpeed) + 1) % speeds.length];
    setPodcastSpeed(nextSpeed);
    if (podcastAudioRef.current) {
      podcastAudioRef.current.playbackRate.value = nextSpeed;
    }
  };

  const toggleVideoPlayback = () => {
    const videoEl = document.querySelector('video');
    if (videoEl) {
      if (videoEl.paused) {
        videoEl.play();
        setIsVideoPlaying(true);
      } else {
        videoEl.pause();
        setIsVideoPlaying(false);
      }
    } else {
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const handleOpenVideoConfig = (target: { type: 'MAIN' | 'NEWS', news?: NewsArticle }) => {
    setVideoConfigTarget(target);
    setShowVideoConfigModal(true);
  };

  const toggleMute = () => {
    const videoEl = document.querySelector('video');
    if (videoEl) {
      videoEl.muted = !videoEl.muted;
      setIsVideoMuted(videoEl.muted);
    }
  };

  const handlePlayArchiveVideo = (video: any) => {
    setCurrentVideoTitle(video.title);
    setVeoVideoUrl("https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4");
    setIsVideoPlaying(true);
  };

  const handleEditImage = async () => {
    if (!isEditingImage) {
      setIsEditingImage(true);
      setEditedImageUrl(null);
      setImageEditPrompt("");
    } else {
      if (!imageEditPrompt.trim() || !selectedNews) return;

      try {
        setEditedImageUrl(null);
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        let blob: Blob;
        try {
            const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(selectedNews.imageUrl)}`);
            if (!res.ok) throw new Error("Fetch failed");
            blob = await res.blob();
        } catch {
             const res = await fetch(selectedNews.imageUrl);
             blob = await res.blob();
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
              parts: [
                { inlineData: { mimeType: 'image/jpeg', data: base64 } },
                { text: imageEditPrompt }
              ]
            }
          });

          const parts = result.candidates?.[0]?.content?.parts || [];
          const imgPart = parts.find(p => p.inlineData);
          if (imgPart && imgPart.inlineData) {
            setEditedImageUrl(`data:${imgPart.inlineData.mimeType || 'image/png'};base64,${imgPart.inlineData.data}`);
          }
        };
        reader.readAsDataURL(blob);

      } catch (e) {
        console.error("Edit Image Failed", e);
        alert("Image generation failed.");
      }
    }
  };

  // Feedback Handling
  const handleSendFeedback = () => {
    if (!feedbackText.trim()) return;
    
    // In a real app, this would send data to a backend
    console.log("Feedback submitted:", {
        message: feedbackText,
        market: market,
        city: city,
        timestamp: new Date().toISOString()
    });
    
    // Simulate confirmation
    alert(lang === 'VN' ? "Cảm ơn bạn đã gửi phản hồi!" : "Thank you for your feedback!");
    
    setFeedbackText('');
    setShowFeedbackModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
    
        {/* 1. Header - Compact */}
        <header className="sticky top-0 z-[6000] bg-white border-b border-slate-200 w-full h-16">
            <div className="w-full px-4 md:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                        <Globe className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">BDS NAVIGATOR</h1>
                        <span className="text-[9px] font-medium text-slate-500 tracking-wider hidden sm:block">Global Real Estate Intelligence</span>
                    </div>
                </div>

                {/* Language Switcher */}
                <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-full">
                    {(['VN', 'DE', 'EN'] as Language[]).map((l) => (
                        <button 
                            key={l}
                            onClick={() => setLang(l)}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${lang === l ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {l}
                        </button>
                    ))}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3">
                    <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                        <Search className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => setShowSettingsModal(true)}
                        className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => setShowLoginModal(true)}
                        className="flex items-center gap-2 bg-[#0f172a] hover:bg-slate-800 text-white px-4 py-2 rounded-full text-xs font-bold transition-all shadow-md active:scale-95"
                    >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>{t.memberLogin}</span>
                    </button>
                </div>
            </div>
        </header>

        {/* 2. Unified Hero & Stats Section (Green Area) */}
        <div className="bg-gradient-to-br from-slate-900 via-[#065f46] to-slate-900 text-white py-6 md:py-8 w-full relative pb-24 md:pb-20">
            <div className="w-full px-4 md:px-6 lg:px-8 relative z-10 flex flex-col gap-4 md:gap-6">
                
                {/* Title Block */}
                <div>
                    <h2 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight mb-1 md:mb-2 max-w-4xl leading-tight">
                        {t.headerTitle}
                    </h2>
                    <p className="text-xs md:text-sm text-emerald-100/80 font-normal max-w-2xl">
                        {t.headerSubtitle}
                    </p>
                </div>

                {/* Content Grid: Briefing Card + Stats Groups */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4">
                    
                    {/* Briefing Card (Takes 4 cols on desktop) */}
                    <div 
                        onClick={handlePlayBriefing}
                        className="bg-transparent hover:bg-white/5 hover:backdrop-blur-xl rounded-2xl p-3 md:p-4 md:col-span-4 lg:col-span-3 flex items-center gap-3 md:gap-4 cursor-pointer transition-all group hover:shadow-2xl relative overflow-hidden border border-transparent hover:border-white/10"
                    >
                        {/* Glow Effect */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-400/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                        <div className="relative w-12 h-12 md:w-14 md:h-14 shrink-0">
                            <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80" className="w-full h-full object-cover rounded-xl grayscale group-hover:grayscale-0 transition-all shadow-md" alt="Host"/>
                            <div className="absolute inset-0 bg-black/10 rounded-xl flex items-center justify-center">
                                <div className={`w-6 h-6 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm ${isBriefingGenerating ? 'animate-pulse' : ''}`}>
                                   {isBriefingPlaying ? <Pause className="w-3 h-3 text-emerald-600"/> : <Play className="w-3 h-3 text-emerald-600 ml-0.5"/>}
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 min-w-0 relative z-10">
                            <p className="text-[9px] font-bold text-emerald-200 uppercase tracking-wider mb-0.5">{t.investorBriefing}</p>
                            <h3 className="text-[11px] md:text-xs font-bold text-white leading-tight group-hover:text-emerald-100 transition-colors truncate">
                                {market === 'VN' ? `Thị trường ${city} biến động` : `${city} market update`}
                            </h3>
                             {isBriefingPlaying ? (
                                <div className="h-1 w-full bg-white/20 mt-1.5 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-300 transition-all duration-300 shadow-[0_0_10px_rgba(110,231,183,0.5)]" style={{width: `${briefingProgress}%`}}></div>
                                </div>
                             ) : (
                                <p className="text-[9px] text-white/60 mt-0.5 line-clamp-1">90s AI Summary</p>
                             )}
                        </div>
                    </div>

                    {/* Grouped Stats Grid with 4 Categories: Apartment, House, Land, Shophouse */}
                    <div className="md:col-span-8 lg:col-span-9 grid grid-cols-2 xl:grid-cols-4 gap-2 md:gap-3">

                        {/* Card 1: Apartment */}
                        <div className="bg-transparent hover:bg-white/5 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-5 border border-transparent hover:border-white/20 relative overflow-hidden transition-all duration-300 group cursor-default">
                             <div className="flex items-center justify-between mb-2 md:mb-3">
                                <div className="flex items-center gap-1.5 md:gap-2">
                                    <div className="p-1 md:p-1.5 bg-blue-500/20 rounded-lg"><Building className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-300"/></div>
                                    <h3 className="text-[10px] md:text-xs font-bold text-blue-100 uppercase tracking-wide">{t.apartment}</h3>
                                </div>
                                <span className="bg-blue-500/20 text-blue-300 text-[8px] md:text-[9px] font-bold px-1.5 py-0.5 rounded border border-blue-500/30 uppercase tracking-wider animate-pulse">Live</span>
                             </div>
                             <div className="flex flex-col gap-0.5 md:gap-1">
                                 <div className="flex items-baseline gap-1 md:gap-1.5">
                                    <span className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight">
                                        {market === 'VN' ? liveMetrics.apt.price.toFixed(2) : (liveMetrics.apt.price/1000).toFixed(2)}
                                    </span>
                                    <span className="text-[9px] md:text-[10px] font-bold text-white/50">{market === 'VN' ? 'Tỷ' : 'k €'}</span>
                                 </div>
                                 <div className="flex items-center gap-1.5 md:gap-2 text-[9px] md:text-[10px] font-medium text-white/70">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                    <span className="truncate">Thuê: {market === 'VN' ? `${liveMetrics.apt.rent.toFixed(2)} Tr` : `${liveMetrics.apt.rent.toFixed(2)} €/m²`}</span>
                                 </div>
                             </div>
                             {/* Sparkline decoration */}
                             <div className="absolute right-0 bottom-0 opacity-10 group-hover:opacity-30 transition-opacity">
                                <TrendingUp className={`w-12 h-12 md:w-16 md:h-16 ${liveMetrics.apt.trend === 'up' ? 'text-green-400' : 'text-red-400'}`} />
                             </div>
                        </div>

                        {/* Card 2: House */}
                        <div className="bg-transparent hover:bg-white/5 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-5 border border-transparent hover:border-white/20 relative overflow-hidden transition-all duration-300 group cursor-default">
                             <div className="flex items-center justify-between mb-2 md:mb-3">
                                <div className="flex items-center gap-1.5 md:gap-2">
                                    <div className="p-1 md:p-1.5 bg-emerald-500/20 rounded-lg"><Home className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-300"/></div>
                                    <h3 className="text-[10px] md:text-xs font-bold text-emerald-100 uppercase tracking-wide">{t.house}</h3>
                                </div>
                                <span className="bg-emerald-500/20 text-emerald-300 text-[8px] md:text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/30 uppercase tracking-wider animate-pulse">Live</span>
                             </div>
                             <div className="flex flex-col gap-0.5 md:gap-1">
                                 <div className="flex items-baseline gap-1 md:gap-1.5">
                                    <span className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight">
                                        {market === 'VN' ? liveMetrics.house.price.toFixed(2) : (liveMetrics.house.price/1000000).toFixed(2)}
                                    </span>
                                    <span className="text-[9px] md:text-[10px] font-bold text-white/50">{market === 'VN' ? 'Tỷ' : 'M €'}</span>
                                 </div>
                                 <div className="flex items-center gap-1.5 md:gap-2 text-[9px] md:text-[10px] font-medium text-white/70">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                    <span className="truncate">Thuê: {market === 'VN' ? `${liveMetrics.house.rent.toFixed(2)} Tr` : `${(liveMetrics.house.rent/1000).toFixed(2)}k €`}</span>
                                 </div>
                             </div>
                             <div className="absolute right-0 bottom-0 opacity-10 group-hover:opacity-30 transition-opacity">
                                <TrendingUp className={`w-12 h-12 md:w-16 md:h-16 ${liveMetrics.house.trend === 'up' ? 'text-green-400' : 'text-red-400'}`} />
                             </div>
                        </div>

                        {/* Card 3: Land */}
                        <div className="bg-transparent hover:bg-white/5 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-5 border border-transparent hover:border-white/20 relative overflow-hidden transition-all duration-300 group cursor-default">
                             <div className="flex items-center justify-between mb-2 md:mb-3">
                                <div className="flex items-center gap-1.5 md:gap-2">
                                    <div className="p-1 md:p-1.5 bg-orange-500/20 rounded-lg"><Layers className="w-3.5 h-3.5 md:w-4 md:h-4 text-orange-300"/></div>
                                    <h3 className="text-[10px] md:text-xs font-bold text-orange-100 uppercase tracking-wide">{t.land}</h3>
                                </div>
                                <span className="bg-orange-500/20 text-orange-300 text-[8px] md:text-[9px] font-bold px-1.5 py-0.5 rounded border border-orange-500/30 uppercase tracking-wider animate-pulse">Live</span>
                             </div>
                             <div className="flex flex-col gap-0.5 md:gap-1">
                                 <div className="flex items-baseline gap-1 md:gap-1.5">
                                    <span className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight">
                                        {market === 'VN' ? liveMetrics.land.price.toFixed(2) : (liveMetrics.land.price/1000).toFixed(2)}
                                    </span>
                                    <span className="text-[9px] md:text-[10px] font-bold text-white/50">{market === 'VN' ? 'Tỷ' : 'k €'}</span>
                                 </div>
                                 <div className="flex items-center gap-1.5 md:gap-2 text-[9px] md:text-[10px] font-medium text-white/70">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                                    <span className="truncate">Thuê: {market === 'VN' ? `${liveMetrics.land.rent.toFixed(2)} Tr` : `${(liveMetrics.land.rent/1000).toFixed(2)}k €`}</span>
                                 </div>
                             </div>
                             <div className="absolute right-0 bottom-0 opacity-10 group-hover:opacity-30 transition-opacity">
                                <TrendingUp className={`w-12 h-12 md:w-16 md:h-16 ${liveMetrics.land.trend === 'up' ? 'text-green-400' : 'text-red-400'}`} />
                             </div>
                        </div>

                        {/* Card 4: Shophouse (New) */}
                        <div className="bg-transparent hover:bg-white/5 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-5 border border-transparent hover:border-white/20 relative overflow-hidden transition-all duration-300 group cursor-default">
                             <div className="flex items-center justify-between mb-2 md:mb-3">
                                <div className="flex items-center gap-1.5 md:gap-2">
                                    <div className="p-1 md:p-1.5 bg-purple-500/20 rounded-lg"><Store className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-300"/></div>
                                    <h3 className="text-[10px] md:text-xs font-bold text-purple-100 uppercase tracking-wide">{t.shophouse}</h3>
                                </div>
                                <span className="bg-purple-500/20 text-purple-300 text-[8px] md:text-[9px] font-bold px-1.5 py-0.5 rounded border border-purple-500/30 uppercase tracking-wider animate-pulse">Live</span>
                             </div>
                             <div className="flex flex-col gap-0.5 md:gap-1">
                                 <div className="flex items-baseline gap-1 md:gap-1.5">
                                    <span className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight">
                                        {market === 'VN' ? liveMetrics.shophouse.price.toFixed(2) : (liveMetrics.shophouse.price/1000000).toFixed(2)}
                                    </span>
                                    <span className="text-[9px] md:text-[10px] font-bold text-white/50">{market === 'VN' ? 'Tỷ' : 'M €'}</span>
                                 </div>
                                 <div className="flex items-center gap-1.5 md:gap-2 text-[9px] md:text-[10px] font-medium text-white/70">
                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                                    <span className="truncate">Thuê: {market === 'VN' ? `${liveMetrics.shophouse.rent.toFixed(2)} Tr` : `${(liveMetrics.shophouse.rent/1000).toFixed(2)}k €`}</span>
                                 </div>
                             </div>
                             <div className="absolute right-0 bottom-0 opacity-10 group-hover:opacity-30 transition-opacity">
                                <TrendingUp className={`w-12 h-12 md:w-16 md:h-16 ${liveMetrics.shophouse.trend === 'up' ? 'text-green-400' : 'text-red-400'}`} />
                             </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* 3. Filter Bar - Floating Glassmorphism at Bottom of Hero */}
            <div className="absolute bottom-0 left-0 right-0 translate-y-1/2 z-30 px-3 md:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">
                    <div className="bg-white/10 backdrop-blur-xl p-2 md:p-3 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-3 md:gap-4 items-center justify-between ring-1 ring-black/5">
                        <div className="grid grid-cols-2 md:flex md:flex-row gap-2 md:gap-3 w-full md:w-auto">
                            {/* Market Filter */}
                            <div className="col-span-2 md:w-auto space-y-1">
                                <CustomSelect 
                                    label={t.selectMarket}
                                    value={market}
                                    onChange={(v: any) => handleMarketChange(v as Market)}
                                    options={[
                                        { value: 'VN', label: 'Vietnam 🇻🇳' },
                                        { value: 'DE', label: 'Deutschland 🇩🇪' }
                                    ]}
                                    placeholder="Search Market..."
                                />
                            </div>

                            {/* City Filter */}
                            <div className="col-span-1 md:w-auto space-y-1">
                                <CustomSelect 
                                    label={t.selectCity}
                                    value={city}
                                    onChange={handleCityChange}
                                    options={MARKET_DATA[market].cities.map(c => ({ value: c, label: c }))}
                                    placeholder="Search City..."
                                />
                            </div>

                            {/* District Filter */}
                            <div className="col-span-1 md:w-auto space-y-1">
                                <CustomSelect 
                                    label={t.selectDistrict}
                                    value={district}
                                    onChange={handleDistrictChange}
                                    options={(MARKET_DATA[market].districts[city] || []).map(d => ({ value: d, label: d }))}
                                    placeholder="Search District..."
                                    align="right"
                                />
                            </div>
                        </div>
                        
                        <span className="text-[10px] text-white/80 font-bold hidden md:block border-l border-white/30 pl-4 py-1 drop-shadow-sm">
                            Data Updated: Just Now
                        </span>
                    </div>
                </div>
            </div>
        </div>

        {/* 4. Map Section - Immediate Follow-up */}
        <div className="w-full h-[400px] md:h-[500px] relative z-0 mb-12 shadow-inner bg-slate-100">
             <div ref={mapContainerRef} className="w-full h-full z-0 relative" style={{ zIndex: 0 }} />
             
             {/* Floating Controls: Recenter */}
             <button onClick={handleRecenter} className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400] bg-white text-slate-700 px-4 py-2 rounded-full shadow-lg border border-slate-200 text-xs font-bold flex items-center gap-2 hover:bg-slate-50 hover:text-emerald-600 transition-all active:scale-95">
                <Target className="w-3 h-3" /><span>{lang === 'VN' ? 'Về trung tâm' : 'Zentrieren'}</span>
             </button>

            {/* Floating Controls: Legend */}
            <div className="absolute top-44 md:top-24 left-4 z-[400] flex gap-2"> {/* Moved down to avoid overlapping the floating filter bar */}
                <div className="bg-white/95 backdrop-blur px-3 py-2 rounded-lg shadow-md border border-slate-100 flex items-center gap-4">
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></div><span className="text-[9px] font-bold uppercase tracking-wider text-slate-600">Giá tốt</span></div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-orange-400 shadow-sm shadow-orange-200"></div><span className="text-[9px] font-bold uppercase tracking-wider text-slate-600">Rủi ro</span></div>
                </div>
            </div>

             {/* Floating Controls: Market Status */}
             <div className="absolute bottom-4 right-4 z-[400]">
                <div className="bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm border border-slate-100 text-[10px] text-slate-400 flex items-center gap-2">
                <span className="text-emerald-600 font-bold flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> {market === 'VN' ? 'Vietnam' : 'Germany'} Market Open</span>
                </div>
            </div>

            {/* Floating Luxury Gold Compass AI Panel */}
            <div className="absolute top-24 right-4 md:top-6 z-[500] flex flex-col items-end gap-3 pointer-events-none">
                
                {/* 1. The Luxury Gold Compass Button (Always Visible, Interactive) */}
                <button 
                    onClick={() => setIsAiPanelExpanded(!isAiPanelExpanded)}
                    className="pointer-events-auto group relative w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-b from-amber-200 via-yellow-400 to-amber-600 border border-yellow-100 shadow-[0_0_20px_rgba(245,158,11,0.5)] flex items-center justify-center transition-all duration-500 hover:scale-110 hover:shadow-[0_0_30px_rgba(245,158,11,0.8)] active:scale-95 ring-2 ring-yellow-500/20"
                    title="AI Market Intelligence"
                >
                    {/* Metallic Shine Effect */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/40 to-transparent pointer-events-none"></div>
                    
                    {/* Compass Visuals */}
                    <div className="relative w-[90%] h-[90%] flex items-center justify-center rounded-full overflow-hidden bg-gradient-to-br from-emerald-900 via-[#022c22] to-emerald-900 border border-amber-900/50 shadow-inner">
                        {/* Decorative Compass Ring */}
                        <div className={`absolute inset-1 rounded-full border border-amber-200/30 transition-transform duration-700 ${isAiPanelExpanded ? 'rotate-180' : 'rotate-0'}`}></div>
                        
                        {/* Needle Elements */}
                        <div className={`absolute top-1.5 w-0.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)] transition-all duration-500 ${isAiPanelExpanded ? 'opacity-0 scale-0' : 'opacity-100'}`}></div>
                        <div className={`absolute bottom-1.5 w-0.5 h-2.5 bg-slate-500 rounded-full transition-all duration-500 ${isAiPanelExpanded ? 'opacity-0 scale-0' : 'opacity-100'}`}></div>
                        
                        {/* Center Icon */}
                        {isAiPanelExpanded ? (
                            <X className="w-5 h-5 text-amber-200 relative z-10 transition-all duration-300 rotate-90" />
                        ) : (
                            <div className="relative z-10">
                                <Zap className="w-5 h-5 text-amber-300 fill-amber-300/20 animate-pulse drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]" />
                            </div>
                        )}
                    </div>
                </button>

                {/* 2. The Expanded Panel (Slides/Fades in) */}
                {isAiPanelExpanded && (
                    <div className="pointer-events-auto w-[85vw] md:w-[320px] bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-scale-up origin-top-right flex flex-col max-h-[60vh] md:max-h-[500px]">
                        {/* Panel Header */}
                        <div className="p-3 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="bg-amber-100 p-1.5 rounded-lg border border-amber-200">
                                    <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider leading-none">AI Intelligence</h3>
                                    <p className="text-[9px] font-bold text-slate-400 mt-0.5">Powered by Gemini 2.0</p>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse delay-75"></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse delay-150"></span>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 flex flex-col p-3 overflow-hidden">
                            {/* Mode Selectors */}
                            <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-2 mb-2 snap-x">
                                <button onClick={() => setAiMode('FAST')} className={`snap-start shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${aiMode === 'FAST' ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'}`}>
                                    <Zap className="w-3 h-3" /> Fast
                                </button>
                                <button onClick={() => setAiMode('SEARCH')} className={`snap-start shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${aiMode === 'SEARCH' ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'}`}>
                                    <Globe className="w-3 h-3" /> Search
                                </button>
                                <button onClick={handleProjectAnalysis} className={`snap-start shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${aiMode === 'PROJECTS' ? 'bg-purple-50 border-purple-200 text-purple-700 shadow-sm' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'}`}>
                                    <Building className="w-3 h-3" /> {lang === 'DE' ? 'Projekte' : 'Dự án'}
                                </button>
                                <button onClick={handleTvNewsAnalysis} className={`snap-start shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${aiMode === 'TV_NEWS' ? 'bg-red-50 border-red-200 text-red-700 shadow-sm' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'}`}>
                                    <Film className="w-3 h-3" /> TV
                                </button>
                            </div>

                            {/* Response Area */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar mb-3 min-h-[120px] bg-slate-50/50 rounded-xl border border-slate-100 p-2">
                                {aiResponse ? (
                                    <div className="animate-fade-in">
                                        <p className="text-[11px] font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">{aiResponse}</p>
                                        {/* AI Video Container for TV News */}
                                        {aiMode === 'TV_NEWS' && (
                                            <div className="mt-3 rounded-lg overflow-hidden border border-slate-200 bg-black relative aspect-video group/video shadow-md">
                                                {tvNewsVideoUrl ? (
                                                    <video src={tvNewsVideoUrl} autoPlay loop controls className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full relative">
                                                        <img src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80" alt="News Studio" className="w-full h-full object-cover opacity-60" loading="lazy" />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[8px] font-black text-red-500 uppercase tracking-widest bg-white/90 px-1.5 py-0.5 rounded animate-pulse">Live Broadcast</span>
                                                                <button 
                                                                    onClick={generateTvNewsVideo} 
                                                                    disabled={isVeoGenerating}
                                                                    className="text-[9px] font-bold text-white bg-slate-800/90 hover:bg-slate-700 backdrop-blur px-2 py-1 rounded-lg border border-slate-600 transition-all flex items-center gap-1.5 shadow-lg"
                                                                >
                                                                    {isVeoGenerating ? 'Generating...' : <><Film className="w-3 h-3"/> Create Video</>}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-40">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center"><Zap className="w-5 h-5 text-slate-400" /></div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Market Assistant Ready</p>
                                    </div>
                                )}
                                {isAiProcessing && (
                                    <div className="flex gap-1.5 justify-center py-4">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                    </div>
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="relative shrink-0">
                                <input 
                                    type="text" 
                                    value={userQuery} 
                                    onChange={(e) => setUserQuery(e.target.value)} 
                                    onKeyDown={(e) => e.key === 'Enter' && handleAiQuery()} 
                                    placeholder={aiMode === 'MAPS' ? 'Trường học quốc tế gần đây?' : "Giá khu vực này tăng không?"} 
                                    className="w-full pl-3 pr-20 py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm transition-all placeholder:font-medium placeholder:text-slate-400" 
                                />
                                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex gap-1">
                                    <button 
                                        onClick={handleVideoSearch} 
                                        disabled={!userQuery.trim() || isAiProcessing} 
                                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all disabled:opacity-30 active:scale-90 border border-red-100" 
                                        title="Search YouTube"
                                    >
                                        <Film className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                        onClick={handleAiQuery} 
                                        disabled={!userQuery.trim() || isAiProcessing} 
                                        className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all disabled:opacity-30 active:scale-90 shadow-md shadow-emerald-200"
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* 5. Main Content - Full Width Grid */}
        <main className="w-full px-4 md:px-6 lg:px-8 pb-20 space-y-8">
            
            {/* --- NEW SECTION: TRENDS & HIGHLIGHTS --- */}
            <section className="w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">{t.trendsNews}</h2>
                    
                    {/* Category Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-4 md:pb-0 custom-scrollbar -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory scroll-px-4">
                        {CATEGORIES.map((cat) => {
                            const Icon = cat.icon;
                            const isActive = selectedCategory === cat.id;
                            return (
                                <button 
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`
                                        flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-bold whitespace-nowrap transition-all border snap-start
                                        ${isActive 
                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200' 
                                            : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50'
                                        }
                                    `}
                                >
                                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                                    <span>{t[cat.labelKey]}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Legal Disclaimer Box */}
                <div className="mb-6 px-4 md:px-0">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-start gap-3 shadow-sm">
                        <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <p className="text-[10px] md:text-xs text-slate-500 font-medium leading-relaxed">{t.newsDisclaimer}</p>
                    </div>
                </div>
                
                <div className="overflow-x-auto pb-8 -mx-4 px-4 md:mx-0 md:px-0 custom-scrollbar snap-x snap-mandatory scroll-pl-4">
                    <div className="flex gap-4 w-max">
                        {currentNews
                            .filter(news => selectedCategory === 'ALL' || news.category === selectedCategory)
                            .map((news, idx) => (
                             <div 
                                key={news.id} 
                                onClick={() => setSelectedNews(news)}
                                className="w-[85vw] sm:w-[320px] bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex-shrink-0 overflow-hidden group cursor-pointer flex flex-col h-[360px] snap-center"
                             >
                                {/* Image */}
                                <div className="relative h-44 overflow-hidden shrink-0">
                                    <img src={news.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" alt={news.title} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-80"></div>
                                    
                                    {/* Category Badge */}
                                    <div className="absolute top-3 left-3 bg-emerald-600/90 backdrop-blur text-white text-[9px] font-bold px-2 py-1 rounded border border-white/20 uppercase tracking-wider shadow-sm">
                                        {news.category !== 'ALL' ? t[CATEGORIES.find(c => c.id === news.category)?.labelKey || 'all'] : 'News'}
                                    </div>

                                    {/* Top Right Icons */}
                                    <div className="absolute top-3 right-3 flex gap-2">
                                        <button 
                                            onClick={(e) => handleViewOnMap(news, e)}
                                            className="w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-white transition-all shadow-sm opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 duration-300"
                                            title="View on Map"
                                        >
                                            <MapPin className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Time Badge */}
                                    <div className="absolute bottom-3 left-3 text-white/90 text-[10px] font-medium flex items-center gap-1.5">
                                        <Clock className="w-3 h-3"/> {news.date.split(',')[0]}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5 flex flex-col flex-1">
                                    <h3 className="text-sm font-bold text-slate-900 leading-snug mb-2 line-clamp-2 group-hover:text-emerald-700 transition-colors">
                                        {news.title}
                                    </h3>
                                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mb-auto">
                                        {news.summary}
                                    </p>
                                    
                                    {/* Footer */}
                                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-50">
                                        <div className="flex items-center gap-1.5 text-slate-400">
                                            <Globe className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{market === 'VN' ? 'VIETNAM' : 'GERMANY'}</span>
                                        </div>
                                        <button onClick={(e) => toggleShareMenu(news.id, e)} className="text-slate-300 hover:text-emerald-600 transition-colors">
                                            <Share2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                             </div>
                        ))}
                        {currentNews.filter(news => selectedCategory === 'ALL' || news.category === selectedCategory).length === 0 && (
                            <div className="w-full py-12 flex flex-col items-center justify-center text-slate-400">
                                <Search className="w-8 h-8 mb-2 opacity-50"/>
                                <p className="text-xs font-bold">No news found for this category.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ... FREE TOOLS & LIBRARY SECTION ... */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* Tools & Goals Column - 1/3 (col-span-4) */}
                <div className="lg:col-span-4 bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm relative transition-all hover:border-emerald-200 flex flex-col justify-between h-[300px] md:h-[300px]">
                    <div className="p-4 flex flex-col items-start gap-4 bg-gradient-to-b from-slate-50/50 to-white flex-1 overflow-y-auto custom-scrollbar">
                        {/* Header */}
                        <div className="w-full">
                            <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-snug mb-1">
                                {t.freeTools}
                            </h2>
                            <p className="text-[10px] text-slate-500 font-medium leading-tight">Công cụ & Kế hoạch tài chính.</p>
                            
                             {/* GOAL REMINDER */}
                             {showGoalReminder && (
                                <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-start gap-2 relative animate-fade-in">
                                    <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-[9px] font-bold text-amber-800 mb-1">Bạn chưa đặt mục tiêu?</p>
                                        <p className="text-[9px] text-amber-700 leading-tight">Thiết lập mục tiêu giúp chúng tôi gợi ý tốt hơn.</p>
                                        <button onClick={() => setShowGoals(true)} className="text-[9px] font-bold text-amber-600 hover:underline mt-1">Thiết lập ngay →</button>
                                    </div>
                                    <button onClick={() => setShowGoalReminder(false)} className="absolute top-1 right-1 text-amber-400 hover:text-amber-600"><X className="w-3 h-3"/></button>
                                </div>
                             )}
                            
                            <div className="space-y-1.5 pt-3">
                                <div className="flex items-center gap-2 text-slate-700 font-bold text-xs bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                                    <div className="bg-emerald-100 p-1 rounded"><Calculator className="w-3.5 h-3.5 text-emerald-600" /></div>
                                    <span>{t.householdCalc}</span>
                                    <span className="text-[8px] bg-red-100 text-red-600 px-1 rounded ml-auto">Live</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-700 font-bold text-xs bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                                    <div className="bg-emerald-100 p-1 rounded"><div className="w-3.5 h-3.5 flex items-center justify-center text-emerald-600 text-[9px] font-black">✓</div></div>
                                    <span>{t.financingCalc}</span>
                                    <span className="text-[8px] text-slate-400 font-bold ml-auto bg-slate-100 px-1 rounded">Pro</span>
                                </div>
                            </div>
                        </div>

                        {/* Buttons Stack */}
                        <div className="flex flex-col gap-2 w-full mt-auto">
                            <button onClick={() => setShowCalcModal(true)} className="flex items-center justify-between px-3 py-2 bg-[#1e4635] text-white rounded-xl shadow-lg shadow-emerald-900/10 hover:bg-[#153326] transition-all group active:scale-[0.98]">
                                <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center border border-white/10 group-hover:bg-white/20 transition-colors">
                                    <Calculator className="w-3 h-3 text-white" />
                                </div>
                                <div className="text-left">
                                    <span className="block text-[8px] text-emerald-200 font-bold uppercase tracking-wider">Live Tool</span>
                                    <span className="block text-[10px] font-bold">Tính Toán Thu Chi</span>
                                </div>
                                </div>
                                <ChevronDown className="w-3 h-3 -rotate-90 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                            </button>

                            <button className="flex items-center justify-between px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl shadow-sm hover:border-emerald-300 hover:text-emerald-700 transition-all group active:scale-[0.98]">
                                <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-colors">
                                    <Download className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                                </div>
                                <div className="text-left">
                                    <span className="block text-[8px] text-slate-400 group-hover:text-emerald-500 font-bold uppercase tracking-wider">Download</span>
                                    <span className="block text-[10px] font-bold">Kế Hoạch Tài Chính</span>
                                </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="bg-slate-50/80 px-4 py-2 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0">
                         <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                             <div className="w-3 h-3 rounded-full border border-slate-300 flex items-center justify-center bg-white">🔒</div>
                             <span className="truncate max-w-[80px]">Secure Data</span>
                         </div>
                        <button 
                            onClick={() => setShowGoals(!showGoals)}
                            className={`px-3 py-1.5 rounded-lg font-bold text-[9px] uppercase tracking-widest flex items-center gap-1.5 transition-all justify-center ${showGoals ? 'bg-slate-200 text-slate-600 shadow-inner' : 'bg-[#059669] text-white shadow shadow-emerald-200 hover:bg-emerald-700 active:scale-95'}`}
                        >
                            <span>{showGoals ? 'Đóng' : "Mục tiêu"}</span>
                            <ChevronDown className={`w-2.5 h-2.5 transition-transform ${showGoals ? 'rotate-180' : '-rotate-90'}`} />
                        </button>
                    </div>

                    {/* Expandable Goals Section Overlay */}
                    {showGoals && (
                        <div className="absolute inset-0 bg-white z-20 flex flex-col animate-fade-in">
                            <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h3 className="font-bold text-xs text-slate-800">Chọn mục tiêu đầu tư</h3>
                                <button onClick={() => setShowGoals(false)}><X className="w-4 h-4 text-slate-400 hover:text-slate-600"/></button>
                            </div>
                            <div className="p-3 overflow-y-auto custom-scrollbar flex-1">
                                <div className="flex flex-col gap-2 mb-3">
                                    {t.goalOptions.map((goal, idx) => {
                                    const isActive = selectedGoals.includes(goal);
                                    return (
                                        <label key={idx} onClick={() => toggleGoal(goal)} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer group ${isActive ? 'bg-emerald-50 border-emerald-500 shadow-sm' : 'bg-white border-slate-100 hover:border-emerald-200'}`}>
                                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${isActive ? 'bg-emerald-600 border-emerald-600' : 'bg-white border-slate-300 group-hover:border-emerald-500'}`}>{isActive && <div className="w-1.5 h-1.5 bg-white rounded-sm"></div>}</div>
                                        <span className={`text-[9px] font-bold leading-tight ${isActive ? 'text-emerald-900' : 'text-slate-600'}`}>{goal}</span>
                                        </label>
                                    );
                                    })}
                                </div>
                                <button onClick={saveGoals} className={`w-full bg-[#059669] text-white py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest shadow-md hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2`}>
                                    {isGoalsSaved && <span>✓</span>} {t.saveContinue}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Library & Ebooks Column - 2/3 (col-span-8) */}
                <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-[300px] md:h-[300px]">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 shrink-0 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                             <div className="bg-amber-100 p-2 rounded-lg"><BookOpen className="w-5 h-5 text-amber-600"/></div>
                             <div>
                                 <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">{t.libraryTitle} & GAMES</h3>
                                 <p className="text-[10px] text-slate-500 font-medium">Tài liệu, Podcast & Simulation Games</p>
                             </div>
                        </div>
                        <div className="hidden sm:flex gap-2">
                             <span className="px-2 py-0.5 rounded-full bg-slate-200 text-[9px] font-bold text-slate-600">Ebooks</span>
                             <span className="px-2 py-0.5 rounded-full bg-purple-100 text-[9px] font-bold text-purple-600">Cashflow</span>
                             <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[9px] font-bold text-blue-600">Audio</span>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                        {/* Left Side: Ebooks */}
                        <div className="p-3 overflow-y-auto custom-scrollbar space-y-2 bg-white">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 pl-1">Sách & Tài liệu</h4>
                            {(EBOOKS_DATA[lang === 'VN' ? 'VN' : 'DE'] || EBOOKS_DATA['DE']).map((book, i) => (
                                <div key={i} className="flex gap-3 p-2 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all group cursor-pointer">
                                    <div className="w-8 h-12 bg-slate-200 rounded shadow-sm flex-shrink-0 overflow-hidden relative">
                                        <img src={book.cover} className="w-full h-full object-cover" alt={book.title} />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-center min-w-0">
                                        <h4 className="text-[11px] font-bold text-slate-800 leading-tight mb-0.5 line-clamp-1 truncate">{book.title}</h4>
                                        <p className="text-[9px] text-slate-500 mb-1 font-medium truncate">{book.author}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[8px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold border border-slate-200">{book.type}</span>
                                            <span className="text-[8px] text-emerald-600 font-bold flex items-center gap-0.5"><DownloadCloud className="w-2.5 h-2.5"/> Free</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Right Side: Games & Podcasts */}
                        <div className="p-3 overflow-y-auto custom-scrollbar space-y-4 bg-slate-50/50">
                             {/* Games Section */}
                             <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 pl-1 flex items-center gap-1">Simulation Games <span className="bg-purple-100 text-purple-600 px-1 rounded text-[8px]">Robert Kiyosaki</span></h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {GAMES_DATA.map(game => (
                                        <div key={game.id} className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group">
                                            <div className="aspect-video bg-purple-100 rounded-lg mb-2 overflow-hidden relative">
                                                <img src={game.img} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt={game.title}/>
                                                <div className="absolute inset-0 flex items-center justify-center"><div className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center shadow-sm"><Play className="w-3 h-3 text-purple-600 ml-0.5"/></div></div>
                                            </div>
                                            <h5 className="text-[10px] font-bold text-slate-800 leading-tight">{game.title}</h5>
                                            <p className="text-[8px] text-slate-500 truncate">{game.desc}</p>
                                        </div>
                                    ))}
                                </div>
                             </div>

                             {/* Mini Podcast Section */}
                             <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 pl-1">Mini Podcast</h4>
                                <div className="space-y-1.5">
                                    {MINI_PODCASTS.map(pod => (
                                        <div key={pod.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100 hover:border-blue-200 cursor-pointer group">
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 text-blue-500"><Mic className="w-2.5 h-2.5"/></div>
                                                <span className="text-[10px] font-bold text-slate-700">{pod.title}</span>
                                            </div>
                                            <span className="text-[9px] font-mono text-slate-400">{pod.duration}</span>
                                        </div>
                                    ))}
                                </div>
                             </div>
                        </div>
                    </div>
                    
                    <div className="p-2 bg-white border-t border-slate-100 text-center shrink-0">
                        <button className="text-[9px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-wider flex items-center justify-center gap-1 w-full py-1">
                            Xem thư viện đầy đủ <ArrowRight className="w-3 h-3"/>
                        </button>
                    </div>
                </div>
            </section>

            {/* ... NEWS SECTION with SHARE ... */}
            <section className="bg-[#f8fafc] rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="px-6 py-4 bg-white border-b border-slate-100">
                    <h3 className="text-sm font-bold text-[#1e293b] uppercase tracking-wider">{t.newsToday} & PODCAST</h3>
                </div>
                <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-5 space-y-6 flex flex-col h-full">
                    <div className="flex-1 min-h-[300px] relative">
                        <ul className="space-y-3 pr-2 h-full overflow-y-auto custom-scrollbar absolute inset-0">
                        {currentNews.map((news) => (
                            <li key={news.id} onClick={() => setSelectedNews(news)} className="relative flex items-start gap-4 p-3 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 transition-all cursor-pointer group">
                            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200 shadow-sm mt-1">
                                <img src={news.imageUrl} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" loading="lazy" />
                            </div>
                            <div className="flex flex-col gap-0.5 flex-1">
                                <div className="flex justify-between items-start gap-2">
                                    <p className="text-xs font-bold text-slate-800 leading-snug group-hover:text-emerald-700 transition-colors line-clamp-2">{news.title}</p>
                                    <div className="relative flex items-center gap-1">
                                        <button 
                                            onClick={(e) => handleViewOnMap(news, e)}
                                            className="p-1.5 hover:bg-emerald-100 hover:text-emerald-700 rounded-full text-slate-400 transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center"
                                            title="View on Map"
                                        >
                                            <MapPin className="w-3.5 h-3.5" />
                                        </button>
                                        <button 
                                            onClick={(e) => toggleShareMenu(news.id, e)}
                                            className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-emerald-600 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Share2 className="w-3 h-3" />
                                        </button>
                                        {activeShareId === news.id && (
                                            <div className="absolute right-0 top-6 bg-white border border-slate-100 rounded-lg shadow-xl z-[100] w-32 overflow-hidden animate-fade-in p-1">
                                                <button onClick={(e) => handleShare('facebook', news, e)} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 rounded-md text-[9px] font-bold text-slate-600 hover:text-[#1877F2] transition-colors">
                                                    <Facebook className="w-3 h-3" /> Facebook
                                                </button>
                                                <button onClick={(e) => handleShare('twitter', news, e)} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 rounded-md text-[9px] font-bold text-slate-600 hover:text-black transition-colors">
                                                    <Twitter className="w-3 h-3" /> X (Twitter)
                                                </button>
                                                <button onClick={(e) => handleShare('copy', news, e)} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 rounded-md text-[9px] font-bold text-slate-600 hover:text-emerald-600 transition-colors border-t border-slate-50 mt-1">
                                                    {copiedLink === news.id ? <Check className="w-3 h-3 text-emerald-500" /> : <LinkIcon className="w-3 h-3" />}
                                                    {copiedLink === news.id ? 'Copied!' : 'Link'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{news.date}</span>
                            </div>
                            </li>
                        ))}
                        </ul>
                    </div>
                    
                    {/* Podcast Card */}
                    <div className="bg-[#1e293b] rounded-xl p-5 border border-slate-700 shadow-xl flex flex-col gap-5 relative overflow-hidden group min-h-[220px]">
                        <div className="flex justify-between items-center z-10">
                            <div className="flex items-center gap-2">
                                <Radio className="w-4 h-4 text-emerald-400" />
                                <span className="text-[11px] font-bold text-white uppercase tracking-widest">BDS-Podcast - Tin Moi 24h</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold bg-emerald-600 text-white px-2.5 py-1 rounded shadow-sm">Overview</span>
                                <button onClick={() => setPodcastTopic('LEGAL')} className={`text-[10px] font-bold hover:text-white transition-colors ${podcastTopic === 'LEGAL' ? 'text-white' : 'text-slate-400'}`}>Legal</button>
                                <button onClick={() => setPodcastTopic('HIGH_YIELD')} className={`text-[10px] font-bold hover:text-white transition-colors ${podcastTopic === 'HIGH_YIELD' ? 'text-white' : 'text-slate-400'}`}>Trends</button>
                            </div>
                        </div>
                        {/* Error Message Display */}
                        {podcastError && (
                            <div className="z-10 px-2 py-1 bg-red-500/20 border border-red-500/50 rounded text-[9px] text-red-200 font-bold mb-1 animate-pulse">
                                {podcastError}
                            </div>
                        )}
                        <div className="z-10 flex-1 flex flex-col justify-center">
                            <h4 className="text-white text-sm font-bold mb-1">{isPodcastPlaying ? "On Air: Daily Update" : (isPodcastGenerating ? "AI Producer Working..." : "Ready to Broadcast")}</h4>
                            <p className="text-[11px] text-slate-400 font-medium">Select a topic and press play</p>
                        </div>
                        <div className="flex items-center gap-3 z-10 mt-auto">
                            <button 
                                onClick={handleGeneratePodcast} 
                                disabled={isPodcastGenerating} 
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 flex-shrink-0 ${isPodcastGenerating ? 'bg-slate-700 cursor-not-allowed' : 'bg-emerald-50 hover:bg-emerald-400 text-white'}`}
                            >
                                {isPodcastPlaying ? <Pause className="w-4 h-4 fill-current" /> : (isPodcastGenerating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Play className="w-4 h-4 fill-current ml-0.5" />)}
                            </button>
                            <span className="text-[10px] font-mono text-slate-500 font-medium w-10 text-right">{podcastCurrentTime}</span>
                            <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden relative cursor-pointer mx-2">
                                <div className="absolute left-0 top-0 h-full bg-emerald-500 transition-all duration-300" style={{ width: `${podcastProgress}%` }}></div>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500 font-medium w-10">{podcastDuration}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 z-10 border-t border-slate-700/50 mt-1">
                        <button onClick={togglePodcastSpeed} className="text-[10px] font-bold text-slate-500 hover:text-white flex items-center gap-1 transition-colors">
                            <FastForward className="w-3 h-3" /> 
                            <span>{podcastSpeed}x</span>
                        </button>
                        <div className="flex items-center gap-2">
                            <Volume2 className="w-3 h-3 text-slate-500" />
                            <div className="w-12 h-1 bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-3/4 rounded-full"></div>
                            </div>
                        </div>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-7 h-full flex flex-col gap-6">
                    {/* ... VIDEO PLAYER AND ARCHIVE ... */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group/video relative">
                    <div className="relative h-[320px] bg-slate-900 overflow-hidden flex items-center justify-center">
                        {veoVideoUrl ? (<video src={veoVideoUrl} autoPlay loop controls className="w-full h-full object-contain" />) : (<><img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80" className={`w-full h-full object-cover transition-all duration-1000 ${isVideoPlaying ? 'scale-110 opacity-40' : 'opacity-60'}`} alt="news studio" loading="lazy" /><div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-90"></div><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center"><button onClick={toggleVideoPlayback} className="bg-white/10 backdrop-blur-md p-6 rounded-full border border-white/20 hover:bg-white/20 transition-all transform hover:scale-110 active:scale-95 group-active:scale-90 shadow-2xl"><Play className="w-10 h-10 text-white fill-white ml-1" /></button><p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mt-4">{currentVideoTitle}</p></div></>)}
                        {isVeoGenerating && (<div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center z-20"><div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4"></div><p className="text-emerald-400 text-xs font-black uppercase tracking-widest animate-pulse">Đang tạo Video với Veo...</p><p className="text-slate-500 text-[10px] mt-2 font-medium">Quá trình có thể mất 1-2 phút</p></div>)}
                    </div>
                    <div className="px-6 py-4 flex items-center justify-between bg-white border-t border-slate-100">
                        <div className="flex gap-3"><button onClick={handlePlayBriefing} disabled={isBriefingGenerating || isVeoGenerating} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wide flex items-center gap-2 shadow-lg shadow-emerald-200 active:scale-95 disabled:opacity-50 transition-all">{isBriefingGenerating ? <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Radio className="w-4 h-4" />}Tạo Briefing</button><button onClick={() => handleOpenVideoConfig({type: 'MAIN'})} disabled={isVeoGenerating} className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wide flex items-center gap-2 shadow-sm active:scale-95 disabled:opacity-50 transition-all"><Film className="w-4 h-4" />Tạo Video (Veo)</button></div>
                        <div className="flex items-center gap-4"><button onClick={toggleMute} className="text-slate-400 hover:text-emerald-600 transition-colors">{(isVideoMuted || videoVolume === 0) ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}</button></div>
                    </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-[#f8fafc]">
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2"><Film className="w-4 h-4 text-slate-400" />{lang === 'DE' ? 'Archiv: Seminare & Beratung' : 'Thư viện: Hội thảo & Tư vấn'}</h3>
                            <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded border border-slate-200">Archive</span>
                        </div>
                        <div className="p-4 overflow-x-auto custom-scrollbar">
                            <div className="flex gap-4 pb-2">
                                {ARCHIVE_VIDEOS.map((video) => (
                                    <div key={video.id} onClick={() => handlePlayArchiveVideo(video)} className="min-w-[200px] w-[200px] group cursor-pointer">
                                        <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 mb-2"><img src={video.img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={video.title} loading="lazy" /><div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center"><div className="w-8 h-8 bg-white/20 backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100"><Play className="w-4 h-4 text-white fill-current" /></div></div><div className="absolute bottom-2 right-2 bg-black/70 px-1.5 py-0.5 rounded text-[9px] font-bold text-white flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {video.duration}</div><div className="absolute top-2 left-2 bg-emerald-600 px-1.5 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-wider">{video.type}</div></div>
                                        <h4 className="text-xs font-bold text-slate-700 leading-tight group-hover:text-emerald-600 transition-colors line-clamp-2">{video.title}</h4>
                                        <div className="flex items-center gap-2 mt-1"><Users className="w-3 h-3 text-slate-400" /><span className="text-[10px] font-medium text-slate-400">{video.views} xem</span></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                </div>
            </section>
        </main>

        {/* --- FOOTER REDESIGN --- */}
        <footer className="px-6 py-6 bg-gradient-to-r from-slate-900 via-[#0f172a] to-[#064e3b] border-t border-emerald-900/30 shadow-inner w-full">
            <div className="w-full px-4 md:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
                {/* Left Side */}
                <div className="flex flex-col items-center md:items-start gap-1">
                    <div className="flex items-center gap-2 opacity-90 hover:opacity-100 transition-opacity">
                        <MapPin className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-[0.2em] drop-shadow-md">BĐS Navigator</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                        Global Real Estate Data Network
                    </p>
                </div>

                {/* Right Side */}
                <div className="flex flex-col items-center md:items-end gap-2">
                    <div className="flex gap-6">
                        <a href="#" className="text-[10px] text-slate-400 font-bold hover:text-emerald-400 transition-colors uppercase tracking-wide">Privacy</a>
                        <a href="#" className="text-[10px] text-slate-400 font-bold hover:text-emerald-400 transition-colors uppercase tracking-wide">Terms</a>
                        <button onClick={() => setShowFeedbackModal(true)} className="text-[10px] text-slate-400 font-bold hover:text-emerald-400 transition-colors uppercase tracking-wide">Feedback</button>
                        <a href="#" className="text-[10px] text-slate-400 font-bold hover:text-emerald-400 transition-colors uppercase tracking-wide">Support</a>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3 text-[9px] text-slate-600 font-medium">
                        <span>Powered by Google Gemini 2.0 Flash & Pro</span>
                        <span className="hidden md:inline text-slate-700">•</span>
                        <span className="text-slate-500 font-bold">Copyright @ 2026 Tiep Vu Xuan</span>
                    </div>
                </div>
            </div>
        </footer>

      {/* ... MODALS ... */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowLoginModal(false)}/>
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm relative z-10 animate-scale-up">
                <button onClick={() => setShowLoginModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3"><LogIn className="w-6 h-6 text-emerald-600" /></div>
                    <h3 className="text-xl font-bold text-slate-900">Welcome Back</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mt-1">Investor Login</p>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Email</label>
                        <input type="email" placeholder="investor@example.com" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"/>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Password</label>
                        <input type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"/>
                    </div>
                    <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-200 transition-all active:scale-95">Sign In</button>
                    <div className="text-center">
                        <a href="#" className="text-[10px] font-bold text-slate-400 hover:text-emerald-600">Forgot Password?</a>
                    </div>
                </div>
            </div>
        </div>
      )}

      {selectedNews && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 sm:p-6">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in" onClick={() => setSelectedNews(null)} />
           <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden relative z-10 flex flex-col animate-scale-up">
              <div className="relative h-[250px] sm:h-[350px] flex-shrink-0 group">
                <img src={selectedNews.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={selectedNews.title} loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80"></div>
                <button onClick={() => setSelectedNews(null)} className="absolute top-6 right-6 w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-all z-20"><X className="w-5 h-5" /></button>
                <div className="absolute bottom-0 left-0 right-0 p-8">
                    <div className="flex gap-2 mb-3"><span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider shadow-sm">Tin Tức</span><span className="bg-white/20 backdrop-blur text-white text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider border border-white/20">{selectedNews.date}</span></div>
                    <h2 className="text-xl sm:text-3xl font-black text-white leading-tight drop-shadow-md line-clamp-2">{selectedNews.title}</h2>
                </div>
                <div className="absolute bottom-6 right-6 flex gap-2">
                    <button onClick={() => handleOpenVideoConfig({type: 'NEWS', news: selectedNews})} className="bg-white/90 hover:bg-white text-slate-900 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"><Film className="w-4 h-4 text-emerald-600"/> Tạo Video</button>
                    <button onClick={handleEditImage} className="bg-white/90 hover:bg-white text-slate-900 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"><Wand2 className="w-4 h-4 text-purple-600"/> Sửa Ảnh AI</button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-8 sm:p-10 bg-white custom-scrollbar">
                 <p className="text-lg font-bold text-slate-800 border-l-4 border-emerald-500 pl-6 mb-8 italic text-justify leading-relaxed bg-slate-50 py-4 pr-4 rounded-r-xl">{selectedNews.summary}</p>
                 <div className="prose prose-slate max-w-none"><p className="text-slate-600 text-sm leading-7 whitespace-pre-wrap text-justify">{selectedNews.content}</p></div>
                 <div className="mt-10 pt-6 border-t border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-3"><div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center"><Newspaper className="w-5 h-5 text-slate-400" /></div><div><p className="text-[10px] font-bold text-slate-400 uppercase">Nguồn</p><p className="text-xs font-bold text-slate-900 truncate max-w-[150px]">{selectedNews.sourceUrl}</p></div></div>
                    <a href={selectedNews.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-black text-emerald-600 hover:text-emerald-700 flex items-center gap-1 uppercase tracking-wider">Đọc bài gốc <Search className="w-3 h-3" /></a>
                 </div>
              </div>
           </div>
        </div>
      )}

      {showVideoConfigModal && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowVideoConfigModal(false)}/>
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative z-10 animate-scale-up">
                <button onClick={() => setShowVideoConfigModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                <div className="flex items-center gap-3 mb-6"><div className="bg-emerald-100 p-3 rounded-xl"><Film className="w-6 h-6 text-emerald-600"/></div><div><h3 className="text-lg font-bold text-slate-900">Cấu hình Video Veo</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Google DeepMind</p></div></div>
                <div className="space-y-6">
                    <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Chất lượng Video</label><div className="grid grid-cols-2 gap-3"><button onClick={() => setVideoSettings({...videoSettings, resolution: '720p'})} className={`py-3 rounded-xl text-xs font-bold border transition-all ${videoSettings.resolution === '720p' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>720p (Nhanh)</button><button onClick={() => setVideoSettings({...videoSettings, resolution: '1080p'})} className={`py-3 rounded-xl text-xs font-bold border transition-all ${videoSettings.resolution === '1080p' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>1080p (HD)</button></div></div>
                    <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Tỷ lệ khung hình</label><div className="grid grid-cols-2 gap-3"><button onClick={() => setVideoSettings({...videoSettings, aspectRatio: '16:9'})} className={`py-3 rounded-xl text-xs font-bold border transition-all ${videoSettings.aspectRatio === '16:9' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>16:9 (Youtube)</button><button onClick={() => setVideoSettings({...videoSettings, aspectRatio: '9:16'})} className={`py-3 rounded-xl text-xs font-bold border transition-all ${videoSettings.aspectRatio === '9:16' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>9:16 (TikTok)</button></div></div>
                </div>
                <div className="mt-8 flex gap-3"><button onClick={() => setShowVideoConfigModal(false)} className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs text-slate-600 transition-colors uppercase tracking-wide">Hủy bỏ</button><button onClick={confirmGenerateVideo} className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-200 transition-all uppercase tracking-wide active:scale-95">Tạo Video AI</button></div>
            </div>
        </div>
      )}

      {showCalcModal && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowCalcModal(false)}/>
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative z-10 animate-scale-up">
                <button onClick={() => setShowCalcModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                <div className="flex items-center gap-3 mb-8"><div className="bg-blue-100 p-3 rounded-xl"><Calculator className="w-6 h-6 text-blue-600"/></div><div><h3 className="text-xl font-bold text-slate-900">Tính toán ngân sách</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Personal Finance</p></div></div>
                <div className="space-y-6">
                    <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Thu nhập hàng tháng</label><div className="relative"><input type="number" value={calcIncome} onChange={(e) => setCalcIncome(Number(e.target.value))} className="w-full text-2xl font-black text-slate-800 border-b-2 border-slate-200 focus:border-blue-500 outline-none py-2 bg-transparent transition-colors pr-8"/><span className="absolute right-0 bottom-2 text-sm font-bold text-slate-400">{market === 'VN' ? 'VND' : 'EUR'}</span></div></div>
                    <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Chi tiêu hàng tháng</label><div className="relative"><input type="number" value={calcExpenses} onChange={(e) => setCalcExpenses(Number(e.target.value))} className="w-full text-2xl font-black text-slate-800 border-b-2 border-slate-200 focus:border-red-400 outline-none py-2 bg-transparent transition-colors pr-8"/><span className="absolute right-0 bottom-2 text-sm font-bold text-slate-400">{market === 'VN' ? 'VND' : 'EUR'}</span></div></div>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mt-4 flex items-center justify-between"><div><p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Khả dụng đầu tư</p><p className={`text-3xl font-black mt-1 ${calcSavings >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{calcSavings.toLocaleString()}</p></div><div className={`p-3 rounded-full ${calcSavings > 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>{calcSavings > 0 ? <TrendingUp className="w-6 h-6 text-emerald-600"/> : <TrendingUp className="w-6 h-6 text-red-500 rotate-180"/>}</div></div>
                </div>
            </div>
        </div>
      )}

      {isEditingImage && (
          <div className="fixed inset-0 z-[7000] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm animate-fade-in" onClick={() => setIsEditingImage(false)}/>
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-5xl relative z-10 flex flex-col gap-6 animate-scale-up">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4"><div className="flex items-center gap-3"><div className="bg-purple-100 p-2 rounded-lg"><Wand2 className="w-5 h-5 text-purple-600"/></div><h3 className="text-lg font-bold text-slate-900">Chỉnh sửa ảnh AI - Compare & Choose</h3></div><button onClick={() => setIsEditingImage(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"><X className="w-4 h-4 text-slate-500"/></button></div>
                  
                  {/* Split View Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[400px]">
                      {/* Left: Original */}
                      <div className="flex flex-col h-full gap-3">
                          <div className="bg-slate-100 rounded-2xl overflow-hidden relative flex-1 group border-2 border-transparent hover:border-slate-300 transition-all">
                              <img src={selectedNews?.imageUrl} className="w-full h-full object-cover" alt="Original" loading="lazy" />
                              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">Original</div>
                          </div>
                          <button onClick={() => confirmKeepImage(null)} className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-wide transition-colors">Keep Original</button>
                      </div>

                      {/* Right: Edited */}
                      <div className="flex flex-col h-full gap-3">
                          <div className="bg-slate-100 rounded-2xl overflow-hidden relative flex-1 border-2 border-dashed border-slate-300 flex items-center justify-center group hover:border-purple-300 transition-all">
                              {editedImageUrl ? (
                                  <>
                                    <img src={editedImageUrl} className="w-full h-full object-cover animate-fade-in" alt="Edited" loading="lazy" />
                                    <div className="absolute top-4 left-4 bg-purple-600/90 backdrop-blur text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-2"><Wand2 className="w-3 h-3"/> AI Result</div>
                                  </>
                              ) : (
                                  <div className="text-center p-6">
                                      <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4"><Wand2 className="w-8 h-8 text-purple-300" /></div>
                                      <p className="text-sm font-bold text-slate-400">Waiting for AI Magic...</p>
                                  </div>
                              )}
                          </div>
                          <button 
                            onClick={() => confirmKeepImage(editedImageUrl)} 
                            disabled={!editedImageUrl}
                            className={`py-3 rounded-xl font-bold text-xs uppercase tracking-wide transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${editedImageUrl ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-200' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                          >
                             Keep New Version <Check className="w-4 h-4" />
                          </button>
                      </div>
                  </div>

                  <div className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex-1 relative">
                          <input type="text" value={imageEditPrompt} onChange={(e) => setImageEditPrompt(e.target.value)} placeholder="Describe your edit (e.g., 'Make it a sunny day', 'Add a modern pool')" className="w-full border border-slate-200 rounded-lg pl-4 pr-4 py-3 text-sm font-medium outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all bg-white"/>
                      </div>
                      <button onClick={handleEditImage} className="bg-slate-900 text-white px-6 rounded-lg font-bold text-sm hover:bg-slate-800 transition-all shadow-md active:scale-95 flex items-center gap-2">
                          <Wand2 className="w-4 h-4" /> Generate
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- NEW: SETTINGS MODAL --- */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowSettingsModal(false)}/>
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative z-10 animate-scale-up">
                <button onClick={() => setShowSettingsModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-slate-100 p-3 rounded-xl"><Settings className="w-6 h-6 text-slate-600"/></div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">{lang === 'VN' ? 'Cài đặt' : (lang === 'DE' ? 'Einstellungen' : 'Settings')}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preferences</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Language */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Language</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['VN', 'DE', 'EN'] as Language[]).map(l => (
                                <button 
                                    key={l}
                                    onClick={() => setLang(l)}
                                    className={`py-2 rounded-lg text-xs font-bold border transition-all ${lang === l ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                                >
                                    {LANG_DISPLAY[l].label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Market */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Market Region</label>
                        <div className="grid grid-cols-2 gap-3">
                             <button onClick={() => handleMarketChange('VN')} className={`py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${market === 'VN' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold shadow-sm' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                                <span>🇻🇳</span> Vietnam
                             </button>
                             <button onClick={() => handleMarketChange('DE')} className={`py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${market === 'DE' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold shadow-sm' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                                <span>🇩🇪</span> Germany
                             </button>
                        </div>
                    </div>

                    {/* Notifications (Mock) */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Notifications</label>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                                <span className="text-xs font-bold text-slate-700">Daily Briefing</span>
                                <div className="w-8 h-4 bg-emerald-500 rounded-full relative cursor-pointer"><div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm"></div></div>
                            </div>
                            <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                                <span className="text-xs font-bold text-slate-700">Price Alerts</span>
                                <div className="w-8 h-4 bg-slate-300 rounded-full relative cursor-pointer"><div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm"></div></div>
                            </div>
                        </div>
                    </div>

                    {/* Data Management */}
                    <div className="pt-4 border-t border-slate-100">
                         <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full py-3 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 font-bold text-xs transition-colors flex items-center justify-center gap-2 group">
                            <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" /> Reset App Data
                         </button>
                    </div>
                </div>

                <div className="mt-6 text-center text-[10px] text-slate-400 font-medium">
                    BDS Navigator v2.5.0 • Build 2026
                </div>
            </div>
        </div>
      )}

      {/* --- NEW: FEEDBACK MODAL --- */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowFeedbackModal(false)}/>
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative z-10 animate-scale-up">
                <button onClick={() => setShowFeedbackModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-emerald-100 p-3 rounded-xl"><MessageSquare className="w-6 h-6 text-emerald-600"/></div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Send Feedback</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">We value your input</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Your Message</label>
                        <textarea 
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            placeholder="Tell us what you think or report a bug..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all min-h-[120px] resize-none"
                        />
                    </div>
                    
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Attached Context</p>
                        <div className="flex gap-2">
                            <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600 flex items-center gap-1">
                                {market === 'VN' ? '🇻🇳 Vietnam' : '🇩🇪 Germany'}
                            </span>
                            <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600 flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {city}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button onClick={() => setShowFeedbackModal(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs text-slate-600 transition-colors uppercase tracking-wide">Cancel</button>
                        <button onClick={handleSendFeedback} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-200 transition-all uppercase tracking-wide active:scale-95">Submit</button>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}
