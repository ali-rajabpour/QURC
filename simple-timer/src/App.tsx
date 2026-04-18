import React, { useState, useEffect } from 'react';
import { Moon, Sun, Coins } from 'lucide-react';

function App() {
  // Explicitly defined target date
  const COUNTDOWN_TARGET = '2025-04-10T23:59:59';
  
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Calculate time on mount and then every second
    function updateCountdown() {
      const targetDate = new Date(COUNTDOWN_TARGET).getTime();
      const now = new Date().getTime();
      const distance = targetDate - now;
      
      if (distance < 0) {
        // Past the target date
        setDays(0);
        setHours(0);
        setMinutes(0);
        setSeconds(0);
        return;
      }
      
      setDays(Math.floor(distance / (1000 * 60 * 60 * 24)));
      setHours(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
      setMinutes(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)));
      setSeconds(Math.floor((distance % (1000 * 60)) / 1000));
    }
    
    // Run immediately to avoid displaying initial values
    updateCountdown();
    
    // Set up interval
    const timer = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(timer);
  }, []); // Empty dependency array since COUNTDOWN_TARGET is constant

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} transition-colors duration-300`}>
      {/* QUR Pattern Background Overlay */}
      <div className="absolute inset-0 opacity-5 bg-[url('https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?q=80&w=2000&auto=format&fit=crop')] bg-repeat"></div>

      <div className="relative z-10">
        {/* Theme Toggle */}
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-opacity-20 hover:bg-gray-500"
        >
          {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
        </button>

        <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-screen">
          {/* Logo */}
          <div className="mb-8">
            <img src="/logo.png" alt="QUR Coin Logo" className="w-32 h-32 md:w-40 md:h-40" />
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-bold text-center mb-4 bg-gradient-to-r from-amber-500 to-amber-700 bg-clip-text text-transparent">
            QUR Coin
          </h1>

          {/* Slogan */}
          <p className="text-lg md:text-xl text-center mb-12 max-w-3xl leading-relaxed">
            The First QUR Token Based on QUR Values, Built on the Tron Blockchain (TRC20)
          </p>

          {/* Countdown Timer */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mb-12">
            {[
              { label: 'Days', value: days },
              { label: 'Hours', value: hours },
              { label: 'Minutes', value: minutes },
              { label: 'Seconds', value: seconds }
            ].map((item) => (
              <div key={item.label} className={`${isDarkMode ? 'bg-gray-800' : 'bg-amber-50'} p-6 rounded-lg text-center min-w-[120px] border-2 border-amber-500`}>
                <div className="text-3xl md:text-4xl font-bold text-amber-500 mb-2">
                  {String(item.value).padStart(2, '0')}
                </div>
                <div className="text-sm uppercase tracking-wider">{item.label}</div>
              </div>
            ))}
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-amber-50'} p-6 rounded-lg`}>
              <Coins className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Shariah Compliant</h3>
              <p className="text-sm opacity-80">Built on QUR principles and values</p>
            </div>
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-amber-50'} p-6 rounded-lg`}>
              <svg className="w-12 h-12 text-amber-500 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="text-xl font-semibold mb-2">Fast & Secure</h3>
              <p className="text-sm opacity-80">Powered by Tron blockchain technology</p>
            </div>
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-amber-50'} p-6 rounded-lg`}>
              <svg className="w-12 h-12 text-amber-500 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-semibold mb-2">Transparent</h3>
              <p className="text-sm opacity-80">Full compliance with QUR finance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;