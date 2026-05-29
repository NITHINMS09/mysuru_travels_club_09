'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { fetchAPI } from '@/lib/api';

export default function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    let sessionId = localStorage.getItem('tripnova_session');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('tripnova_session', sessionId);
    }

    const device = /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop';
    let browser = 'Other';
    if (navigator.userAgent.includes('Chrome')) browser = 'Chrome';
    else if (navigator.userAgent.includes('Firefox')) browser = 'Firefox';
    else if (navigator.userAgent.includes('Safari')) browser = 'Safari';
    else if (navigator.userAgent.includes('Edge')) browser = 'Edge';

    fetchAPI('/analytics/visit', {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        device,
        browser,
        page: pathname || '/'
      })
    }).catch(() => {});
  }, [pathname]);

  return null;
}
