# KAS-FLASH Architecture Diagrams

## System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer - Browser"
        UI[User Interface<br/>React Components]
        WS_CLIENT[WebSocket Client]
        KASWARE[Kasware Wallet<br/>Extension]
    end
    
    subgraph "Frontend - Next.js 14"
        PAGES[Pages & Routes]
        COMPONENTS[UI Components]
        STORE[State Management<br/>Zustand]
        HOOKS[Custom Hooks]
        API_CLIENT[API Client]
    end
    
    subgraph "Backend - Express + TypeScript"
        REST_API[REST API<br/>Endpoints]
        WS_SERVER[WebSocket<br/>Server]
        SESSION_MGR[Session<br/>Manager]
        PAYMENT_MGR[Payment<br/>Scheduler]
        KASPA_CLIENT[Kaspa RPC<br/>Client]
    end
    
    subgraph "Data Layer"
        SESSIONS[In-Memory<br/>Sessions Map]
        TRANSACTIONS[Transaction<br/>History]
        STATS[Merchant<br/>Stats Cache]
    end
    
    subgraph "Blockchain Layer"
        KASPA_NET[Kaspa Network<br/>BlockDAG]
        EXPLORER[Kaspa Explorer<br/>kaspa.org]
    end
    
    UI --> PAGES
    PAGES --> COMPONENTS
    COMPONENTS --> STORE
    COMPONENTS --> HOOKS
    HOOKS --> WS_CLIENT
    HOOKS --> API_CLIENT
    
    API_CLIENT --> REST_API
    WS_CLIENT <--> WS_SERVER
    
    REST_API --> SESSION_MGR
    REST_API --> PAYMENT_MGR
    WS_SERVER --> SESSION_MGR
    
    SESSION_MGR --> SESSIONS
    PAYMENT_MGR --> TRANSACTIONS
    PAYMENT_MGR --> STATS
    
    KASWARE --> KASPA_NET
    KASPA_CLIENT --> KASPA_NET
    KASPA_NET --> EXPLORER
    
    style UI fill:#e1f5ff
    style KASWARE fill:#ffe1e1
    style REST_API fill:#fff4e1
    style KASPA_NET fill:#f0e1ff
```

## Component Architecture

```mermaid
graph LR
    subgraph "Frontend Components"
        WC[WalletConnect]
        MS[MoviesSection]
        AS[APISection]
        CS[CloudSection]
        MD[MerchantDashboard]
        TL[TransactionList]
    end
    
    subgraph "Shared State"
        WS[WalletStore]
        SS[StreamingStore]
        MStats[MerchantStats]
    end
    
    subgraph "Hooks"
        useWS[useWebSocket]
        useAPI[useAPI]
    end
    
    subgraph "Services"
        API[API Client]
        KW[Kasware Wallet]
    end
    
    WC --> WS
    WC --> KW
    
    MS --> SS
    AS --> SS
    CS --> SS
    
    MD --> MStats
    MD --> API
    
    TL --> SS
    
    MS --> useWS
    AS --> useWS
    CS --> useWS
    MD --> useWS
    
    useWS --> API
    useWS --> KW
    
    style WC fill:#e1f5ff
    style WS fill:#e1ffe1
    style useWS fill:#fff4e1
    style KW fill:#ffe1e1
```

## Data Flow Architecture

```mermaid
flowchart TD
    subgraph "User Interaction"
        A[User Action]
    end
    
    subgraph "Frontend Processing"
        B[Component Handler]
        C[State Update]
        D[API Call]
    end
    
    subgraph "Network Layer"
        E[HTTP Request]
        F[WebSocket Message]
    end
    
    subgraph "Backend Processing"
        G[Route Handler]
        H[Business Logic]
        I[Data Update]
    end
    
    subgraph "External Services"
        J[Kaspa Network]
        K[Kasware Wallet]
    end
    
    subgraph "Response Flow"
        L[Backend Response]
        M[State Update]
        N[UI Update]
    end
    
    A --> B
    B --> C
    B --> D
    D --> E
    D --> F
    E --> G
    F --> G
    G --> H
    H --> I
    H --> J
    B --> K
    K --> J
    I --> L
    J --> L
    L --> M
    M --> N
    N --> A
    
    style A fill:#e1f5ff
    style J fill:#f0e1ff
    style K fill:#ffe1e1
    style N fill:#e1ffe1
```

## Payment Processing Architecture

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant Frontend
    participant Kasware
    participant Backend
    participant WebSocket
    participant Kaspa
    
    User->>Frontend: Start Service
    Frontend->>Backend: Create Session
    Backend->>Backend: Initialize Payment Timer
    Backend->>WebSocket: Broadcast Session Created
    WebSocket->>Frontend: Session Active
    
    loop Every 30 seconds
        Backend->>Backend: Calculate Payment
        Backend->>WebSocket: Payment Request
        WebSocket->>Frontend: Transaction Broadcast
        Frontend->>Kasware: sendKaspa()
        Kasware->>User: Show Approval
        User->>Kasware: Approve
        Kasware->>Kaspa: Broadcast TX
        Kaspa->>Kasware: TX Hash
        Kasware->>Frontend: TX Hash
        Frontend->>Backend: Submit Hash
        Backend->>Backend: Update Transaction
        Backend->>WebSocket: TX Confirmed
        WebSocket->>Frontend: Update UI
    end
```

