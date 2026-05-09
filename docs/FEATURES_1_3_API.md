# SynergySphere: Advanced Collaboration Features
## API Documentation for Features 1-3

This document provides comprehensive API documentation for the three advanced collaboration features implemented in SynergySphere.

---

## Feature 1: AI Conversation Summary

### Overview
Automatically generates AI-powered summaries of task discussions, extracting key points, decisions, pending work, and blockers.

### Database Models
- **ConversationSummary**: Stores AI-generated summaries with metadata

### API Endpoints

#### 1. Get or Generate Task Summary
```http
GET /api/summaries/task/:taskId
Query Parameters:
  - generate (boolean): Force regeneration (default: false)

Response:
{
  "_id": "summary_id",
  "task": "task_id",
  "project": "project_id",
  "summary": "Brief overview of the discussion...",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "identifiedIssues": ["Issue 1", "Issue 2"],
  "decisions": ["Decision 1"],
  "pendingWork": ["Task 1", "Task 2"],
  "blockers": ["Blocker 1"],
  "messageCount": 45,
  "generatedBy": "openai",
  "confidence": 0.85,
  "lastUpdated": "2024-01-15T10:30:00Z",
  "isStale": false
}
```

#### 2. Force Regenerate Summary
```http
POST /api/summaries/task/:taskId/regenerate
Response: [Same as above]
```

#### 3. Get All Project Summaries
```http
GET /api/summaries/project/:projectId
Query Parameters:
  - limit (number): Results per page (default: 20)
  - skip (number): Results to skip (default: 0)

Response:
[
  { /* summary object */ },
  { /* summary object */ }
]
```

### Usage Example

```javascript
// Get summary with auto-generation if stale
const response = await fetch('/api/summaries/task/task123?generate=true', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const summary = await response.json();

// Display to user
console.log(summary.summary);
console.log(summary.keyPoints);
console.log(summary.blockers);
```

---

## Feature 2: Decision Tracking System

### Overview
Users can mark important messages as decisions, final fixes, important updates, or blockers. These are stored separately for reference.

### Database Models
- **Decision**: Stores marked decisions with type and metadata

### Decision Types
- `decision` - Technical decision made
- `final_fix` - Final solution/fix applied
- `important_update` - Important status update
- `blocker` - Impediment blocking progress

### API Endpoints

#### 1. Mark Message as Decision
```http
POST /api/decisions/mark
Body:
{
  "messageId": "msg_id",
  "decisionType": "decision|final_fix|important_update|blocker",
  "tags": ["authentication", "backend"],
  "priority": "low|medium|high"
}

Response:
{
  "_id": "decision_id",
  "task": "task_id",
  "project": "project_id",
  "message": "msg_id",
  "decisionType": "decision",
  "content": "Original message content...",
  "markedBy": "user_id",
  "status": "active",
  "tags": ["authentication", "backend"],
  "priority": "high",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

#### 2. Unmark Decision
```http
DELETE /api/decisions/:decisionId

Response:
{ "message": "Decision removed" }
```

#### 3. Get Task Decisions
```http
GET /api/decisions/task/:taskId
Query Parameters:
  - decisionType (string): Filter by type
  - priority (string): Filter by priority
  - status (string): Filter by status

Response:
[
  { /* decision object */ },
  { /* decision object */ }
]
```

#### 4. Get Project Decisions
```http
GET /api/decisions/project/:projectId
Query Parameters:
  - limit (number): Results per page (default: 50)
  - skip (number): Results to skip
  - decisionType (string): Filter by type

Response:
[
  { /* decision object */ }
]
```

#### 5. Get Active Blockers
```http
GET /api/decisions/project/:projectId/blockers

Response:
[
  {
    "_id": "decision_id",
    "task": { "title": "Task name" },
    "decisionType": "blocker",
    "content": "API server is down...",
    "priority": "high",
    "markedBy": { "name": "John Doe" }
  }
]
```

#### 6. Update Decision Status
```http
PATCH /api/decisions/:decisionId/status
Body:
{
  "status": "active|resolved|obsolete"
}

Response:
{ /* updated decision object */ }
```

#### 7. Search Decisions
```http
GET /api/decisions/search
Query Parameters:
  - projectId (string): Project to search in
  - keyword (string): Search keyword

Response:
[
  { /* decision object */ }
]
```

### Usage Example

```javascript
// Mark a critical message as blocker
const markDecision = async () => {
  const response = await fetch('/api/decisions/mark', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      messageId: 'msg_id',
      decisionType: 'blocker',
      priority: 'high',
      tags: ['api', 'critical']
    })
  });
  const decision = await response.json();
  console.log(`Marked as ${decision.decisionType}`);
};

