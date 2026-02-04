# AOG Analytics API Documentation

## Overview

This document provides comprehensive API documentation for the AOG Analytics endpoints, including the new analytics capabilities added in the enhancement project.

## Base URL

```
http://localhost:3000/api
```

## Authentication

All endpoints require JWT authentication via Bearer token:

```
Authorization: Bearer <your-jwt-token>
```

## Analytics Endpoints

### 1. Get Three-Bucket Analytics

Retrieve downtime breakdown by technical, procurement, and operations buckets.

**Endpoint:** `GET /api/aog-events/analytics/buckets`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| aircraftId | string | No | Filter by specific aircraft ObjectId |
| fleetGroup | string | No | Filter by fleet group (A330, A340, G650ER, etc.) |
| startDate | string (ISO 8601) | No | Start of date range |
| endDate | string (ISO 8601) | No | End of date range |

**Example Request:**

```bash
GET /api/aog-events/analytics/buckets?startDate=2025-01-01&endDate=2025-01-31&fleetGroup=A340
```

**Success Response (200 OK):**

```json
{
  "summary": {
    "totalEvents": 45,
    "activeEvents": 3,
    "totalDowntimeHours": 1234.5,
    "averageDowntimeHours": 27.4
  },
  "buckets": {
    "technical": {
      "totalHours": 456.2,
      "averageHours": 10.1,
      "percentage": 37.0
    },
    "procurement": {
      "totalHours": 567.8,
      "averageHours": 12.6,
      "percentage": 46.0
    },
    "ops": {
      "totalHours": 210.5,
      "averageHours": 4.7,
      "percentage": 17.0
    }
  },
  "byAircraft": [
    {
      "aircraftId": "507f1f77bcf86cd799439011",
      "registration": "HZ-A42",
      "technicalHours": 123.4,
      "procurementHours": 234.5,
      "opsHours": 56.7,
      "totalHours": 414.6
    }
  ]
}
```

**Error Responses:**

- `400 Bad Request` - Invalid query parameters
- `401 Unauthorized` - Missing or invalid JWT token
- `500 Internal Server Error` - Server error

---

### 2. Get Monthly Trend

Retrieve monthly event count and downtime trends with moving averages.

**Endpoint:** `GET /api/aog-events/analytics/monthly-trend`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| aircraftId | string | No | Filter by specific aircraft ObjectId |
| fleetGroup | string | No | Filter by fleet group |
| startDate | string (ISO 8601) | No | Start of date range (defaults to 12 months ago) |
| endDate | string (ISO 8601) | No | End of date range (defaults to today) |

**Example Request:**

```bash
GET /api/aog-events/analytics/monthly-trend?fleetGroup=A340&startDate=2024-01-01&endDate=2025-01-31
```

**Success Response (200 OK):**

```json
{
  "trends": [
    {
      "month": "2024-01",
      "eventCount": 12,
      "totalDowntimeHours": 345.6,
      "averageDowntimeHours": 28.8
    },
    {
      "month": "2024-02",
      "eventCount": 8,
      "totalDowntimeHours": 234.5,
      "averageDowntimeHours": 29.3
    }
  ],
  "movingAverage": [
    {
      "month": "2024-03",
      "value": 27.5
    },
    {
      "month": "2024-04",
      "value": 26.8
    }
  ]
}
```

**Error Responses:**

- `400 Bad Request` - Invalid date format or parameters
- `401 Unauthorized` - Missing or invalid JWT token
- `500 Internal Server Error` - Server error

---

### 3. Get Automated Insights

Retrieve AI-generated insights and recommendations based on AOG patterns.

**Endpoint:** `GET /api/aog-events/analytics/insights`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| aircraftId | string | No | Filter by specific aircraft ObjectId |
| fleetGroup | string | No | Filter by fleet group |
| startDate | string (ISO 8601) | No | Start of date range (defaults to 90 days ago) |
| endDate | string (ISO 8601) | No | End of date range (defaults to today) |
| limit | number | No | Maximum number of insights to return (default: 5) |

