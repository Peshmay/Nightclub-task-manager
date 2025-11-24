// src/testUtils.ts

/**
 * Minimal types for testing the scoreboard logic, so we don’t depend
 * on the full Station/Task interfaces from src/types.ts.
 */
export interface TestStation {
  id: string;
  name: string;
}

export interface TestTask {
  stationId: string;
  completed: boolean;
}

/**
 * Shape of the scoreboard result, matching what your AppContext
 * getScoreboard() returns (stationId, stationName, points, etc).
 */
export interface TestStationScore {
  stationId: string;
  stationName: string;
  points: number;
  completedTasks: number;
  totalTasks: number;
}

/**
 * Pure function that copies your real getScoreboard logic:
 * - counts tasks per station
 * - points = number of completed tasks
 * - sorts stations by points DESC
 */
export function getScoreboardForTest(
  stations: TestStation[],
  tasks: TestTask[]
): TestStationScore[] {
  return stations
    .map((station) => {
      const stationTasks = tasks.filter((t) => t.stationId === station.id);
      const completedTasks = stationTasks.filter((t) => t.completed).length;

      return {
        stationId: station.id,
        stationName: station.name,
        points: completedTasks,
        completedTasks,
        totalTasks: stationTasks.length,
      };
    })
    .sort((a, b) => b.points - a.points);
}
