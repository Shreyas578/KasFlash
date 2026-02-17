# KAS-FLASH System Flowcharts

## 1. Overall System Architecture

```mermaid
graph TB
    subgraph "User Layer"
        U[User Browser]
        K[Kasware Wallet]
    end
    
    subgraph "Frontend Layer"
        F[Next.js Frontend<br/>Port 3000]
        WC[Wallet Connect]
        UI[Service UI]
        WS1[WebSocket Client]
    end
    
    subgraph "Backend Layer"
        B[Express Backend<br/>Port 3001]
        SM[Session Manager]
        PM[Payment Manager]
        WS2[WebSocket Server]
    end
    
    subgraph "Blockchain Layer"
        KN[Kaspa Network<br/>1-sec blocks]
        EX[Kaspa Explorer]
    end
    
    U --> F
    U --> K
    F --> WC
    F --> UI
    F --> WS1
    WS1 <--> WS2
    UI --> B
    B --> SM
    B --> PM
    B --> WS2
    K --> KN
    PM --> KN
    KN --> EX
    
    style U fill:#e1f5ff
    style K fill:#ffe1e1
    style F fill:#e1ffe1
    style B fill:#fff4e1
    style KN fill:#f0e1ff
```

## 2. User Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant K as Kasware
    participant B as Backend
    participant KN as Kaspa Network
    
    U->>F: Click "Connect Wallet"
    F->>K: Check if installed
    alt Kasware Not Installed
        K-->>F: Not found
        F-->>U: Show install prompt
    else Kasware Installed
        K-->>F: Found
        F->>K: requestAccounts()
        K->>U: Show approval popup
        U->>K: Approve connection
        K-->>F: Return address
        F->>K: getBalance()
        K->>KN: Query balance
        KN-->>K: Return balance
        K-->>F: Return balance
        F->>F: Detect role<br/>(merchant/viewer)
        F-->>U: Show connected state
    end
