import { formatCurrency, formatDateTime, formatNumber } from "../../lib/formatters";
import type { SalesLogEntry } from "../../lib/salesService";

interface SalesTableProps {
  sales: SalesLogEntry[];
}

const SalesTable = ({ sales }: SalesTableProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-3 md:hidden">
        {sales.map((sale) => (
          <article
            key={sale.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{sale.itemName}</h3>
                <p className="text-xs text-slate-500">{formatDateTime(sale.soldAt)}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                Qty {formatNumber(sale.quantity)}
              </span>
            </div>
            <dl className="mt-3 space-y-1 text-sm text-slate-600">
              <div className="flex justify-between gap-2">
                <dt>Unit price</dt>
                <dd className="font-medium text-slate-800">
                  {formatCurrency(sale.unitPrice)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Total</dt>
                <dd className="font-semibold text-slate-900">
                  {formatCurrency(sale.total)}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      <div className="hidden max-h-[32rem] overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="sticky top-0 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Sold at
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Item
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Quantity
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Unit price
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                  {formatDateTime(sale.soldAt)}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-slate-800">
                  {sale.itemName}
                </td>
                <td className="px-4 py-3 text-right text-sm text-slate-700">
                  {formatNumber(sale.quantity)}
                </td>
                <td className="px-4 py-3 text-right text-sm text-slate-700">
                  {formatCurrency(sale.unitPrice)}
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                  {formatCurrency(sale.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesTable;
