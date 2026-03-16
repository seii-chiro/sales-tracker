import SalesTable from "../components/sales/SalesTable";
import { useSales } from "../hooks/useSales";

const Sales = () => {
  const { sales, loading, error, refetch } = useSales();

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Sales Log</h2>
        <p className="text-sm text-slate-600">
          Review completed transactions by item, quantity, and total.
        </p>
      </div>

      {loading ? <p className="text-sm text-slate-600">Loading sales...</p> : null}

      {!loading && error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => {
              void refetch();
            }}
            className="mt-2 rounded-md border border-rose-300 px-2 py-1 text-xs font-medium"
          >
            Retry
          </button>
        </div>
      ) : null}

      {!loading && !error && sales.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
          No sales records found.
        </p>
      ) : null}

      {!loading && !error && sales.length > 0 ? <SalesTable sales={sales} /> : null}
    </section>
  );
};

export default Sales;
