# 🧦 Sole Mates

### *Every sock deserves its pair* 💕

> **The world's most over-engineered sock matching platform.**
>
> What could be `sock1.color === sock2.color && sock1.size === sock2.size` is instead a distributed, AI-powered, event-driven, committee-based deliberation system featuring 5 Bedrock agents, 7 Lambda functions, Step Functions orchestration, and 20+ EventBridge events per sock.

---

## 🤔 The Problem

Every year, **billions of socks** go unmatched. They sit alone in drawers, separated from their partners, wondering if they'll ever feel whole again.

Traditional solutions like "looking at them" or "using your hands" are:
- ❌ Not cloud-native
- ❌ Not AI-powered
- ❌ Not enterprise-grade
- ❌ Not generating enough AWS bills

**Sole Mates fixes this.**

---

## 🏗️ Architecture

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

### AWS Services Used

| Service | What It Does | What It Could Do |
|---------|--------------|------------------|
| Amazon Bedrock | 5 AI agents deliberating sock compatibility | Nothing, socks don't need AI |
| AWS Lambda | 7 functions processing sock data | 1 function with an `if` statement |
| Step Functions | Orchestrates the agent committee | A single function call |
| EventBridge | 20+ events per sock match | Zero events |
| DynamoDB | Stores "historical matching data" | localStorage |
| S3 | Stores sock images and agent artifacts | A folder on your desktop |
| Cognito | AI-powered password validation | `password.length >= 8` |
| API Gateway | REST API with Cognito authorizer | None needed |
| SQS | Dead letter queues for failed socks | Try/catch |
| SNS | Notifications when socks match | `console.log()` |
| CloudWatch | Monitors sock matching performance | Your eyes |

---

## 🤖 The AI Agent Committee

Every sock submitted for matching goes through a **rigorous 5-agent deliberation process**:

### 🎨 Dr. Chromatius — *Color Analysis Agent*
> *PhD in Chromatics, 200-word essays on color cultural significance*

**What it does:** Calls Claude to write essays analyzing the cultural, psychological, and historical significance of sock colors.

**What it could do:** `validColors.includes(color)`

**Sample output:**
```json
{
  "validityScore": 94,
  "culturalEssay": "The color blue, particularly in its navy manifestation, carries profound cultural weight dating back to ancient maritime traditions...",
  "hexCode": "#1a237e",
  "colorFamily": "Blue",
  "mood": "Trustworthy and dependable"
}
```

---

