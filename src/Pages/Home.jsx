import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const HOMEPAGE_EXPORT_PATH = '/ciis-premium-saas-homepage/CIIS%20Homepage.dc.html';

function Home() {
  const iframeRef = useRef(null);
  const [iframeHeight, setIframeHeight] = useState('100vh');

  const homepageSrc = useMemo(() => {
    const hash = window.location.hash || '';
    return `${HOMEPAGE_EXPORT_PATH}${hash}`;
  }, []);

  const syncIframeHeight = useCallback(() => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;

    if (!doc) return;

    const nextHeight = Math.max(
      doc.body?.scrollHeight || 0,
      doc.documentElement?.scrollHeight || 0,
      window.innerHeight
    );

    setIframeHeight(`${nextHeight}px`);
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return undefined;

    let resizeObserver;
    let intervalId;

    const handleLoad = () => {
      syncIframeHeight();

      const doc = iframe.contentDocument;
      if (!doc) return;

      doc.documentElement.style.overflow = 'hidden';
      doc.body.style.overflow = 'hidden';

      if (window.ResizeObserver && doc.body) {
        resizeObserver = new ResizeObserver(syncIframeHeight);
        resizeObserver.observe(doc.body);
      }

      intervalId = window.setInterval(syncIframeHeight, 800);
      window.setTimeout(syncIframeHeight, 1200);
      window.setTimeout(syncIframeHeight, 2600);
    };

    iframe.addEventListener('load', handleLoad);
    window.addEventListener('resize', syncIframeHeight);

    return () => {
      iframe.removeEventListener('load', handleLoad);
      window.removeEventListener('resize', syncIframeHeight);
      resizeObserver?.disconnect();
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [syncIframeHeight]);

  return (
    <main
      style={{
        width: '100%',
        minHeight: '100vh',
        margin: 0,
        background: '#ffffff',
        overflow: 'visible',
      }}
    >
      <iframe
        ref={iframeRef}
        title="CIIS Premium SaaS Homepage"
        src={homepageSrc}
        onLoad={syncIframeHeight}
        style={{
          display: 'block',
          width: '100%',
          height: iframeHeight,
          border: 0,
          background: '#ffffff',
        }}
      />
    </main>
  );
}

export default Home;
