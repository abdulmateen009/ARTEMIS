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
    const body = encodeURIComponent(`${article.alert_summary}\n\n---\nCRITICAL INTELLIGENCE REPORT\nRisk Category: ${article.risk_category}\nSource: ${article.source}\nDate: ${article.date}\nIP Address: ${article.ip_address || 'Unknown'}\n\nAnalysis Summary:\n${article.summary}\n\nSentiment: ${article.sentiment_label} (${article.sentiment_score})\nEntities: ${article.key_entities.join(', ')}\n\nReferences:\n${article.references?.map(r => `- ${r.name} (${r.url})`).join('\n') || 'None'}`);
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border p-5 md:p-6 transition-all duration-200 relative overflow-hidden group ${isHighRisk ? 'border-red-300 ring-1 ring-red-100 shadow-red-100' : 'border-gray-200 hover:border-blue-300 hover:shadow-md'}`}>
      
      {/* High Risk Indicator Strip */}
      {isHighRisk && (
        <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4 pl-3">
        <div>
          <div className="flex flex-wrap gap-2 mb-2">
            <span 
                className="inline-block px-2.5 py-0.5 text-xs font-bold rounded-full tracking-wide uppercase"
                style={{ backgroundColor: `${topicColor}15`, color: topicColor }}
            >
                {article.primary_topic}
            </span>
            {isHighRisk && (
                 <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-700 border border-red-200">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    {article.risk_category}
                 </span>
            )}
          </div>
          <h3 className="text-sm text-gray-500 font-semibold">{article.source} &bull; <span className="font-normal opacity-80">{article.date}</span></h3>
        </div>
        
        <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 sm:self-start self-end">
          <div className="text-right">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sentiment</div>
            <div className="text-sm font-bold" style={{ color: sentimentColor }}>{article.sentiment_label}</div>
          </div>
          <div className="text-xl font-black" style={{ color: sentimentColor }}>
             {article.sentiment_score > 0 ? '+' : ''}{article.sentiment_score.toFixed(2)}
          </div>
        </div>
      </div>

      <p className="text-gray-800 text-sm leading-relaxed mb-5 pl-3 font-medium">
        {article.summary}
      </p>

      {/* Alert Section */}
      {article.alert_summary && (
        <div className="mb-5 ml-3 bg-red-50 border border-red-100 rounded-lg p-3.5 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-red-700 font-bold text-xs uppercase mb-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Security Alert
            </div>
            <p className="text-red-900 text-sm font-semibold italic">"{article.alert_summary}"</p>
          </div>
          <button 
            onClick={handleGmailClick}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-600 hover:text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
          >
            Email Admin
          </button>
        </div>
      )}

      {/* References Section */}
      {article.references && article.references.length > 0 && (
         <div className="mb-5 ml-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-[10px] text-gray-400 font-bold uppercase mb-2 flex items-center gap-1 tracking-wider">
                Identified Sources
            </p>
            <div className="flex flex-wrap gap-2">
                {article.references.map((ref, idx) => (
                    <a 
                        key={idx} 
                        href={ref.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 hover:border-blue-400 hover:text-blue-600 rounded-md text-xs font-semibold text-gray-600 transition-colors shadow-sm"
                    >
                        {ref.type === 'Page' && <span className="opacity-70">📄</span>}
                        {ref.type === 'Group' && <span className="opacity-70">👥</span>}
                        {ref.type === 'Profile' && <span className="opacity-70">👤</span>}
                        {ref.type === 'Channel' && <span className="opacity-70">📺</span>}
                        <span>{ref.name}</span>
                    </a>
                ))}
            </div>
         </div>
      )}

      <div className="border-t border-gray-100 pt-4 pl-3">
        <p className="text-[10px] text-gray-400 font-bold uppercase mb-2 tracking-wider">Key Entities Detected</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {article.key_entities.map((entity, idx) => (
            <span key={idx} className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-md border border-gray-200 font-medium">
              {entity}
            </span>
          ))}
        </div>
        
        <div className="border-t border-dashed border-gray-200 pt-3">
             <div className="flex justify-between items-center cursor-pointer group select-none" onClick={() => setShowRaw(!showRaw)}>
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 font-mono bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                        IP: {article.ip_address || "Unknown"}
                    </span>
                 </div>
                 <div className="text-xs text-blue-600 font-bold hover:text-blue-700 flex items-center gap-1 transition-colors">
                    {showRaw ? 'Hide Raw Post' : 'View Raw Post'}
                     <svg className={`w-3 h-3 transition-transform duration-200 ${showRaw ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                     </svg>
                 </div>
             </div>
             {showRaw && (
                 <div className="mt-3 bg-slate-900 rounded-lg p-4 text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                     {article.original_post_content || "No raw content available."}
                 </div>
             )}
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;