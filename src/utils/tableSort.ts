import { useState, useMemo } from 'react';

export type SortDirection = 'ASC' | 'DESC' | null;

export interface SortState {
  column: string | null;
  direction: SortDirection;
}

// 3. Weight Map for Delivery Status Sorting (Operational Relevance Priority)
export function getDeliveryStatusWeight(statusInfo?: any): number {
  if (!statusInfo) return 2; // Default Paused weight
  const code = String(statusInfo.code || statusInfo || '').toUpperCase();

  if (code === 'ACTIVE') return 5; // Top priority (Green)
  if (code.includes('LEARNING')) return 4; // Learning Phase
  if (code.includes('SCHEDULED')) return 3; // Scheduled
  if (code.includes('PAUSED') || code.includes('DISABLED')) return 2; // Paused (Gray)
  if (code.includes('DISAPPROVED') || code.includes('REJECTED') || code.includes('ERROR')) return 1; // Error / Rejection

  return 2;
}

export function useTableSort<T>(items: T[]) {
  const [sortState, setSortState] = useState<SortState>({
    column: null,
    direction: null
  });

  const toggleSort = (columnKey: string) => {
    setSortState((prev) => {
      if (prev.column !== columnKey) {
        return { column: columnKey, direction: 'DESC' }; // Click 1: Descending (Highest/Ativos first)
      }
      if (prev.direction === 'DESC') {
        return { column: columnKey, direction: 'ASC' }; // Click 2: Ascending (Lowest/Pausados first)
      }
      return { column: null, direction: null }; // Click 3: Clear sorting
    });
  };

  const sortedItems = useMemo(() => {
    if (!sortState.column || !sortState.direction) {
      return items;
    }

    const { column, direction } = sortState;
    const isDesc = direction === 'DESC';

    return [...items].sort((a: any, b: any) => {
      let valA = a[column];
      let valB = b[column];

      // Delivery Status Weighted Sorting
      if (column === 'deliveryInfo' || column === 'status') {
        const weightA = getDeliveryStatusWeight(a.deliveryInfo || a.status);
        const weightB = getDeliveryStatusWeight(b.deliveryInfo || b.status);

        if (weightA !== weightB) {
          return isDesc ? weightB - weightA : weightA - weightB;
        }
        // Secondary tie-breaker by spend
        const spendA = a.spend ?? 0;
        const spendB = b.spend ?? 0;
        return isDesc ? spendB - spendA : spendA - spendB;
      }

      // Null handling (Push nulls to bottom in DESC, top in ASC)
      if (valA === null || valA === undefined) return isDesc ? 1 : -1;
      if (valB === null || valB === undefined) return isDesc ? -1 : 1;

      // Numeric comparison
      if (typeof valA === 'number' && typeof valB === 'number') {
        return isDesc ? valB - valA : valA - valB;
      }

      // String comparison
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return isDesc ? strB.localeCompare(strA) : strA.localeCompare(strB);
    });
  }, [items, sortState]);

  return {
    sortState,
    toggleSort,
    sortedItems
  };
}