**Example Request:**

```bash
GET /api/aog-events/analytics/insights?fleetGroup=A340&limit=5
```

**Success Response (200 OK):**

```json
{
  "insights": [
    {
      "type": "warning",
      "title": "Procurement Delays Detected",
      "description": "Parts procurement accounts for 46% of total downtime, significantly above the 30% target.",
      "metric": 46,
      "recommendation": "Review supplier contracts and consider increasing critical parts inventory."
    },
    {
      "type": "info",
      "title": "Recurring Issue: Hydraulic System",
      "description": "Hydraulic system failures have occurred 5 times in the last 30 days on aircraft HZ-A42.",
      "metric": 5,
      "recommendation": "Schedule comprehensive hydraulic system inspection and consider component replacement."
    }
  ],
  "dataQuality": {
    "completenessPercentage": 87.5,
    "legacyEventCount": 12,
    "totalEvents": 96
  }
}
```

**Insight Types:**

- `warning` - Issues requiring immediate attention (red)
- `info` - Informational patterns and trends (blue)
- `success` - Positive improvements and achievements (green)

**Error Responses:**

- `400 Bad Request` - Invalid parameters
- `401 Unauthorized` - Missing or invalid JWT token
- `500 Internal Server Error` - Server error

---

### 4. Get Forecast

Retrieve predictive analytics for future downtime trends.

**Endpoint:** `GET /api/aog-events/analytics/forecast`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| aircraftId | string | No | Filter by specific aircraft ObjectId |
| fleetGroup | string | No | Filter by fleet group |
| months | number | No | Number of months to forecast (default: 3, max: 6) |

**Example Request:**

```bash
GET /api/aog-events/analytics/forecast?fleetGroup=A340&months=3
```

**Success Response (200 OK):**

```json
{
  "historical": [
    {
      "month": "2024-10",
      "actual": 234.5
    },
    {
      "month": "2024-11",
      "actual": 267.8
    },
    {
      "month": "2024-12",
      "actual": 289.3
    }
  ],
  "forecast": [
    {
      "month": "2025-01",
      "predicted": 312.5,
      "confidenceInterval": {
        "lower": 250.0,
        "upper": 375.0
      }
    },
    {
      "month": "2025-02",
      "predicted": 335.7,
      "confidenceInterval": {
        "lower": 268.6,
        "upper": 402.8
      }
    },
    {
      "month": "2025-03",
      "predicted": 358.9,
      "confidenceInterval": {
        "lower": 287.1,
        "upper": 430.7
      }
    }
  ],
  "algorithm": "linear_regression",
  "confidence": 0.80
}
```

**Forecast Algorithm:**

The forecast uses simple linear regression on the last 12 months of historical data:
- `y = mx + b` where y = predicted downtime hours, x = month index
- Confidence interval: ±20% of predicted value
- Minimum 6 months of historical data required

**Error Responses:**

- `400 Bad Request` - Invalid parameters or insufficient historical data
- `401 Unauthorized` - Missing or invalid JWT token
- `500 Internal Server Error` - Server error

---

### 5. Get Aircraft Reliability Scores

Retrieve reliability scores and rankings for all aircraft.

**Endpoint:** `GET /api/aog-events/analytics/reliability`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| fleetGroup | string | No | Filter by fleet group |
| startDate | string (ISO 8601) | No | Start of date range (defaults to 90 days ago) |
| endDate | string (ISO 8601) | No | End of date range (defaults to today) |
| limit | number | No | Number of aircraft to return (default: 10) |

**Example Request:**

```bash
GET /api/aog-events/analytics/reliability?fleetGroup=A340&limit=5
```

**Success Response (200 OK):**

```json
{
  "aircraft": [
    {
      "aircraftId": "507f1f77bcf86cd799439011",
      "registration": "HZ-A41",
      "eventCount": 2,
      "totalDowntimeHours": 45.3,
      "reliabilityScore": 92.5,
      "trend": "improving"
    },
    {
      "aircraftId": "507f1f77bcf86cd799439012",
      "registration": "HZ-A42",
      "eventCount": 15,
      "totalDowntimeHours": 456.7,
      "reliabilityScore": 28.3,
      "trend": "declining"
    }
  ],
  "fleetAverage": 67.8
}
```

