import React from 'react';
import { TrendingUp, Zap, Target } from 'lucide-react';

const AILeadScoring = () => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2"><TrendingUp /> AI Lead Scoring</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white col-span-1">
          <Zap className="text-yellow-300 mb-4" size={32} />
          <h3 className="text-xl font-bold mb-2">Predictive AI Engine</h3>
          <p className="text-indigo-100 text-sm">
            Our AI engine analyzes hundreds of data points to predict which leads are most likely to convert. Focus your energy on the top 10%.
          </p>
          <div className="mt-6 pt-6 border-t border-indigo-400/30">
            <div className="text-3xl font-black text-white mb-1">85%</div>
            <div className="text-xs uppercase tracking-widest text-indigo-200 font-bold">Accuracy Rate</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 col-span-2 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Target size={18}/> Top Scoring Leads</h3>
          <div className="space-y-4">
            {[
              { name: 'Acme Corp', score: 98, intent: 'High' },
              { name: 'Globex Inc', score: 92, intent: 'High' },
              { name: 'Soylent Corp', score: 87, intent: 'Medium' }
            ].map((lead, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <div className="font-bold text-slate-800">{lead.name}</div>
                  <div className="text-xs text-slate-500">Intent: {lead.intent}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xl font-black text-indigo-600">{lead.score}</div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">AI Score</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AILeadScoring;
