import React from 'react';
import { ArticleAnalysis, SENTIMENT_COLORS, TOPIC_COLORS } from '../types';

interface HistoryViewProps {
  articles: ArticleAnalysis[];
}

const HistoryView: React.FC<HistoryViewProps> = ({ articles }) => {
  if (articles.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No history available</h3>
        <p className="mt-1 text-sm text-gray-500">Analyzed content will appear here once you process articles.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
            <h2 className="text-lg font-semibold text-gray-800">Analysis History Log</h2>
            <p className="text-sm text-gray-500">Comprehensive record of all processed events.</p>
        </div>
        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          {articles.length} Records
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Date / Source</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Topic</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Origin IP</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Analysis Summary</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Sentiment</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {articles.map((article) => {
               const sentimentColor = SENTIMENT_COLORS[article.sentiment_label];
               const topicColor = TOPIC_COLORS[article.primary_topic];
               
               return (
                <tr key={article.article_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{article.date}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{article.source}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     <span 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: `${topicColor}20`, color: topicColor }}
                      >
                        {article.primary_topic}
                      </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs font-mono text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                        {article.ip_address || "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-800 line-clamp-2 leading-relaxed">
                        {article.summary}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                        {article.key_entities.slice(0, 3).map((entity, idx) => (
                            <span key={idx} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                                {entity}
                            </span>
                        ))}
                         {article.key_entities.length > 3 && (
                            <span className="text-[10px] text-gray-400 px-1.5 py-0.5">+{article.key_entities.length - 3} more</span>
                        )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex flex-col items-end">
                        <span 
                            className="text-sm font-bold"
                            style={{ color: sentimentColor }}
                        >
                            {article.sentiment_score.toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-400 font-medium uppercase">{article.sentiment_label}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoryView;