# Growth Engine Requirements v1.0

## 1. Project Overview

Project name: Growth Engine

Repository name: growth-engine

Growth Engine is a shared acquisition, sales, and customer development foundation for experts who use Professional Studio products.

The initial target is independent fortune tellers using Numeria Studio.

Growth Engine is not sold as an independent standalone service. It is provided as additional Business-plan functionality inside Professional Studio products such as Numeria Studio.

Users should experience it as one service inside Numeria Studio, not as a separate application.

## 2. System Architecture

The whole system is separated into three responsibilities.

```text
Growth Engine
  acquisition, sales, customer development
    |
Professional Studio
  expert work
    |
AI Platform Core
  shared AI foundation
```

Initial structure:

```text
Growth Engine
  |
Numeria Studio
  |
AI Platform Core
```

Future structure:

```text
Growth Engine
  |
FP Studio / Coach Studio / other Professional Studio
  |
AI Platform Core
```

Growth Engine and AI Platform Core are shared. Industry-specific business logic belongs to Professional Studio.

## 3. System Responsibilities

### 3.1 Growth Engine

Growth Engine supports customer acquisition, sales, repeat usage, and referrals for Professional Studio users.

Scope:

- acquisition
- SNS marketing strategy
- SNS Planner integration
- LINE integration
- lead management
- customer management
- customer journey management
- reservation management
- product and menu management
- payment integration
- revenue management
- repeat management
- referral management
- review management
- marketing funnel analysis
- AI improvement suggestions
- AI next-action suggestions

Growth Engine does not execute expert work.

### 3.2 Professional Studio

Professional Studio owns the expert's work.

For Numeria Studio, this includes:

- customer chart
- reading session
- fortune-telling calculations
- reading content
- AI reading
- report
- PDF
- reading history
- session history

Growth Engine must not contain this domain logic.

### 3.3 AI Platform Core

AI Platform Core is the shared AI foundation used by Growth Engine and Professional Studio.

Scope:

- AI Runtime
- Responses API
- Agent
- Workflow
- Tool Calling
- prompt management
- prompt version management
- Knowledge
- RAG
- Search
- AI usage history
- token usage
- cost
- billing
- Event Engine

Growth Engine does not call AI models directly. It uses AI Platform Core.

## 4. Product Positioning

### 4.1 Users

The direct users are experts who subscribe to Professional Studio.

Initial users are fortune tellers.

Roles:

- Service operator provides Growth Engine and Numeria Studio.
- Fortune teller uses Growth Engine and Numeria Studio.
- End customer uses LINE, forms, reservations, payment pages, and delivered services.

End customers do not log in to the Growth Engine management UI.

### 4.2 Plans

Growth Engine is available only on the Business plan.

Plan structure:

| Plan | Positioning |
| --- | --- |
| Free | Basic Professional Studio features with usage or output limits |
| Pro | AI expert work, advanced Professional Studio features, templates, PDF, history |
| Business | Pro plus Growth Engine features |

Business unlocks:

- acquisition
- SNS strategy
- SNS Planner integration
- LINE
- leads
- reservations
- payments
- revenue
- repeat usage
- referrals
- marketing analysis
- AI improvement suggestions

Growth Engine should not have separate standalone billing.

## 5. UX Policy

### 5.1 One App Experience

Internally, Growth Engine and Numeria Studio are separated. Externally, users see one service.

Shared context:

- one login
- auth state
- Workspace
- plan
- user information

Example routes:

- `/app/business`
- `/app/professional`

The internal name "Growth Engine" should generally not be shown in user-facing screens.

### 5.2 Business Plan Menu

Free and Pro show Professional features only. Business adds Business-related menus.

Example menu:

- Home
- Professional
- 顧客
- 新しい鑑定
- 鑑定履歴
- テンプレート
- 出力
- Business
- 集客
- 投稿戦略
- 見込み客
- 予約
- 売上
- リピート
- 紹介
- 分析
- 設定

Avoid stiff or abstract terms such as 経営 and AI COO in user-facing screens.

Use everyday terms:

- 今日やること
- 集客
- お客様
- 予約
- 売上
- フォロー
- リピート
- 紹介
- AIからの提案

### 5.3 Seamless Context Transitions

Users must be able to move between Growth Engine and Numeria Studio while preserving customer, reservation, and session context.

Example:

1. Reservation detail
2. Start reading
3. Numeria Studio reading screen
4. Reading completed
5. Growth Engine follow-up screen

Users should not need to search for or reselect the same customer during this flow.

