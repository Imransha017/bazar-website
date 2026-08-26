import type { DBOrder } from "@/lib/admin-api";

export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const val = row[header];
          const cell = val === null || val === undefined ? "" : String(val);
          return `"${cell.replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function formatOrdersForExport(orders: any[]) {
  return orders.map((o) => ({
    "Order Number": o.order_number,
    "Date": new Date(o.created_at).toLocaleString(),
    "Customer": o.customer_name,
    "Phone": o.customer_phone,
    "Total": o.total,
    "Status": o.status,
    "Payment Method": o.payment_method,
    "Address": o.address,
    "Items": o.items?.map((i: any) => `${i.name} (x${i.qty})`).join("; ") || "",
  }));
}
