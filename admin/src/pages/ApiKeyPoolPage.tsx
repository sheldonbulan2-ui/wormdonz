import React, { useState } from 'react';
import { ApiKeyItem, ApiKeyStatus } from '../types';
import { adminApi } from '../api';
import { 
  KeyRound, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  XCircle, 
  Play, 
  Trash2, 
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Layers,
  ShieldAlert
} from 'lucide-react';

interface ApiKeyPoolPageProps {
  keys: ApiKeyItem[];
  onRefresh: () => void;
}

export const ApiKeyPoolPage: React.FC<ApiKeyPoolPageProps> = ({ keys, onRefresh }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [alias, setAlias] = useState('');
  const [provider, setProvider] = useState<'openai' | 'anthropic' | 'gemini' | 'openrouter'>('openai');
  const [keyValue, setKeyValue] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ [keyId: string]: string }>({});

  const handleAddSingleKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alias || !keyValue) return;

    await adminApi.addKey({
      key_alias: alias,
      provider,
      encrypted_key: keyValue,
      priority_order: keys.length + 1
    });

    setAlias('');
    setKeyValue('');
    setShowAddModal(false);
    onRefresh();
  };

  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText) return;

    await adminApi.bulkAddKeys(bulkText, provider);
    setBulkText('');
    setShowBulkModal(false);
    onRefresh();
  };

  const handleTestKey = async (keyId: string) => {
    setTestingKeyId(keyId);
    try {
      const result = await adminApi.testKey(keyId);
      setTestResult(prev => ({
        ...prev,
        [keyId]: result.success ? `✅ Active (${result.latencyMs}ms)` : `❌ ${result.message}`
      }));
    } catch (err: any) {
      setTestResult(prev => ({
        ...prev,
        [keyId]: `❌ ${err.message}`
      }));
    } finally {
      setTestingKeyId(null);
    }
  };

  const handleResetErrors = async (keyId: string) => {
    await adminApi.updateKey(keyId, { reset_errors: true, status: 'active' });
    onRefresh();
  };

  const handleToggleStatus = async (key: ApiKeyItem) => {
    const nextStatus: ApiKeyStatus = key.status === 'active' ? 'disabled' : 'active';
    await adminApi.updateKey(key.id, { status: nextStatus });
    onRefresh();
  };

  const handleDelete = async (keyId: string) => {
    if (confirm('Are you sure you want to remove this key from the rotation pool?')) {
      await adminApi.deleteKey(keyId);
      onRefresh();
    }
  };

  const handleMovePriority = async (key: ApiKeyItem, direction: 'up' | 'down') => {
    const delta = direction === 'up' ? -1 : 1;
    const newOrder = Math.max(1, key.priority_order + delta);
    await adminApi.updateKey(key.id, { priority_order: newOrder });
    onRefresh();
  };

  const getStatusBadge = (status: ApiKeyStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
        );
      case 'exhausted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" />
            Quota Exhausted
          </span>
        );
      case 'rate_limited':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            Rate Limited
          </span>
        );
      case 'disabled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-700 text-neutral-400 border border-neutral-600">
            Disabled
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar with Quick Add Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-charcoal-800 border border-charcoal-700/80">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-electric-500" />
            Automatic Multi-API Key Failover Engine
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Incoming chat queries automatically route through the highest priority active key. If upstream returns HTTP 429 / 402, key is instantly rotated.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBulkModal(true)}
            className="px-3.5 py-2 rounded-xl bg-charcoal-700 hover:bg-charcoal-600 border border-charcoal-600 text-xs font-semibold text-white transition flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5" />
            Bulk Paste Keys
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 rounded-xl bg-electric-500 hover:bg-electric-600 text-xs font-semibold text-white shadow-md shadow-electric-500/25 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Single Key
          </button>
        </div>
      </div>

      {/* API Keys Table */}
      <div className="rounded-2xl bg-charcoal-800 border border-charcoal-700/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-charcoal-900/80 text-neutral-400 uppercase tracking-wider border-b border-charcoal-700/80 font-mono text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Key Alias & Provider</th>
                <th className="py-3.5 px-4">Live Status</th>
                <th className="py-3.5 px-4">Requests Served</th>
                <th className="py-3.5 px-4">Errors</th>
                <th className="py-3.5 px-4">Last Activity</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-700/60 font-medium">
              {keys.map((k) => (
                <tr key={k.id} className="hover:bg-charcoal-700/30 transition">
                  {/* Priority reordering */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 font-mono">
                      <span className="w-6 h-6 rounded bg-charcoal-900 text-white flex items-center justify-center font-bold text-xs border border-charcoal-700">
                        #{k.priority_order}
                      </span>
                      <div className="flex flex-col">
                        <button
                          onClick={() => handleMovePriority(k, 'up')}
                          className="hover:text-electric-400 text-neutral-500 p-0.5"
                          title="Increase Priority"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleMovePriority(k, 'down')}
                          className="hover:text-electric-400 text-neutral-500 p-0.5"
                          title="Decrease Priority"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* Alias & Provider */}
                  <td className="py-4 px-4">
                    <div className="font-bold text-white text-sm">{k.key_alias}</div>
                    <div className="text-[11px] text-neutral-400 flex items-center gap-2 mt-0.5">
                      <span className="uppercase px-1.5 py-0.2 rounded bg-charcoal-900 text-neutral-300 font-mono text-[10px] border border-charcoal-700">
                        {k.provider}
                      </span>
                      <span className="font-mono text-neutral-500">
                        {k.encrypted_key.slice(0, 10)}...{k.encrypted_key.slice(-4)}
                      </span>
                    </div>
                    {k.last_error_message && (
                      <div className="mt-1 text-[11px] text-rose-400 font-mono flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{k.last_error_message}</span>
                      </div>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    {getStatusBadge(k.status)}
                    {testResult[k.id] && (
                      <div className="text-[10px] font-mono mt-1 text-neutral-300">
                        {testResult[k.id]}
                      </div>
                    )}
                  </td>

                  {/* Requests served */}
                  <td className="py-4 px-4 whitespace-nowrap font-mono text-white text-sm">
                    {k.total_requests.toLocaleString()}
                  </td>

                  {/* Error count */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className={`font-mono text-xs px-2 py-0.5 rounded ${
                      k.error_count > 0 ? 'bg-rose-500/20 text-rose-400 font-bold' : 'text-neutral-400'
                    }`}>
                      {k.error_count}
                    </span>
                  </td>

                  {/* Last used */}
                  <td className="py-4 px-4 whitespace-nowrap text-neutral-400 text-[11px]">
                    {k.last_used_at ? new Date(k.last_used_at).toLocaleTimeString() : 'Never'}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Test key */}
                      <button
                        onClick={() => handleTestKey(k.id)}
                        disabled={testingKeyId === k.id}
                        className="px-2.5 py-1.5 rounded-lg bg-charcoal-700 hover:bg-charcoal-600 text-neutral-200 hover:text-white transition flex items-center gap-1"
                        title="Ping upstream API with test payload"
                      >
                        <Play className={`w-3 h-3 ${testingKeyId === k.id ? 'animate-spin text-electric-500' : ''}`} />
                        <span>Test</span>
                      </button>

                      {/* Reset errors / re-enable */}
                      {(k.status === 'exhausted' || k.status === 'rate_limited' || k.error_count > 0) && (
                        <button
                          onClick={() => handleResetErrors(k.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 transition flex items-center gap-1"
                          title="Reset error count & mark Active"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset</span>
                        </button>
                      )}

                      {/* Toggle status */}
                      <button
                        onClick={() => handleToggleStatus(k)}
                        className="p-1.5 rounded-lg hover:bg-charcoal-700 text-neutral-400 hover:text-white transition"
                        title={k.status === 'active' ? 'Disable Key' : 'Enable Key'}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete key */}
                      <button
                        onClick={() => handleDelete(k.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 transition"
                        title="Remove Key"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Single Key */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-charcoal-800 border border-charcoal-700 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-electric-500" />
              Add Single API Key to Pool
            </h3>
            <form onSubmit={handleAddSingleKey} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Key Alias</label>
                <input
                  type="text"
                  placeholder="e.g. OpenAI-Primary-Prod-03"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-charcoal-900 border border-charcoal-700 text-white placeholder-neutral-500 focus:outline-none focus:border-electric-500"
                  required
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Provider</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl bg-charcoal-900 border border-charcoal-700 text-white focus:outline-none focus:border-electric-500"
                >
                  <option value="dahl">Dahl Inference (inference.dahl.global)</option>
                  <option value="openrouter">OpenRouter Multi-Cluster</option>
                  <option value="openai">OpenAI (gpt-4o, o3-mini)</option>
                  <option value="anthropic">Anthropic (Claude 3.7)</option>
                  <option value="gemini">Google Gemini 2.0</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">API Key / Token</label>
                <input
                  type="password"
                  placeholder="sk-proj-..."
                  value={keyValue}
                  onChange={(e) => setKeyValue(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-charcoal-900 border border-charcoal-700 text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-electric-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-charcoal-700 text-neutral-300 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-electric-500 hover:bg-electric-600 font-semibold text-white transition shadow-md shadow-electric-500/25"
                >
                  Save to Pool
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Bulk Paste Keys */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-charcoal-800 border border-charcoal-700 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Layers className="w-5 h-5 text-electric-500" />
              Bulk Import API Keys
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Paste multiple keys below (one key per line). They will be automatically registered with sequential aliases and prioritized in the failover pool.
            </p>
            <form onSubmit={handleBulkAdd} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Provider</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl bg-charcoal-900 border border-charcoal-700 text-white focus:outline-none focus:border-electric-500"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="openrouter">OpenRouter</option>
                  <option value="gemini">Gemini</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Paste Keys (One per line)</label>
                <textarea
                  rows={6}
                  placeholder={`sk-proj-001...\nsk-proj-002...\nsk-proj-003...`}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  className="w-full p-3 rounded-xl bg-charcoal-900 border border-charcoal-700 text-white font-mono placeholder-neutral-500 focus:outline-none focus:border-electric-500 text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 rounded-xl bg-charcoal-700 text-neutral-300 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-electric-500 hover:bg-electric-600 font-semibold text-white transition shadow-md shadow-electric-500/25"
                >
                  Import All Keys
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
