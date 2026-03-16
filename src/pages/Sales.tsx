import { useMemo, useState } from "react";
import SalesTable from "../components/sales/SalesTable";
import { formatCurrency } from "../lib/formatters";
import { useSales } from "../hooks/useSales";

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

const toDateInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const parseDateBoundary = (value: string, boundary: "start" | "end"): Date | null => {
  if (!value) {
    return null;
  }

  const [yearString, monthString, dayString] = value.split("-");
  const year = Number(yearString);
  const month = Number(monthString);
  const day = Number(dayString);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return null;
  }

  if (boundary === "start") {
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }

  return new Date(year, month - 1, day, 23, 59, 59, 999);
};

const Sales = () => {
  const { sales, loading, error, refetch } = useSales();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFilterModalOpen, setMobileFilterModalOpen] = useState(false);

  const dateRangeError = useMemo(() => {
    if (!startDate || !endDate) {
      return null;
    }

    return startDate > endDate ? "Start date cannot be after end date." : null;
  }, [startDate, endDate]);

  const filteredSales = useMemo(() => {
    if (dateRangeError) {
      return [];
    }

    const startBoundary = parseDateBoundary(startDate, "start");
    const endBoundary = parseDateBoundary(endDate, "end");

    return sales.filter((sale) => {
      const soldAt = new Date(sale.soldAt);

      if (Number.isNaN(soldAt.getTime())) {
        return false;
      }

      if (startBoundary && soldAt < startBoundary) {
        return false;
      }

      if (endBoundary && soldAt > endBoundary) {
        return false;
      }

      return true;
    });
  }, [dateRangeError, endDate, sales, startDate]);

  const totalSalesAmount = useMemo(
    () => filteredSales.reduce((sum, sale) => sum + sale.total, 0),
    [filteredSales],
  );

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredSales.length / pageSize)),
    [filteredSales.length, pageSize],
  );
  const clampedCurrentPage = Math.min(currentPage, totalPages);

  const paginatedSales = useMemo(() => {
    const startIndex = (clampedCurrentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return filteredSales.slice(startIndex, endIndex);
  }, [clampedCurrentPage, filteredSales, pageSize]);

  const visibleStart =
    filteredSales.length === 0 ? 0 : (clampedCurrentPage - 1) * pageSize + 1;
  const visibleEnd = Math.min(clampedCurrentPage * pageSize, filteredSales.length);
  const hasDateFilter = startDate.length > 0 || endDate.length > 0;

  const applyTodayFilter = () => {
    const today = toDateInputValue(new Date());
    setStartDate(today);
    setEndDate(today);
    setCurrentPage(1);
  };

  const clearDateFilters = () => {
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const mobileFilterSummary = hasDateFilter
    ? `Filtered: ${startDate || "Any"} to ${endDate || "Any"}`
    : "No date filters applied.";

  return (
    <section className="space-y-4 pb-20 md:pb-0">
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

      {!loading && !error && sales.length > 0 ? (
        <>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:hidden">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate-600">{mobileFilterSummary}</p>
              <button
                type="button"
                onClick={() => {
                  setMobileFilterModalOpen(true);
                }}
                className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Filters
              </button>
            </div>
          </div>

          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:block">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] md:items-end">
              <label className="block min-w-0 text-sm font-medium text-slate-700">
                Start date
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => {
                    setStartDate(event.target.value);
                    setCurrentPage(1);
                  }}
                  className="mt-1 block w-full min-w-0 max-w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-slate-400 focus:outline-none sm:text-sm"
                />
              </label>

              <label className="block min-w-0 text-sm font-medium text-slate-700">
                End date
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => {
                    setEndDate(event.target.value);
                    setCurrentPage(1);
                  }}
                  className="mt-1 block w-full min-w-0 max-w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-slate-400 focus:outline-none sm:text-sm"
                />
              </label>

              <button
                type="button"
                onClick={applyTodayFilter}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 md:w-auto"
              >
                Today
              </button>

              <button
                type="button"
                onClick={clearDateFilters}
                disabled={!hasDateFilter}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300 md:w-auto"
              >
                Clear filters
              </button>
            </div>

            {dateRangeError ? (
              <p className="mt-3 text-sm text-rose-600">{dateRangeError}</p>
            ) : null}
          </div>

          {filteredSales.length === 0 ? (
            <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
              No sales records match the selected date range.
            </p>
          ) : (
            <SalesTable sales={paginatedSales} />
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-slate-600">
                Showing {visibleStart}-{visibleEnd} of {filteredSales.length} records
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  Rows
                  <select
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value));
                      setCurrentPage(1);
                    }}
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                  >
                    {PAGE_SIZE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage(Math.max(1, clampedCurrentPage - 1));
                  }}
                  disabled={clampedCurrentPage === 1 || filteredSales.length === 0}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  Previous
                </button>

                <span className="text-sm text-slate-700">
                  Page {clampedCurrentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage(Math.min(totalPages, clampedCurrentPage + 1));
                  }}
                  disabled={clampedCurrentPage >= totalPages || filteredSales.length === 0}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
              <span className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Total Sales
              </span>
              <span className="text-base font-bold text-slate-900">
                {formatCurrency(totalSalesAmount)}
              </span>
            </div>
          </div>

          {mobileFilterModalOpen ? (
            <div
              className="fixed inset-0 z-50 bg-slate-900/50 p-4 md:hidden"
              onClick={(event) => {
                if (event.target === event.currentTarget) {
                  setMobileFilterModalOpen(false);
                }
              }}
            >
              <div className="flex h-full items-end justify-center">
                <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-slate-900">Sales filters</h2>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileFilterModalOpen(false);
                      }}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      Close
                    </button>
                  </div>

                  <div className="space-y-3">
                    <label className="block min-w-0 text-sm font-medium text-slate-700">
                      Start date
                      <input
                        type="date"
                        value={startDate}
                        onChange={(event) => {
                          setStartDate(event.target.value);
                          setCurrentPage(1);
                        }}
                        className="mt-1 block w-full min-w-0 max-w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-slate-400 focus:outline-none sm:text-sm"
                      />
                    </label>

                    <label className="block min-w-0 text-sm font-medium text-slate-700">
                      End date
                      <input
                        type="date"
                        value={endDate}
                        onChange={(event) => {
                          setEndDate(event.target.value);
                          setCurrentPage(1);
                        }}
                        className="mt-1 block w-full min-w-0 max-w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-slate-400 focus:outline-none sm:text-sm"
                      />
                    </label>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={applyTodayFilter}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        Today
                      </button>

                      <button
                        type="button"
                        onClick={clearDateFilters}
                        disabled={!hasDateFilter}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
                      >
                        Clear filters
                      </button>
                    </div>

                    {dateRangeError ? (
                      <p className="text-sm text-rose-600">{dateRangeError}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => {
              setMobileFilterModalOpen(true);
            }}
            aria-label="Open sales filters"
            className="fixed bottom-4 right-4 z-40 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800 md:hidden"
          >
            Filters
          </button>
        </>
      ) : null}
    </section>
  );
};

export default Sales;
