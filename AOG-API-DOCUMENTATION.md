# AOG Events API Documentation

## Overview

This document provides comprehensive API documentation for the AOG (Aircraft On Ground) Events system, including all endpoints for event management, analytics, and import/export functionality.

## Base URL

```
Production: https://api.alphastarav.com
Development: http://localhost:3000
```

## Authentication

All API endpoints require JWT authentication unless marked as `[Public]`.

### Headers

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Obtaining JWT Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@alphastarav.com",
  "password": "password"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@alphastarav.com",
    "name": "User Name",
    "role": "Admin"
  }
}
```

## AOG Events Endpoints

### 1. List AOG Events

Get a paginated list of AOG events with optional filtering.

```http
GET /api/aog-events
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `aircraftId` | string | No | Filter by aircraft ObjectId |
| `category` | string | No | Filter by category (aog, scheduled, unscheduled, mro, cleaning) |
| `status` | string | No | Filter by status (active, resolved) |
| `location` | string | No | Filter by ICAO location code |
| `startDate` | string | No | Filter events starting after this date (ISO 8601) |
| `endDate` | string | No | Filter events starting before this date (ISO 8601) |
| `responsibleParty` | string | No | Filter by responsible party |
| `isLegacy` | boolean | No | Filter legacy imported events |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 25) |
| `sort` | string | No | Sort field (default: -detectedAt) |

#### Example Request

```http
GET /api/aog-events?category=aog&status=active&limit=10
Authorization: Bearer <token>
```

#### Example Response

```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "aircraftId": {
        "_id": "507f1f77bcf86cd799439012",
        "registration": "HZ-A42",
        "fleetGroup": "A340"
      },
      "detectedAt": "2026-01-27T08:04:00.000Z",
      "clearedAt": null,
      "category": "aog",
      "reasonCode": "R GCU FAIL",
      "actionTaken": "Troubleshooting in progress",
      "location": "OERK",
      "responsibleParty": "Internal",
      "manpowerCount": 3,
      "manHours": 24,
      "isLegacy": false,
      "status": "active",
      "durationHours": 96.5,
      "createdAt": "2026-01-27T08:10:00.000Z",
      "updatedAt": "2026-01-27T08:10:00.000Z"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

### 2. Get Single AOG Event

Get detailed information about a specific AOG event.

```http
GET /api/aog-events/:id
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | AOG Event ObjectId |

#### Example Request

```http
GET /api/aog-events/507f1f77bcf86cd799439011
Authorization: Bearer <token>
```

#### Example Response

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "aircraftId": {
    "_id": "507f1f77bcf86cd799439012",
    "registration": "HZ-A42",
    "fleetGroup": "A340",
    "aircraftType": "A340-642"
  },
  "detectedAt": "2026-01-27T08:04:00.000Z",
  "clearedAt": null,
  "category": "aog",
  "reasonCode": "R GCU FAIL",
  "actionTaken": "Troubleshooting in progress",
  "location": "OERK",
  "responsibleParty": "Internal",
  "manpowerCount": 3,
  "manHours": 24,
  "reportedAt": "2026-01-27T08:04:00.000Z",
  "procurementRequestedAt": "2026-01-27T10:30:00.000Z",
  "availableAtStoreAt": null,
  "installationCompleteAt": null,
  "testStartAt": null,
  "upAndRunningAt": null,
  "technicalTimeHours": 0,
  "procurementTimeHours": 0,
  "opsTimeHours": 0,
  "totalDowntimeHours": 96.5,
  "internalCost": 5000,
  "externalCost": 15000,
  "attachments": [],
  "isLegacy": false,
  "status": "active",
  "durationHours": 96.5,
  "createdAt": "2026-01-27T08:10:00.000Z",
  "updatedAt": "2026-01-27T08:10:00.000Z"
}
```

### 3. Create AOG Event

Create a new AOG event.

```http
POST /api/aog-events
```

#### Request Body

```json
{
  "aircraftId": "507f1f77bcf86cd799439012",
  "detectedAt": "2026-01-27T08:04:00.000Z",
  "category": "aog",
  "reasonCode": "R GCU FAIL",
  "actionTaken": "Troubleshooting in progress",
  "location": "OERK",
  "responsibleParty": "Internal",
  "manpowerCount": 3,
  "manHours": 24,
  "reportedAt": "2026-01-27T08:04:00.000Z",
  "procurementRequestedAt": "2026-01-27T10:30:00.000Z",
  "internalCost": 5000,
  "externalCost": 15000
}
```

#### Required Fields

- `aircraftId` (string): Aircraft ObjectId
- `detectedAt` (string): ISO 8601 timestamp
- `category` (string): aog, scheduled, unscheduled, mro, or cleaning
- `reasonCode` (string): Description of the issue
- `responsibleParty` (string): Internal, OEM, Customs, Finance, or Other

#### Optional Fields

- `clearedAt` (string): ISO 8601 timestamp (null for active events)
- `actionTaken` (string): Corrective action description
- `location` (string): ICAO airport code
- `manpowerCount` (number): Number of technicians
- `manHours` (number): Total labor hours
- `reportedAt` (string): Milestone timestamp
- `procurementRequestedAt` (string): Milestone timestamp
- `availableAtStoreAt` (string): Milestone timestamp
- `issuedBackAt` (string): Milestone timestamp
- `installationCompleteAt` (string): Milestone timestamp
- `testStartAt` (string): Milestone timestamp
- `upAndRunningAt` (string): Milestone timestamp
- `internalCost` (number): Internal costs
- `externalCost` (number): External costs

#### Example Response

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "aircraftId": "507f1f77bcf86cd799439012",
  "detectedAt": "2026-01-27T08:04:00.000Z",
  "clearedAt": null,
  "category": "aog",
  "reasonCode": "R GCU FAIL",
  "actionTaken": "Troubleshooting in progress",
  "location": "OERK",
  "responsibleParty": "Internal",
  "manpowerCount": 3,
  "manHours": 24,
  "isLegacy": false,
  "status": "active",
  "durationHours": 0,
  "createdAt": "2026-01-27T08:10:00.000Z",
  "updatedAt": "2026-01-27T08:10:00.000Z"
}
```

