export type SentimentLabel = 'Very Negative' | 'Negative' | 'Neutral' | 'Positive' | 'Very Positive';

export type PrimaryTopic = 
  | 'Technology' 
  | 'Finance/Markets' 
  | 'Politics/Policy' 
  | 'Health/Science' 
  | 'Environment' 
  | 'Sports' 
  | 'Culture/Lifestyle' 
  | 'Religion/Beliefs'
  | 'Social Unrest'
  | 'Other';

export type RiskCategory = 
  | 'None'
  | 'Religious Desecration' 
  | 'Ideological Subversion' 
  | 'Hate Speech' 
  | 'Public Incitement' 
  | 'Misinformation';

export interface Reference {
  type: 'Profile' | 'Page' | 'Group' | 'Channel' | 'External';
  name: string;
  url: string;
}

export interface ArticleAnalysis {
  article_id: string;
  source: string;
  url?: string; // Specific URL of the post
  date: string;
  summary: string;
  primary_topic: PrimaryTopic;
  sentiment_score: number;
  sentiment_label: SentimentLabel;
  risk_category: RiskCategory;
  key_entities: string[];
  references: Reference[];
  alert_summary?: string; 
  ip_address?: string; // Origin IP of the poster/source
  original_post_content?: string; // The raw input text
}

export interface AnalysisRequest {
  text: string;
  source: string;
  url?: string;
  date: string;
  ip_address?: string;
}

export interface DataSource {
  id: string;
  name: string;
  platform: 'RSS' | 'Facebook' | 'X (Twitter)' | 'Instagram' | 'TikTok' | 'News Paper' | 'Magazine';
  url: string;
  status: 'active' | 'error' | 'inactive';
  lastScraped: string;
}

export interface AlertEntry {
  id: string;
  timestamp: string;
  recipient: string;
  subject: string;
  body: string;
  riskLevel: RiskCategory;
  source: string;
  status: 'Sent' | 'Failed';
}

export interface DocumentationFile {
  id: string;
  name: string;
  size: string;
  uploadDate: string;
  url: string;
}

export interface AppSettings {
  email: string;
  emailEnabled: boolean;
  sensitivity: string;
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

// --- E-COMMERCE TYPES ---
export interface EcommerceTrend {
  id: string;
  title: string;
  description: string;
  growth: string; // e.g. "+24%"
  tag: string;
}

export interface PlatformMetric {
  platform: string;
  order_volume: number;
  customer_satisfaction: number; // 0-100
}

export interface ProductReviewData {
  id: string;
  product_name: string;
  category: string;
  price: string;
  platform: string;
  rating: number; // 1-5
  sentiment_score: number; // -1 to 1
  review_snippet: string;
}

export interface EcommerceData {
  trends: EcommerceTrend[];
  platforms: PlatformMetric[];
  products: ProductReviewData[];
}
// ------------------------

export const TOPIC_COLORS: Record<PrimaryTopic, string> = {
  'Technology': '#3B82F6', // Blue
  'Finance/Markets': '#10B981', // Emerald
  'Politics/Policy': '#6366F1', // Indigo
  'Health/Science': '#EC4899', // Pink
  'Environment': '#84CC16', // Lime
  'Sports': '#F59E0B', // Amber
  'Culture/Lifestyle': '#8B5CF6', // Violet
  'Religion/Beliefs': '#7C3AED', // Violet-700
  'Social Unrest': '#B91C1C', // Red-700
  'Other': '#9CA3AF' // Gray
};

export const SENTIMENT_COLORS: Record<SentimentLabel, string> = {
  'Very Negative': '#EF4444', // Red 500
  'Negative': '#F87171', // Red 400
  'Neutral': '#9CA3AF', // Gray 400
  'Positive': '#34D399', // Emerald 400
  'Very Positive': '#10B981' // Emerald 500
};