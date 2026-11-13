# AgriVeda Firestore Security Specification

## 1. Data Invariants
1. **Marketplace Listing Ownership**: Every document under `/marketplaceListings/{listingId}` must specify `ownerId == request.auth.uid`, valid `status` (`active` on create, locked once `sold_out`), server timestamps (`createdAt == request.time`, `updatedAt == request.time`), and zero shadow/PII fields.
2. **Private User Scoped Collections**: Documents under `/users/{userId}/cropPlans/{planId}`, `/users/{userId}/orders/{orderId}`, and `/users/{userId}/scanLogs/{scanId}` belong strictly to `userId == request.auth.uid` with verified email (`request.auth.token.email_verified == true`).
3. **Immutable Ownership & Timestamps**: `ownerId` / `buyerId` and `createdAt` can never be reassigned or forged on update.
4. **Path ID & String Size Guardrails**: Every document ID matches `^[a-zA-Z0-9_-]+$` (`<= 128` chars), and every string field enforces explicit `.size()` boundaries.

## 2. Dirty Dozen Attack Payloads (All Must Fail with PERMISSION_DENIED)
1. **Identity Spoofing on Listing Create**: Authenticated user creates `/marketplaceListings/item_1` with `ownerId: "other_uid"`.
2. **Unverified Email Write**: Authenticated user with `email_verified: false` attempts to create a listing.
3. **Shadow / Ghost Field Injection**: User includes `isVerifiedFarmer: true` in `/marketplaceListings/item_1`.
4. **Client Timestamp Forgery**: User submits `createdAt: "2020-01-01T00:00:00Z"` instead of server timestamp `request.time`.
5. **Terminal State Mutation**: Owner attempts to update a listing whose `status` is already `"sold_out"`.
6. **Unauthorized Listing Update**: Non-owner authenticated user tries to modify `pricePerKg` on another farmer's listing.
7. **Unauthorized Field Mutation on Update**: Owner tries to change `ownerId` or `createdAt` during an update.
8. **ID Poisoning**: Attacker writes to `/marketplaceListings/` with a 500-character or slash/dot-injected document ID.
9. **Resource Exhaustion / Payload Oversize**: Attacker submits a 2000-character `cropName` or >450KB `imageDataUrl`.
10. **Cross-User Order Read/Write**: User A tries to read or create `/users/userB/orders/order_1`.
11. **Cross-User Crop Plan List**: User A attempts to `list` `/users/userB/cropPlans`.
12. **Blanket Unfiltered Listing Read of Inactive/Draft Records**: Non-owner tries to `get` or `list` non-active listings (`status != 'active'`).
