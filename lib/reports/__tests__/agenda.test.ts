import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { computeAgendaSummary, type Booking } from "../agenda";

const BOOKINGS_FIXTURE: Booking[] = [
  {
    id: "1",
    status: "Completed",
    start_at: "2024-05-01T14:00:00.000Z",
    end_at: "2024-05-01T14:30:00.000Z",
    created_at: "2024-04-30T13:00:00.000Z",
    resource_name: "Consulta A",
  },
  {
    id: "2",
    status: "No-Show",
    start_at: "2024-05-01T16:00:00.000Z",
    end_at: "2024-05-01T16:45:00.000Z",
    created_at: "2024-05-01T15:00:00.000Z",
    provider: "Dr. B",
  },
  {
    id: "3",
    status: "Cancelled by patient",
    start_at: "2024-05-02T09:00:00.000Z",
    created_at: "2024-04-28T09:30:00.000Z",
    resource_id: "res-123",
  },
  {
    id: "4",
    status: "Scheduled",
    start_at: "2024-05-02T11:00:00.000Z",
    end_at: "2024-05-02T12:30:00.000Z",
    created_at: "2024-05-01T10:00:00.000Z",
  },
];

describe("computeAgendaSummary", () => {
  const baseArgs: [string, string, string, string] = [
    "org-1",
    "2024-05-01",
    "2024-05-03",
    "America/Mexico_City",
  ];

  it("computes totals and averages for each status bucket", () => {
    const summary = computeAgendaSummary(...baseArgs, BOOKINGS_FIXTURE, "Sin recurso");

    assert.deepStrictEqual(summary.totals, {
      total: 4,
      completed: 1,
      no_show: 1,
      cancelled: 1,
      other: 1,
      avg_duration_min: 55,
      avg_lead_time_h: 36.6,
    });
  });

  it("aggregates bookings by day using the supplied timezone", () => {
    const summary = computeAgendaSummary(...baseArgs, BOOKINGS_FIXTURE, "Sin recurso");

    assert.deepStrictEqual(summary.by_day, [
      {
        date: "2024-05-01",
        total: 2,
        completed: 1,
        no_show: 1,
        cancelled: 0,
        other: 0,
        avg_duration_min: 37.5,
        avg_lead_time_h: 13,
      },
      {
        date: "2024-05-02",
        total: 2,
        completed: 0,
        no_show: 0,
        cancelled: 1,
        other: 1,
        avg_duration_min: 90,
        avg_lead_time_h: 60.3,
      },
    ]);
  });

  it("aggregates totals by resource and respects the fallback label", () => {
    const summary = computeAgendaSummary(...baseArgs, BOOKINGS_FIXTURE, "Sin recurso");

    assert.deepStrictEqual(summary.by_resource, [
      {
        resource: "Consulta A",
        total: 1,
        completed: 1,
        no_show: 0,
        cancelled: 0,
        other: 0,
      },
      {
        resource: "Dr. B",
        total: 1,
        completed: 0,
        no_show: 1,
        cancelled: 0,
        other: 0,
      },
      {
        resource: "res-123",
        total: 1,
        completed: 0,
        no_show: 0,
        cancelled: 1,
        other: 0,
      },
      {
        resource: "Sin recurso",
        total: 1,
        completed: 0,
        no_show: 0,
        cancelled: 0,
        other: 1,
      },
    ]);
  });
});
