# Internal Beta Go-Live Checklist

This project is still in an internal-beta state. Keep it private until every item below is checked and tested.

## 1. Secrets and infrastructure

- Rotate `DEEPSEEK_API_KEY`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `WEBHOOK_SECRET`, `MONGODB_URI`, and any map or storage keys that may have appeared in code, docs, screenshots, or chat logs.
- Restrict browser-exposed provider keys by domain and server-side keys by IP, VPC, or provider allowlist where possible.
- Confirm `.env`, deployment secrets, and production config are not tracked in Git.
- Make sure webhook verification fails closed when `WEBHOOK_SECRET` is missing.

## 2. Registration and access control

- Keep `REQUIRE_REGISTRATION_APPROVAL=true` for internal beta.
- Review every new registration in `/admin` before allowing login.
- Record a short approval or rejection reason for audit follow-up.
- Keep admin accounts separate from daily-use accounts.

## 3. Identity and merchant onboarding

- Treat the current identity flow as manual review only.
- Do not claim government-grade real-name verification until a compliant identity provider is integrated.
- Require identity approval before enabling merchant payments.
- Require merchant application approval before enabling campaign or payment features.
- Store only the minimum identity data needed for beta review.

## 4. Payments and monetization guardrails

- Keep `PAYMENTS_ENABLED=false` by default.
- Use the payment intent endpoint for internal testing only until compliance, policy, and provider integration are complete.
- Prefer offline redemption, venue campaigns, sponsorships, and merchant promotion packages during beta.
- Do not sell digital goods or in-app virtual items until store policy and local legal review are complete.

## 5. Mainland China launch reminders

- Re-evaluate ICP, app filing, privacy policy, and data-processing disclosures before public release.
- If the product is positioned as an online game for public launch, confirm whether game approval, anti-addiction, and formal real-name requirements apply.
- Separate "offline event/service platform" scope from "public online game" scope in product documents and payment copy.
- Get local legal and compliance review before commercial release.

## 6. Operational readiness

- Add an incident response contact for secret leakage, abuse reports, and account appeals.
- Add backup and restore procedures for user data and merchant review records.
- Add rate limiting, audit logs, and usage monitoring for AI and payment-related endpoints.
- Run a smoke test for registration, login, identity submission, merchant submission, admin approval, and payment eligibility after each deployment.

## 7. Exit criteria before public release

- No hardcoded secrets remain in active runtime paths or docs.
- Admin review queues are working for registration, identity, merchant, and content review.
- Payment policy, privacy policy, and beta terms are written and published.
- Internal beta data can be exported, backed up, and purged safely.
- A production payment provider and compliant identity path are reviewed and approved.