### 4. Update AOG Event

Update an existing AOG event.

```http
PUT /api/aog-events/:id
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | AOG Event ObjectId |

#### Request Body

Same as Create AOG Event, but all fields are optional. Only include fields you want to update.

#### Example Request

```http
PUT /api/aog-events/507f1f77bcf86cd799439011
Authorization: Bearer <token>
Content-Type: application/json

{
  "clearedAt": "2026-01-31T16:00:00.000Z",
  "actionTaken": "GCU replaced and tested successfully",
  "installationCompleteAt": "2026-01-31T14:00:00.000Z",
  "upAndRunningAt": "2026-01-31T16:00:00.000Z"
}
```

#### Example Response

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "aircraftId": "507f1f77bcf86cd799439012",
  "detectedAt": "2026-01-27T08:04:00.000Z",
  "clearedAt": "2026-01-31T16:00:00.000Z",
  "category": "aog",
  "reasonCode": "R GCU FAIL",
  "actionTaken": "GCU replaced and tested successfully",
  "location": "OERK",
  "responsibleParty": "Internal",
  "status": "resolved",
  "durationHours": 103.93,
  "updatedAt": "2026-01-31T16:05:00.000Z"
}
```

### 5. Delete AOG Event

Delete an AOG event (Admin only).

```http
DELETE /api/aog-events/:id
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | AOG Event ObjectId |

#### Example Request

```http
DELETE /api/aog-events/507f1f77bcf86cd799439011
Authorization: Bearer <token>
```

#### Example Response

```json
{
  "message": "AOG event deleted successfully"
}
```

## Analytics Endpoints

### 6. Get Active AOG Events

Get all currently active AOG events.

```http
GET /api/aog-events/active
```

#### Example Response

```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "aircraftId": {
        "registration": "HZ-A42",
        "fleetGroup": "A340"
      },
      "detectedAt": "2026-01-27T08:04:00.000Z",
      "category": "aog",
      "reasonCode": "R GCU FAIL",
      "location": "OERK",
      "durationHours": 96.5
    }
  ],
  "count": 1
}
```

### 7. Get Active AOG Count

Get count of active AOG events.

```http
GET /api/aog-events/active/count
```

#### Example Response

```json
{
  "count": 3
}
```

### 8. Get AOG Analytics by Responsibility

Get downtime analytics grouped by responsible party.

```http
GET /api/aog-events/analytics
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | string | No | Filter events starting after this date |
| `endDate` | string | No | Filter events starting before this date |
| `aircraftId` | string | No | Filter by aircraft |
| `fleetGroup` | string | No | Filter by fleet group |

