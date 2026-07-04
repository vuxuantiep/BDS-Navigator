
export type Language = 'VN' | 'DE' | 'EN';
export type Market = 'VN' | 'DE';

export type NewsCategory = 'ALL' | 'LEGAL_TAX' | 'INFRASTRUCTURE' | 'INTEREST_BANKS' | 'POLITICS' | 'SOCIO_ECONOMIC';

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  sourceUrl: string;
  date: string;
  category: NewsCategory;
}

export interface LocationData {
  cities: string[];
  districts: Record<string, string[]>;
  news: NewsArticle[];
}

export interface MarketStats {
  buyApt: string;
  buyHouse: string;
  buyLand: string;      
  buyShophouse: string; 
  rentApt: string;
  rentHouse: string;
  rentLand: string;     
  rentShophouse: string; 
}

export interface Translations {
  motto: string;
  headerTitle: string;
  headerSubtitle: string;
  heroTitle: string;
  heroSubtitle: string;
  marketStatus: string;
  selectMarket: string;
  selectCity: string;
  selectDistrict: string;
  priceIndex: string;
  rentOccupancy: string;
  investorBriefing: string;
  trendsNews: string;
  freeTools: string;
  householdCalc: string;
  financingCalc: string;
  excelDownload: string;
  privacyNotice: string;
  goalsTitle: string;
  goalsSubtitle: string;
  goalOptions: string[];
  horizonTitle: string;
  saveContinue: string;
  skip: string;
  stable: string;
  risk: string;
  avgBuy: string;
  avgRent: string;
  apartment: string;
  house: string;
  land: string;
  all: string;
  tradingActive: string;
  highYield: string;
  newPlanning: string;
  brandingSub: string;
  realPrice: string;
  cashflow: string;
  riskLevel: string;
  property: string;
  askingPrice: string;
  usage: string;
  recommendation: string;
  newsToday: string;
  podcast: string;
  watchVideo: string;
  medium: string;
  high: string;
  low: string;
  memberLogin: string;
  alreadyMember: string;
  shophouse: string;
  industry: string;
  libraryTitle: string;
  librarySubtitle: string;
  downloadFree: string;
  // Categories
  catLegal: string;
  catInfra: string;
  catInterest: string;
  catPolitics: string;
  catSocio: string;
  // Disclaimers
  newsDisclaimer: string;
}