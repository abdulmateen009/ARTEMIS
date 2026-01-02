import React from 'react';
import { ArticleAnalysis, TOPIC_COLORS } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface DashboardStatsProps {
  articles: ArticleAnalysis[];
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ articles }) => {
  if (articles.length === 0) return null;

  // Calculate Aggregates
  const totalArticles = articles.length;
  const avgSentiment = articles.reduce((acc, curr) => acc + curr.sentiment_score, 0) / totalArticles;
  
  // Topic Distribution
  const topicCounts = articles.reduce((acc, curr) => {
    acc[curr.primary_topic] = (acc[curr.primary_topic] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topicData = Object.entries(topicCounts).map(([name, value]) => ({ name, value }));

  // Sentiment Distribution (Bins)
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
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {/* Key Metrics Cards */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
        <h3 className="text-gray-500 text-sm font-medium uppercase">Total Articles</h3>
        <p className="text-3xl font-bold text-gray-900 mt-1">{totalArticles}</p>
      </div>

      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
        <h3 className="text-gray-500 text-sm font-medium uppercase">Avg Sentiment</h3>
        <p className={`text-3xl font-bold mt-1 ${avgSentiment >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
          {avgSentiment > 0 ? '+' : ''}{avgSentiment.toFixed(2)}
        </p>
      </div>

      {/* Topic Chart */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm md:col-span-1 h-48">
        <h3 className="text-gray-500 text-xs font-medium uppercase mb-2">Topic Distribution</h3>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={topicData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={60}
              paddingAngle={5}
              dataKey="value"
            >
              {topicData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={TOPIC_COLORS[entry.name as keyof typeof TOPIC_COLORS] || '#9CA3AF'} />
              ))}
            </Pie>
            <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Sentiment Chart */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm md:col-span-1 h-48">
        <h3 className="text-gray-500 text-xs font-medium uppercase mb-2">Sentiment Spread</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sentimentBins}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB"/>
            <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
            <YAxis fontSize={10} axisLine={false} tickLine={false} allowDecimals={false}/>
            <Tooltip cursor={{fill: '#F3F4F6'}} contentStyle={{ borderRadius: '8px' }}/>
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {sentimentBins.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardStats;