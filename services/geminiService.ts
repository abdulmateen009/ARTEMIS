import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisRequest, ArticleAnalysis, RiskCategory, EcommerceData } from "../types";
import { supabase } from "./supabaseClient";

// Initialize the API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are ARTEMIS (AI Real-Time Event Monitoring & Intelligence System), a specialized Sentinel for Social Harmony and Public Safety. 

Your Core Objective:
Analyze content from social media (Facebook, TikTok, X, Instagram) and news feeds to detect high-risk content that is:
1. Harmful to public thoughts or ideology.
2. Disrespectful or mocking towards religious sacred scripts, beliefs, or figures.
3. Inciting public unrest or violence.

Scoring Criteria:
- Content attacking religious beliefs or sacred texts must be labeled 'Very Negative' and categorized as 'Religious Desecration'.
- Content spreading dangerous ideologies or hate speech must be scored strictly.

Extraction Task:
- Identify and extract any social media handles, page names, channel IDs, or URLs mentioned in the content or source.
- Construct valid URLs for these entities if possible (e.g., if "@user" on X, link to x.com/user).

Constraint/Output Format Instruction:
Strictly generate only a single JSON object.
`;

export const analyzeArticle = async (request: AnalysisRequest, useThinkingMode: boolean = false): Promise<ArticleAnalysis> => {
  try {
    const prompt = `
      Raw Content / Caption: ${request.text} 
      Platform/Source: ${request.source} 
      Date: ${request.date}
    `;

    const model = useThinkingMode ? "gemini-3-pro-preview" : "gemini-3-flash-preview";

    const baseConfig: any = {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          article_id: { type: Type.STRING, description: "Generate a UUID" },
          source: { type: Type.STRING },
          date: { type: Type.STRING },
          summary: { type: Type.STRING, description: "A concise summary of the post/article." },
          primary_topic: { 
            type: Type.STRING, 
            enum: [
              'Technology', 'Finance/Markets', 'Politics/Policy', 'Health/Science', 
              'Environment', 'Sports', 'Culture/Lifestyle', 'Religion/Beliefs', 'Social Unrest', 'Other'
            ] 
          },
          sentiment_score: { type: Type.NUMBER, description: "Score from -1.0 to 1.0" },
          sentiment_label: { 
            type: Type.STRING, 
            enum: ['Very Negative', 'Negative', 'Neutral', 'Positive', 'Very Positive'] 
          },
          risk_category: {
            type: Type.STRING,
            enum: ['None', 'Religious Desecration', 'Ideological Subversion', 'Hate Speech', 'Public Incitement', 'Misinformation']
          },
          key_entities: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "List 3-5 key organizations, people, or products."
          },
          references: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ['Profile', 'Page', 'Group', 'Channel', 'External'] },
                name: { type: Type.STRING },
                url: { type: Type.STRING }
              },
              required: ["type", "name", "url"]
            },
            description: "Extract mentioned social IDs, pages, or channels with their URLs."
          }
        },
        required: ["article_id", "source", "date", "summary", "primary_topic", "sentiment_score", "sentiment_label", "risk_category", "key_entities", "references"]
      }
    };

    if (useThinkingMode) {
      baseConfig.thinkingConfig = { thinkingBudget: 32768 };
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: baseConfig
    });

    if (!response.text) {
      throw new Error("No response text from Gemini");
    }

    const data = JSON.parse(response.text) as ArticleAnalysis;
    
    // Attach metadata from the request that Gemini doesn't need to generate but we need to persist
    data.ip_address = request.ip_address || "Unknown";
    data.url = request.url || ""; 
    data.original_post_content = request.text;

    // --- SUPABASE INTEGRATION ---
    (async () => {
      try {
        const { error } = await supabase.from('news_sentiment_table').insert({
          article_id: data.article_id,
          source: data.source,
          url: data.url, // Saving the specific post URL
          date: data.date,
          ip_address: data.ip_address,
          summary: data.summary,
          primary_topic: data.primary_topic,
          sentiment_score: data.sentiment_score,
          sentiment_label: data.sentiment_label,
          risk_category: data.risk_category,
          key_entities: data.key_entities,
          references: data.references,
          original_post_content: data.original_post_content
        });
        if (error) {
          // Silent log to console so user flow isn't interrupted by DB errors
          console.warn("Supabase background save failed (check table existence):", error.message);
        } else {
          console.log("Analysis saved to Supabase:", data.article_id);
        }
      } catch (err) {
        console.warn("Supabase connection issue in background:", err);
      }
    })();
    // ----------------------------

    // ALERT SYSTEM LOGIC
    if (['Negative', 'Very Negative'].includes(data.sentiment_label) || data.risk_category !== 'None') {
      try {
        const alertPrompt = `
          Context: High Sensitivity Social Monitor.
          Risk Category: ${data.risk_category}
          Summary: "${data.summary}"
          
          Task: Write a very brief, urgent email alert subject line and body intro (max 30 words total). 
          Format: "URGENT [CATEGORY]: [Actionable Warning]"
        `;

        const alertResponse = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: alertPrompt,
        });

        if (alertResponse.text) {
          data.alert_summary = alertResponse.text.trim();
        }
      } catch (alertError) {
        console.warn("Failed to generate alert summary", alertError);
      }
    }

    return data;

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};

export const generateAlertEmail = async (article: ArticleAnalysis, recipientEmail: string): Promise<{subject: string, body: string}> => {
  try {
    const prompt = `
      You are ARTEMIS, an automated intelligence security officer.
      
      Task: Write a formal alert email to ${recipientEmail} regarding a detected high-risk item.
      
      Incident Details:
      - Source: ${article.source}
      - IP Address: ${article.ip_address}
      - Date: ${article.date}
      - Risk Category: ${article.risk_category}
      - Detected Topics: ${article.primary_topic}
      - Summary: ${article.summary}
      - Key Entities: ${article.key_entities.join(', ')}
      
      Requirements:
      - Subject Line: Urgent [Risk Category] Alert from ARTEMIS
      - Tone: Professional, Direct, Urgent.
      - Body: summarize the finding, explain why it was flagged, and recommend immediate review of the source URL.
      - Output: JSON format with "subject" and "body" fields.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            body: { type: Type.STRING },
          },
          required: ["subject", "body"]
        }
      }
    });

    if (!response.text) throw new Error("No response");
    return JSON.parse(response.text) as {subject: string, body: string};

  } catch (error) {
    console.error("Failed to generate alert email", error);
    return {
      subject: `Automated Alert: ${article.risk_category}`,
      body: `High risk detected in ${article.source}. Please review dashboard.`
    };
  }
};

