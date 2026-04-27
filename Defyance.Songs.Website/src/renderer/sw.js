const pdfCache = new Map();

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_PDF_BLOB') {
    pdfCache.set(event.data.filename, event.data.blob);
    // Auto-cleanup after 60 seconds
    setTimeout(() => pdfCache.delete(event.data.filename), 60000);
  }
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Intercept our virtual PDF path
  if (url.pathname.startsWith('/view-pdf/')) {
    const filename = decodeURIComponent(url.pathname.replace('/view-pdf/', ''));
    const blob = pdfCache.get(filename);

    if (blob) {
      event.respondWith(
        new Response(blob, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${filename}"`,
            'Content-Length': blob.size.toString(),
            'X-Content-Type-Options': 'nosniff'
          }
        })
      );
    }
  }
});

// Force immediate control
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
