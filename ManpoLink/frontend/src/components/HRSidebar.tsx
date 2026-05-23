import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import hrNav from './hr/hrNav.tsx';
import { ThemeToggle } from '@/context/ThemeContext';

const HRSidebar: React.FC = () => {
  const { pathname } = useLocation();

  const isActive = (to: string) => pathname === to || pathname.startsWith(to + '/') || (to === '/hr' && pathname === '/hr');

  return (
    <aside className="w-64 bg-[#0B1220] text-white h-full border-r border-black/10 flex flex-col">
      <div className="p-5 border-b border-black/10 shrink-0">
        <Link to="/hr" className="text-xl font-extrabold">HR Panel</Link>
      </div>

      <nav className="p-4 space-y-4 flex-1 overflow-y-auto">
        {hrNav.map((section, idx) => (
          <div key={idx}>
            {section.title && <div className="text-xs text-gray-400 font-semibold mb-2">{section.title}</div>}
            <div className="flex flex-col">
              {section.items.map((it) => (
                <div key={it.to} className="mb-1">
                  <Link
                    to={it.to}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm ${isActive(it.to) ? 'bg-white/10' : 'text-gray-200 hover:bg-white/5'}`}
                  >
                    <span className="text-gray-300">{it.icon}</span>
                    <span className="font-semibold">{it.label}</span>
                  </Link>

                  {it.children && isActive(it.to) && (
                    <div className="pl-8 mt-1 flex flex-col text-gray-300 text-sm">
                      {it.children.map((c) => (
                        <Link key={c.to} to={c.to} className="py-1">• {c.label}</Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-black/10 shrink-0 flex items-center justify-center">
        <ThemeToggle />
      </div>
    </aside>
  );
};

export default HRSidebar;