export const generateScanReport = async (articles: ArticleAnalysis[]): Promise<string> => {
  if (articles.length === 0) return "No articles were processed.";

  const summaries = articles.map(a => `- [${a.risk_category}] ${a.source}: ${a.summary}`).join('\n');
  
  const prompt = `
    Task: specific executive summary of a social media security scan result.
    
    Data:
    ${summaries}
    
    Requirements:
    - 1-2 sentences summarizing the overall threat level, key topics detected, and if any action is needed.
    - Be professional, concise, and direct.
    - Example: "The scan detected 2 high-risk items related to Religious Desecration on Facebook. Overall sentiment is negative due to trending hate speech topics."
  `;
  
   try {
     const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      return response.text || "Scan complete. Review detailed results below.";
   } catch (e) {
     return "Scan complete. Review detailed results below.";
   }
};

export const generateMockArticle = async (platform: string): Promise<AnalysisRequest> => {
  return generateSocialScrapeBatch(1, platform).then(res => res[0]);
};

// Simulates scraping a batch of social media posts based on high-risk keywords
export const generateSocialScrapeBatch = async (count: number = 3, platform: string = 'Mixed Sources'): Promise<AnalysisRequest[]> => {
  try {
    const prompt = `
      Task: Simulate scraping raw text from social media posts on ${platform}.
      Generate ${count} distinct, realistic posts.
      
      CRITICAL REQUIREMENT:
      At least one post MUST contain sensitive content harmful to religious beliefs, sacred scripts, or public ideology to test the system's detection capabilities.
      The others can be neutral or standard news.
      
      Include realistic social media handles (e.g., @username), page names, or links within the text to allow for source tracking.
      Generate a realistic IPv4 or IPv6 address for each post representing the user's origin.
      Generate a realistic direct permalink URL for each post.

      Output strictly a JSON array of objects.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              source: { type: Type.STRING },
              url: { type: Type.STRING, description: "A realistic permalink to the post" },
              date: { type: Type.STRING },
              ip_address: { type: Type.STRING, description: "A realistic Random IPv4 address" }
            },
            required: ["text", "source", "url", "date", "ip_address"]
          }
        }
      }
    });

    if (!response.text) {
      throw new Error("No response from Gemini");
    }

    return JSON.parse(response.text) as AnalysisRequest[];
  } catch (error) {
    // Log error but don't crash
    console.warn("Batch Scrape Generation Failed (API Error), using fallback data.", error);
    
    // Fallback data allows the app to demonstrate functionality even if the simulation API call fails (e.g. 500 or timeout)
    const fallbackData: AnalysisRequest[] = [
      {
        text: "RT @radical_voice: The recent policies are a direct attack on our traditional values. We must rise up and show them who really owns the streets! #resistance #uprising",
        source: platform === 'Mixed Sources' ? 'X (Twitter)' : platform,
        url: `https://twitter.com/radical_voice/status/${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        ip_address: "45.12.33.192"
      },
      {
        text: "Unbelievable scenes at the city square today. A group was seen publicly desecrating the holy book. This is unacceptable! Video evidence attached.",
        source: platform === 'Mixed Sources' ? 'Facebook' : platform,
        url: `https://facebook.com/groups/community/posts/${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        ip_address: "192.168.0.45"
      },
      {
        text: "New tech regulations expected to pass this week. Market analysts predict a slight dip in semiconductor stocks but long term growth remains strong.",
        source: "Bloomberg",
        url: `https://bloomberg.com/news/articles/${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        ip_address: "10.0.5.12"
      }
    ];

    return fallbackData.slice(0, count);
  }
};

