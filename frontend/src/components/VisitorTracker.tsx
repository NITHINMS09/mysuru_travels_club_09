'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { fetchAPI } from '@/lib/api';

export default function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    let visitorId = localStorage.getItem('tripnova_visitor');
    if (!visitorId) {
      visitorId = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('tripnova_visitor', visitorId);
    }

    let sessionId = sessionStorage.getItem('tripnova_session');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('tripnova_session', sessionId);
    }

    const device = /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : /Tablet|iPad/i.test(navigator.userAgent) ? 'Tablet' : 'Desktop';
    
    let browser = 'Other';
    if (navigator.userAgent.includes('Chrome')) browser = 'Chrome';
    else if (navigator.userAgent.includes('Firefox')) browser = 'Firefox';
    else if (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome')) browser = 'Safari';
    else if (navigator.userAgent.includes('Edge')) browser = 'Edge';

    let os = 'Unknown OS';
    if (navigator.userAgent.includes('Win')) os = 'Windows';
    else if (navigator.userAgent.includes('Mac')) os = 'MacOS';
    else if (navigator.userAgent.includes('Linux')) os = 'Linux';
    else if (navigator.userAgent.includes('Android')) os = 'Android';
    else if (navigator.userAgent.includes('like Mac')) os = 'iOS';

    fetchAPI('/analytics/visit', {
      method: 'POST',
      body: JSON.stringify({
        visitorId,
        sessionId,
        device,
        browser,
        os,
        referrer: document.referrer || null,
        page: pathname || '/'
      })
    }).catch(() => {});
  }, [pathname]);

  return null;
}
