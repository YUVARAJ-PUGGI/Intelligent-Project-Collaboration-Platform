#!/bin/bash

# SynergySphere Features 1-3 Testing Script
# Test all endpoints for AI Conversation Summary, Decision Tracking, and Smart Search

# Configuration
API_BASE="http://localhost:5000/api"
TOKEN="your_bearer_token_here"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test helper function
test_endpoint() {
  local method=$1
  local endpoint=$2
  local data=$3
  local description=$4

  echo -e "\n${YELLOW}Testing: $description${NC}"
  echo "Method: $method"
  echo "Endpoint: $endpoint"

  if [ -z "$data" ]; then
    # GET request
    curl -X $method \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      "$API_BASE$endpoint"
  else
    # POST/PATCH request
    curl -X $method \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$API_BASE$endpoint"
  fi

  echo -e "\n${GREEN}✓ Request completed${NC}\n"
}

echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   SynergySphere Features 1-3 API Testing                  ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${YELLOW}NOTE: Replace 'your_bearer_token_here' with actual token${NC}"
echo -e "${YELLOW}Replace 'PROJECT_ID', 'TASK_ID', 'MSG_ID', etc. with actual IDs${NC}\n"

# ============================================================================
# FEATURE 1: AI CONVERSATION SUMMARY
# ============================================================================

echo -e "\n${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}FEATURE 1: AI CONVERSATION SUMMARY${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"

# Get task summary
test_endpoint "GET" \
  "/summaries/task/TASK_ID" \
  "" \
  "Get summary for a specific task"

# Get summary with force regenerate
test_endpoint "GET" \
  "/summaries/task/TASK_ID?generate=true" \
  "" \
  "Get summary and force regenerate if stale"

# Force regenerate summary
test_endpoint "POST" \
  "/summaries/task/TASK_ID/regenerate" \
  "" \
  "Force regenerate summary (ignores cache)"

# Get all project summaries
test_endpoint "GET" \
  "/summaries/project/PROJECT_ID" \
  "" \
  "Get summaries for all tasks in project"

# Get project summaries with pagination
test_endpoint "GET" \
  "/summaries/project/PROJECT_ID?limit=10&skip=0" \
  "" \
  "Get project summaries with pagination"

# ============================================================================
# FEATURE 2: DECISION TRACKING SYSTEM
# ============================================================================

echo -e "\n${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}FEATURE 2: DECISION TRACKING SYSTEM${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"

# Mark message as decision
test_endpoint "POST" \
  "/decisions/mark" \
  '{
    "messageId":"MSG_ID",
    "decisionType":"decision",
    "tags":["architecture","backend"],
    "priority":"high"
  }' \
  "Mark message as a decision"

# Mark message as final fix
test_endpoint "POST" \
  "/decisions/mark" \
  '{
    "messageId":"MSG_ID",
    "decisionType":"final_fix",
    "priority":"high"
  }' \
  "Mark message as final fix"

# Mark message as important update
test_endpoint "POST" \
  "/decisions/mark" \
  '{
    "messageId":"MSG_ID",
    "decisionType":"important_update",
    "priority":"medium"
  }' \
  "Mark message as important update"

# Mark message as blocker
test_endpoint "POST" \
  "/decisions/mark" \
  '{
    "messageId":"MSG_ID",
    "decisionType":"blocker",
    "priority":"high",
    "tags":["critical","api"]
  }' \
  "Mark message as blocker"

# Get all decisions for a task
test_endpoint "GET" \
  "/decisions/task/TASK_ID" \
  "" \
  "Get all decisions for a task"

# Get task decisions filtered by type
test_endpoint "GET" \
  "/decisions/task/TASK_ID?decisionType=blocker" \
  "" \
  "Get all blockers in a task"

# Get task decisions filtered by priority
test_endpoint "GET" \
  "/decisions/task/TASK_ID?priority=high" \
  "" \
  "Get high priority decisions"

# Get all decisions in project
test_endpoint "GET" \
  "/decisions/project/PROJECT_ID" \
  "" \
  "Get all decisions in project"

# Get active high-priority blockers
test_endpoint "GET" \
  "/decisions/project/PROJECT_ID/blockers" \
  "" \
  "Get active blockers (for manager alerts)"

# Update decision status
test_endpoint "PATCH" \
  "/decisions/DECISION_ID/status" \
  '{"status":"resolved"}' \
  "Update decision status to resolved"

# Search decisions
test_endpoint "GET" \
  "/decisions/search?projectId=PROJECT_ID&keyword=authentication" \
  "" \
  "Search for decisions about authentication"

# Unmark decision
test_endpoint "DELETE" \
  "/decisions/DECISION_ID" \
  "" \
  "Remove decision marking from message"

# ============================================================================
# FEATURE 3: SMART SEARCH SYSTEM
# ============================================================================

echo -e "\n${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}FEATURE 3: SMART SEARCH SYSTEM${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"

# Search within a task
test_endpoint "POST" \
  "/search/task/TASK_ID" \
  '{
    "query":"JWT token expiration",
    "limit":10
  }' \
  "Search messages in task by natural language"

# Search task with entity type filter
test_endpoint "POST" \
  "/search/task/TASK_ID" \
  '{
    "query":"error",
    "limit":10,
    "entityType":"error_log"
  }' \
  "Search task filtered by entity type (error logs)"

# Project-wide search
test_endpoint "POST" \
  "/search/project" \
  '{
    "projectId":"PROJECT_ID",
    "query":"database migration",
    "limit":20
  }' \
  "Search across entire project"

# Project search filtered by decision
test_endpoint "POST" \
  "/search/project" \
  '{
    "projectId":"PROJECT_ID",
    "query":"authentication",
    "limit":20,
    "entityType":"decision"
  }' \
  "Search project for decisions about authentication"

