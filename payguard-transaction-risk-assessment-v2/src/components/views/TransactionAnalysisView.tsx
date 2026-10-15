import React, { useState } from 'react';
import {
  Sliders,
  Play,
  RotateCcw,
  Shield,
  Layers,
  ArrowRight,
  FileText,
  Copy,
  Check,
  CheckCircle2
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { TransactionPayload, TransactionRecord, PaymentRail } from '../../types';
import { apiClient } from '../../api/client';

export const TransactionAnalysisView: React.FC = () => {
  const { evaluateTransaction, selectedTransaction, setSelectedTransaction } = useDashboard();

  const [activeMode, setActiveMode] = useState<'single' | 'batch'>('single');

  // Single form parameters
  const [userId, setUserId] = useState<string>('USR_0100');
  const [channel, setChannel] = useState<PaymentRail | string>('CREDIT_CARD');
  const [amount, setAmount] = useState<number>(2850.0);
  const [userAvg30d, setUserAvg30d] = useState<number>(50.0);
  const [oldBalance, setOldBalance] = useState<number>(4000.0);
  const [newBalance, setNewBalance] = useState<number>(1150.0);
  const [merchantCategory, setMerchantCategory] = useState<string>('crypto_exchange');
  const [isForeign, setIsForeign] = useState<boolean>(true);
  const [deviceTrust, setDeviceTrust] = useState<number>(0.08);
  const [locationRisk, setLocationRisk] = useState<number>(0.92);
  const [velocity1h, setVelocity1h] = useState<number>(6);
  const [velocity24h, setVelocity24h] = useState<number>(9);

  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evalResult, setEvalResult] = useState<TransactionRecord | null>(selectedTransaction);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Batch evaluation state
  const [batchJson, setBatchJson] = useState<string>(
    JSON.stringify(
      [
        {
          user_id: 'USR_0100',
          amount: 2850.0,
          old_balance: 4000.0,
          new_balance: 1150.0,
          user_avg_amount_30d: 50.0,
          channel: 'CREDIT_CARD',
          merchant_category: 'crypto_exchange',
          is_foreign_transaction: 1,
          device_trust_score: 0.08,
          location_risk_score: 0.92,
          velocity_1h: 6,
          velocity_24h: 9
        },
        {
          user_id: 'USR_0892',
          amount: 45.0,
          old_balance: 1840.0,
          new_balance: 1795.0,
          user_avg_amount_30d: 52.5,
          channel: 'UPI',
          merchant_category: 'grocery_supermarket',
          is_foreign_transaction: 0,
          device_trust_score: 0.96,
          location_risk_score: 0.04,
          velocity_1h: 1,
          velocity_24h: 2
        }
      ],
      null,
      2
    )
  );
  const [batchResults, setBatchResults] = useState<any[] | null>(null);
  const [isBatchRunning, setIsBatchRunning] = useState<boolean>(false);

  // Presets
  const loadGroceryPreset = () => {
    setUserId('USR_0892');
    setChannel('UPI');
    setAmount(45.0);
    setUserAvg30d(52.5);
    setOldBalance(1840.0);
    setNewBalance(1795.0);
    setMerchantCategory('grocery_supermarket');
    setIsForeign(false);
    setDeviceTrust(0.96);
    setLocationRisk(0.04);
    setVelocity1h(1);
    setVelocity24h(2);
  };

  const loadAnomalousPreset = () => {
    setUserId('USR_0100');
    setChannel('CREDIT_CARD');
    setAmount(2850.0);
    setUserAvg30d(50.0);
    setOldBalance(4000.0);
    setNewBalance(1150.0);
    setMerchantCategory('crypto_exchange');
    setIsForeign(true);
    setDeviceTrust(0.08);
    setLocationRisk(0.92);
    setVelocity1h(6);
    setVelocity24h(9);
  };

  const handleSingleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEvaluating(true);
    setErrorMessage(null);

    const payload: TransactionPayload = {
      user_id: userId.trim() || 'USR_0001',
      amount: Number(amount) || 0,
      old_balance: Number(oldBalance) || 0,
      new_balance: Number(newBalance) || 0,
      user_avg_amount_30d: Number(userAvg30d) || 1,
      channel,
      merchant_category: merchantCategory,
      is_foreign_transaction: isForeign ? 1 : 0,
      device_trust_score: Number(deviceTrust),
      location_risk_score: Number(locationRisk),
      velocity_1h: Number(velocity1h) || 0,
      velocity_24h: Number(velocity24h) || 0
    };

    try {
      const record = await evaluateTransaction(payload);
      setEvalResult(record);
      setSelectedTransaction(record);
    } catch (err: any) {
      setErrorMessage(err.message || 'Evaluation failed. Check API connectivity.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleBatchEvaluate = async () => {
    setIsBatchRunning(true);
    setErrorMessage(null);
    try {
      const parsed = JSON.parse(batchJson);
      if (!Array.isArray(parsed)) {
        throw new Error('Batch payload must be a JSON array of transaction objects');
      }
      const results = await apiClient.predictBatch(parsed);
      setBatchResults(results);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid batch JSON format');
    } finally {
      setIsBatchRunning(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* View Header with Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-md p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-slate-900">
            Transaction Risk Evaluation & SHAP Analysis
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit candidate transaction parameters to the live FastAPI /predict & /explain endpoints
          </p>
        </div>

        <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-200/80 text-xs">
          <button
            onClick={() => setActiveMode('single')}
            className={`px-3 py-1 rounded font-medium transition-all cursor-pointer ${
              activeMode === 'single'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Single Transaction
          </button>
          <button
            onClick={() => setActiveMode('batch')}
            className={`px-3 py-1 rounded font-medium transition-all cursor-pointer ${
              activeMode === 'batch'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Batch (/predict/batch)
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-md text-xs">
          {errorMessage}
        </div>
      )}

      {activeMode === 'single' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Form & Presets (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-md p-4 sm:p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-4">
            
            {/* Scenario Presets Toolbar */}
            <div className="space-y-1.5 pb-2 border-b border-slate-100">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                Synthetic Test Scenarios
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={loadGroceryPreset}
                  className="text-xs text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded transition-colors cursor-pointer"
                >
                  Preset: Grocery <span className="font-mono text-slate-400 text-[11px]">(UPI · $45)</span>
                </button>
                <button
                  type="button"
                  onClick={loadAnomalousPreset}
                  className="text-xs text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded transition-colors cursor-pointer font-medium"
                >
                  Preset: Midnight Transfer <span className="font-mono text-slate-400 text-[11px]">(CC · $2,850)</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSingleEvaluate} className="space-y-3">
              {/* Row 1: User & Rail */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">User Identifier</label>
                  <input
                    type="text"
                    value={userId}
                    onChange={e => setUserId(e.target.value)}
                    required
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Payment Rail</label>
                  <select
                    value={channel}
                    onChange={e => setChannel(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                  >
                    <option value="UPI">UPI</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="DEBIT_CARD">Debit Card</option>
                    <option value="NET_BANKING">Net Banking</option>
                    <option value="WALLET">Wallet</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Amount & 30d Avg */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">User 30-Day Avg ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    value={userAvg30d}
                    onChange={e => setUserAvg30d(parseFloat(e.target.value) || 1)}
                    required
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              {/* Row 3: Balances Prior & Post */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Prior Balance ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={oldBalance}
                    onChange={e => setOldBalance(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Post Balance ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newBalance}
                    onChange={e => setNewBalance(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              {/* Row 4: Merchant Category & Cross Border */}
              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Merchant Category</label>
                  <select
                    value={merchantCategory}
                    onChange={e => setMerchantCategory(e.target.value)}
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                  >
                    <option value="crypto_exchange">crypto_exchange</option>
                    <option value="grocery_supermarket">grocery_supermarket</option>
                    <option value="electronics_retail">electronics_retail</option>
                    <option value="luxury_goods">luxury_goods</option>
                    <option value="money_transfer">money_transfer</option>
                    <option value="gambling_gaming">gambling_gaming</option>
                    <option value="digital_services">digital_services</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Cross-Border</label>
                  <label className="inline-flex items-center gap-2 cursor-pointer pt-0.5">
                    <input
                      type="checkbox"
                      checked={isForeign}
                      onChange={e => setIsForeign(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-slate-900 relative" />
                    <span className="text-xs font-mono text-slate-700">
                      {isForeign ? 'Yes (1)' : 'No (0)'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Row 5: Device Trust Slider */}
              <div className="space-y-1 bg-slate-50/60 p-2.5 rounded border border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-medium text-slate-700">Device Trust Score</span>
                  <span className="font-mono font-medium text-slate-900">{deviceTrust.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={deviceTrust}
                  onChange={e => setDeviceTrust(parseFloat(e.target.value))}
                  className="w-full cursor-pointer"
                />
              </div>

              {/* Row 6: Location Risk Slider */}
              <div className="space-y-1 bg-slate-50/60 p-2.5 rounded border border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-medium text-slate-700">Location Risk Score</span>
                  <span className="font-mono font-medium text-slate-900">{locationRisk.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={locationRisk}
                  onChange={e => setLocationRisk(parseFloat(e.target.value))}
                  className="w-full cursor-pointer"
                />
              </div>

              {/* Row 7: Velocity 1h & 24h */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Velocity 1h (Txns)</label>
                  <input
                    type="number"
                    min="0"
                    value={velocity1h}
                    onChange={e => setVelocity1h(parseInt(e.target.value) || 0)}
                    required
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Velocity 24h (Txns)</label>
                  <input
                    type="number"
                    min="0"
                    value={velocity24h}
                    onChange={e => setVelocity24h(parseInt(e.target.value) || 0)}
                    required
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isEvaluating}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 px-4 rounded text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>{isEvaluating ? 'Evaluating via FastAPI...' : 'Evaluate Risk (POST /predict)'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Output & SHAP Table (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {evalResult ? (
              <div className="bg-white border border-slate-200 rounded-md p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-4">
                
                {/* Header Score & Verdict */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-bold font-mono uppercase tracking-wider ${
                        evalResult.verdict === 'BLOCKED'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : evalResult.verdict === 'REVIEW'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {evalResult.verdict}
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
                        {(evalResult.fraud_probability * 100).toFixed(1)}%
                      </span>
                      <span className="text-xs text-slate-500 font-medium">Fraud Probability</span>
                    </div>
                  </div>

                  <span className="text-xs font-mono text-slate-400">
                    Latency: {evalResult.inference_latency_ms.toFixed(1)} ms
                  </span>
                </div>

                {/* Radar Gauge */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span className="text-emerald-700">0 · Normal</span>
                    <span className="text-amber-700">45 · Review</span>
                    <span className="text-rose-700">74 · Block Cutoff</span>
                    <span>100</span>
                  </div>
                  <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                    <div className="h-full bg-emerald-200/90 w-[45%]" />
                    <div className="h-full bg-amber-200/90 w-[29%]" />
                    <div className="h-full bg-rose-200/90 w-[26%]" />
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-slate-50 border border-slate-200/80 rounded p-2.5">
                    <span className="block text-[10px] font-medium text-slate-500 uppercase">Threshold</span>
                    <span className="text-xs font-semibold font-mono text-slate-900 mt-0.5 block">
                      {evalResult.decision_threshold}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/80 rounded p-2.5">
                    <span className="block text-[10px] font-medium text-slate-500 uppercase">Recommendation</span>
                    <span className="text-[11px] font-semibold font-mono text-slate-900 mt-0.5 block truncate">
                      {evalResult.recommendation}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/80 rounded p-2.5">
                    <span className="block text-[10px] font-medium text-slate-500 uppercase">Risk Level</span>
                    <span className="text-xs font-semibold font-mono text-slate-900 mt-0.5 block">
                      {evalResult.risk_level}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/80 rounded p-2.5">
                    <span className="block text-[10px] font-medium text-slate-500 uppercase">Model</span>
                    <span className="text-[11px] font-mono text-slate-700 mt-0.5 block truncate">
                      RF_Candidate
                    </span>
                  </div>
                </div>

                {/* Synthesis */}
                {evalResult.plain_language_summary && (
                  <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs text-slate-700 leading-relaxed">
                    <span className="font-semibold text-slate-900 mr-1.5">Decision Explanation:</span>
                    <span>{evalResult.plain_language_summary}</span>
                  </div>
                )}

                {/* SHAP Attribution Table */}
                {evalResult.shap_values && evalResult.shap_values.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                        SHAP Attribution Breakdown
                      </h3>
                      <span className="text-[10px] font-mono text-slate-400">POST /explain output</span>
                    </div>

                    <div className="border border-slate-200 rounded overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-[10px] font-medium text-slate-500 uppercase border-b border-slate-200">
                          <tr>
                            <th className="py-2 px-3">Feature Name</th>
                            <th className="py-2 px-3">Observed Value</th>
                            <th className="py-2 px-3 text-right font-mono">Impact</th>
                            <th className="py-2 px-3 w-28">Magnitude</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {evalResult.shap_values.map((s, idx) => {
                            const isPos = s.impact >= 0;
                            const formatted = (isPos ? '+' : '') + s.impact.toFixed(3);
                            const widthPercent = Math.min(100, Math.max(8, (Math.abs(s.impact) / 0.35) * 100));

                            return (
                              <tr key={idx} className="hover:bg-slate-50/70">
                                <td className="py-2 px-3 font-medium text-slate-900">{s.feature}</td>
                                <td className="py-2 px-3 font-mono text-slate-600 text-[11px]">{s.value}</td>
                                <td
                                  className={`py-2 px-3 text-right font-mono font-medium ${
                                    isPos ? 'text-rose-700' : 'text-emerald-700'
                                  }`}
                                >
                                  {formatted}
                                </td>
                                <td className="py-2 px-3">
                                  <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                                    <div
                                      className={`h-1 rounded-full ${isPos ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                      style={{ width: `${widthPercent}%` }}
                                    />
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-md p-12 text-center text-slate-400 space-y-2">
                <Sliders className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-medium text-slate-600">Awaiting Transaction Evaluation</p>
                <p className="text-[11px] text-slate-400">
                  Select a test scenario or enter custom parameters and click Evaluate Risk.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Batch Evaluation Tab */
        <div className="bg-white border border-slate-200 rounded-md p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-tight">
              Batch Prediction Request (POST /predict/batch)
            </h3>
            <p className="text-[11px] text-slate-500">
              Submit a JSON array of transaction payloads to evaluate multiple payments concurrently.
            </p>
          </div>

          <div className="space-y-2">
            <textarea
              rows={8}
              value={batchJson}
              onChange={e => setBatchJson(e.target.value)}
              className="w-full font-mono text-xs p-3 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
            />
            <button
              onClick={handleBatchEvaluate}
              disabled={isBatchRunning}
              className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-4 py-2 rounded text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isBatchRunning ? 'Running Batch...' : 'Submit Batch to /predict/batch'}
            </button>
          </div>

          {batchResults && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-semibold text-slate-900">
                Batch Results ({batchResults.length} transactions scored)
              </h4>
              <div className="border border-slate-200 rounded overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] font-medium text-slate-500 uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Transaction ID</th>
                      <th className="py-2 px-3 text-right">Probability</th>
                      <th className="py-2 px-3">Verdict</th>
                      <th className="py-2 px-3">Risk Level</th>
                      <th className="py-2 px-3 text-right">Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {batchResults.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-medium text-slate-900">{r.transaction_id || `TXN_${i}`}</td>
                        <td className="py-2 px-3 font-mono text-right tabular-nums">
                          {((r.fraud_probability || 0) * 100).toFixed(1)}%
                        </td>
                        <td className="py-2 px-3 font-mono font-semibold">{r.verdict}</td>
                        <td className="py-2 px-3">{r.risk_level}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-500">
                          {r.inference_latency_ms?.toFixed(1)}ms
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