## 6. Core Concept

Growth Engine is not just an SNS posting tool or general CRM.

It connects customer, consultation, and usage data accumulated in Professional Studio with SNS, LINE, reservation, and revenue data. It continuously improves the marketing funnel from awareness to referral.

Target funnel:

1. Awareness
2. Interest
3. LINE or form registration
4. Lead
5. Consultation or reservation
6. Payment or conversion
7. Service delivery in Professional Studio
8. Follow-up
9. Repeat
10. Review
11. Referral

Growth Engine manages the count and conversion rate of each stage.

## 7. SNS Planner Relationship

SNS Planner remains a separate tool.

Growth Engine owns:

- customer data and consultation trend analysis
- themes that should be posted
- target customer suggestions
- post objective decisions
- campaign strategy
- analysis between post results and revenue
- requests to SNS Planner for post creation

SNS Planner owns:

- post body creation
- post draft management
- image and asset management
- post format management
- post schedule
- JSON bulk registration
- SNS-specific post adjustment
- future scheduled posting integration

Growth Engine must not reimplement SNS Planner's editing or asset management features.

### 7.1 Request Data to SNS Planner

Minimum request shape:

```json
{
  "workspaceId": "string",
  "professionalStudioId": "string",
  "campaignId": "string",
  "objective": "awareness | line_registration | consultation | reservation | repeat | referral",
  "targetAudience": {
    "ageRange": "string",
    "gender": "string",
    "concerns": ["string"]
  },
  "topic": "string",
  "contentType": "feed | reel | story | short_video | blog",
  "channel": "instagram | x | tiktok | youtube | blog",
  "callToAction": "string",
  "sourceInsights": ["string"],
  "dueDate": "datetime"
}
```

Minimum response shape:

```json
{
  "draftId": "string",
  "status": "draft | review | approved | published",
  "channel": "string",
  "publishedAt": "datetime",
  "trackingLinkId": "string"
}
```

## 8. Domain Models

All major records must include `workspaceId` unless explicitly global.

### 8.1 Workspace

Expert or business management area.

Fields:

- id
- name
- ownerUserId
- professionalStudioType
- plan
- timezone
- currency
- createdAt
- updatedAt

### 8.2 User

Expert or management member.

Fields:

- id
- workspaceId
- name
- email
- role
- status
- createdAt
- updatedAt

### 8.3 Lead

A person who is not yet a formal customer.

Fields:

- id
- workspaceId
- displayName
- sourceChannel
- sourceCampaignId
- sourceContentId
- snsAccount
- lineUserId
- email
- phone
- status
- interestTags
- concernTags
- score
- assignedUserId
- firstContactAt
- lastContactAt
- createdAt
- updatedAt

Statuses:

- new
- contacted
- line_registered
- consultation_requested
- consultation_booked
- considering
- won
- lost
- inactive

### 8.4 Customer

Customer is mastered by Growth Engine.

Professional Studio references the same Customer ID.

Fields:

- id
- workspaceId
- leadId
- customerNumber
- name
- displayName
- contactInformation
- lineUserId
- snsAccounts
- sourceChannel
- sourceCampaignId
- sourceContentId
- referredByCustomerId
- customerStatus
- firstPurchaseAt
- lastPurchaseAt
- totalRevenue
- purchaseCount
- createdAt
- updatedAt

Growth Engine owns marketing and sales information. Professional Studio owns expert work information tied to the customer.

### 8.5 Campaign

Fields:

- id
- workspaceId
- name
- objective
- targetAudience
- startAt
- endAt
- channels
- relatedProductIds
- status
- budget
- createdAt
- updatedAt

### 8.6 Content

References SNS posts and blogs. The body is edited in SNS Planner.

Fields:

- id
- workspaceId
- externalDraftId
- campaignId
- channel
- objective
- topic
- status
- publishedAt
- trackingLinkId
- createdAt
- updatedAt

### 8.7 TrackingLink

Identifies inflow from posts, profiles, campaigns, QR codes, and forms.

Fields:

- id
- workspaceId
- campaignId
- contentId
- channel
- destinationType
- destinationUrl
- code
- clickCount
- createdAt
- updatedAt

Even when SNS platforms do not expose per-person view data, inflow should be tracked through dedicated URLs, QR codes, forms, LINE registration paths, and equivalent sources.

### 8.8 Product

Services and menus sold by the expert.

Fields:

- id
- workspaceId
- professionalStudioType
- name
- description
- category
- price
- durationMinutes
- active
- professionalServiceReference
- createdAt
- updatedAt