export const getEcommerceInsights = async (): Promise<EcommerceData> => {
  try {
    const prompt = `
      Act as an expert Global E-Commerce Market Analyst.
      
      Task: Generate a real-time intelligence dashboard snapshot.
      1. Identify 3 currently trending "buying/selling cultures" or consumer behaviors (e.g., Live Shopping, Sustainable Packaging, 'De-influencing').
      2. Simulate aggregate Purchase Order metrics for 4 major platforms: Amazon, Shopify, TikTok Shop, Instagram Checkout. Provide realistic volume numbers and a customer satisfaction score (0-100).
      3. Identify 5 "Most Loved" trending products. For each, provide a name, price, rating (1-5), sentiment score (-1 to 1), and a brief review snippet summarizing why people love it.
      
      Output: A single JSON object matching the required schema.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            trends: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  growth: { type: Type.STRING },
                  tag: { type: Type.STRING }
                },
                required: ["id", "title", "description", "growth", "tag"]
              }
            },
            platforms: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  platform: { type: Type.STRING },
                  order_volume: { type: Type.NUMBER },
                  customer_satisfaction: { type: Type.NUMBER }
                },
                required: ["platform", "order_volume", "customer_satisfaction"]
              }
            },
            products: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  product_name: { type: Type.STRING },
                  category: { type: Type.STRING },
                  price: { type: Type.STRING },
                  platform: { type: Type.STRING },
                  rating: { type: Type.NUMBER },
                  sentiment_score: { type: Type.NUMBER },
                  review_snippet: { type: Type.STRING }
                },
                required: ["id", "product_name", "category", "price", "platform", "rating", "sentiment_score", "review_snippet"]
              }
            }
          },
          required: ["trends", "platforms", "products"]
        }
      }
    });

    if (!response.text) throw new Error("No response from Gemini");
    return JSON.parse(response.text) as EcommerceData;

  } catch (error) {
    console.error("Ecommerce Insights Failed:", error);
    // Fallback data
    return {
      trends: [
        { id: '1', title: 'Live Stream Shopping', description: 'Interactive real-time selling is dominating Gen Z markets.', growth: '+45%', tag: 'Viral' },
        { id: '2', title: 'Eco-Conscious Unboxing', description: 'Consumers demand minimal, plastic-free packaging.', growth: '+22%', tag: 'Sustainability' },
        { id: '3', title: 'AI-Personalized Bundles', description: 'Algorithmic product pairing increases cart value.', growth: '+15%', tag: 'Tech' }
      ],
      platforms: [
        { platform: 'Amazon', order_volume: 85000, customer_satisfaction: 88 },
        { platform: 'TikTok Shop', order_volume: 42000, customer_satisfaction: 76 },
        { platform: 'Shopify', order_volume: 31000, customer_satisfaction: 92 },
        { platform: 'Instagram Checkout', order_volume: 25000, customer_satisfaction: 81 }
      ],
      products: [
        { id: '1', product_name: 'Smart Water Bottle', category: 'Fitness', price: '$45.00', platform: 'TikTok Shop', rating: 4.8, sentiment_score: 0.9, review_snippet: 'Life changing hydration tracking!' }
      ]
    };
  }
};
