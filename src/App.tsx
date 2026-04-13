import React, { useState } from 'react';
import SidePanel from './components/SidePanel';
import Popup from './components/Popup';

export default function App() {
  const [view, setView] = useState<'sidepanel' | 'popup'>('sidepanel');

  return (
    <div className="min-h-screen bg-[#F3F3F3] flex flex-col font-sans">
      {/* Navigation / Demo Controls */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Extension UI Preview</h1>
          <p className="text-sm text-gray-500">Toggle between the two extension views</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setView('sidepanel')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
              view === 'sidepanel'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Side Panel
          </button>
          <button
            onClick={() => setView('popup')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
              view === 'popup'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Popup Menu
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
        {view === 'sidepanel' ? (
          <div className="h-[600px] w-full max-w-sm rounded-xl overflow-hidden shadow-xl ring-1 ring-gray-900/5 bg-white flex">
            <SidePanel />
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <Popup />
          </div>
        )}
      </div>
    </div>
  );
}
