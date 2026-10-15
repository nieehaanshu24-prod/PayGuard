import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { TransactionRecord, RiskLevel, Verdict } from '../types';

export const TransactionTable: React.FC = () => {
  const {
    transactions,
    selectedTransaction,
    setSelectedTransaction,
    searchQuery,
    setSearchQuery,
    riskFilter,
    setRiskFilter,
    verdictFilter,
    setVerdictFilter
  } = useDashboard();

  // Sorting state
  const [sortField, setSortField] = useState<'timestamp' | 'amount' | 'fraud_probability' | 'inference_latency_ms'>('timestamp');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Filter & Search Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = t.id.toLowerCase().includes(q);
        const matchesUser = t.user_id.toLowerCase().includes(q);
        const matchesChannel = t.channel.toLowerCase().includes(q);
        const matchesMerchant = t.merchant_category.toLowerCase().includes(q);
        if (!matchesId && !matchesUser && !matchesChannel && !matchesMerchant) {
          return false;
        }
      }

      // Risk filter
      if (riskFilter !== 'ALL' && t.risk_level !== riskFilter) {
        return false;
      }

      // Verdict filter
      if (verdictFilter !== 'ALL' && t.verdict !== verdictFilter) {
        return false;
      }

      return true;
    });
  }, [transactions, searchQuery, riskFilter, verdictFilter]);

  // Sorted Transactions
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'timestamp') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredTransactions, sortField, sortAsc]);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(sortedTransactions.length / pageSize));
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedTransactions.slice(start, start + pageSize);
  }, [sortedTransactions, currentPage, pageSize]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
    setCurrentPage(1);
  };

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-3.5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by ID, User, Channel, or Category..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-colors"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Risk Level */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 font-medium">Risk:</span>
            <select
              value={riskFilter}
              onChange={e => {
                setRiskFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 text-xs focus:outline-none focus:border-slate-900"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="HIGH">High Risk (&ge; 74%)</option>
              <option value="MEDIUM">Medium Risk (45-73%)</option>
              <option value="LOW">Low Risk (&lt; 45%)</option>
            </select>
          </div>

          {/* Verdict */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 font-medium">Verdict:</span>
            <select
              value={verdictFilter}
              onChange={e => {
                setVerdictFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 text-xs focus:outline-none focus:border-slate-900"
            >
              <option value="ALL">All Verdicts</option>
              <option value="BLOCKED">Blocked</option>
              <option value="REVIEW">Review / Step-Up</option>
              <option value="APPROVED">Approved</option>
            </select>
          </div>

          {/* Page size */}
          <select
            value={pageSize}
            onChange={e => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 text-xs focus:outline-none focus:border-slate-900 hidden sm:block font-mono"
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/90 text-slate-600 text-[11px] font-medium uppercase tracking-wider border-b border-slate-200">
              <th scope="col" className="py-2.5 px-3.5">
                Transaction ID
              </th>
              <th
                scope="col"
                className="py-2.5 px-3 cursor-pointer hover:text-slate-900 select-none"
                onClick={() => handleSort('timestamp')}
              >
                <div className="flex items-center gap-1">
                  <span>Timestamp</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                scope="col"
                className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-900 select-none"
                onClick={() => handleSort('amount')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Amount ($)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th scope="col" className="py-2.5 px-3">
                Channel
              </th>
              <th
                scope="col"
                className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-900 select-none"
                onClick={() => handleSort('fraud_probability')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Fraud Prob</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th scope="col" className="py-2.5 px-3">
                Risk Level
              </th>
              <th scope="col" className="py-2.5 px-3">
                Verdict
              </th>
              <th
                scope="col"
                className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-900 select-none"
                onClick={() => handleSort('inference_latency_ms')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Latency</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th scope="col" className="py-2.5 px-3 text-center">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedTransactions.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400 space-y-2">
                  <p className="text-xs font-medium text-slate-600">No transactions match current filters</p>
                  <p className="text-[11px] text-slate-400">
                    Try modifying your search query or reset the risk/verdict selectors.
                  </p>
                </td>
              </tr>
            ) : (
              paginatedTransactions.map(tx => {
                const isSelected = selectedTransaction?.id === tx.id;
                const prob = tx.fraud_probability;
                const probPercent = (prob * 100).toFixed(1);

                return (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedTransaction(tx)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-slate-100/90 font-medium'
                        : 'hover:bg-slate-50/70'
                    }`}
                  >
                    {/* Transaction ID */}
                    <td className="py-2.5 px-3.5 font-mono text-slate-900 font-medium">
                      <div className="flex items-center gap-1.5">
                        {tx.is_simulated && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"
                            title="Simulated traffic transaction"
                          />
                        )}
                        <span>{tx.id}</span>
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                      {formatTimestamp(tx.timestamp)}
                    </td>

                    {/* Amount */}
                    <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-900 tabular-nums">
                      ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Channel */}
                    <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">
                      {tx.channel}
                    </td>

                    {/* Fraud Probability */}
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold">
                      <span
                        className={
                          prob >= 0.74
                            ? 'text-rose-700'
                            : prob >= 0.45
                            ? 'text-amber-700'
                            : 'text-emerald-700'
                        }
                      >
                        {probPercent}%
                      </span>
                    </td>

                    {/* Risk Level Badge */}
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold font-mono tracking-wider ${
                          tx.risk_level === 'HIGH'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : tx.risk_level === 'MEDIUM'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {tx.risk_level}
                      </span>
                    </td>

                    {/* Verdict Badge */}
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold font-mono tracking-wider ${
                          tx.verdict === 'BLOCKED'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : tx.verdict === 'REVIEW'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {tx.verdict}
                      </span>
                    </td>

                    {/* Inference Latency */}
                    <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-500 tabular-nums">
                      {tx.inference_latency_ms.toFixed(1)}ms
                    </td>

                    {/* View Details Icon */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTransaction(tx);
                        }}
                        className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-200/50 transition-colors"
                        title="Inspect transaction"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="font-mono text-[11px]">
          Showing <span className="text-slate-900 font-medium">{paginatedTransactions.length}</span> of{' '}
          <span className="text-slate-900 font-medium">{sortedTransactions.length}</span> records
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] px-2">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
