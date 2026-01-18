# 📧 uOttaMail - AI-Powered Inbox Firewall

> **Built for uOttaHack 8** | Solace Agent Mesh + Solace PubSub+ + Django + React

An intelligent email security system that uses **multiple AI agents** to analyze incoming emails in real-time for spam detection, priority classification, tone analysis, action item extraction, and malicious URL scanning.

![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)
![Django](https://img.shields.io/badge/Django-5.1-green?logo=django)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![Solace](https://img.shields.io/badge/Solace-PubSub+-purple)
![AWS](https://img.shields.io/badge/AWS-Bedrock-orange?logo=amazon-aws)
![Docker](https://img.shields.io/badge/Docker-Compose-blue?logo=docker)

---

## ✨ Features

- 🚫 **Spam Detection** - AI-powered spam and phishing classification
- 🎯 **Priority Classification** - Automatic urgency scoring (Urgent/High/Medium/Low)
- 📝 **Smart Summaries** - One-line AI summaries for quick scanning
- 😊 **Tone Analysis** - Sentiment detection (Professional, Friendly, Urgent, etc.)
- ✅ **Action Item Extraction** - Automatically extracts tasks with due dates
- 🔗 **URL Security Scanning** - VirusTotal integration for malicious link detection
- 💬 **AI Chat Interface** - Ask questions about your emails in natural language
- ⚡ **Real-time Updates** - Server-Sent Events (SSE) for instant UI updates

---

## 🏗️ Architecture Overview

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────────────────────┐
│   React UI  │◄───►│  Django Backend  │────►│       Solace PubSub+ Broker     │
│  (Vite)     │ SSE │  (DRF + JWT)     │MQTT │                                 │
└─────────────┘     └──────────────────┘     └───────────────┬─────────────────┘
                              │                              │
                              │                              ▼
                    ┌─────────┴─────────┐     ┌─────────────────────────────────┐
                    │  PostgreSQL 16    │     │   Solace Agent Mesh (SAM)       │
                    │  + Redis 7        │     │  ┌─────────┐ ┌─────────────────┐│
                    └───────────────────┘     │  │ Event   │ │   AI Agents     ││
                                              │  │ Mesh GW │►│ • SpamAgent     ││
                    ┌───────────────────┐     │  │         │ │ • PriorityAgent ││
                    │  Django Consumer  │◄────┤  │         │ │ • SummaryAgent  ││
                    │  (MQTT Subscriber)│     │  │         │ │ • ToneAnalyzer  ││
                    └───────────────────┘     │  │         │ │ • ActionItems   ││
                                              │  │         │ │ • URLScanner    ││
                                              │  └─────────┘ │ • QueryAgent    ││
                                              └─────────────────────────────────┘
                                                              │
                                              ┌───────────────┴───────────────┐
                                              │        External Services       │
                                              │  • AWS Bedrock (Claude 3.5)   │
                                              │  • VirusTotal API (MCP)       │
                                              └───────────────────────────────┘
```

**How it works:**
1. Django publishes new emails to Solace topics via MQTT
2. SAM's **Event Mesh Gateway** fans out each email to 6+ specialist AI agents in parallel
3. Each agent analyzes the email and publishes results to its own topic
4. Django Consumer subscribes to all result topics and updates the database
5. SSE pushes real-time updates to the React UI

---

## 📁 Project Structure

```
uOttaMail/
├── backend/                 # Django REST API + MQTT Consumer
│   ├── api/                 # DRF views, models, serializers
│   │   ├── models.py        # Email, User, ActionItem models
│   │   ├── views.py         # REST endpoints + SSE
│   │   └── solace_mqtt.py   # MQTT publisher client
│   ├── inboxfirewall/       # Django project settings
│   └── requirements.txt
├── frontend/                # React + Vite UI
│   ├── src/
│   │   ├── App.jsx          # Main application component
│   │   └── index.css        # Styling
│   └── package.json
├── sam/                     # Solace Agent Mesh configuration
│   ├── configs/
│   │   ├── agents/          # AI agent definitions
│   │   │   ├── spam_agent.yaml
│   │   │   ├── priority_agent.yaml
│   │   │   ├── summary_agent.yaml
│   │   │   ├── email_tone_analyzer.yaml
│   │   │   ├── action_items_agent.yaml
│   │   │   ├── url-scanner.yaml
│   │   │   └── email_query_agent.yaml
│   │   ├── gateways/        # Event Mesh Gateway configs
│   │   └── shared_config.yaml
│   └── src/inbox_agents/    # Custom Python tools
├── docker-compose.yml       # Full stack orchestration
├── .env.example             # Environment template
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- AWS account with Bedrock access (Claude 3.5 Haiku enabled)
- VirusTotal API key (free tier works)

### 1. Clone & Configure

```bash
git https://github.com/Divi76h/uOttaMail.git
cd uOttaMail

# Copy environment files
cp .env.example .env
cp sam/.env.example sam/.env
```

### 2. Set Environment Variables

Edit `sam/.env`:
```env
LLM_SERVICE_API_KEY=<your-aws-access-key>
LLM_SERVICE_API_KEY_SECRET=<your-aws-secret-key>
LLM_SERVICE_REGION=us-east-1
VIRUSTOTAL_API_KEY=<your-virustotal-key>
```

### 3. Start All Services

```bash
docker compose up --build
```

> **Note:** First run takes a few minutes as SAM installs the Event Mesh Gateway plugin.

### 4. Access the Application

| Service | URL | Credentials |
|---------|-----|-------------|
| **React UI** | http://localhost:5173 | Register new user |
| **Django API** | http://localhost:8001/api/ | JWT Auth |
| **Solace Broker Manager** | http://localhost:8080 | admin / admin |

---

## 🎮 How to Demo

1. **Register two users** in the UI (e.g., `alice` and `bob`)
2. **Login as Alice** and send an email to Bob
3. **Login as Bob** - watch the email appear with AI analysis badges:
   - 🟢 Priority badge (Urgent/High/Medium/Low)
   - 🛡️ Spam status (Legitimate/Suspicious/Spam)
   - 📝 One-line summary
   - 😊 Tone indicator
   - ✅ Extracted action items
   - 🔗 URL safety status
4. **Try the AI Chat** - Ask "What emails mention deadlines?"

---

## 📨 Topic Architecture

```
solace-broker/
├── email/
│   ├── new/{user_id}/{email_id}           # Trigger for all agents
│   ├── chat/{user_id}/{session_id}        # AI chat queries
│   ├── priority/{user_id}/{email_id}      # Priority results
│   ├── spam/{user_id}/{email_id}          # Spam detection results
│   ├── summary/{user_id}/{email_id}       # Summary results
│   ├── tone/{user_id}/{email_id}          # Tone analysis results
│   ├── action_items/{user_id}/{email_id}  # Action items results
│   └── url_scan/{user_id}/{email_id}      # URL scan results
```

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 + Vite | Modern UI with hot reload |
| **Backend** | Django 5.1 + DRF | REST API framework |
| **Auth** | SimpleJWT | Token-based authentication |
| **Database** | PostgreSQL 16 | Primary data store |
| **Cache** | Redis 7 | Session management |
| **Message Broker** | Solace PubSub+ | Event-driven messaging |
| **AI Framework** | Solace Agent Mesh | Multi-agent orchestration |
| **LLM** | AWS Bedrock (Claude 3.5 Haiku) | AI inference |
| **Security API** | VirusTotal (MCP) | Malicious URL detection |
| **Orchestration** | Docker Compose | Container management |

---

## 🔧 Development

### Running Individual Services

```bash
# Backend only
cd backend && python manage.py runserver

# Frontend only  
cd frontend && npm run dev

# View SAM logs
docker logs -f inbox-sam
```

### Useful Commands

```bash
# Restart just SAM (after config changes)
docker compose restart sam

# View all container logs
docker compose logs -f

# Reset database (caution: deletes all data)
docker compose down -v
docker compose up --build
```

---

## 🐛 Troubleshooting

### SAM not processing emails?
Check for broker queue limits in Solace Manager (http://localhost:8080):
```
Queues > Look for queues starting with "#P2P"
If count is ~100, delete old queues and restart SAM
```

### Database connection errors?
```bash
docker compose down
docker compose up -d postgres
# Wait for healthy status, then:
docker compose up
```

### LLM not responding?
Verify AWS credentials and ensure Claude 3.5 Haiku is enabled in your Bedrock region.

---

## 📄 License

MIT License

---