## Session Management Architecture

```mermaid
classDiagram
    class StreamingSession {
        +string id
        +string viewerAddress
        +string merchantAddress
        +number ratePerSecond
        +string status
        +Date startTime
        +Date endTime
        +number totalPaid
        +string serviceType
        +string serviceName
        +number paymentInterval
        +number maxTransactions
        +boolean payAtEnd
    }
    
    class Transaction {
        +string id
        +string sessionId
        +string from
        +string to
        +number amount
        +string status
        +string txHash
        +Date timestamp
    }
    
    class SessionManager {
        -Map sessions
        +createSession()
        +pauseSession()
        +resumeSession()
        +endSession()
        +getSession()
        +getActiveSessions()
    }
    
    class PaymentScheduler {
        -Map timers
        +schedulePayment()
        +cancelPayment()
        +processPayment()
    }
    
    class WebSocketServer {
        -Set clients
        +broadcast()
        +broadcastTransaction()
        +broadcastSession()
    }
    
    SessionManager "1" --> "*" StreamingSession
    StreamingSession "1" --> "*" Transaction
    SessionManager --> PaymentScheduler
    SessionManager --> WebSocketServer
    PaymentScheduler --> WebSocketServer
```

## State Management Architecture

```mermaid
graph TD
    subgraph "Zustand Stores"
        WalletStore[Wallet Store<br/>- connected<br/>- address<br/>- balance<br/>- role]
        StreamingStore[Streaming Store<br/>- session<br/>- transactions<br/>- isStreaming]
        MerchantStore[Merchant Stats Store<br/>- totalEarned<br/>- activeStreams<br/>- revenuePerSecond]
    end
    
    subgraph "Actions"
        WA[Wallet Actions<br/>- connect()<br/>- disconnect()<br/>- updateBalance()]
        SA[Streaming Actions<br/>- setSession()<br/>- addTransaction()<br/>- updateSession()]
        MA[Merchant Actions<br/>- updateStats()]
    end
    
    subgraph "Components"
        WC[WalletConnect]
        Player[StreamingPlayer]
        Dashboard[MerchantDashboard]
    end
    
    WalletStore --> WA
    StreamingStore --> SA
    MerchantStore --> MA
    
    WA --> WC
    SA --> Player
    MA --> Dashboard
    
    WC --> WalletStore
    Player --> StreamingStore
    Dashboard --> MerchantStore
    
    style WalletStore fill:#e1f5ff
    style StreamingStore fill:#e1ffe1
    style MerchantStore fill:#fff4e1
```

## API Architecture

```mermaid
graph LR
    subgraph "REST Endpoints"
        E1[POST /api/sessions/create]
        E2[POST /api/sessions/:id/pause]
        E3[POST /api/sessions/:id/resume]
        E4[POST /api/sessions/:id/end]
        E5[GET /api/sessions/:id]
        E6[GET /api/merchant/stats]
        E7[POST /api/transactions/:id/hash]
        E8[POST /api/transactions/:id/failed]
        E9[GET /health]
    end
    
    subgraph "Services"
        SS[StreamingService]
        KS[KaspaClient]
    end
    
    subgraph "WebSocket Events"
        WE1[session_created]
        WE2[session_updated]
        WE3[transaction_broadcast]
        WE4[transaction_confirmed]
        WE5[balance_updated]
    end
    
    E1 --> SS
    E2 --> SS
    E3 --> SS
    E4 --> SS
    E5 --> SS
    E6 --> SS
    E7 --> SS
    E8 --> SS
    
    SS --> KS
    SS --> WE1
    SS --> WE2
    SS --> WE3
    SS --> WE4
    SS --> WE5
    
    style E1 fill:#e1ffe1
    style SS fill:#fff4e1
    style WE3 fill:#ffe1e1
```

## Security Architecture

