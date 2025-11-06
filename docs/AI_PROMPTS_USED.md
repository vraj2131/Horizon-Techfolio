# Core AI Prompts Used in Horizon Trading Project Development

This document lists the key prompts used throughout the project development to demonstrate AI-assisted development for the project presentation.

## 1. Project Planning & Architecture

### Initial Setup
- **"so according to the plan, where are we?@horizontrader-implementation-46ac1fef.plan.md"**
  - Purpose: Check project status against the execution plan

- **"I think we should go for full migration, starting with Backend for now and gradually we can do frontend. So first we should focus on the backend"**
  - Purpose: Decision to migrate to Express.js starting with backend

- **"Implement the plan as specified. To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one."**
  - Purpose: Systematic implementation following the execution plan

## 2. Backend Migration & Express.js Setup

- **"1.a, 2.a, 3.b (We will do next js/reactjs for frontend later) 4. a)"**
  - Purpose: Specify implementation choices for Express.js migration

- **"Implement the plan as specified. To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one."**
  - Purpose: Implement Express.js migration with production-ready setup

- **"the concept of wallet is that as soon as a user makes his account the wallet is made with baance $10000 by default so based on these $ the trading can happen and are you storing the transactions in the database?"**
  - Purpose: Clarify wallet system requirements - default balance and transaction persistence

- **"but before we proceed, what are you considering as the current buying price of the stock we a user actually tries buying the stock?"**
  - Purpose: Understand price source for trading operations

## 3. Database & Data Management

- **"but are you updating the database by populating with new daily data by using alphabantage new api?"**
  - Purpose: Ensure daily data updates from Alpha Vantage API

- **"lets install cron job"**
  - Purpose: Set up automated daily price updates

- **"you ran the cron job but where is it actually in the database?"**
  - Purpose: Verify data persistence in MongoDB

- **"what i am asking is the cron job get the new data but where is that data in the database?"**
  - Purpose: Confirm data storage location and structure

- **"can you add logs in between so that i can if the update prices is actually running or not"**
  - Purpose: Add logging for debugging daily update process

- **"where are we currently in the complete implementatin of backend of this project? this is just a question so dont make a md file based on it just go through the project and tell me"**
  - Purpose: Get status update on backend implementation progress

## 4. Frontend Development

- **"now based on our currenct implementation lets make Next js frontend for our backend"**
  - Purpose: Start Next.js frontend development

- **"also add that it should not be the generic website which AI generates, make it mordern, custom themed not generic website so that it doesnt look like every other frontend made with AI"**
  - Purpose: Create unique, custom-designed frontend (not generic AI-generated look)

- **"1. b like outside 2. a and then b 3.a"**
  - Purpose: Specify frontend structure and organization preferences

- **"Can we do something to move the frontend in ths horizon trading folder so we can access both in the same place?"**
  - Purpose: Organize project structure

## 5. Feature Development

- **"can you add logs in between so that i can if the update prices is actually running or not"**
  - Purpose: Debug and verify daily update functionality

- **"I want a separate dedicated page for explaining the technical indicators that we are using in our platform. Just that the users could understand what are they and how they help in indicating the signal. Dont make it in a genric AI generated way, it should be interacitve and easy to understand which is one of our USP."**
  - Purpose: Create educational, interactive technical indicators page

- **"Dont make cards like this make one component per indicator and have left and right arrows to go through different indicators"**
  - Purpose: Redesign indicators page with carousel navigation

## 6. Testing & Debugging

- **"No before pushing it I need to test it, my username is and179 and password is and179 for the user login"**
  - Purpose: Test authentication before deployment

- **"So should I test the current frontend implementation?"**
  - Purpose: Request testing guidance

- **"there is some issue with layout/styling"**
  - Purpose: Fix styling issues

- **"are there any server of frontend or backend running in any terminal?"**
  - Purpose: Check running processes

## 7. Technical Understanding & Clarification

- **"how are you doing the calculations they are not static right? I hope you are using the historical data of the stock for these technical indicators"**
  - Purpose: Verify technical indicators use real historical data

- **"can you explain how are you doing sma ema using the historical data?"**
  - Purpose: Understand SMA/EMA calculation methodology

- **"what can we infer with these results and how is our platform using these results?"**
  - Purpose: Understand indicator interpretation and signal generation

## 8. System Operations

- **"close both server terminal of backend and frontend and restart"**
  - Purpose: Restart both servers

- **"i think this happened because i connected to a different wifi but now i have whitlisted the ip address"**
  - Purpose: Explain MongoDB connection issue and resolution

## 9. Documentation & Presentation

- **"I am going to make a ppt regarding this project, as AI was encouraged to use I have to make a slide regarding the prompts that I have used while makin this project. Can you access "project execution plan for Horizontrader" ? SO use that chat and this one chat and make a list of core prompts that I used for Building projects so i can mention them in my ppt."**
  - Purpose: Create list of prompts for presentation

---

## Prompt Categories Summary

### Planning & Architecture (5 prompts)
- Project status checks
- Migration decisions
- Implementation planning

### Backend Development (6 prompts)
- Express.js migration
- Wallet system design
- Trading logic clarification
- Database integration

### Frontend Development (4 prompts)
- Next.js setup
- Custom design requirements
- Project organization
- UI/UX improvements

### Feature Development (3 prompts)
- Daily updates
- Technical indicators education
- Interactive components

### Testing & Debugging (4 prompts)
- Authentication testing
- Styling fixes
- Process management
- Error resolution

### Technical Understanding (3 prompts)
- Calculation methodology
- Data source verification
- Signal interpretation

### System Operations (2 prompts)
- Server management
- Database connectivity

### Documentation (1 prompt)
- Presentation preparation

**Total: 28 Core Prompts**

---

## Key Insights

1. **Iterative Development**: Prompts show progression from planning → backend → frontend → features
2. **Problem-Solving Focus**: Many prompts address specific issues (styling, database, authentication)
3. **Educational Emphasis**: Dedicated prompts for creating educational content about technical indicators
4. **Quality Requirements**: Explicit requests for non-generic, custom designs
5. **Understanding & Verification**: Multiple prompts asking for explanations of how systems work