```

## 3. Pay-Per-Interval Transaction Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant K as Kasware
    participant B as Backend
    participant WS as WebSocket
    participant KN as Kaspa Network
    
    U->>F: Select service & click "Start"
    F->>B: POST /api/sessions/create
    B->>B: Create session
    B->>WS: Broadcast session_created
    WS-->>F: Session created
    F-->>U: Show "Service Active"
    
    loop Every 30 seconds
        B->>B: Calculate payment amount
        B->>WS: Broadcast transaction_broadcast
        WS-->>F: Payment request
        F->>K: sendKaspa(merchant, amount)
        K->>U: Show transaction popup
        U->>K: Approve transaction
        K->>KN: Broadcast transaction
        KN-->>K: Return txHash
        K-->>F: Return txHash
        F->>B: POST /api/transactions/:id/hash
        B->>B: Update transaction
        B->>WS: Broadcast transaction_confirmed
        WS-->>F: Transaction confirmed
        F->>K: getBalance()
        K-->>F: New balance
        F-->>U: Update balance display
    end
    
    U->>F: Click "Stop"
    F->>B: POST /api/sessions/:id/end
    B->>B: End session
    B->>WS: Broadcast session_ended
    WS-->>F: Session ended
    F-->>U: Show "Service Stopped"

sequenceDiagram
    participant U as User
    participant F as Frontend
    participant K as Kasware
    participant B as Backend
    participant WS as WebSocket
    participant KN as Kaspa Network
    
    U->>F: Select "Pay at End" mode
    U->>F: Click "Start"
    F->>B: POST /api/sessions/create<br/>(payAtEnd: true)
    B->>B: Create session<br/>(no recurring payments)
    B->>WS: Broadcast session_created
    WS-->>F: Session created
    F-->>U: Show "Service Active"
    
    Note over U,F: User watches/uses service<br/>No payments during usage
    
    U->>F: Click "Stop" or video ends
    F->>B: POST /api/sessions/:id/end
    B->>B: Calculate total cost<br/>(duration × rate)
    B->>B: Create single transaction
    B->>WS: Broadcast transaction_broadcast
    WS-->>F: Payment request (full amount)
    F->>K: sendKaspa(merchant, totalAmount)
    K->>U: Show transaction popup
    U->>K: Approve transaction
    K->>KN: Broadcast transaction
    KN-->>K: Return txHash
    K-->>F: Return txHash
    F->>B: POST /api/transactions/:id/hash
    B->>B: Update transaction & end session
    B->>WS: Broadcast session_ended
    WS-->>F: Session ended
    F->>K: getBalance()
    K-->>F: New balance
    F-->>U: Show "Payment Complete"

graph TD
    Start([User Opens App]) --> Connect{Wallet<br/>Connected?}
    Connect -->|No| ShowConnect[Show Connect Button]
    ShowConnect --> ClickConnect[User Clicks Connect]
    ClickConnect --> Kasware[Kasware Popup]
    Kasware --> Approve{User<br/>Approves?}
    Approve -->|No| ShowConnect
    Approve -->|Yes| Connected[Wallet Connected]
    Connect -->|Yes| Connected
    
    Connected --> Role{Detect<br/>Role}
    Role -->|Merchant| MerchantDash[Show Merchant Dashboard]
    Role -->|Viewer| ViewerUI[Show Service Selection]
    
    ViewerUI --> SelectType{Select<br/>Service Type}
    SelectType -->|Movies| MovieConfig[Configure Movie Payment]
    SelectType -->|API| APIConfig[Configure API Requests]
    SelectType -->|Cloud| CloudConfig[Configure Cloud Time]
    
    MovieConfig --> PayMode{Payment<br/>Mode?}
    PayMode -->|Per Interval| SetInterval[Select Interval:<br/>Second/Minute/Hour]
    PayMode -->|Pay at End| PayEnd[Pay when done]
    
    APIConfig --> EnterQty[Enter Quantity<br/>Min: 1 request]
    CloudConfig --> EnterTime[Enter Duration<br/>Min: 1 minute]
    
    SetInterval --> CheckMin{Total Cost<br/>≥ 0.1 KAS?}
    PayEnd --> CheckMin
    EnterQty --> CheckMin
    EnterTime --> CheckMin
    
    CheckMin -->|No| ShowWarning[Show Warning:<br/>Increase amount]
    ShowWarning --> SelectType
    CheckMin -->|Yes| EnableStart[Enable Start Button]
    
    EnableStart --> ClickStart[User Clicks Start]
    ClickStart --> CreateSession[Create Session]
    CreateSession --> StartPayments[Begin Payment Flow]
    
    style Start fill:#e1f5ff
    style Connected fill:#e1ffe1
    style MerchantDash fill:#ffe1e1
    style StartPayments fill:#f0e1ff

graph LR
    subgraph "Data Sources"
        S1[Active Sessions]
        S2[Transaction History]
        S3[Payment Events]
    end
    
    subgraph "Backend Processing"
        SM[Session Manager]
        TM[Transaction Manager]
        SC[Stats Calculator]
    end
    
    subgraph "Real-time Updates"
        WS[WebSocket Server]
        Poll[Polling API<br/>Every 2 seconds]
    end
    
    subgraph "Frontend Display"
        TE[Total Earned]
        AS[Active Streams]
        RS[Revenue/Second]
        TT[Total Transactions]
        G1[Earnings Graph]
        G2[Revenue Rate Graph]
    end
    
    S1 --> SM
    S2 --> TM
    S3 --> SC
    
    SM --> SC
    TM --> SC
    
    SC --> WS
    SC --> Poll
    
    WS --> TE
    WS --> AS
    WS --> RS
    WS --> TT
    
    Poll --> TE
    Poll --> AS
    Poll --> RS
    Poll --> TT
    
    TE --> G1
    RS --> G2
    
    style WS fill:#ffe1e1
    style Poll fill:#fff4e1
    style G1 fill:#e1ffe1
    style G2 fill:#e1ffe1
```

## 7. Error Handling Flow