```mermaid
graph TB
    subgraph "Client Security"
        CS1[Non-Custodial Wallet]
        CS2[Client-Side Signing]
        CS3[HTTPS/WSS Only]
    end
    
    subgraph "Backend Security"
        BS1[Input Validation]
        BS2[Session Verification]
        BS3[CORS Protection]
        BS4[Rate Limiting]
    end
    
    subgraph "Blockchain Security"
        BCS1[On-Chain Verification]
        BCS2[Transaction Finality]
        BCS3[Immutable Records]
    end
    
    subgraph "Data Security"
        DS1[No Private Keys Stored]
        DS2[Encrypted WebSocket]
        DS3[Minimum TX Amounts]
    end
    
    CS1 --> BS1
    CS2 --> BS2
    CS3 --> BS3
    
    BS1 --> BCS1
    BS2 --> BCS2
    BS4 --> BCS3
    
    BCS1 --> DS1
    BCS2 --> DS2
    BCS3 --> DS3
    
    style CS2 fill:#e1ffe1
    style BS2 fill:#fff4e1
    style BCS1 fill:#f0e1ff
    style DS1 fill:#ffe1e1
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Development"
        DEV_FE[Frontend<br/>localhost:3000]
        DEV_BE[Backend<br/>localhost:3001]
        DEV_WS[WebSocket<br/>ws://localhost:3001]
    end
    
    subgraph "Production - Render"
        PROD_FE[Frontend<br/>kasflash.onrender.com]
        PROD_BE[Backend<br/>kas-flash-backend.onrender.com]
        PROD_WS[WebSocket<br/>wss://kas-flash-backend.onrender.com]
    end
    
    subgraph "Blockchain"
        TESTNET[Kaspa Testnet]
        MAINNET[Kaspa Mainnet]
    end
    
    subgraph "External Services"
        KASWARE[Kasware Wallet]
        EXPLORER[Kaspa Explorer]
    end
    
    DEV_FE --> DEV_BE
    DEV_FE --> DEV_WS
    DEV_BE --> TESTNET
    
    PROD_FE --> PROD_BE
    PROD_FE --> PROD_WS
    PROD_BE --> TESTNET
    PROD_BE -.-> MAINNET
    
    DEV_FE --> KASWARE
    PROD_FE --> KASWARE
    KASWARE --> TESTNET
    KASWARE --> MAINNET
    
    TESTNET --> EXPLORER
    MAINNET --> EXPLORER
    
    style DEV_FE fill:#e1f5ff
    style PROD_FE fill:#e1ffe1
    style TESTNET fill:#f0e1ff
    style KASWARE fill:#ffe1e1
```

## Technology Stack

```mermaid
mindmap
  root((KAS-FLASH))
    Frontend
      Next.js 14
      React 18
      TypeScript
      TailwindCSS
      Zustand
      Recharts
    Backend
      Node.js
      Express
      TypeScript
      WebSocket ws
      dotenv
    Blockchain
      Kaspa Network
      Kasware Wallet
      BlockDAG
    DevOps
      Render
      Docker
      GitHub
      npm
    Tools
      VS Code
      Git
      Chrome DevTools
```

## File Structure

```
KAS-FLASH/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx          # Root layout
│   │   │   ├── page.tsx            # Main page
│   │   │   └── globals.css         # Global styles
│   │   ├── components/
│   │   │   ├── WalletConnect.tsx   # Wallet connection
│   │   │   ├── MoviesSection.tsx   # Video streaming
│   │   │   ├── APISection.tsx      # API services
│   │   │   ├── CloudSection.tsx    # Cloud services
│   │   │   ├── MerchantDashboard.tsx # Merchant stats
│   │   │   └── TransactionList.tsx # TX history
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts     # WebSocket hook
│   │   ├── lib/
│   │   │   ├── api.ts              # API client
│   │   │   ├── kasware.ts          # Kasware integration
│   │   │   └── utils.ts            # Utilities
│   │   ├── store/
│   │   │   └── index.ts            # Zustand stores
│   │   └── data/
│   │       └── services.ts         # Service definitions
│   ├── public/                     # Static assets
│   ├── package.json
│   └── next.config.js
│
├── backend/
│   ├── src/
│   │   ├── index.ts                # Main server
│   │   ├── services/
│   │   │   ├── KaspaClient.ts      # Blockchain client
│   │   │   └── StreamingService.ts # Session manager
│   │   └── websocket/
│   │       └── server.ts           # WebSocket server
│   ├── package.json
│   └── tsconfig.json
│
├── shared/
│   ├── src/
│   │   ├── types.ts                # Shared types
│   │   └── constants.ts            # Constants
│   ├── package.json
│   └── tsconfig.json
│
├── docs/
│   ├── PROJECT_DESCRIPTION.md      # Project overview
│   ├── FLOWCHARTS.md               # System flowcharts
│   ├── ARCHITECTURE_DIAGRAMS.md    # This file
│   ├── DEPLOYMENT.md               # Deployment guide
│   ├── TROUBLESHOOTING.md          # Debug guide
│   └── KASWARE_TRANSACTION_GUIDE.md # TX guide
│
├── docker-compose.yml              # Docker config
├── render.yaml                     # Render config
└── package.json                    # Root package
```

---

## How to Use These Diagrams

### For Developers
- Understand system architecture before coding
- Reference during feature development
- Use for code reviews and discussions

### For Documentation
- Include in technical documentation
- Use in presentations and demos
- Share with team members

### For Debugging
- Trace data flow during issues
- Understand component interactions
- Identify bottlenecks

### For Planning
- Plan new features
- Identify refactoring opportunities
- Design system improvements

---

**These architecture diagrams provide a comprehensive visual guide to the KAS-FLASH system structure and design.**
