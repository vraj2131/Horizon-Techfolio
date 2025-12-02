# ER Diagram Creation Guide

## How to Create the Visual ER Diagram

### Option 1: Using draw.io (Recommended)

1. Go to [https://app.diagrams.net/](https://app.diagrams.net/) (formerly draw.io)
2. Create a new diagram
3. Use the following steps:

#### Step 1: Add Entities (Rectangles)

Create 7 entity boxes with the following names:
- User
- Wallet
- Portfolio
- Transaction
- PriceData
- BacktestSession
- PaperTradingSession

#### Step 2: Add Attributes

For each entity, add the attributes listed below:

**User:**
- userId (PK) - underline to indicate primary key
- name
- email
- passwordHash
- createdAt

**Wallet:**
- _id (PK)
- userId (FK) - italicize to indicate foreign key
- balance
- currency
- reservedFunds
- totalDeposited
- totalInvested
- totalProfitLoss
- totalTrades
- winningTrades
- losingTrades
- status
- lastTransactionAt
- createdAt
- updatedAt

**Portfolio:**
- portfolioId (PK)
- userId (FK)
- name
- horizon
- cash
- initialCapital
- risk_budget
- securities[] (embedded array)
- positions[] (embedded array)
- createdAt
- lastUpdated

**Transaction:**
- _id (PK)
- userId (FK)
- portfolioId (FK, optional)
- type
- ticker
- quantity
- price
- subtotal
- commission
- fees
- total
- balanceBefore
- balanceAfter
- status
- executionType
- orderSource
- costBasis
- realizedProfitLoss
- notes
- createdAt
- updatedAt

**PriceData:**
- _id (PK)
- ticker (unique)
- interval
- data[] (embedded array)
- firstDate
- lastDate
- lastUpdated
- totalDataPoints

**BacktestSession:**
- sessionId (PK)
- portfolioId (FK)
- startDate
- endDate
- strategy
- status
- metrics (object)
- createdAt
- completedAt

**PaperTradingSession:**
- _id (PK)
- portfolioId (unique FK)
- status
- initialValue
- currentValue
- totalReturn
- dailyReturn
- paperTrades[] (embedded array)
- performance (object)
- startedAt
- lastUpdated

#### Step 3: Add Relationships (Lines with Cardinality)

1. **User → Wallet**: 1:1 relationship
   - Draw line from User to Wallet
   - Label: "has"
   - Add "1" near User, "1" near Wallet

2. **User → Portfolio**: 1:N relationship
   - Draw line from User to Portfolio
   - Label: "owns"
   - Add "1" near User, "N" near Portfolio

3. **User → Transaction**: 1:N relationship
   - Draw line from User to Transaction
   - Label: "performs"
   - Add "1" near User, "N" near Transaction

4. **Portfolio → Transaction**: 1:N relationship (optional)
   - Draw line from Portfolio to Transaction
   - Label: "contains" (dashed line to indicate optional)
   - Add "1" near Portfolio, "N" near Transaction

5. **Portfolio → BacktestSession**: 1:N relationship
   - Draw line from Portfolio to BacktestSession
   - Label: "has"
   - Add "1" near Portfolio, "N" near BacktestSession

6. **Portfolio → PaperTradingSession**: 1:1 relationship
   - Draw line from Portfolio to PaperTradingSession
   - Label: "has"
   - Add "1" near Portfolio, "1" near PaperTradingSession

7. **PriceData**: Standalone entity
   - No direct relationship lines
   - Add note: "Referenced by ticker (logical relationship)"

#### Step 4: Add Embedded Objects (Separate boxes or notes)

For entities with embedded objects, you can either:
- Create separate boxes connected with composition (filled diamond)
- Add as notes within the entity box

**Portfolio contains:**
- Security (embedded)
- Position (embedded)

**PriceData contains:**
- PricePoint (embedded)

**PaperTradingSession contains:**
- PaperTrade (embedded)

### Option 2: Using Lucidchart

1. Go to [https://www.lucidchart.com/](https://www.lucidchart.com/)
2. Select "Entity Relationship Diagram" template
3. Follow similar steps as draw.io
4. Use the ERD shapes library

### Option 3: Using MySQL Workbench (if you have it)

1. Create a new EER Model
2. Add tables for each entity
3. Add relationships
4. Export as image

### Option 4: Using Online ERD Tools

- [dbdiagram.io](https://dbdiagram.io/) - Simple text-based ERD
- [QuickDBD](https://www.quickdatabasediagrams.com/) - Text to diagram
- [ERDPlus](https://erdplus.com/) - Free ERD tool

## Recommended Tool: dbdiagram.io

For a quick text-based ERD, you can use dbdiagram.io with this syntax:

```dbml
Table User {
  userId string [pk]
  name string
  email string
  passwordHash string
  createdAt datetime
}

Table Wallet {
  _id ObjectId [pk]
  userId string [ref: > User.userId, unique]
  balance number
  currency string
  reservedFunds number
  totalDeposited number
  totalInvested number
  totalProfitLoss number
  totalTrades number
  winningTrades number
  losingTrades number
  status string
  lastTransactionAt datetime
  createdAt datetime
  updatedAt datetime
}

Table Portfolio {
  portfolioId string [pk]
  userId string [ref: > User.userId]
  name string
  horizon number
  cash number
  initialCapital number
  risk_budget number
  createdAt datetime
  lastUpdated datetime
}

Table Transaction {
  _id ObjectId [pk]
  userId string [ref: > User.userId]
  portfolioId string [ref: > Portfolio.portfolioId]
  type string
  ticker string
  quantity number
  price number
  subtotal number
  commission number
  fees number
  total number
  balanceBefore number
  balanceAfter number
  status string
  executionType string
  orderSource string
  costBasis number
  realizedProfitLoss number
  notes string
  createdAt datetime
  updatedAt datetime
}

Table PriceData {
  _id ObjectId [pk]
  ticker string [unique]
  interval string
  firstDate string
  lastDate string
  lastUpdated datetime
  totalDataPoints number
}

Table BacktestSession {
  sessionId string [pk]
  portfolioId string [ref: > Portfolio.portfolioId]
  startDate string
  endDate string
  strategy string
  status string
  createdAt datetime
  completedAt datetime
}

Table PaperTradingSession {
  _id ObjectId [pk]
  portfolioId string [ref: > Portfolio.portfolioId, unique]
  status string
  initialValue number
  currentValue number
  totalReturn number
  dailyReturn number
  startedAt datetime
  lastUpdated datetime
}
```

## Export Format for Report

Export your ER diagram as:
- **PNG** (high resolution, at least 300 DPI)
- **PDF** (vector format, scalable)
- **SVG** (vector format, best for documents)

Make sure the diagram is:
- Clear and readable
- All relationships labeled
- Cardinality indicators visible
- Legend included if using special symbols

## What to Include in the Report

1. The visual ER diagram
2. Brief description of each entity
3. Description of relationships
4. Data sources section (already documented in ER_DIAGRAM.md)




## How to Create the Visual ER Diagram

### Option 1: Using draw.io (Recommended)

1. Go to [https://app.diagrams.net/](https://app.diagrams.net/) (formerly draw.io)
2. Create a new diagram
3. Use the following steps:

#### Step 1: Add Entities (Rectangles)

Create 7 entity boxes with the following names:
- User
- Wallet
- Portfolio
- Transaction
- PriceData
- BacktestSession
- PaperTradingSession

#### Step 2: Add Attributes

For each entity, add the attributes listed below:

**User:**
- userId (PK) - underline to indicate primary key
- name
- email
- passwordHash
- createdAt

**Wallet:**
- _id (PK)
- userId (FK) - italicize to indicate foreign key
- balance
- currency
- reservedFunds
- totalDeposited
- totalInvested
- totalProfitLoss
- totalTrades
- winningTrades
- losingTrades
- status
- lastTransactionAt
- createdAt
- updatedAt

**Portfolio:**
- portfolioId (PK)
- userId (FK)
- name
- horizon
- cash
- initialCapital
- risk_budget
- securities[] (embedded array)
- positions[] (embedded array)
- createdAt
- lastUpdated

**Transaction:**
- _id (PK)
- userId (FK)
- portfolioId (FK, optional)
- type
- ticker
- quantity
- price
- subtotal
- commission
- fees
- total
- balanceBefore
- balanceAfter
- status
- executionType
- orderSource
- costBasis
- realizedProfitLoss
- notes
- createdAt
- updatedAt

**PriceData:**
- _id (PK)
- ticker (unique)
- interval
- data[] (embedded array)
- firstDate
- lastDate
- lastUpdated
- totalDataPoints

**BacktestSession:**
- sessionId (PK)
- portfolioId (FK)
- startDate
- endDate
- strategy
- status
- metrics (object)
- createdAt
- completedAt

**PaperTradingSession:**
- _id (PK)
- portfolioId (unique FK)
- status
- initialValue
- currentValue
- totalReturn
- dailyReturn
- paperTrades[] (embedded array)
- performance (object)
- startedAt
- lastUpdated

#### Step 3: Add Relationships (Lines with Cardinality)

1. **User → Wallet**: 1:1 relationship
   - Draw line from User to Wallet
   - Label: "has"
   - Add "1" near User, "1" near Wallet

2. **User → Portfolio**: 1:N relationship
   - Draw line from User to Portfolio
   - Label: "owns"
   - Add "1" near User, "N" near Portfolio

3. **User → Transaction**: 1:N relationship
   - Draw line from User to Transaction
   - Label: "performs"
   - Add "1" near User, "N" near Transaction

4. **Portfolio → Transaction**: 1:N relationship (optional)
   - Draw line from Portfolio to Transaction
   - Label: "contains" (dashed line to indicate optional)
   - Add "1" near Portfolio, "N" near Transaction

5. **Portfolio → BacktestSession**: 1:N relationship
   - Draw line from Portfolio to BacktestSession
   - Label: "has"
   - Add "1" near Portfolio, "N" near BacktestSession

6. **Portfolio → PaperTradingSession**: 1:1 relationship
   - Draw line from Portfolio to PaperTradingSession
   - Label: "has"
   - Add "1" near Portfolio, "1" near PaperTradingSession

7. **PriceData**: Standalone entity
   - No direct relationship lines
   - Add note: "Referenced by ticker (logical relationship)"

#### Step 4: Add Embedded Objects (Separate boxes or notes)

For entities with embedded objects, you can either:
- Create separate boxes connected with composition (filled diamond)
- Add as notes within the entity box

**Portfolio contains:**
- Security (embedded)
- Position (embedded)

**PriceData contains:**
- PricePoint (embedded)

**PaperTradingSession contains:**
- PaperTrade (embedded)

### Option 2: Using Lucidchart

1. Go to [https://www.lucidchart.com/](https://www.lucidchart.com/)
2. Select "Entity Relationship Diagram" template
3. Follow similar steps as draw.io
4. Use the ERD shapes library

### Option 3: Using MySQL Workbench (if you have it)

1. Create a new EER Model
2. Add tables for each entity
3. Add relationships
4. Export as image

### Option 4: Using Online ERD Tools

- [dbdiagram.io](https://dbdiagram.io/) - Simple text-based ERD
- [QuickDBD](https://www.quickdatabasediagrams.com/) - Text to diagram
- [ERDPlus](https://erdplus.com/) - Free ERD tool

## Recommended Tool: dbdiagram.io

For a quick text-based ERD, you can use dbdiagram.io with this syntax:

```dbml
Table User {
  userId string [pk]
  name string
  email string
  passwordHash string
  createdAt datetime
}

Table Wallet {
  _id ObjectId [pk]
  userId string [ref: > User.userId, unique]
  balance number
  currency string
  reservedFunds number
  totalDeposited number
  totalInvested number
  totalProfitLoss number
  totalTrades number
  winningTrades number
  losingTrades number
  status string
  lastTransactionAt datetime
  createdAt datetime
  updatedAt datetime
}

Table Portfolio {
  portfolioId string [pk]
  userId string [ref: > User.userId]
  name string
  horizon number
  cash number
  initialCapital number
  risk_budget number
  createdAt datetime
  lastUpdated datetime
}

Table Transaction {
  _id ObjectId [pk]
  userId string [ref: > User.userId]
  portfolioId string [ref: > Portfolio.portfolioId]
  type string
  ticker string
  quantity number
  price number
  subtotal number
  commission number
  fees number
  total number
  balanceBefore number
  balanceAfter number
  status string
  executionType string
  orderSource string
  costBasis number
  realizedProfitLoss number
  notes string
  createdAt datetime
  updatedAt datetime
}

Table PriceData {
  _id ObjectId [pk]
  ticker string [unique]
  interval string
  firstDate string
  lastDate string
  lastUpdated datetime
  totalDataPoints number
}

Table BacktestSession {
  sessionId string [pk]
  portfolioId string [ref: > Portfolio.portfolioId]
  startDate string
  endDate string
  strategy string
  status string
  createdAt datetime
  completedAt datetime
}

Table PaperTradingSession {
  _id ObjectId [pk]
  portfolioId string [ref: > Portfolio.portfolioId, unique]
  status string
  initialValue number
  currentValue number
  totalReturn number
  dailyReturn number
  startedAt datetime
  lastUpdated datetime
}
```

## Export Format for Report

Export your ER diagram as:
- **PNG** (high resolution, at least 300 DPI)
- **PDF** (vector format, scalable)
- **SVG** (vector format, best for documents)

Make sure the diagram is:
- Clear and readable
- All relationships labeled
- Cardinality indicators visible
- Legend included if using special symbols

## What to Include in the Report

1. The visual ER diagram
2. Brief description of each entity
3. Description of relationships
4. Data sources section (already documented in ER_DIAGRAM.md)