```mermaid
graph TD
    Start[Transaction Initiated] --> Execute[Execute Payment]
    Execute --> Check{Transaction<br/>Success?}
    
    Check -->|Success| GetHash[Get TxHash]
    GetHash --> SendHash[Send Hash to Backend]
    SendHash --> UpdateUI[Update UI]
    UpdateUI --> End([Complete])
    
    Check -->|Error| ErrorType{Error<br/>Type?}
    
    ErrorType -->|Storage Mass| StorageMass[Show: Increase amount<br/>to ≥ 0.1 KAS]
    ErrorType -->|Insufficient Balance| InsufficientBal[Show: Add more KAS<br/>to wallet]
    ErrorType -->|User Rejected| UserReject[Show: Transaction<br/>cancelled by user]
    ErrorType -->|Network Error| NetworkErr[Show: Network issue<br/>Try again]
    ErrorType -->|Other| GenericErr[Show: Transaction failed<br/>Check console]
    
    StorageMass --> Report[Report Error to Backend]
    InsufficientBal --> Report
    UserReject --> Report
    NetworkErr --> Report
    GenericErr --> Report
    
    Report --> EndSession{Auto-end<br/>Session?}
    EndSession -->|Yes| StopSession[Stop Session]
    EndSession -->|No| AllowRetry[Allow Retry]
    
    StopSession --> End
    AllowRetry --> Retry{User<br/>Retries?}
    Retry -->|Yes| Execute
    Retry -->|No| End
    
    style Check fill:#fff4e1
    style ErrorType fill:#ffe1e1
    style End fill:#e1ffe1
```

## 8. Session Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Idle: App Loaded
    Idle --> Connecting: Click Connect Wallet
    Connecting --> Connected: Wallet Approved
    Connecting --> Idle: Connection Failed
    
    Connected --> Configuring: Select Service
    Configuring --> Ready: Configuration Valid
    Configuring --> Configuring: Adjust Settings
    
    Ready --> Active: Click Start
    Active --> Paused: Click Pause
    Paused --> Active: Click Resume
    
    Active --> Processing: Payment Due
    Processing --> Active: Payment Success
    Processing --> Failed: Payment Error
    
    Failed --> Active: Retry Success
    Failed --> Ended: Max Retries
    
    Active --> Ending: Click Stop
    Paused --> Ending: Click Stop
    Ending --> PayAtEnd: Pay-at-End Mode
    PayAtEnd --> Ended: Final Payment
    Ending --> Ended: Per-Interval Mode
    
    Ended --> Resetting: Auto-reset (3s)
    Resetting --> Connected: Reset Complete
    
    Connected --> [*]: Disconnect Wallet
```

## 9. WebSocket Communication Flow

```mermaid
sequenceDiagram
    participant F as Frontend
    participant WS as WebSocket Server
    participant B as Backend
    participant DB as Session Store
    
    F->>WS: Connect
    WS-->>F: Connection established
    WS-->>F: Welcome message
    
    Note over F,DB: Session Creation
    F->>B: Create session
    B->>DB: Store session
    B->>WS: Broadcast session_created
    WS-->>F: Session created event
    
    Note over F,DB: Payment Cycle
    loop Every 30 seconds
        B->>DB: Check active sessions
        B->>B: Create transaction
        B->>WS: Broadcast transaction_broadcast
        WS-->>F: Payment request
        F->>F: Execute Kasware payment
        F->>B: Submit txHash
        B->>DB: Update transaction
        B->>WS: Broadcast transaction_confirmed
        WS-->>F: Transaction confirmed
    end
    
    Note over F,DB: Session End
    F->>B: End session
    B->>DB: Update session status
    B->>WS: Broadcast session_ended
    WS-->>F: Session ended event
    
    Note over F,DB: Merchant Updates
    loop Every 2 seconds
        F->>B: GET /api/merchant/stats
        B->>DB: Calculate stats
        B-->>F: Return stats
        F->>F: Update dashboard
    end
```

## 10. Data Flow Architecture

```mermaid
graph TB
    subgraph "User Actions"
        UA1[Connect Wallet]
        UA2[Select Service]
        UA3[Start Service]
        UA4[Sign Transaction]
        UA5[Stop Service]
    end
    
    subgraph "Frontend State"
        FS1[Wallet Store]
        FS2[Streaming Store]
        FS3[Merchant Stats Store]
    end
    
    subgraph "API Layer"
        API1[Session API]
        API2[Transaction API]
        API3[Stats API]
    end
    
    subgraph "Backend Services"
        BS1[Session Manager]
        BS2[Payment Scheduler]
        BS3[Stats Calculator]
    end
    
    subgraph "Data Storage"
        DS1[Active Sessions Map]
        DS2[Transaction History]
        DS3[Merchant Stats Cache]
    end
    
    subgraph "External Services"
        ES1[Kasware Wallet]
        ES2[Kaspa Network]
        ES3[WebSocket]
    end
    
    UA1 --> FS1
    UA2 --> FS2
    UA3 --> API1
    UA4 --> ES1
    UA5 --> API1
    
    FS1 --> ES1
    FS2 --> API1
    FS3 --> API3
    
    API1 --> BS1
    API2 --> BS1
    API3 --> BS3
    
    BS1 --> DS1
    BS2 --> DS2
    BS3 --> DS3
    
    BS1 --> ES3
    BS2 --> ES3
    
    ES1 --> ES2
    ES3 --> FS2
    ES3 --> FS3
    
    style UA3 fill:#e1f5ff
    style FS2 fill:#e1ffe1
    style BS2 fill:#fff4e1
    style ES2 fill:#f0e1ff
