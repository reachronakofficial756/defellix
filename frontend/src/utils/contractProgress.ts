/**
 * Calculates a weighted completion percentage for a contract based on its milestones.
 *
 * Weights:
 * - Approved / Paid: 100%
 * - Submitted / Pending Review: 40% (Client is currently reviewing)
 * - Revision / Reiteration: 10% (In backlog for fix)
 * - Pending: 0%
 *
 * @param milestones Array of milestone objects with 'status' and 'amount'
 * @param totalAmount Total contract value for weighting by financial value
 * @returns number (0-100)
 */
export function calculateContractProgress(milestones: any[], totalAmount: number): number {
  if (!milestones || !milestones.length) return 0;
  
  const denominator = totalAmount || milestones.reduce((sum, m) => sum + (m.amount || 0), 0) || 1;
  
  const weightedScore = milestones.reduce((sum, m) => {
    let weight = 0;
    const s = (m.status || '').toLowerCase();
    
    if (s === 'approved' || s === 'paid') {
      weight = 1.0;
    } else if (s === 'submitted' || s === 'pending_review') {
      weight = 0.4;
    } else if (s === 'revision' || s === 'reiteration') {
      weight = 0.1;
    }
    
    return sum + ((m.amount || 0) * weight);
  }, 0);
  
  const pct = Math.round((weightedScore / denominator) * 100);
  return Math.min(100, Math.max(0, pct));
}