#### Example Response

```json
{
  "summary": {
    "totalEvents": 45,
    "totalDowntimeHours": 12450,
    "averageDowntimeHours": 276.67
  },
  "byResponsibility": [
    {
      "responsibleParty": "Internal",
      "eventCount": 25,
      "totalDowntimeHours": 5600,
      "averageDowntimeHours": 224,
      "percentage": 45
    },
    {
      "responsibleParty": "OEM",
      "eventCount": 15,
      "totalDowntimeHours": 4800,
      "averageDowntimeHours": 320,
      "percentage": 38.5
    }
  ]
}
```

### 9. Get Three-Bucket Analytics

Get downtime breakdown by Technical, Procurement, and Ops buckets.

```http
GET /api/aog-events/analytics/buckets
```

#### Query Parameters

Same as Analytics by Responsibility.

#### Example Response

```json
{
  "summary": {
    "totalEvents": 45,
    "activeEvents": 3,
    "totalDowntimeHours": 12450,
    "averageDowntimeHours": 276.67
  },
  "buckets": {
    "technical": {
      "totalHours": 5600,
      "averageHours": 124.44,
      "percentage": 45
    },
    "procurement": {
      "totalHours": 4800,
      "averageHours": 106.67,
      "percentage": 38.5
    },
    "ops": {
      "totalHours": 2050,
      "averageHours": 45.56,
      "percentage": 16.5
    }
  },
  "byAircraft": [
    {
      "aircraftId": "507f1f77bcf86cd799439012",
      "registration": "HZ-A42",
      "technicalHours": 450,
      "procurementHours": 380,
      "opsHours": 120,
      "totalHours": 950
    }
  ]
}
```

### 10. Get Category Breakdown

Get event distribution by category.

```http
GET /api/aog-events/analytics/category-breakdown
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | string | No | Filter events starting after this date |
| `endDate` | string | No | Filter events starting before this date |

#### Example Response

```json
{
  "summary": {
    "totalEvents": 118,
    "totalDowntimeHours": 25680
  },
  "categories": [
    {
      "category": "aog",
      "count": 45,
      "percentage": 38.1,
      "totalHours": 12450,
      "averageHours": 276.67
    },
    {
      "category": "unscheduled",
      "count": 28,
      "percentage": 23.7,
      "totalHours": 5600,
      "averageHours": 200
    },
    {
      "category": "scheduled",
      "count": 32,
      "percentage": 27.1,
      "totalHours": 6400,
      "averageHours": 200
    },
    {
      "category": "mro",
      "count": 10,
      "percentage": 8.5,
      "totalHours": 1080,
      "averageHours": 108
    },
    {
      "category": "cleaning",
      "count": 3,
      "percentage": 2.5,
      "totalHours": 150,
      "averageHours": 50
    }
  ]
}
```

### 11. Get Location Heatmap

Get event distribution by location.

```http
GET /api/aog-events/analytics/location-heatmap
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | string | No | Filter events starting after this date |
| `endDate` | string | No | Filter events starting before this date |
| `limit` | number | No | Number of top locations to return (default: 5) |

#### Example Response

```json
{
  "summary": {
    "totalEvents": 118,
    "uniqueLocations": 8
  },
  "locations": [
    {
      "location": "OERK",
      "count": 52,
      "percentage": 44.1,
      "totalHours": 14560
    },
    {
      "location": "LFSB",
      "count": 28,
      "percentage": 23.7,
      "totalHours": 6720
    },
    {
      "location": "EDDH",
      "count": 18,
      "percentage": 15.3,
      "totalHours": 2880
    },
    {
      "location": "OEJN",
      "count": 9,
      "percentage": 7.6,
      "totalHours": 1080
    },
    {
      "location": "OMDB",
      "count": 6,
      "percentage": 5.1,
      "totalHours": 720
    }
  ]
}
```

### 12. Get Duration Distribution

Get event distribution by duration ranges.

```http
GET /api/aog-events/analytics/duration-distribution
```

#### Query Parameters

Same as Category Breakdown.

#### Example Response

