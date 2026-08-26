import { X, Clock, AlertCircle } from "lucide-react";
import { type DropshipperEarning } from "@/lib/dropshipper";

interface ProfitLedgerModalProps {
  earning: DropshipperEarning;
  onClose: () => void;
}

export function ProfitLedgerModal({ earning, onClose }: ProfitLedgerModalProps) {
  const log = earning.activity_log || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-200 rounded-xl border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Profit Ledger History</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          <div className="mb-4 rounded-lg bg-muted/50 p-3 text-xs">
            <div className="flex justify-between font-bold text-muted-foreground uppercase tracking-wider mb-2">
              <span>Transaction Details</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-muted-foreground">Order ID</p>
                <p className="font-mono">{earning.order_id.slice(0, 12)}...</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Profit Amount</p>
                <p className="font-bold text-green-600">৳{Number(earning.profit).toFixed(0)}</p>
              </div>
            </div>
          </div>

          <div className="relative space-y-6 before:absolute before:left-2 before:top-2 before:h-[calc(100%-16px)] before:w-0.5 before:bg-muted">
            {log.length === 0 ? (
              <div className="flex items-center gap-3 pl-8 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                No history available
              </div>
            ) : (
              log.map((entry, idx) => (
                <div key={idx} className="relative pl-8">
                  <div className={`absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 bg-card ${
                    entry.status === 'approved' ? 'border-green-500' :
                    entry.status === 'rejected' ? 'border-red-500' :
                    entry.status === 'paid' ? 'border-blue-500' :
                    'border-amber-500'
                  }`} />
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold uppercase tracking-wide ${
                        entry.status === 'approved' ? 'text-green-600' :
                        entry.status === 'rejected' ? 'text-red-600' :
                        entry.status === 'paid' ? 'text-blue-600' :
                        'text-amber-600'
                      }`}>
                        {entry.status}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(entry.changed_at).toLocaleString()}
                      </span>
                    </div>
                    {entry.previous_status && (
                      <span className="text-[10px] text-muted-foreground italic">
                        From {entry.previous_status}
                      </span>
                    )}
                    <p className="mt-1 text-sm text-foreground">
                      {entry.note || 'Status updated'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end border-t p-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
