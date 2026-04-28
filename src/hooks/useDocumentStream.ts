import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export function useDocumentStream(documentId: number | null, initialStatus: string) {
  const [telemetry, setTelemetry] = useState({
    status: initialStatus,
    msg: '',
    percentage: 0,
  });

  useEffect(() => {
    // Only connect if it's currently processing or recently uploaded
    if (!documentId || (initialStatus !== 'processing' && initialStatus !== 'uploaded')) {
      return;
    }

    // Default to localhost for development if defaults.baseURL is undefined
    const baseURL = api.defaults.baseURL || 'http://localhost:8000/api';
    
    // Create EventSource
    const eventSource = new EventSource(`${baseURL}/inbound/documents/${documentId}/stream/`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        setTelemetry({
          status: data.status,
          msg: data.msg,
          percentage: data.percentage
        });

        // Terminate connection cleanly on finish states
        if (data.status === 'ready' || data.status === 'error') {
          eventSource.close();
        }
      } catch (err) {
        console.error("Failed to parse SSE data", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE Connection Error", err);
      eventSource.close();
    };

    // Cleanup Function (Memory Leak Prevention)
    return () => {
      eventSource.close();
    };
  }, [documentId, initialStatus]);

  return telemetry;
}