```

## 11. Transaction Validation Flow

```mermaid
graph TD
    Start[Transaction Request] --> CheckSession{Session<br/>Valid?}
    CheckSession -->|No| Reject1[Reject: Invalid Session]
    CheckSession -->|Yes| CheckBalance{User Balance<br/>≥ Amount?}
    
    CheckBalance -->|No| Reject2[Reject: Insufficient Balance]
    CheckBalance -->|Yes| CheckMin{Amount<br/>≥ 0.1 KAS?}
    
    CheckMin -->|No| Reject3[Reject: Below Minimum]
    CheckMin -->|Yes| CheckNetwork{Correct<br/>Network?}
    
    CheckNetwork -->|No| Reject4[Reject: Wrong Network]
    CheckNetwork -->|Yes| CreateTx[Create Transaction]
    
    CreateTx --> SendToKasware[Send to Kasware]
    SendToKasware --> UserApprove{User<br/>Approves?}
    
    UserApprove -->|No| Reject5[Reject: User Cancelled]
    UserApprove -->|Yes| Broadcast[Broadcast to Network]
    
    Broadcast --> Mempool[Enter Mempool]
    Mempool --> Confirm[Confirm in Block]
    Confirm --> UpdateBackend[Update Backend]
    UpdateBackend --> Success[Transaction Success]
    
    Reject1 --> End([End])
    Reject2 --> End
    Reject3 --> End
    Reject4 --> End
    Reject5 --> End
    Success --> End
    
    style CheckSession fill:#fff4e1
    style CheckBalance fill:#fff4e1
    style CheckMin fill:#fff4e1
    style Success fill:#e1ffe1
    style End fill:#e1f5ff
```

## 12. Complete User Journey Map

```mermaid
journey
    title User Journey: From Landing to Payment
    section Discovery
      Open App: 5: User
      See Services: 5: User
      Read Pricing: 4: User
    section Connection
      Click Connect: 5: User
      Kasware Popup: 3: User, Kasware
      Approve Connection: 4: User
      See Balance: 5: User, Frontend
    section Service Selection
      Browse Services: 5: User
      Select Movie/API/Cloud: 5: User
      Configure Settings: 4: User
      Check Total Cost: 5: User, Frontend
    section Payment
      Click Start: 5: User
      Kasware Popup: 3: User, Kasware
      Review Transaction: 4: User
      Approve Payment: 4: User
      Transaction Confirms: 5: User, Kaspa
    section Usage
      Watch/Use Service: 5: User
      See Balance Decrease: 4: User, Frontend
      Monitor Transactions: 4: User
    section Completion
      Stop Service: 5: User
      Final Payment (if pay-at-end): 4: User, Kasware
      See Total Spent: 5: User, Frontend
      View on Explorer: 4: User, Kaspa
```

---

## How to View These Flowcharts

### Option 1: GitHub/GitLab
These Mermaid diagrams render automatically on GitHub and GitLab.

### Option 2: VS Code
Install the "Markdown Preview Mermaid Support" extension.

### Option 3: Online Viewers
- https://mermaid.live
- https://mermaid-js.github.io/mermaid-live-editor

### Option 4: Export as Images
Use Mermaid CLI to export as PNG/SVG:
```bash
npm install -g @mermaid-js/mermaid-cli
mmdc -i FLOWCHARTS.md -o flowcharts.png
```

---

**These flowcharts provide a complete visual understanding of the KAS-FLASH system architecture and user flows.**
