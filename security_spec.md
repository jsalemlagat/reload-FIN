# Security Specification: BCC Reload Ministry Finance

## 1. Data Invariants
1. **Master Gate / Workspace Membership**:
   - Access to transactions, comments, members, and notifications is derived from active membership in the workspace (`/workspaces/{workspaceId}/members/{uid}`).
   - An unauthenticated user cannot read or write any workspace data.
   - An authenticated user who is not a registered member cannot read or write transactions, comments, or notifications.
2. **Role-Based Access Control (RBAC)**:
   - `admin`: Full administrative control (manage members, change roles, edit workspace, edit any transaction, delete entries).
   - `encoder`: Can create transactions, edit their own transactions, post comments, request email receipts. Cannot delete transactions or modify member roles.
   - `viewer`: Read-only access to transactions, offering breakdowns, comments, and member lists. Cannot create or edit entries or comments.
3. **Identity & Author Integrity**:
   - For any transaction creation, `incoming().encoderUid` must strictly match `request.auth.uid`.
   - For any comment creation, `incoming().authorUid` must strictly match `request.auth.uid`.
   - `authorUid`, `encoderUid`, `createdAt`, and `workspaceId` are immutable.
4. **Volumetric & Type Limits**:
   - Transaction amounts must be non-negative numbers.
   - Strings (whatPurchased, notes, comments) are size-bounded (<= 1000 chars) to prevent storage exhaustion.
   - Tags array is bounded (<= 20 elements).

## 2. The "Dirty Dozen" Threat Payloads
1. **Spoofed Author ID**: An attacker sends a transaction with `encoderUid: "victim_admin_uid"` while authenticated as `attacker_uid`. Rejected: `encoderUid == request.auth.uid`.
2. **Viewer Write Attack**: A user with `role: "viewer"` attempts to create a transaction. Rejected: Requires `role in ['admin', 'encoder']`.
3. **Ghost Fields Injection**: An attacker attempts an update with `isVerified: true` or `bypassAudit: true`. Rejected: `affectedKeys().hasOnly(...)`.
4. **Unauthenticated Read**: An unauthenticated request attempts to list `/workspaces/bcc-reload/transactions`. Rejected: `request.auth != null`.
5. **Non-Member Workspace Intrusion**: An authenticated user not in `/workspaces/{workspaceId}/members` attempts to read ledger entries. Rejected: `isMember() == true`.
6. **Self-Promotion to Admin**: A user with `role: "encoder"` sends an update to their member document changing `role: "admin"`. Rejected: Member role modification restricted to `isAdmin()`.
7. **Negative Amount Exploit**: A malicious user sends `{ amount: -50000, type: "inflow" }`. Rejected: `amount >= 0`.
8. **Immutability Bypass**: An encoder attempts to edit another encoder's transaction without admin rights. Rejected: `isOwner(resource.data.encoderUid) || isAdmin()`.
9. **Tampering with Creation Timestamp**: An attacker sends `{ createdAt: "2020-01-01" }`. Rejected: Timestamp must match `request.time`.
10. **Oversized String Buffer Overflow**: An attacker attempts to inject a 2MB string into `whatPurchased`. Rejected: `size() <= 500`.
11. **Orphaned Comment Write**: A user attempts to write a comment for a non-existent transaction. Rejected: `exists(/databases/$(database)/documents/workspaces/$(workspaceId)/transactions/$(transactionId))`.
12. **Comment Impersonation**: A user creates a comment with `authorUid: "another_user"`. Rejected: `incoming().authorUid == request.auth.uid`.

## 3. Test Runner Invariant
Every test scenario verifying these 12 malicious payloads must assert that Firestore returns `PERMISSION_DENIED`.
