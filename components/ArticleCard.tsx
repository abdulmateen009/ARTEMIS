import React, { useState } from 'react';
import { ArticleAnalysis, SENTIMENT_COLORS, TOPIC_COLORS } from '../types';

interface ArticleCardProps {
  article: ArticleAnalysis;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  const [showRaw, setShowRaw] = useState(false);
  const sentimentColor = SENTIMENT_COLORS[article.sentiment_label];
  const topicColor = TOPIC_COLORS[article.primary_topic] || TOPIC_COLORS['Other'];
  
  const isHighRisk = article.risk_category && article.risk_category !== 'None';
  
  const handleGmailClick = () => {
    if (!article.alert_summary) return;
    
    const subject = encodeURIComponent(`🚨 ARTEMIS ALERT: ${article.risk_category} detected on ${article.source}`);
    const body = encodeURIComponent(
`${article.alert_summary}

---
CRITICAL INTELLIGENCE REPORT
Risk Category: ${article.risk_category}
Source: ${article.source}
Date: ${article.date}
IP Address: ${article.ip_address || 'Unknown'}

Analysis Summary:
${article.summary}

Sentiment: ${article.sentiment_label} (${article.sentiment_score})
Entities: ${article.key_entities.join(', ')}

References:
${article.references?.map(r => `- ${r.name} (${r.url})`).join('\n') || 'None'}

---
Action Required: Please review immediately via Admin Dashboard.`
    );
    
    // Open Gmail compose window
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-5 hover:shadow-md transition-shadow duration-200 relative overflow-hidden ${isHighRisk ? 'border-red-400 ring-1 ring-red-100' : 'border-gray-100'}`}>
      
      {/* High Risk Indicator Strip */}
      {isHighRisk && (
        <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600 animate-pulse"></div>
      )}

      <div className="flex justify-between items-start mb-3 pl-3">
        <div>
          <div className="flex gap-2 mb-2">
            <span 
                className="inline-block px-2 py-1 text-xs font-semibold rounded-full"
                style={{ backgroundColor: `${topicColor}20`, color: topicColor }}
            >
                {article.primary_topic}
            </span>
            {isHighRisk && (
                 <span className="inline-block px-2 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700 border border-red-200">
                    ⚠️ {article.risk_category}
                 </span>
            )}
          </div>
          <h3 className="text-sm text-gray-500 font-medium">{article.source} &bull; {article.date}</h3>
        </div>
        <div className="text-right">
          <div 
            className="text-lg font-bold"
            style={{ color: sentimentColor }}
          >
            {article.sentiment_score.toFixed(2)}
          </div>
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {article.sentiment_label}
          </div>
        </div>
      </div>

      <p className="text-gray-800 text-sm leading-relaxed mb-4 pl-3">
        {article.summary}
      </p>

      {/* Alert Section */}
      {article.alert_summary && (
        <div className="mb-4 ml-3 bg-red-50 border border-red-100 rounded-md p-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-red-700 font-bold text-xs uppercase mb-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Security Alert
            </div>
            <p className="text-red-800 text-sm font-medium italic">
              "{article.alert_summary}"
            </p>
          </div>
          <button 
            onClick={handleGmailClick}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded text-xs font-semibold transition-colors shadow-sm"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
            </svg>
            Email Admin
          </button>
        </div>
      )}

      {/* References Section */}
      {article.references && article.references.length > 0 && (
         <div className="mb-4 ml-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-xs text-gray-500 font-semibold uppercase mb-2 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Identified Sources & Channels
            </p>
            <div className="flex flex-wrap gap-2">
                {article.references.map((ref, idx) => (
                    <a 
                        key={idx} 
                        href={ref.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 hover:border-blue-300 hover:text-blue-600 rounded-md text-xs font-medium text-gray-600 transition-colors shadow-sm"
                    >
                        {ref.type === 'Page' && <span className="text-blue-500">📄</span>}
                        {ref.type === 'Group' && <span className="text-purple-500">👥</span>}
                        {ref.type === 'Profile' && <span className="text-gray-500">👤</span>}
                        {ref.type === 'Channel' && <span className="text-red-500">📺</span>}
                        <span>{ref.name}</span>
                    </a>
                ))}
            </div>
         </div>
      )}

      <div className="border-t border-gray-100 pt-3 pl-3">
        <div className="flex justify-between items-center mb-2">
             <p className="text-xs text-gray-400 font-semibold uppercase">Key Entities</p>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {article.key_entities.map((entity, idx) => (
            <span key={idx} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-md border border-gray-200">
              {entity}
            </span>
          ))}
        </div>
        
        {/* Traceability & Raw Data */}
        <div className="border-t border-dashed border-gray-200 pt-3">
             <div className="flex justify-between items-center cursor-pointer group" onClick={() => setShowRaw(!showRaw)}>
                 <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded border border-gray-200">
                        IP: {article.ip_address || "Unknown"}
                    </span>
                 </div>
                 <div className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1">
                    {showRaw ? 'Hide Raw Post' : 'View Raw Post'}
                     <svg className={`w-3 h-3 transition-transform ${showRaw ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                     </svg>
                 </div>
             </div>
             {showRaw && (
                 <div className="mt-3 bg-slate-900 rounded-lg p-3 text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap">
                     {article.original_post_content || "No raw content available."}
                 </div>
             )}
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;