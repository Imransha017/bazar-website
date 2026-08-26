import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useClickAway } from "react-use";

interface AutocompleteItem {
  type: 'customer' | 'dropshipper' | 'store';
  label: string;
  value: string;
  sublabel?: string;
}

interface OrderAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  context?: 'admin' | 'vendor' | 'dropshipper';
  vendorId?: string;
  dropshipperId?: string;
}

export function OrderAutocomplete({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  context = 'admin',
  vendorId,
  dropshipperId
}: OrderAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AutocompleteItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useClickAway(ref, () => setIsOpen(false));

  useEffect(() => {
    const fetchSuggestions = async () => {
      const q = value.trim();
      if (q.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const results: AutocompleteItem[] = [];

        // 1. Search Customers (Names, Phones, Emails)
        let customerQuery = supabase.from('orders')
          .select('customer_name, customer_phone, customer_email')
          .or(`customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%,customer_email.ilike.%${q}%`)
          .limit(5);
        
        if (context === 'vendor' && vendorId) customerQuery = customerQuery.eq('vendor_id', vendorId);
        if (context === 'dropshipper' && dropshipperId) customerQuery = customerQuery.eq('dropshipper_id', dropshipperId);

        const { data: customers } = await customerQuery;
        
        const uniqueCustomers = new Set();
        customers?.forEach(c => {
          const main = c.customer_name;
          const sub = c.customer_phone || c.customer_email;
          if (!uniqueCustomers.has(main + sub)) {
             results.push({ type: 'customer', label: main, value: main, sublabel: sub || undefined });
             uniqueCustomers.add(main + sub);
          }
        });

        // 2. Search Dropshippers / Stores (Admin context only usually)
        if (context === 'admin') {
          const { data: dss } = await supabase.from('dropshippers')
            .select('store_name, code, phone')
            .or(`store_name.ilike.%${q}%,code.ilike.%${q}%,phone.ilike.%${q}%`)
            .limit(5);
          
          dss?.forEach(d => {
            results.push({ type: 'store', label: d.store_name, value: d.store_name, sublabel: `Code: ${d.code} · ${d.phone}` });
          });
        }

        setSuggestions(results);
        setIsOpen(results.length > 0);
      } catch (err) {
        console.error("Autocomplete error:", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [value, context, vendorId, dropshipperId]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => value.length >= 2 && suggestions.length > 0 && setIsOpen(true)}
        placeholder={placeholder}
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
      />
      
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
          {suggestions.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                onChange(item.value);
                setIsOpen(false);
              }}
              className="flex w-full flex-col px-3 py-2 text-left hover:bg-purple-50"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-900">{item.label}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {item.type}
                </span>
              </div>
              {item.sublabel && (
                <span className="text-xs text-slate-500">{item.sublabel}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