```json
{
  "summary": {
    "totalEvents": 118,
    "medianDurationHours": 48,
    "averageDurationHours": 156
  },
  "distribution": [
    {
      "range": "< 24 hours",
      "count": 42,
      "percentage": 35.6
    },
    {
      "range": "1-7 days",
      "count": 51,
      "percentage": 43.2
    },
    {
      "range": "1-4 weeks",
      "count": 18,
      "percentage": 15.3
    },
    {
      "range": "> 1 month",
      "count": 7,
      "percentage": 5.9
    }
  ]
}
```

### 13. Get Aircraft Reliability Ranking

Get aircraft ranked by reliability (event count and downtime).

```http
GET /api/aog-events/analytics/aircraft-reliability
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | string | No | Filter events starting after this date |
| `endDate` | string | No | Filter events starting before this date |
| `limit` | number | No | Number of aircraft per category (default: 3) |

#### Example Response

```json
{
  "mostReliable": [
    {
      "aircraftId": "507f1f77bcf86cd799439012",
      "registration": "HZ-A9",
      "fleetGroup": "A340",
      "eventCount": 2,
      "totalDowntimeHours": 45
    },
    {
      "aircraftId": "507f1f77bcf86cd799439013",
      "registration": "HZ-A4",
      "fleetGroup": "A340",
      "eventCount": 3,
      "totalDowntimeHours": 67
    }
  ],
  "needsAttention": [
    {
      "aircraftId": "507f1f77bcf86cd799439014",
      "registration": "HZ-A25",
      "fleetGroup": "A330",
      "eventCount": 12,
      "totalDowntimeHours": 1240
    },
    {
      "aircraftId": "507f1f77bcf86cd799439015",
      "registration": "HZ-SK2",
      "fleetGroup": "A340",
      "eventCount": 10,
      "totalDowntimeHours": 890
    }
  ]
}
```

### 14. Get Monthly Trend

Get event count and downtime by month.

```http
GET /api/aog-events/analytics/monthly-trend
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | string | No | Filter events starting after this date |
| `endDate` | string | No | Filter events starting before this date |

#### Example Response

```json
{
  "trend": [
    {
      "month": "2024-01",
      "eventCount": 8,
      "totalDowntimeHours": 1920
    },
    {
      "month": "2024-02",
      "eventCount": 12,
      "totalDowntimeHours": 2880
    },
    {
      "month": "2024-03",
      "eventCount": 10,
      "totalDowntimeHours": 2400
    }
  ]
}
```

### 15. Get Insights

Get auto-generated insights and recommendations.

```http
GET /api/aog-events/analytics/insights
```

#### Query Parameters

Same as Monthly Trend.

#### Example Response

```json
{
  "fleetHealthScore": 78,
  "topProblemAircraft": [
    {
      "registration": "HZ-A25",
      "eventCount": 12,
      "totalDowntimeHours": 1240,
      "insight": "High event count - requires attention"
    }
  ],
  "mostCommonIssues": [
    {
      "issue": "Engine related",
      "count": 15,
      "percentage": 33.3
    },
    {
      "issue": "Electrical system",
      "count": 12,
      "percentage": 26.7
    }
  ],
  "busiestLocations": [
    {
      "location": "OERK",
      "count": 52,
      "percentage": 44.1
    }
  ],
  "averageResolutionTime": {
    "aog": 276.67,
    "unscheduled": 200,
    "scheduled": 200,
    "mro": 108,
    "cleaning": 50
  }
}
```

## Import/Export Endpoints

### 16. Download AOG Template

Download Excel template for AOG event import.

```http
GET /api/import/template/aog_events
```

#### Example Request

```http
GET /api/import/template/aog_events
Authorization: Bearer <token>
```

#### Response

Excel file download with:
- Data sheet with column headers
- Instructions sheet
- Example rows

### 17. Upload AOG Import File

Upload and validate AOG event data from Excel.

```http
POST /api/import/upload
```

#### Request Body (multipart/form-data)

```
file: <Excel file>
type: "aog_events"
```

#### Example Response

```json
{
  "sessionId": "import_1706745600000",
  "totalRows": 118,
  "validCount": 115,
  "errorCount": 3,
  "errors": [
    {
      "row": 5,
      "field": "aircraft",
      "message": "Aircraft 'HZ-XYZ' not found"
    },
    {
      "row": 12,
      "field": "finishDate",
      "message": "Finish date cannot be before start date"
    }
  ],
  "preview": [
    {
      "row": 1,
      "aircraft": "HZ-A42",
      "category": "aog",
      "startDate": "2024-01-15",
      "startTime": "08:30",
      "finishDate": "2024-01-17",
      "finishTime": "14:45"
    }
  ]
}
```

