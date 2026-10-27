import React, { useState } from 'react';
import { SubscriptionPlanItem } from '../types';
import { adminApi } from '../api';
import { Sliders, Save, Check, Plus, Trash2, Crown } from 'lucide-react';

interface PlansConfiguratorPageProps {
  plans: SubscriptionPlanItem[];
  onRefresh: () => void;
}

export const PlansConfiguratorPage: React.FC<PlansConfiguratorPageProps> = ({ plans, onRefresh }) => {
  const [editingPlans, setEditingPlans] = useState<{ [tier: string]: SubscriptionPlanItem }>(() => {
    const map: any = {};
    plans.forEach(p => { map[p.tier_name] = { ...p }; });
    return map;
  });

  const [savedTier, setSavedTier] = useState<string | null>(null);

  const handleFieldChange = (tier: string, field: keyof SubscriptionPlanItem, value: any) => {
    setEditingPlans(prev => ({
      ...prev,
      [tier]: {
        ...prev[tier],
        [field]: value
      }
    }));
  };

  const handleAddFeature = (tier: string) => {
    const current = editingPlans[tier]?.features || [];
    handleFieldChange(tier, 'features', [...current, 'New custom feature highlight']);
  };

  const handleRemoveFeature = (tier: string, index: number) => {
    const current = editingPlans[tier]?.features || [];
    handleFieldChange(tier, 'features', current.filter((_, i) => i !== index));
  };

  const handleFeatureTextChange = (tier: string, index: number, text: string) => {
    const current = [...(editingPlans[tier]?.features || [])];
    current[index] = text;
    handleFieldChange(tier, 'features', current);
  };

  const handleSave = async (tier: string) => {
    const plan = editingPlans[tier];
    if (!plan) return;

    await adminApi.updatePlan(tier, {
      display_name: plan.display_name,
      price_cents: Number(plan.price_cents),
      credit_allowance: Number(plan.credit_allowance),
      features: plan.features,
      is_active: plan.is_active
    });

    setSavedTier(tier);
    setTimeout(() => setSavedTier(null), 2000);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-charcoal-800 border border-charcoal-700/80">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Sliders className="w-5 h-5 text-electric-500" />
          Dynamic Subscription Tier Configurator
        </h2>
        <p className="text-xs text-neutral-400 mt-1">
          Update prices, monthly credit pools, and marketing feature checklists dynamically. Any change is instantly reflected across the Flutter mobile app without publishing a new app store release.
        </p>
      </div>

      {/* Grid of Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {['start', 'basic', 'pro'].map((tier) => {
          const plan = editingPlans[tier] || plans.find(p => p.tier_name === tier);
          if (!plan) return null;

          const isPro = tier === 'pro';
          const isBasic = tier === 'basic';

          return (
            <div
              key={tier}
              className={`p-6 rounded-2xl bg-charcoal-800 border ${
                isBasic
                  ? 'border-electric-500/80 shadow-lg shadow-electric-500/10'
                  : 'border-charcoal-700/80'
              } flex flex-col justify-between`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-electric-500/20 text-electric-400 flex items-center justify-center font-bold text-xs uppercase border border-electric-500/30">
                      {tier}
                    </span>
                    <div>
                      <input
                        type="text"
                        value={plan.display_name}
                        onChange={(e) => handleFieldChange(tier, 'display_name', e.target.value)}
                        className="font-bold text-white text-sm bg-transparent border-b border-transparent hover:border-neutral-500 focus:border-electric-500 focus:outline-none"
                      />
                      <div className="text-[10px] text-neutral-400 font-mono uppercase">
                        {plan.billing_cycle}
                      </div>
                    </div>
                  </div>

                  {isBasic && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-electric-500 text-white">
                      POPULAR
                    </span>
                  )}
                </div>

                {/* Pricing & Credit Allowance Inputs */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="p-3 rounded-xl bg-charcoal-900 border border-charcoal-700/60">
                    <label className="block text-[11px] text-neutral-400 font-semibold mb-1">
                      Price ($ USD)
                    </label>
                    <div className="flex items-center gap-1 font-mono">
                      <span className="text-neutral-500 font-bold">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={(plan.price_cents / 100).toFixed(2)}
                        onChange={(e) => handleFieldChange(tier, 'price_cents', Math.round(parseFloat(e.target.value || '0') * 100))}
                        className="w-full bg-transparent font-bold text-white text-base focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-charcoal-900 border border-charcoal-700/60">
                    <label className="block text-[11px] text-neutral-400 font-semibold mb-1">
                      Monthly Credits
                    </label>
                    <div className="flex items-center gap-1 font-mono">
                      <span className="text-electric-400 font-bold">⚡</span>
                      <input
                        type="number"
                        value={plan.credit_allowance}
                        onChange={(e) => handleFieldChange(tier, 'credit_allowance', Number(e.target.value))}
                        className="w-full bg-transparent font-bold text-white text-base focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Features list */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-neutral-300">Feature Bullet Points</span>
                    <button
                      type="button"
                      onClick={() => handleAddFeature(tier)}
                      className="text-[11px] text-electric-400 hover:text-electric-300 font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add Feature
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={feat}
                          onChange={(e) => handleFeatureTextChange(tier, idx, e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-charcoal-900 border border-charcoal-700 text-xs text-white focus:outline-none focus:border-electric-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(tier, idx)}
                          className="text-neutral-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-charcoal-700/60 mt-2">
                <button
                  type="button"
                  onClick={() => handleSave(tier)}
                  className={`w-full py-2.5 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-1.5 ${
                    savedTier === tier
                      ? 'bg-emerald-500 text-white'
                      : 'bg-electric-500 hover:bg-electric-600 text-white shadow-md shadow-electric-500/25'
                  }`}
                >
                  {savedTier === tier ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Live Synced!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Publish Tier Updates</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
