export interface AttendanceStats {
  attended: number;
  absent: number;
  cancelled: number;
  total: number; // attended + absent
  percentage: number;
  status: 'safe' | 'caution' | 'low' | 'critical';
  classesNeeded: number;
  classesCanMiss: number;
  message: string;
  isAtRisk: boolean;
}

export function calculateAttendanceStats(
  attended: number,
  absent: number,
  cancelled: number,
  requiredPercentage: number = 75
): AttendanceStats {
  const total = attended + absent; // Cancelled classes strictly excluded!
  
  if (total === 0) {
    return {
      attended: 0,
      absent: 0,
      cancelled,
      total: 0,
      percentage: 100,
      status: 'safe',
      classesNeeded: 0,
      classesCanMiss: 0,
      message: 'No classes held yet. You start with a clean slate!',
      isAtRisk: false,
    };
  }

  const percentage = Number(((attended / total) * 100).toFixed(1));
  const R = requiredPercentage;

  let status: 'safe' | 'caution' | 'low' | 'critical' = 'safe';
  if (percentage >= 85) {
    status = 'safe';
  } else if (percentage >= 75) {
    status = 'caution';
  } else if (percentage >= 65) {
    status = 'low';
  } else {
    status = 'critical';
  }

  const isAtRisk = percentage < R;
  let classesNeeded = 0;
  let classesCanMiss = 0;
  let message = '';

  if (isAtRisk) {
    // (A + n) / (T + n) >= R / 100
    // n >= (R * T - 100 * A) / (100 - R)
    if (R >= 100) {
      classesNeeded = 1;
    } else {
      const numerator = R * total - 100 * attended;
      const denominator = 100 - R;
      classesNeeded = Math.max(1, Math.ceil(numerator / denominator));
    }
    message = `Attend the next ${classesNeeded} ${classesNeeded === 1 ? 'class' : 'classes'} to reach ${R}%.`;
  } else {
    // A / (T + m) >= R / 100
    // m <= (100 * A - R * T) / R
    if (R <= 0) {
      classesCanMiss = 999;
      message = 'You have fulfilled requirements.';
    } else {
      const diff = 100 * attended - R * total;
      classesCanMiss = Math.max(0, Math.floor(diff / R));
      if (classesCanMiss > 0) {
        message = `You can miss ${classesCanMiss} ${classesCanMiss === 1 ? 'class' : 'classes'} and remain above ${R}%.`;
      } else {
        message = `On the borderline! You cannot miss any classes to stay above ${R}%.`;
      }
    }
  }

  return {
    attended,
    absent,
    cancelled,
    total,
    percentage,
    status,
    classesNeeded,
    classesCanMiss,
    message,
    isAtRisk,
  };
}