Products can link to Numeria Studio reading menus and fortune-telling methods.

### 8.9 Reservation

Fields:

- id
- workspaceId
- leadId
- customerId
- productId
- professionalStudioType
- scheduledStartAt
- scheduledEndAt
- status
- sourceChannel
- campaignId
- contentId
- paymentStatus
- professionalSessionId
- createdAt
- updatedAt

Statuses:

- requested
- confirmed
- cancelled
- completed
- no_show

### 8.10 Payment

Fields:

- id
- workspaceId
- customerId
- reservationId
- productId
- provider
- externalPaymentId
- amount
- currency
- status
- paidAt
- refundedAt
- createdAt
- updatedAt

Payment processing uses external providers such as Stripe. Card data must not be stored in Growth Engine.

### 8.11 Revenue

Analysis record for revenue.

Fields:

- id
- workspaceId
- paymentId
- customerId
- productId
- campaignId
- contentId
- sourceChannel
- amount
- occurredAt
- revenueType
- createdAt

Analysis axes:

- daily
- monthly
- product
- customer
- source
- SNS
- campaign
- content
- new or repeat
- referral

### 8.12 Followup

Fields:

- id
- workspaceId
- leadId
- customerId
- reservationId
- professionalSessionId
- type
- scheduledAt
- status
- recommendedByAI
- messageDraft
- sentAt
- createdAt
- updatedAt

Types:

- consultation_followup
- post_session_followup
- repeat_offer
- review_request
- referral_request
- inactive_customer_reactivation

### 8.13 Referral

Fields:

- id
- workspaceId
- referrerCustomerId
- referredLeadId
- referredCustomerId
- status
- rewardType
- rewardValue
- convertedAt
- createdAt
- updatedAt

### 8.14 MarketingInsight

AI or analysis-generated suggestion.

Fields:

- id
- workspaceId
- insightType
- title
- summary
- evidence
- recommendedActions
- priority
- confidence
- status
- generatedAt
- dismissedAt
- completedAt

Types:

- funnel_bottleneck
- content_topic
- campaign_recommendation
- followup_recommendation
- repeat_recommendation
- referral_recommendation
- product_recommendation
- revenue_risk
- customer_segment

AI suggestions must always show evidence. AI must not make unsupported assertions.

## 9. Marketing Funnel

### 9.1 Stages

Standard funnel:

| Stage | Meaning |
| --- | --- |
| Awareness | 認知 |
| Interest | 興味・流入 |
| Lead | 見込み客登録 |
| Consultation | 相談・問い合わせ |
| Reservation | 予約 |
| Conversion | 決済・成約 |
| Service | Professional Studioでサービス提供 |
| Retention | リピート |
| Advocacy | レビュー・紹介 |

Stage customization by workspace or industry should be considered, but MVP may use fixed standard stages.

### 9.2 Funnel Analysis

Display:

- people in each stage
- conversion rate from previous stage
- average transition days
- drop-off count
- source conversion rate
- campaign conversion rate
- product conversion rate
- new/repeat ratio
- customer acquisition cost
- average revenue per customer
- LTV

If ad spend is not entered, customer acquisition cost should not be displayed.

### 9.3 AI Bottleneck Detection

Growth Engine detects relatively weak funnel points.

Example suggestions:

- Instagram inflow is increasing, but LINE registration rate is lower than last month. Review profile and CTA.
- Conversion from free consultation to reservation is decreasing. Follow up within 24 hours after consultation.
- Repeat usage within 90 days after service is high. Recommend recontact around day 75.

AI suggestions should not execute automatically. User confirmation is required by default.

## 10. AI Features

Growth Engine AI is limited to marketing and customer development.

Expert reading judgment belongs to Numeria Studio.

### 10.1 Consultation Trend Analysis

Growth Engine receives anonymized or aggregated consultation tags, themes, and counts from Numeria Studio.

Examples:

- increase in love consultation
- increase in reconciliation consultation
- trends by age group
- seasonal consultation changes
- themes likely to lead to repeat usage

If consultation text is used, personal information must be removed and explicit user settings must be respected.

### 10.2 Post Strategy Suggestions

Growth Engine creates post briefs for SNS Planner.

Output:

- post theme
- objective
- target reader
- reader concern
- appeal point
- CTA
- recommended SNS
- recommended format
- series idea
- frequency
- evidence from consultation trends

Actual post body and image production are delegated to SNS Planner.

### 10.3 Follow-Up Suggestions

