import cron from 'node-cron';
import { runReminderCheck } from '../services/reminderService';

export const setupCronJobs = (): void => {
  console.log('[Cron] Initializing automated reminder and follow-up cron scheduler...');

  // Run every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    try {
      console.log('[Cron] Running scheduled follow-up & risk check...');
      const results = await runReminderCheck();
      console.log(`[Cron] Completed check: ${results.checked} evaluated, ${results.markedFollowUpDue} marked due, ${results.escalated} escalated.`);
    } catch (error) {
      console.error('[Cron] Error running reminder check:', error);
    }
  });

  // Run initial check 5 seconds after startup
  setTimeout(async () => {
    try {
      console.log('[Cron] Executing initial startup submission and follow-up scan...');
      await runReminderCheck();
    } catch (e) {
      console.error('[Cron] Initial scan error:', e);
    }
  }, 5000);
};