// Get all blockers to alert manager
const getBlockers = async () => {
  const response = await fetch('/api/decisions/project/proj123/blockers', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const blockers = await response.json();
  return blockers;
};
```

---

## Feature 3: Smart Search System

### Overview
Intelligent semantic search with keyword matching, entity filtering, and related discussions discovery.

### Database Models
- **SearchIndex**: Stores searchable content with embeddings and keywords

### Entity Types
- `discussion` - General discussion message
- `error_log` - Error/stack trace
- `code_snippet` - Code snippet
- `screenshot` - Screenshot/image
- `decision` - Marked decision
- `fix` - Solution/fix applied

### API Endpoints

#### 1. Search Within Task
```http
POST /api/search/task/:taskId
Body:
{
  "query": "JWT login issue",
  "limit": 10,
  "entityType": "discussion|error_log|code_snippet|screenshot|decision|fix"
}

Response:
{
  "query": "JWT login issue",
  "taskId": "task_id",
  "resultCount": 3,
  "results": [
    {
      "_id": "index_id",
      "content": "Message content...",
      "keywords": ["jwt", "login", "token"],
      "entityType": "error_log",
      "message": {
        "_id": "msg_id",
        "content": "...",
        "sender": { "name": "John" },
        "createdAt": "2024-01-15T10:00:00Z"
      }
    }
  ]
}
```

#### 2. Project-Wide Search
```http
POST /api/search/project
Body:
{
  "projectId": "project_id",
  "query": "database migration",
  "limit": 20,
  "entityType": "decision"
}

Response:
{
  "query": "database migration",
  "projectId": "project_id",
  "resultCount": 5,
  "results": [ /* search results */ ]
}
```

#### 3. Find Error Logs
```http
GET /api/search/task/:taskId/errors

Response:
{
  "taskId": "task_id",
  "errorCount": 2,
  "errors": [
    {
      "content": "Stack trace...",
      "metadata": {
        "fileName": "app.js",
        "stackTrace": "at Function..."
      }
    }
  ]
}
```

#### 4. Find Code Snippets
```http
GET /api/search/task/:taskId/code-snippets
Query Parameters:
  - language (string): Filter by programming language (optional)

Response:
{
  "taskId": "task_id",
  "snippetCount": 3,
  "snippets": [
    {
      "content": "function authenticate() { ... }",
      "metadata": { "language": "javascript" }
    }
  ]
}
```

#### 5. Find Related Discussions
```http
GET /api/search/message/:messageId/related
Query Parameters:
  - limit (number): Number of related discussions (default: 5)
  - taskId (string): Limit to specific task (optional)

Response:
{
  "messageId": "msg_id",
  "relatedCount": 3,
  "related": [
    { /* related message/discussion */ }
  ]
}
```

#### 6. Manually Index Task Messages
```http
POST /api/search/index-task
Body:
{
  "taskId": "task_id"
}

Response:
{
  "message": "Indexed 45 messages for task",
  "indexed": 45
}
```

### Usage Example

```javascript
// Search for JWT issues
const searchMessages = async () => {
  const response = await fetch('/api/search/task/task123', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      query: 'JWT token expiration error',
      limit: 10
    })
  });
  const results = await response.json();
  console.log(`Found ${results.resultCount} relevant discussions`);
  results.results.forEach(r => console.log(r.message.content));
};

// Find all errors in a task
const findErrors = async () => {
  const response = await fetch('/api/search/task/task123/errors', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const { errors } = await response.json();
  return errors;
};

// Find related discussions
const findRelated = async (messageId) => {
  const response = await fetch(`/api/search/message/${messageId}/related`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const { related } = await response.json();
  return related;
};
```

---

## Service Architecture

### AIService (aiService.js)
Handles all AI-related operations:
- `generateConversationSummary(messages)` - Generate AI summary
- `extractKeywords(text)` - Extract keywords for search
- `generateEmbedding(text)` - Generate semantic embeddings
- `detectBlockersAndStress(text)` - Detect stress indicators

### ConversationSummaryService (conversationSummaryService.js)
Manages conversation summaries:
- `generateTaskSummary(taskId, force)` - Generate or update summary
- `getTaskSummary(taskId)` - Get existing or generate new
- `markSummaryStale(taskId)` - Mark as outdated
- `getProjectSummaries(projectId, options)` - Get all project summaries

### DecisionTrackingService (decisionTrackingService.js)
Manages decision tracking:
- `markMessageAsDecision(messageId, type, userId, options)` - Mark message
- `getTaskDecisions(taskId, filters)` - Get decisions for task
- `getActiveBlockers(projectId)` - Get high-priority blockers
- `updateDecisionStatus(decisionId, status)` - Update status
- `searchDecisions(projectId, keyword)` - Search decisions

### SemanticSearchService (semanticSearchService.js)
Handles search operations:
- `indexMessage(messageId, type, metadata)` - Index message
- `semanticSearch(taskId, query, options)` - Search messages
- `keywordSearch(taskId, keyword, options)` - Keyword-based search
- `findErrorLogs(taskId)` - Find errors
- `findCodeSnippets(taskId, language)` - Find code
- `projectWideSearch(projectId, query, options)` - Project-level search

---

## Integration with Message Creation

When a new message is created in a task:

1. **Summary Invalidation**: The associated task summary is marked as stale
2. **Search Indexing**: The message is automatically indexed for search
3. **Blocker Detection**: Content is scanned for stress indicators

This ensures that summaries stay fresh and search indices are current.

---

## Configuration

### Environment Variables
```
OPENAI_API_KEY=your_api_key          # For OpenAI integration (optional)
AI_SERVICE_TYPE=mock|openai|claude   # AI service to use (default: mock)
```

### Default Settings
- Summary cache: Valid for 1 hour or until new message added
- Search limit: 10 results per query
- Decision retention: Permanent (until marked obsolete)
- Blocker detection: Automatic on message creation

---

## Error Handling

All endpoints follow standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad request (missing/invalid parameters)
- `403` - Forbidden (no access to resource)
- `404` - Not found
- `500` - Server error

Example error response:
```json
{
  "message": "You cannot access this task"
}
```

---

## Performance Considerations

1. **Summaries**: Generated on-demand, cached for 1 hour
2. **Search**: Uses full-text indexes and keyword matching for fast retrieval
3. **Decisions**: Indexed by task and status for quick filtering
4. **Embeddings**: Cached to avoid regeneration

---

## Future Enhancements

1. **Real OpenAI/Claude Integration**: Replace mock implementations with actual API calls
2. **Vector Search**: Use embeddings for semantic similarity search
3. **Scheduled Summaries**: Generate summaries on interval
4. **Webhook Alerts**: Notify managers of critical blockers
5. **Export Functionality**: Generate reports from decisions and summaries
6. **Multi-language Support**: Summarize discussions in different languages