Extract follow-up candidates from:

- no reply after inquiry
- no reservation after free consultation
- no rebooking after cancellation
- time elapsed after service
- past usage interval exceeded
- high satisfaction but no review request
- many repeat visits but no referral request

AI presents target, timing, reason, and message draft.

### 10.4 Revenue and Product Analysis

Analyze:

- high-revenue products
- high-conversion products
- high-repeat products
- revenue by source
- revenue by content
- revenue by campaign
- new revenue and repeat revenue
- customer unit price
- LTV
- revenue outlook

AI must separate facts and suggestions.

### 10.5 Next-Action Suggestions

Business Home shows prioritized actions:

- 3 leads need LINE replies
- 2 reservations today
- 4 post-session follow-ups
- 1 love-theme post brief
- 2 repeat offer targets
- 1 review request target

Use 今日やること and AIからの提案, not 経営 or COO.

## 11. Main Screens

### 11.1 Business Home

Display:

- 今日やること
- 今日の予約
- 未返信の見込み客
- フォロー予定
- AIからの提案
- 今月の売上
- 今月の新規顧客
- 今月のリピート
- 目標進捗
- 主なファネル改善点

Prioritize next action over merely listing numbers.

### 11.2 集客

Features:

- campaign list
- SNS initiatives
- post objective
- post theme candidates
- SNS Planner request
- dedicated URL and QR code
- inflow count
- LINE registrations
- consultations
- conversions
- revenue

### 11.3 投稿戦略

Growth Engine manages strategy and requests, not editing.

Features:

- AI-suggested themes
- themes from consultation trends
- post objective
- target
- CTA
- SNS Planner request status
- publication status
- content performance
- content revenue

### 11.4 見込み客

Features:

- lead list
- status
- source
- interest theme
- last contact date
- next action
- lead score
- consultation reservation
- convert to customer

Lead score is supporting information only. AI must not make final important decisions by itself.

### 11.5 お客様

Features:

- customer list
- basic information
- source
- purchased products
- total revenue
- usage count
- last usage date
- next follow-up
- repeat status
- referral status
- transition to Numeria Studio

Do not edit Numeria Studio reading content inside Growth Engine.

### 11.6 予約

Features:

- reservation list
- calendar
- product/menu
- customer
- payment status
- reservation status
- start reading in Numeria Studio
- cancellation
- rebooking

Growth Engine owns reservation management. Professional Studio provides expert menu information.

### 11.7 売上

Features:

- daily/monthly revenue
- new/repeat revenue
- product revenue
- source revenue
- content revenue
- campaign revenue
- customer revenue
- average price
- LTV
- refunds

Growth Engine is not an accounting software replacement.

### 11.8 リピート

Features:

- repeat candidates
- last usage date
- average usage cycle
- next recommended date
- guidance history
- rebooking status
- repeat rate
- message draft

### 11.9 紹介・レビュー

Features:

- review request candidates
- review request history
- referral request candidates
- referrer and referred relationship
- referral revenue
- referral rate
- saved review content

Automatic publication to SNS requires user confirmation.

### 11.10 分析

Features:

- marketing funnel
- conversion rate
- source analysis
- content analysis
- product analysis
- customer analysis
- repeat analysis
- referral analysis
- AI suggestion history

## 12. Numeria Studio Integration

### 12.1 Shared Identifiers

Use these common identifiers:

- workspaceId
- userId
- customerId
- reservationId
- professionalSessionId
- productId
- documentId

Growth Engine and Numeria Studio must not create separate duplicate customers.

### 12.2 Data Passed from Growth Engine to Numeria Studio

- workspaceId
- customerId
- reservationId
- productId
- reservation date/time
- consultation theme
- pre-questionnaire
- source
- campaign
- payment status

Context must be preserved during transition.

### 12.3 Data Returned from Numeria Studio to Growth Engine

- professionalSessionId
- customerId
- session status
- session startedAt
- session completedAt
- service type
- concern tags
- documentId
- document generated status
- next recommended date
- followup allowed
- review request allowed

Reading text and sensitive personal data must not be copied into Growth Engine without limits.

Marketing data should primarily use tags, categories, aggregated values, and anonymized information.

## 13. Event Integration

State changes should be integrated through AI Platform Core Event Engine.

Policy:

- state change notification: Event
- data fetch for UI: API
- immediate user operation: API
- asynchronous follow-up processing: Event

### 13.1 Events Published by Growth Engine

