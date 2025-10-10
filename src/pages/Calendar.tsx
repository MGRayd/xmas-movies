import React, { useState, useEffect } from 'react';

export default function Calendar() {
  const [iframeHeight, setIframeHeight] = useState(600);

  // Adjust iframe height based on viewport width for better mobile experience
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) { // Mobile devices
        setIframeHeight(500);
      } else if (width < 1024) { // Tablets
        setIframeHeight(550);
      } else { // Desktops
        setIframeHeight(600);
      }
    };

    // Set initial height
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Google Calendar iframe parameters
  // We can customize some aspects through URL parameters
  const calendarSrc = "https://calendar.google.com/calendar/embed?" + 
    "src=97084ad1a7c1976fc22d25a18cfebc591f5ea24e12737b6cbbead55805ee5822%40group.calendar.google.com" + 
    "&ctz=Europe%2FLondon" + 
    "&bgcolor=%2312151b" + // Dark background matching Terraveil theme
    "&color=%23c23c3c" + // Accent color for events
    "&showTitle=0" + // Hide default title
    "&showNav=1" + 
    "&showDate=1" + 
    "&showPrint=0" + 
    "&showTabs=1" + 
    "&showCalendars=0" + 
    "&showTz=0";

  return (
    <div className="container mx-auto px-4">
      <div className="prose prose-invert max-w-none">
        <h1 className="text-2xl font-bold mb-2 text-terraveil-line">Campaign Calendar</h1>
        <div className="tv-divider w-full"></div>
        <p className="mb-4 text-terraveil-mute">View and keep track of upcoming game sessions and events.</p>
      </div>
      
      <div className="calendar-container w-full overflow-hidden rounded-lg border border-terraveil-line/30 shadow-lg bg-terraveil-card p-3">
        <div className="relative">
          {/* Red accent bar at top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-terraveil-line opacity-80"></div>
          
          <iframe 
            src={calendarSrc}
            style={{ border: 0 }} 
            width="100%" 
            height={iframeHeight} 
            frameBorder="0" 
            scrolling="no"
            title="Terraveil Campaign Calendar"
            className="bg-terraveil-bg"
          ></iframe>
          
          {/* Red accent bar at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-terraveil-line opacity-80"></div>
        </div>
      </div>
      
      <div className="mt-6 text-sm text-terraveil-mute border-l-2 border-terraveil-line/50 pl-4 py-2">
        <p>This calendar shows all scheduled game sessions and important campaign events.</p>
        <p className="mt-2">Click on any event for more details.</p>
      </div>
    </div>
  );
}
