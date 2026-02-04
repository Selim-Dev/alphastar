# AOG Analytics Endpoints - Implementation Summary

## Overview

This document describes the new analytics endpoints added to the AOG Events API as part of the AOG Data Import & Enhancement feature.

## Implemented Endpoints

### 1. Category Breakdown
**Endpoint:** `GET /api/aog-events/analytics/category-breakdown`

**Description:** Groups events by category and calculates count, percentage, and total hours for each category.

**Query Parameters:**
- `startDate` (optional): Filter by start date (ISO 8601 format)
- `endDate` (optional): Filter by end date (ISO 8601 format)
- `aircraftId` (optional): Filter by specific aircraft

**Response:**
```json
[
  {
    "category": "aog",
    "count": 45,
    "percentage": 38.14,
    "totalHours": 1240.5
  },
  {
    "category": "scheduled",
    "count": 32,
    "percentage": 27.12,
    "totalHours": 890.25
  }
]
```

**Requirements:** 8.1, 16.4

---

### 2. Location Heatmap
**Endpoint:** `GET /api/aog-events/analytics/location-heatmap`

**Description:** Groups events by location and calculates count and percentage. Returns top N locations by event count.

**Query Parameters:**
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date
- `aircraftId` (optional): Filter by specific aircraft
- `limit` (optional): Number of top locations to return (default: 5)

**Response:**
```json
[
  {
    "location": "OERK",
    "count": 52,
    "percentage": 44.07
  },
  {
    "location": "LFSB",
    "count": 28,
    "percentage": 23.73
  }
]
```

**Requirements:** 8.2, 16.3

---

### 3. Duration Distribution
**Endpoint:** `GET /api/aog-events/analytics/duration-distribution`

**Description:** Groups events by duration ranges and calculates count and percentage for each range.

**Duration Ranges:**
- `< 24 hours`
- `1-7 days`
- `1-4 weeks`
- `> 1 month`

**Query Parameters:**
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date
- `aircraftId` (optional): Filter by specific aircraft

**Response:**
```json
[
  {
    "range": "< 24 hours",
    "count": 42,
    "percentage": 35.29
  },
  {
    "range": "1-7 days",
    "count": 51,
    "percentage": 42.86
  },
  {
    "range": "1-4 weeks",
    "count": 18,
    "percentage": 15.13
  },
  {
    "range": "> 1 month",
    "count": 7,
    "percentage": 5.88
  }
]
```

**Requirements:** 8.3, 6.5

---

### 4. Aircraft Reliability
**Endpoint:** `GET /api/aog-events/analytics/aircraft-reliability`

**Description:** Ranks aircraft by event count and total downtime. Returns top 3 most reliable and top 3 needing attention.

**Query Parameters:**
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date

**Response:**
```json
{
  "mostReliable": [
    {
      "aircraftId": "507f1f77bcf86cd799439011",
      "registration": "HZ-A42",
      "eventCount": 2,
      "totalHours": 45.5
    }
  ],
  "needsAttention": [
    {
      "aircraftId": "507f1f77bcf86cd799439012",
      "registration": "HZ-A25",
      "eventCount": 12,
      "totalHours": 1240.75
    }
  ]
}
```

**Requirements:** 8.4, 16.1

---

### 5. Monthly Trend
**Endpoint:** `GET /api/aog-events/analytics/monthly-trend`

**Description:** Groups events by month and calculates count and total hours for each month.

**Query Parameters:**
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date
- `aircraftId` (optional): Filter by specific aircraft

**Response:**
```json
[
  {
    "month": "2024-01",
    "count": 8,
    "totalHours": 320.5
  },
  {
    "month": "2024-02",
    "count": 12,
    "totalHours": 480.25
  }
]
```

**Requirements:** 8.5, 16.5

---

### 6. Insights Generation
**Endpoint:** `GET /api/aog-events/analytics/insights`

**Description:** Generates comprehensive insights from AOG data including top problem aircraft, most common issues, busiest locations, average resolution time by category, and fleet health score.

**Query Parameters:**
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date

**Response:**
```json
{
  "topProblemAircraft": [
    {
      "registration": "HZ-A25",
      "eventCount": 12,
      "totalHours": 1240.75
    }
  ],
  "mostCommonIssues": [
    {
      "issue": "Hydraulic leak",
      "count": 15
    },
    {
      "issue": "Engine failure",
      "count": 12
    }
  ],
  "busiestLocations": [
    {
      "location": "OERK",
      "count": 52
    },
    {
      "location": "LFSB",
      "count": 28
    }
  ],
  "averageResolutionTime": {
    "aog": 48.5,
    "scheduled": 120.25,
    "unscheduled": 36.75,
    "mro": 720.0,
    "cleaning": 12.5
  },
  "fleetHealthScore": 75
}
```

**Fleet Health Score Calculation:**
The fleet health score (0-100) is calculated based on:
- Active AOG count (lower is better): -10 points per active AOG (max -50)
- Event frequency (lower is better): -1 point per event (max -30)
- Average downtime (lower is better): -1 point per 10 hours (max -20)

**Requirements:** 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7, 16.8

---

## Implementation Details

### Service Methods
All analytics methods are implemented in `backend/src/aog-events/services/aog-events.service.ts`:

- `getCategoryBreakdown()`
- `getLocationHeatmap()`
- `getDurationDistribution()`
- `getAircraftReliability()`
- `getMonthlyTrend()`
- `getInsights()`

### Helper Methods
The insights endpoint uses several helper methods:
- `getTopProblemAircraft()` - Identifies aircraft with > 10 events
- `getMostCommonIssues()` - Groups by reasonCode
- `getBusiestLocations()` - Groups by location
- `getAverageResolutionTimeByCategory()` - Calculates avg downtime per category
- `calculateFleetHealthScore()` - Computes 0-100 health score

### Controller Endpoints
All endpoints are registered in `backend/src/aog-events/aog-events.controller.ts` under the `/api/aog-events/analytics/` path.

### Date Handling
All endpoints automatically adjust the `endDate` to end of day (23:59:59.999) to include all events on that day.

### Authentication
All endpoints require JWT authentication and are protected by the `JwtAuthGuard`.

## Testing

To test these endpoints:

1. Start the backend server:
   ```bash
   cd backend
   npm run start:dev
   ```

2. Use a tool like Postman or curl to make requests:
   ```bash
   # Get category breakdown
   curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     "http://localhost:3000/api/aog-events/analytics/category-breakdown?startDate=2024-01-01&endDate=2024-12-31"

   # Get insights
   curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     "http://localhost:3000/api/aog-events/analytics/insights?startDate=2024-01-01&endDate=2024-12-31"
   ```

## Next Steps

These analytics endpoints will be consumed by the frontend Analytics Page (Task 9) to display:
- Category breakdown chart
- Location heatmap chart
- Duration distribution chart
- Aircraft reliability ranking
- Monthly trend chart
- Insights panel

## Notes

- All analytics use MongoDB aggregation pipelines for efficient computation
- Results are rounded to 2 decimal places for consistency
- Empty or null values are filtered out where appropriate
- The implementation follows the existing patterns in the codebase
- No property-based testing or unit testing was implemented per the task requirements (fast iteration focus)