- Lead.Created
- Lead.Updated
- Lead.Qualified
- Customer.Created
- Customer.Updated
- Campaign.Created
- Content.BriefRequested
- Reservation.Requested
- Reservation.Created
- Reservation.Confirmed
- Reservation.Cancelled
- Payment.Completed
- Payment.Refunded
- Followup.Scheduled
- Followup.Completed
- Review.Requested
- Referral.Created
- Repeat.Booked

### 13.2 Events Subscribed by Growth Engine

- Customer.Updated
- Session.Started
- Session.Completed
- Document.Generated
- Professional.RecommendationCreated
- Content.DraftCreated
- Content.Published
- AI.ActivityCompleted

Final event names must align with AI Platform Core naming rules.

## 14. API Policy

Use REST or the existing project standard.

Resources:

- `/workspaces`
- `/users`
- `/leads`
- `/customers`
- `/campaigns`
- `/contents`
- `/tracking-links`
- `/products`
- `/reservations`
- `/payments`
- `/revenues`
- `/followups`
- `/referrals`
- `/insights`
- `/funnels`
- `/integrations`

Representative operations:

```text
POST   /leads
GET    /leads
GET    /leads/:id
PATCH  /leads/:id
POST   /leads/:id/convert
POST   /customers
GET    /customers
GET    /customers/:id
PATCH  /customers/:id
POST   /campaigns
GET    /campaigns
GET    /campaigns/:id
PATCH  /campaigns/:id
POST   /content-briefs
GET    /contents
GET    /contents/:id/results
POST   /reservations
GET    /reservations
GET    /reservations/:id
PATCH  /reservations/:id
POST   /payments/checkout
POST   /payments/webhook
GET    /revenues/summary
POST   /followups
GET    /followups
PATCH  /followups/:id
GET    /funnels/summary
GET    /analytics/revenue
GET    /analytics/content
GET    /analytics/customers
POST   /insights/generate
GET    /insights
PATCH  /insights/:id
```

## 15. External Integrations

### 15.1 MVP Integrations

- Numeria Studio
- AI Platform Core
- SNS Planner
- LINE Official Account
- Stripe

### 15.2 Future Integrations

- Instagram
- X
- TikTok
- YouTube
- Google Business Profile
- Google Calendar
- Google Forms
- email
- Square
- Zoom
- Google Meet

Do not assume unavailable SNS personal tracking data.

Assume these are unavailable:

- how many times a specific person viewed a post
- who saved a post
- detailed behavior of unlinked accounts

Use instead:

- dedicated URL
- QR code
- UTM-like parameters
- LINE registration
- form submission
- reservation
- coupon code
- user-entered source

## 16. Authorization and Plan Control

### 16.1 Plan Control

Growth Engine features are unavailable outside the Business plan.

Business menus should be hidden or shown as upgrade prompts for non-Business plans.

The server must always verify the plan. UI visibility is not enough.

### 16.2 Roles

MVP roles:

- Owner
- Admin
- Member

Prioritize individual use, but keep future team use possible.

## 17. Security and Privacy

Requirements:

- isolate data by Workspace
- include `workspaceId` on all major tables
- verify authorization on the server
- do not store payment card data
- verify external webhook signatures
- encrypt API keys and access tokens at rest
- do not casually log personal data, consultation text, or payment data
- minimize customer data sent to AI
- prefer anonymized and aggregated data for AI analysis
- design for customer data deletion and export
- record evidence and execution history for AI suggestions
- require user confirmation for AI-suggested message sending and post publication in the MVP

## 18. Non-Functional Requirements

### 18.1 Performance

- Normal screens should initially render within 2 seconds.
- Heavy analytics should be asynchronous.
- Dashboard aggregates should use cache or aggregate tables.
- Lists should be paginated.

### 18.2 Availability

- External service failures must not stop Growth Engine as a whole.
- Show integration states for LINE, Stripe, SNS Planner, and similar services.
- Webhook processing must support retry.
- Event processing must be idempotent.

### 18.3 Audit

Record audit logs for:

- customer information changes
- lead-to-customer conversion
- reservation changes
- payments and refunds
- external message sending
- AI suggestion execution
- integration setting changes
- data deletion

### 18.4 Mobile

Fortune tellers often use smartphones for LINE replies, reservation checks, revenue checks, and post checks.

Mobile-first screens:

- Business Home
- leads
- reservations
- follow-ups
- revenue

Complex analysis and settings may assume PC usage.

## 19. MVP Requirements

The MVP is limited to Numeria Studio users.

### 19.1 Required MVP Features

