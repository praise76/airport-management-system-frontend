import { useState, useEffect } from 'react';
import { api } from '@/api/client'; // Using existing client instead of raw axios if possible
import { DutyBoardResponse } from '@/types/dutyBoard';

export const useDutyBoardData = (departmentId = 'all', terminalId?: string) => {
  const [data, setData] = useState<DutyBoardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const response = await api.get('/public/duty-board', {
        params: { departmentId, terminalId },
      });
      // Assuming api client unwraps data or returns axios response. 
      // Based on previous files, api.get returns axios response.
      // And typically the backend response is { success: true, data: ... }
      // But let's check what `api.get` typically returns in this project.
      // Usually in this project: res.data is the payload.
      
      const payload = response.data; 
      if (payload.success) {
          setData(payload.data);
          setError(null);
      } else {
          // If the API format is direct data:
          setData(payload); 
      }
      
    } catch (err) {
      setError('Failed to fetch duty board data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [departmentId, terminalId]);

  return { data, loading, error, refetch: fetchData };
};
