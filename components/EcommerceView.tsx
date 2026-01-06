import React, { useEffect, useState } from 'react';
import { EcommerceData } from '../types';
import { getEcommerceInsights } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const EcommerceView: React.FC = () => {
  const [data, setData] = useState<EcommerceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const result = await getEcommerceInsights();
      setData(result);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-gray-500 font-medium">Analyzing Global Market Trends...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8 animate-fade-in-down">
      
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-900 to-blue-800 rounded-xl p-8 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2">Global Commerce Pulse</h2>
        <p className="text-blue-100 max-w-2xl">
          Real-time analysis of buying cultures, platform performance, and consumer sentiment across the e-commerce landscape.
        </p>
      </div>

      {/* Trending Culture Row */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Trending Buying & Selling Culture
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.trends.map((trend) => (
            <div key={trend.id} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <svg className="w-24 h-24 text-indigo-600 transform rotate-12" fill="currentColor" viewBox="0 0 20 20">
                   <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.298-2.54a1 1 0 00-1.71-.513 4.154 4.154 0 00-.863 1.907 6.565 6.565 0 00-.134 1.953c.026.247.055.495.087.74.015.115.03.228.046.341.088.635.187 1.252.277 1.845.056.372.1.728.132 1.054.048.47.067.933.056 1.346-.016.608-.128 1.07-.34 1.405-.228.361-.577.591-1.05.693a1 1 0 00-.81 1.196 1 1 0 001.127.8 5.16 5.16 0 001.76-.665c.42-.266.772-.61 1.06-1.018.468-.665.71-1.488.756-2.315.01-.19-.003-.385-.015-.58-.024-.38-.052-.77-.078-1.157-.043-.637-.086-1.274-.114-1.847-.02-.387-.031-.73-.027-1.026.01-.645.152-1.218.4-1.658.21-.373.486-.68.803-.927.054.896.16 1.802.327 2.693.18 1.012.42 1.983.742 2.87.333.91.748 1.737 1.258 2.426.544.735 1.238 1.29 2.072 1.623a13.357 13.357 0 002.592.766 1 1 0 001.08-.664c.063-.19.065-.392.008-.586a1 1 0 00-.47-.563c-.886-.532-1.428-1.214-1.77-2.007-.347-.803-.54-1.74-.694-2.736a32.748 32.748 0 01-.29-2.706 15.68 15.68 0 01-.06-1.28c0-.792.053-1.57.156-2.316.03-.223.067-.442.108-.655.094-.486.208-.946.33-1.353.118-.396.251-.74.39-1.01.125-.24.254-.42.365-.544a1 1 0 00-.094-1.42z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex justify-between items-start mb-3">
                <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-1 rounded border border-indigo-100">
                  {trend.tag}
                </span>
                <span className="text-green-600 font-bold text-sm bg-green-50 px-2 py-1 rounded-full">
                  {trend.growth} Growth
                </span>
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">{trend.title}</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{trend.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Analysis Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
           <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Purchase Volume by Platform</h3>
           <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={data.platforms as any[]} layout="vertical" margin={{ left: 10 }}>
                 <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                 <XAxis type="number" fontSize={12} tickFormatter={(val) => `${val/1000}k`} />
                 <YAxis dataKey="platform" type="category" fontSize={12} width={130} />
                 <Tooltip cursor={{fill: '#F3F4F6'}} contentStyle={{borderRadius: '8px'}} />
                 <Bar dataKey="order_volume" fill="#4F46E5" radius={[0, 4, 4, 0]} barSize={24} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
           <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Customer Satisfaction (CSAT)</h3>
           <div className="h-64 flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                    data={data.platforms as any[]}
                    dataKey="customer_satisfaction"
                    nameKey="platform"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                 >
                    {data.platforms.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#10B981', '#3B82F6', '#6366F1', '#8B5CF6'][index % 4]} />
                    ))}
                 </Pie>
                 <Tooltip />
               </PieChart>
             </ResponsiveContainer>
           </div>
           <div className="flex justify-center gap-4 text-xs text-gray-500 mt-2 flex-wrap">
              {data.platforms.map((p, i) => (
                  <div key={p.platform} className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{backgroundColor: ['#10B981', '#3B82F6', '#6366F1', '#8B5CF6'][i % 4]}}></span>
                      {p.platform}: {p.customer_satisfaction}%
                  </div>
              ))}
           </div>
        </div>
      </div>

      {/* Most Loved Products */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
             <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
          Most Loved Products & Reviews
        </h3>
        
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Review Summary</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{product.product_name}</div>
                    <div className="text-xs text-gray-500">{product.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                      {product.platform}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-500 font-bold">
                    {'★'.repeat(Math.round(product.rating))}
                    <span className="text-gray-300 font-normal">{'★'.repeat(5 - Math.round(product.rating))}</span>
                    <span className="ml-1 text-gray-500 text-xs font-normal">({product.rating})</span>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-start gap-2">
                         <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                            product.sentiment_score > 0.5 ? 'bg-green-500' : 
                            product.sentiment_score > 0 ? 'bg-green-300' : 'bg-gray-300'
                         }`}></div>
                         <p className="text-sm text-gray-600 italic">"{product.review_snippet}"</p>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default EcommerceView;