#### A. Business Home

- 今日やること
- 今日の予約
- 未対応の見込み客
- フォロー対象
- 今月売上
- AIからの提案

#### B. Lead Management

- manual registration
- LINE registration
- form registration
- source
- status
- tags
- customer conversion

#### C. Customer Management

- shared Customer mastered by Growth Engine
- basic information
- source
- total revenue
- usage count
- last usage date
- transition to Numeria Studio

#### D. Reservation Management

- product selection
- customer selection
- date/time
- status
- payment status
- start reading

#### E. Payments and Revenue

- Stripe Checkout
- payment webhook
- paid/unpaid state
- revenue aggregation
- revenue by product and source

#### F. SNS Planner Integration

- post brief creation
- send to SNS Planner
- fetch creation status
- connect to post performance

#### G. Content and Inflow Tracking

- campaign
- post objective
- dedicated URL
- QR code
- source recording
- link to reservation and revenue

#### H. Numeria Studio Integration

- shared Customer ID
- start reading from reservation
- receive reading completion event
- generate post-reading follow-up
- seamless transition with one login

#### I. AI Features

- consultation tag trend analysis
- post theme suggestion
- follow-up target suggestion
- simple funnel bottleneck analysis
- next-action suggestions

### 19.2 Out of Scope for MVP

- direct posting to all SNS platforms
- advanced ad operations
- fully automated LINE step delivery
- AI auto-send without confirmation
- advanced revenue forecasting
- accounting and tax filing
- complex team permissions
- external Professional Studio support
- marketplace
- generic plugin system
- public API for third parties
- individual SNS view tracking
- independent AI execution foundation
- SNS Planner asset editing duplication

## 20. Implementation Phases

### Phase 1: Foundation

- repository initialization
- auth and Workspace
- Business plan control
- shared Customer
- event integration foundation
- Numeria Studio connection
- AI Platform Core connection
- audit log

### Phase 2: Sales Flow

- Lead
- Customer
- Product
- Reservation
- Stripe payments
- Revenue
- Business Home

### Phase 3: Marketing

- Campaign
- TrackingLink
- QR code
- source
- funnel
- SNS Planner integration
- content performance

### Phase 4: Customer Development

- Followup
- Repeat
- Review
- Referral
- LINE integration
- automatic task generation

### Phase 5: AI Improvement

- consultation trend analysis
- post strategy suggestions
- funnel bottleneck detection
- revenue analysis
- next-action suggestions
- AI suggestion evaluation and improvement

## 21. Success Metrics

Growth Engine should be evaluated by Professional Studio users' business outcomes, not by feature usage alone.

Metrics:

- Business plan conversion rate
- Business plan retention
- monthly active usage
- lead-to-reservation conversion
- reservation-to-payment conversion
- new customers
- repeat rate
- referral rate
- average customer revenue
- LTV
- post-to-LINE registrations
- post/campaign-attributed revenue
- post-reading follow-up execution rate
- Numeria Studio integration usage

Do not claim direct causality for revenue growth. Evaluate based on data recorded through Growth Engine.

## 22. Development Principles

1. Growth Engine is dedicated to owned Professional Studio products.
2. The initial target is Numeria Studio.
3. Growth Engine is not sold standalone.
4. Growth Engine is unlocked by the Business plan.
5. Users see one app.
6. Growth Engine is an internal name and should generally not appear in the UI.
7. Professional Studio must work without Growth Engine.
8. Growth Engine must not own expert-work business logic.
9. Growth Engine uses SNS Planner and does not duplicate its features.
10. AI processing is delegated to AI Platform Core.
11. Customer is mastered by Growth Engine and referenced by Professional Studio through shared Customer ID.
12. Sensitive expert-work data must not be copied without limits for marketing.
13. Use Events for state changes and APIs for synchronous data and user operations.
14. AI suggestions must show evidence and must not auto-execute in the MVP.
15. New features must improve awareness, acquisition, conversion, repeat usage, or referral.

## 23. Final Definition

Growth Engine is an owned Business Growth foundation for experts using Professional Studio. It connects SNS Planner, LINE, reservations, payments, customer data, and Professional Studio activity data to improve the marketing funnel from awareness to referral.

The initial target is fortune tellers using Numeria Studio. Business-plan users receive seamless acquisition, sales, repeat, referral, revenue analysis, and AI suggestion features.

Growth Engine does not perform expert work on behalf of the expert. It helps experts acquire, develop, retain, and receive referrals from customers so they can focus on delivering value.
