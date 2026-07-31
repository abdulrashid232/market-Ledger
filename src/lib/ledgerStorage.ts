import { DailyLedgerReport } from '../types';

export async function getSavedReports(): Promise<DailyLedgerReport[]> {
  try {
    const res = await fetch('/api/reports');
    if (!res.ok) return [];
    return res.json();
  } catch (err) {
    console.error('Failed to load reports:', err);
    return [];
  }
}

export async function saveReport(report: DailyLedgerReport): Promise<DailyLedgerReport[]> {
  try {
    await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });
    return getSavedReports();
  } catch (err) {
    console.error('Failed to save report:', err);
    return [];
  }
}

export async function deleteReport(reportId: string): Promise<DailyLedgerReport[]> {
  try {
    await fetch(`/api/reports/${reportId}`, { method: 'DELETE' });
    return getSavedReports();
  } catch (err) {
    console.error('Failed to delete report:', err);
    return [];
  }
}
