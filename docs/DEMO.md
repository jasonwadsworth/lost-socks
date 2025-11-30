# 🧦 Lost Socks - Demo Guide

## The Most Over-Engineered Sock Matcher Ever Built

### What It Does
Matches socks by color and size using a **committee of 5 AI agents** that deliberate, analyze, and reach consensus.

**What could be:** `sock1.color === sock2.color && sock1.size === sock2.size`

**What we built:** 
- 3 Bedrock Agents (Dr. Chromatius, Prof. Sockmund Freud, Justice Sockrates)
- 7 Lambda functions
- Step Functions workflow
- EventBridge event cascade (20+ events per sock!)
- DynamoDB tables
- Real-time progress tracking

### The AI Agent Committee

| Agent | Role | What They Do |
|-------|------|--------------|
| 🎨 Dr. Chromatius | Color Analyst | Writes 200-word essays on color cultural significance |
| 📏 ISO Expert | Size Validator | Validates against ISO 3635:1981 (fake but sounds official) |
| 🔮 Prof. Sockmund Freud | Sock Psychologist | Determines MBTI type and zodiac sign for socks |
| 📊 Data Archaeologist | Historical Analyst | Generates meaningless trend reports |
| ⚖️ Justice Sockrates | Final Arbiter | Writes 500-word philosophical treatises |

### Demo Flow

1. **Upload a sock image** → Triggers image processing pipeline
2. **Submit for matching** → Publishes `SockSubmitted` event to EventBridge
3. **Watch agents deliberate** → Real-time progress as each agent analyzes
4. **See the verdict** → Unanimous consensus with philosophical reasoning
5. **Find matches** → Display compatible socks with agent vote breakdown

### Running the Demo

```bash
# Start backend
cd backend && npm install && npm start

# Start frontend (separate terminal)
cd frontend && npm install && npm run dev

# Or test the workflow directly
./scripts/test-sock-workflow.sh
```

### Key Talking Points

**"But why?"** - That's the point! Maximum impracticality for hackathon points.

**Cost comparison:**
- Simple query: $0.000001
- Our solution: $0.15-0.50
- Over-engineering factor: **500,000x**

**AWS Services Used:**
- Amazon Bedrock (3 Agents)
- AWS Lambda (7 functions)
- AWS Step Functions
- Amazon EventBridge
- Amazon DynamoDB
- Amazon S3
- Amazon CloudWatch
- AWS X-Ray

### Architecture Highlights

```
User → Frontend → Backend → EventBridge → Step Functions
                                              ↓
                              ┌───────────────┼───────────────┐
                              ↓               ↓               ↓
                         ColorAgent     SizeAgent    PersonalityAgent
                              └───────────────┼───────────────┘
                                              ↓
                                      HistoricalAgent
                                              ↓
                                       DecisionAgent
                                              ↓
                                        MatchSearch
                                              ↓
                                    ConsensusReached! 🎉
```

### Hackathon Scoring

- **Impracticality (40 pts):** ✅ Bedrock Agents for string comparison
- **Pointlessness (35 pts):** ✅ AI debates sock compatibility
- **Entertainment (25 pts):** ✅ Dr. Chromatius and Justice Sockrates

**Total: 100/100** 🏆
