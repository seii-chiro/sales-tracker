import { NavLink, Outlet } from "react-router";

const navItems: Array<{ to: string; label: string; end?: boolean }> = [
  { to: "/", label: "Home", end: true },
  { to: "/inventory", label: "Inventory" },
  { to: "/sales", label: "Sales" },
];

const RootLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div>
            {/* <p className="text-sm font-medium text-slate-500">Sales Tracker</p> */}
            <h1 className="text-lg font-semibold">Rechelle's Store</h1>
          </div>

          <nav className="flex items-center gap-2 rounded-lg bg-slate-100 p-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-4 md:px-6 md:py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default RootLayout;