### 18. Confirm AOG Import

Confirm and process validated import data.

```http
POST /api/import/confirm
```

#### Request Body

```json
{
  "sessionId": "import_1706745600000",
  "type": "aog_events"
}
```

#### Example Response

```json
{
  "successCount": 115,
  "errorCount": 0,
  "importLogId": "507f1f77bcf86cd799439016",
  "message": "Successfully imported 115 AOG events"
}
```

### 19. Export AOG Events

Export AOG events to Excel.

```http
GET /api/export/aog_events
```

#### Query Parameters

Same as List AOG Events (filters are applied to export).

#### Example Request

```http
GET /api/export/aog_events?category=aog&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <token>
```

#### Response

Excel file download with all filtered events.

## Dashboard Endpoints

### 20. Get AOG Summary for Dashboard

Get AOG summary metrics for dashboard display.

```http
GET /api/dashboard/aog-summary
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | string | No | Filter events starting after this date |
| `endDate` | string | No | Filter events starting before this date |

#### Example Response

```json
{
  "activeCount": 3,
  "totalThisMonth": 12,
  "averageDuration": 156.5,
  "totalDowntime": 1878,
  "activeEvents": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "aircraft": "HZ-A42",
      "issue": "R GCU FAIL",
      "location": "OERK",
      "durationHours": 96.5
    }
  ],
  "unavailableAircraft": [
    {
      "registration": "HZ-A42",
      "reason": "AOG - R GCU FAIL",
      "durationHours": 96.5
    }
  ],
  "trend": [
    {
      "month": "2025-08",
      "count": 8
    },
    {
      "month": "2025-09",
      "count": 10
    }
  ]
}
```

## Error Responses

### Standard Error Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "aircraftId",
      "message": "Aircraft ID is required"
    }
  ]
}
```

### Common Error Codes

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Missing or invalid JWT token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource does not exist |
| 409 | Conflict - Duplicate resource |
| 500 | Internal Server Error - Server-side error |

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Authenticated users**: 1000 requests per hour
- **Import endpoints**: 10 requests per hour
- **Export endpoints**: 20 requests per hour

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1706745600
```

## Pagination

List endpoints support pagination with these parameters:

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 25, max: 100)

Pagination metadata is included in responses:

```json
{
  "data": [...],
  "total": 118,
  "page": 1,
  "limit": 25,
  "totalPages": 5
}
```

## Filtering Best Practices

1. **Date Ranges**: Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
2. **Multiple Filters**: Combine filters with AND logic
3. **Case Sensitivity**: Most string filters are case-insensitive
4. **Null Values**: Use `null` or omit parameter for null checks

## Examples

### Example 1: Get Active AOG Events for Specific Aircraft

```bash
curl -X GET \
  'https://api.alphastarav.com/api/aog-events?aircraftId=507f1f77bcf86cd799439012&status=active' \
  -H 'Authorization: Bearer <token>'
```

### Example 2: Create AOG Event with Milestones

```bash
curl -X POST \
  'https://api.alphastarav.com/api/aog-events' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "aircraftId": "507f1f77bcf86cd799439012",
    "detectedAt": "2026-01-27T08:04:00.000Z",
    "category": "aog",
    "reasonCode": "R GCU FAIL",
    "actionTaken": "Troubleshooting in progress",
    "location": "OERK",
    "responsibleParty": "Internal",
    "reportedAt": "2026-01-27T08:04:00.000Z",
    "procurementRequestedAt": "2026-01-27T10:30:00.000Z"
  }'
```

### Example 3: Get Analytics for Last 30 Days

```bash
curl -X GET \
  'https://api.alphastarav.com/api/aog-events/analytics/category-breakdown?startDate=2026-01-01&endDate=2026-01-31' \
  -H 'Authorization: Bearer <token>'
```

### Example 4: Export Filtered Events

```bash
curl -X GET \
  'https://api.alphastarav.com/api/export/aog_events?category=aog&startDate=2024-01-01&endDate=2024-12-31' \
  -H 'Authorization: Bearer <token>' \
  --output aog_events_2024.xlsx
```

## Support

For API support or questions:
- Email: support@alphastarav.com
- Documentation: https://docs.alphastarav.com
- Status Page: https://status.alphastarav.com