**Reliability Score Calculation:**

```
reliabilityScore = 100 - min(100, (eventCount × 5) + (totalDowntimeHours / 10))
```

**Trend Values:**

- `improving` - Score increased by >5 points vs previous period
- `stable` - Score changed by ≤5 points
- `declining` - Score decreased by >5 points

**Error Responses:**

- `400 Bad Request` - Invalid parameters
- `401 Unauthorized` - Missing or invalid JWT token
- `500 Internal Server Error` - Server error

---

## Data Quality Indicators

All analytics endpoints respect data quality and handle legacy events gracefully:

### Legacy Events

Events without milestone timestamps are flagged as `isLegacy: true` and:
- Show total downtime only (clearedAt - detectedAt)
- Cannot provide three-bucket breakdown
- Are excluded from bucket-specific analytics
- Display "Limited Analytics" badge in UI

### Data Completeness

The `dataQuality` object in responses indicates:
- `completenessPercentage` - Percentage of events with complete milestone data
- `legacyEventCount` - Number of events without milestone timestamps
- `totalEvents` - Total number of events in the dataset

### Fallback Metrics

When milestone data is partial:
- `reportedAt` defaults to `detectedAt` if missing
- `upAndRunningAt` defaults to `clearedAt` if missing
- Bucket times are computed only when both endpoints are available

---

## Rate Limiting

Analytics endpoints are rate-limited to prevent abuse:

- **Limit:** 100 requests per minute per user
- **Response Header:** `X-RateLimit-Remaining`
- **Error Response (429):** `{ "message": "Too many requests, please try again later" }`

---

## Caching

Analytics endpoints use server-side caching:

- **Cache TTL:** 5 minutes (300 seconds)
- **Cache Key:** Based on query parameters
- **Cache Invalidation:** Automatic on AOG event create/update/delete

To bypass cache (for testing), add `?nocache=true` query parameter.

---

## Error Response Format

All error responses follow this format:

```json
{
  "statusCode": 400,
  "message": "Invalid date format for startDate parameter",
  "error": "Bad Request",
  "timestamp": "2025-02-03T10:30:00.000Z",
  "path": "/api/aog-events/analytics/monthly-trend"
}
```

---

## Common Error Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 400 | Bad Request | Invalid query parameters, malformed dates |
| 401 | Unauthorized | Missing or expired JWT token |
| 403 | Forbidden | Insufficient permissions (role-based) |
| 404 | Not Found | Aircraft or resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Database error, unexpected exception |

---

## Best Practices

### 1. Date Range Filtering

Always specify date ranges for better performance:

```bash
# Good
GET /api/aog-events/analytics/buckets?startDate=2025-01-01&endDate=2025-01-31

# Avoid (queries all historical data)
GET /api/aog-events/analytics/buckets
```

### 2. Fleet Group Filtering

Use fleet group filters to reduce dataset size:

```bash
GET /api/aog-events/analytics/monthly-trend?fleetGroup=A340
```

### 3. Pagination

For large datasets, use limit parameters:

```bash
GET /api/aog-events/analytics/reliability?limit=10
```

### 4. Error Handling

Always handle errors gracefully in your client code:

```typescript
try {
  const response = await fetch('/api/aog-events/analytics/buckets');
  if (!response.ok) {
    const error = await response.json();
    console.error('API Error:', error.message);
  }
  const data = await response.json();
} catch (error) {
  console.error('Network Error:', error);
}
```

---

## Support

For API support or to report issues:
- Email: support@alphastarav.com
- Documentation: [Internal Wiki]
- Issue Tracker: [JIRA Project]

---

**Last Updated:** February 3, 2025  
**API Version:** 1.0  
**Related Documents:**
- AOG Analytics User Guide
- System Architecture Documentation
- AOG Analytics Enhancement Requirements
