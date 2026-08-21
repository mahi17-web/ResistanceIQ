import { useEffect, useRef, useCallback } from 'react';
import { getJobStatus } from '../api/client.js';
import useProjectStore from '../store/projectStore.js';

/**
 * Polls a job endpoint every intervalMs until status is 'complete' or 'failed'.
 * Updates the global job store and fires callbacks on completion.
 *
 * @param {string|null} jobId - Job ID to poll (null = no-op)
 * @param {{ onComplete?: (result) => void, onError?: (err) => void, intervalMs?: number }} opts
 */
export function useJobPolling(jobId, { onComplete, onError, intervalMs = 1500 } = {}) {
  const updateJob = useProjectStore((s) => s.updateJob);
  const timerRef = useRef(null);
  const doneRef  = useRef(false);

  const poll = useCallback(async () => {
    if (!jobId || doneRef.current) return;
    try {
      const job = await getJobStatus(jobId);
      updateJob(jobId, job);

      if (job.status === 'complete') {
        doneRef.current = true;
        clearInterval(timerRef.current);
        onComplete?.(job.result);
      } else if (job.status === 'failed') {
        doneRef.current = true;
        clearInterval(timerRef.current);
        onError?.(job.error ?? 'Job failed');
      }
    } catch (err) {
      console.error('[useJobPolling] poll error:', err);
    }
  }, [jobId, updateJob, onComplete, onError]);

  useEffect(() => {
    if (!jobId) return;
    doneRef.current = false;
    poll(); // immediate first poll
    timerRef.current = setInterval(poll, intervalMs);
    return () => clearInterval(timerRef.current);
  }, [jobId, intervalMs, poll]);
}
