import { getScoreboardForTest } from "../testUtils";

describe("Scoreboard", () => {
  test("correctly calculates points, totals, and sorting", () => {
    const stations = [
      { id: "A", name: "Bar" },
      { id: "B", name: "Entrance" },
    ];

    const tasks = [
      { id: "1", stationId: "A", completed: true },
      { id: "2", stationId: "A", completed: false },
      { id: "3", stationId: "B", completed: true },
      { id: "4", stationId: "B", completed: true },
    ];

    const result = getScoreboardForTest(stations, tasks);

    expect(result[0].stationName).toBe("Entrance");
    expect(result[0].points).toBe(2);
    expect(result[0].totalTasks).toBe(2);

    expect(result[1].stationName).toBe("Bar");
    expect(result[1].points).toBe(1);
    expect(result[1].totalTasks).toBe(2);
  });
});