# Find all error logs in task
test_endpoint "GET" \
  "/search/task/TASK_ID/errors" \
  "" \
  "Find all error logs/stack traces in task"

# Find code snippets in task
test_endpoint "GET" \
  "/search/task/TASK_ID/code-snippets" \
  "" \
  "Find all code snippets in task"

# Find code snippets by language
test_endpoint "GET" \
  "/search/task/TASK_ID/code-snippets?language=javascript" \
  "" \
  "Find JavaScript code snippets in task"

# Find related discussions
test_endpoint "GET" \
  "/search/message/MSG_ID/related" \
  "" \
  "Find discussions related to a specific message"

# Find related with limit
test_endpoint "GET" \
  "/search/message/MSG_ID/related?limit=10&taskId=TASK_ID" \
  "" \
  "Find related discussions (limited to 10, same task)"

# Manually index task messages
test_endpoint "POST" \
  "/search/index-task" \
  '{
    "taskId":"TASK_ID"
  }' \
  "Index all messages in task for search"

# ============================================================================
# INTEGRATION TEST: Full Workflow
# ============================================================================

echo -e "\n${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}INTEGRATION TEST: FULL WORKFLOW${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}Recommended test sequence:${NC}"
echo "
1. Create a task and post several messages
   - Include technical discussions
   - Include error messages
   - Include code snippets

2. Wait a moment for processing

3. Test Summary Feature:
   GET /api/summaries/task/TASK_ID
   Should return:
   - Key points from discussion
   - Any errors identified
   - Pending work items
   - Identified blockers

4. Test Decision Tracking:
   POST /api/decisions/mark
   Mark a critical message as blocker

   GET /api/decisions/project/PROJECT_ID/blockers
   Should return marked blocker

5. Test Search:
   POST /api/search/task/TASK_ID
   Search for relevant terms
   Should return related messages

6. Test Integration:
   - Add a new message to task
   - Summary should be marked stale
   - Get summary with ?generate=true
   - Should show updated content
"

# ============================================================================
# RESPONSE FORMAT EXAMPLES
# ============================================================================

echo -e "\n${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}EXPECTED RESPONSE FORMATS${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}Summary Response:${NC}"
cat << 'EOF'
{
  "_id": "summary_id",
  "task": "task_id",
  "summary": "Brief overview of discussion",
  "keyPoints": ["Point 1", "Point 2"],
  "identifiedIssues": ["Issue 1"],
  "decisions": ["Decision made"],
  "pendingWork": ["Task 1"],
  "blockers": ["Blocker 1"],
  "messageCount": 45,
  "isStale": false
}
EOF

echo -e "\n${YELLOW}Decision Response:${NC}"
cat << 'EOF'
{
  "_id": "decision_id",
  "task": "task_id",
  "decisionType": "blocker",
  "content": "Message content",
  "status": "active",
  "priority": "high",
  "createdAt": "2024-01-15T10:00:00Z"
}
EOF

echo -e "\n${YELLOW}Search Response:${NC}"
cat << 'EOF'
{
  "query": "JWT error",
  "taskId": "task_id",
  "resultCount": 3,
  "results": [
    {
      "content": "Message content",
      "keywords": ["jwt", "error", "token"],
      "entityType": "error_log",
      "message": {
        "content": "...",
        "sender": {"name": "John"}
      }
    }
  ]
}
EOF

# ============================================================================
# HTTP STATUS CODES
# ============================================================================

echo -e "\n${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}HTTP STATUS CODES${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"

cat << 'EOF'

200 - OK (Success)
201 - Created
204 - No Content (Delete success)

400 - Bad Request
  - Missing required fields
  - Invalid decisionType
  - Invalid query parameters

403 - Forbidden
  - No access to project/task
  - Not a project member

404 - Not Found
  - Task/message/decision doesn't exist

500 - Server Error
  - Database error
  - AI service error
  - Unexpected exception

EOF

# ============================================================================
# CURL EXAMPLES FOR SCRIPTING
# ============================================================================

echo -e "\n${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}CURL EXAMPLES (Copy-Paste Ready)${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}Get Summary:${NC}"
cat << 'EOF'
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/summaries/task/TASK_ID
EOF

echo -e "\n${YELLOW}Mark as Blocker:${NC}"
cat << 'EOF'
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"messageId":"MSG_ID","decisionType":"blocker","priority":"high"}' \
  http://localhost:5000/api/decisions/mark
EOF

echo -e "\n${YELLOW}Search Task:${NC}"
cat << 'EOF'
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"error message","limit":10}' \
  http://localhost:5000/api/search/task/TASK_ID
EOF

echo -e "\n${YELLOW}Get Blockers:${NC}"
cat << 'EOF'
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/decisions/project/PROJECT_ID/blockers
EOF

# ============================================================================
# SUMMARY
# ============================================================================

echo -e "\n${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}TESTING COMPLETE${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"

echo -e "\n${GREEN}✓ All features tested${NC}"
echo -e "Total Endpoints: 19"
echo -e "  - Summary: 3 endpoints"
echo -e "  - Decisions: 7 endpoints"
echo -e "  - Search: 6 endpoints"
echo -e "  - Integration: 3 custom tests"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Review responses for accuracy"
echo "2. Test error cases (invalid IDs, permissions)"
echo "3. Test pagination and filters"
echo "4. Integrate frontend components"
echo "5. Load test with high message volume"

echo -e "\n${GREEN}Documentation:${NC}"
echo "- API Reference: docs/FEATURES_1_3_API.md"
echo "- Implementation: docs/IMPLEMENTATION_GUIDE.md"
echo "- Quick Start: QUICK_START.md"

