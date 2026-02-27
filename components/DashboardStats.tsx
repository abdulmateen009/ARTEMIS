import React from 'react';
import { ArticleAnalysis, TOPIC_COLORS } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface DashboardStatsProps {
  articles: ArticleAnalysis[];
  onViewHistory?: () => void;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ articles, onViewHistory }) => {
  if (articles.length === 0) return null;

  const totalArticles = articles.length;
  const avgSentiment = articles.reduce((acc, curr) => acc + curr.sentiment_score, 0) / totalArticles;
  
  const topicCounts = articles.reduce((acc, curr) => {
    acc[curr.primary_topic] = (acc[curr.primary_topic] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topicData = Object.entries(topicCounts).map(([name, value]) => ({ name, value }));

  const sentimentBins = [
    { name: 'V. Neg', count: 0, fill: '#EF4444' },
    { name: 'Neg', count: 0, fill: '#F87171' },
    { name: 'Neu', count: 0, fill: '#9CA3AF' },
    { name: 'Pos', count: 0, fill: '#34D399' },
    { name: 'V. Pos', count: 0, fill: '#10B981' },
  ];

  articles.forEach(a => {
    if (a.sentiment_label === 'Very Negative') sentimentBins[0].count++;
    else if (a.sentiment_label === 'Negative') sentimentBins[1].count++;
    else if (a.sentiment_label === 'Neutral') sentimentBins[2].count++;
    else if (a.sentiment_label === 'Positive') sentimentBins[3].count++;
    else if (a.sentiment_label === 'Very Positive') sentimentBins[4].count++;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
      {/* Key Metrics Cards - Total Articles */}
      <div 
        onClick={onViewHistory}
        className={`bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center relative overflow-hidden group ${onViewHistory ? 'cursor-pointer hover:border-blue-300 hover:shadow-md transition-all' : ''}`}
      >
        <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <svg className="w-20 h-20 text-gray-900" fill="currentColor" viewBox="0 0 20 20"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" /></svg>
        </div>
        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider group-hover:text-blue-600 transition-colors">Total Articles</h3>
        <p className="text-4xl font-black text-gray-900 mt-2">{totalArticles}</p>
        {onViewHistory && (
             <div className="mt-2 text-xs font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 absolute bottom-4">
                 View Full List <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
             </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center relative overflow-hidden">
        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Avg Sentiment</h3>
        <p className={`text-4xl font-black mt-2 ${avgSentiment >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
          {avgSentiment > 0 ? '+' : ''}{avgSentiment.toFixed(2)}
        </p>
        <div className={`text-xs font-bold mt-1 ${avgSentiment >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {avgSentiment >= 0.5 ? 'Very Positive' : avgSentiment >= 0 ? 'Positive' : 'Negative Trend'}
        </div>
      </div>

      {/* Topic Chart */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm md:col-span-1 h-60 flex flex-col">
        <h3 className="text-gray-400 text-xs font-bold uppercase mb-2 tracking-wider">Topic Distribution</h3>
        <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                data={topicData}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={55}
                paddingAngle={5}
                dataKey="value"
                >
                {topicData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={TOPIC_COLORS[entry.name as keyof typeof TOPIC_COLORS] || '#9CA3AF'} />
                ))}
                </Pie>
                <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
            </PieChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Sentiment Chart */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm md:col-span-1 h-60 flex flex-col">
        <h3 className="text-gray-400 text-xs font-bold uppercase mb-2 tracking-wider">Sentiment Spread</h3>
        <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sentimentBins}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6"/>
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontWeight: 600}} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} allowDecimals={false} width={20} tick={{fill: '#9CA3AF'}}/>
                <Tooltip cursor={{fill: '#F9FAFB'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {sentimentBins.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                </Bar>
            </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;