### 📏 ISO Compliance Expert — *Size Validation Agent*
> *Validates against ISO 3635:1981 (a real standard we're misusing)*

**What it does:** Generates official-looking ISO compliance reports for sock sizes.

**What it could do:** `['small', 'medium', 'large'].includes(size)`

**Sample output:**
```
SIZE VALIDATION REPORT
=======================
Subject: "medium"
Standard: ISO 3635:1981 (Clothing sizes - Definitions and body measurement procedures)
Status: FULLY COMPLIANT ✓

ISO CLASSIFICATION:
- Code: ISO-3635-M
- Category: Category B - Standard Foot Coverage
- Foot Length Range: 245mm - 270mm
- EU Size Equivalent: 39 - 42
- US Size Equivalent: 7 - 10

CERTIFICATION:
This sock size has been validated against international standards and is 
approved for cross-border sock matching operations.

Certificate ID: SM-ISO-1732998234567
```

---

### 🔮 Prof. Sockmund Freud — *Personality Analyzer Agent*
> *Renowned sock psychologist, determines MBTI and zodiac for socks*

**What it does:** Uses Claude to generate full psychological profiles for socks, including personality type, zodiac sign, and ideal partner description.

**What it could do:** Nothing. Socks don't have personalities.

**Sample output:**
```json
{
  "mbtiType": "ENFP",
  "zodiacSign": "Sagittarius",
  "traits": ["adventurous", "warm", "reliable", "cozy", "supportive"],
  "musicGenre": "Indie Folk",
  "idealPartner": "A sock of matching color with complementary energy and shared appreciation for long walks",
  "compatibilityPotential": 87,
  "personalitySummary": "This sock exhibits classic ENFP characteristics—warm, enthusiastic, and eager to connect with others..."
}
```

---

### 📊 Data Archaeologist — *Historical Context Agent*
> *Generates meaningless trend reports and Monte Carlo simulations*

**What it does:** Queries DynamoDB for "historical matching patterns" and generates statistical analysis reports with fake confidence intervals.

**What it could do:** Nothing. Each match is independent.

**Sample output:**
```
HISTORICAL TREND ANALYSIS REPORT
================================
STATISTICAL FINDINGS:
- Match Success Rate: 100.00% (all sock matches are successful by definition)
- Trend Direction: upward
- Seasonal Correlation: Strong affinity with fall registrations
- Mean Time to Match: 7.34 days
- Standard Deviation: 1.2847

PREDICTIVE MODELING:
Based on Monte Carlo simulation with 10,000 iterations, this sock has a 
94.72% probability of finding a compatible match within the current dataset.
```

---

### ⚖️ Justice Sockrates — *Final Decision Agent*
> *Philosophical arbiter, writes 500-word treatises on sock compatibility*

**What it does:** Synthesizes all agent inputs and renders a final verdict with philosophical analysis referencing existentialism, utilitarianism, and Kantian ethics.

**What it could do:** `return color1 === color2 && size1 === size2`

**Sample output:**
```json
{
  "philosophicalAnalysis": "In considering the compatibility of this sock, we must first examine the fundamental nature of 'matching' itself. From a Kantian perspective, the categorical imperative demands that we treat each sock not merely as a means to warmth, but as an end in itself...",
  "decision": "match",
  "confidenceScore": 97,
  "reasoning": "All committee members concur on matchability based on chromatic harmony and dimensional compatibility",
  "dissent": "None. The committee has reached unanimous consensus."
}
```

---

## 🔐 AI-Powered Password Validation

Because checking `password.length >= 8` is too simple, we use **Amazon Bedrock** to validate passwords during Cognito sign-up.

```javascript
// What we do
const response = await bedrock.invokeModel({
  modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
  body: JSON.stringify({
    messages: [{
      role: 'user',
      content: `Analyze this password for security: "${password}"`
    }]
  })
});

// What we could do
const isValid = password.length >= 8;
```

---

## 🖼️ Quantum Image Processor

Our "Quantum Image Processor" handles sock image uploads through an **enterprise-grade, cloud-native, serverless, event-driven workflow**:

1. **Upload Request** → API Gateway → Cognito Authorizer → Lambda → Pre-signed URL
2. **Image Upload** → S3 → EventBridge → SQS → Lambda → Step Functions
3. **Processing Pipeline:**
   - Validate Image → DynamoDB status update
   - Extract Metadata → DynamoDB status update  
   - Resize Image (parallel) → DynamoDB status update
   - Generate Thumbnail (parallel) → DynamoDB status update
   - Archive to Glacier → DynamoDB status update
4. **Notification** → SNS → Success/Failure broadcast

**Services involved:** S3, API Gateway, Cognito, Lambda (6 functions), Step Functions, EventBridge, SQS, DLQ, SNS, DynamoDB, Lambda Layers

**What it could be:** `<input type="file" />`

---

## 💰 Cost Analysis

| Operation | Our Solution | Simple Solution | Over-Engineering Factor |
|-----------|--------------|-----------------|------------------------|
| Match one sock | ~$0.50 | $0.000001 | **500,000x** |
| Validate password | ~$0.003 | $0.00 | **∞** |
| Upload image | ~$0.02 | $0.0001 | **200x** |

**Monthly estimate for 1,000 sock matches:** $500+

**Monthly estimate with simple code:** $0.01

---

## 🚀 Getting Started

### Prerequisites

- AWS Account with a high credit limit
- Node.js 20+
- Python 3.11+
- A willingness to question your life choices

### Installation

```bash
# Clone the repository
git clone https://github.com/jasonwadsworth/lost-socks.git
cd lost-socks

# Install dependencies (there are many)
npm install
cd backend && npm install
cd ../frontend && npm install
cd ../lambda && npm install

# Deploy the infrastructure
npx cdk deploy --all

# Start the backend
cd backend && npm start

# Start the frontend
cd frontend && npm run dev
```

### Testing the Workflow

```bash
# Submit a sock for matching
./scripts/test-sock-workflow.sh
```

Watch as 5 AI agents deliberate the fate of your sock.

---

## 📊 Event Flow

A single sock submission triggers the following EventBridge events:

1. `SockSubmitted`
2. `ColorAgentStarted`
3. `ColorAgentCompleted`
4. `SizeAgentStarted`
5. `SizeAgentCompleted`
6. `PersonalityAgentStarted`
7. `PersonalityAgentCompleted`
8. `HistoricalAgentStarted`
9. `HistoricalAgentCompleted`
10. `DecisionAgentStarted`
11. `DecisionAgentCompleted`
12. `ConsensusReached`
13. `MatchSearchStarted`
14. `MatchSearchCompleted`
15. `SockMatchFound` (or `NoMatchFound`)
16. `WorkflowCompleted`

Plus status updates, error events, and audit logs.

**Total events per sock: 20+**

---

## 🗳️ The Voting System

Each agent casts a vote with a confidence score. A sock is approved for matching when:

- **3+ agents vote "for"** (simple majority)
- **Average confidence > 70%**

The Final Decision Agent can override with a **philosophical veto** if ethical concerns arise.

---

## 🎭 Demo Highlights

- **Crying sock animation** on the intro screen
- **Real-time agent progress tracking** as each AI deliberates
- **Philosophical treatises** displayed when matches are found
- **ISO compliance certificates** for validated socks
- **MBTI compatibility analysis** between sock pairs

---

## 🏆 Hackathon Scoring

| Category | Points | Our Score |
|----------|--------|-----------|
| Magnificent Impracticality | 40 | ✅ 5 AI agents for string comparison |
| Pointless Problem Solving | 35 | ✅ Socks don't need personality tests |
| Entertainment Excellence | 25 | ✅ Justice Sockrates writes philosophy |

---

## 📜 License

MIT License — Use this code to over-engineer your own problems.

---

## 🙏 Acknowledgments

- **Amazon Bedrock** for enabling us to waste Claude's intelligence on sock analysis
- **AWS** for providing enough services to make this possible
- **The socks** who inspired this journey

---

<p align="center">
  <i>Built with ❤️ and an unreasonable amount of Lambda functions</i>
</p>

<p align="center">
  <b>Remember: Every sock deserves its pair. Even if finding that pair requires 5 AI agents, 7 Lambda functions, and a philosophical treatise.</b>
</p>
