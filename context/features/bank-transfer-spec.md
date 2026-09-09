# Product Requirements Document

## Bank Transfer Payment Method

**Product:** SherryBerries E-Commerce Website
**Feature:** Bank Transfer Payment and Receipt Verification
**Status:** Proposed
**Priority:** High

---

# 1. Overview

SherryBerries needs to support **Bank Transfer** as a payment method during checkout.

Unlike an online card payment, a bank transfer cannot be automatically confirmed at checkout. The customer must complete the transfer separately and submit proof of payment.

The system should therefore create the order first, temporarily reserve the inventory, allow the customer to upload proof of payment, and require an administrator to verify that payment was actually received before the order is considered paid.

The payment receipt itself must **not** automatically mark the order as paid.

### High-Level Flow

```text
Customer Checkout
      ↓
Select Bank Transfer
      ↓
Place Order
      ↓
Order Created
Payment: Awaiting Payment
      ↓
Inventory Reserved
      ↓
Display Bank Transfer Instructions
      ↓
Customer Completes Transfer
      ↓
Upload Payment Receipt
      ↓
Payment: Payment Submitted
      ↓
Admin Reviews Receipt + Bank Account
      ↓
Payment Verified?
   ↙        ↘
 YES        NO
  ↓          ↓
Paid      Rejected
  ↓
Order Processing
```

---

# 2. Goals

The feature should:

1. Allow customers to select Bank Transfer during checkout.
2. Create an order before payment is completed.
3. Generate a unique order number before payment.
4. Provide customers with the correct bank transfer instructions.
5. Allow customers to upload proof of payment.
6. Associate the uploaded receipt with the correct order.
7. Temporarily reserve inventory while payment is pending.
8. Allow administrators to verify or reject submitted payments.
9. Prevent uploaded receipts from automatically marking orders as paid.
10. Automatically release inventory when unpaid orders expire.
11. Maintain a clear audit trail of payment activity.

---

# 3. Non-Goals

The initial implementation does not need to:

* Connect directly to the bank.
* Automatically verify bank transactions.
* Read transaction information from receipt images.
* Use OCR to determine payment amounts.
* Automatically reconcile bank statements.
* Automatically mark a payment as paid after an image is uploaded.

Payment verification will initially be performed manually by a SherryBerries administrator.

---

# 4. Customer Checkout Flow

## 4.1 Payment Method Selection

During checkout, the customer should be able to select:

```text
Payment Method

○ Bank Transfer
○ Paywise
○ Cash on Delivery
```

When **Bank Transfer** is selected, display a short explanation:

> Complete your order first and we'll provide the bank transfer details. Your order will be temporarily reserved while we wait for payment.

The customer should not need to upload a receipt before placing the order.

---

# 5. Order Creation

When the customer clicks:

**Place Order**

the backend should:

1. Validate the cart.
2. Validate current inventory.
3. Calculate the final order total.
4. Create the order.
5. Generate a unique order number.
6. Create the associated payment record.
7. Reserve the purchased inventory.
8. Set the payment status to `AWAITING_PAYMENT`.
9. Set the order status to `PENDING`.
10. Set the payment expiration time.
11. Redirect the customer to the bank transfer instructions.

Example:

```text
Order Number: SB-1048

Order Status:
PENDING

Payment Status:
AWAITING_PAYMENT
```

---

# 6. Inventory Reservation

Inventory should be temporarily reserved when the order is created.

Example:

```text
Product:
Titanium Belly Ring

Length:
10mm

Available Quantity:
2

Customer Orders:
1

Available to Other Customers:
1

Reserved:
1
```

The system should distinguish between:

* Physical inventory
* Reserved inventory
* Available inventory

Conceptually:

```text
Available Inventory =
Physical Inventory - Reserved Inventory
```

This is particularly important for jewelry variants where inventory is tracked by attributes such as jewelry length.

---

# 7. Payment Reservation Window

Bank transfer orders should have a configurable payment window.

### Initial Recommendation

**6 hours**

Example:

```text
Payment Required By:
September 8, 2026 at 11:45 PM
```

The UI should clearly communicate:

> Your items are temporarily reserved. Please complete your bank transfer and upload your payment receipt within 6 hours. Unpaid orders may be automatically cancelled and the items returned to stock.

The expiration period should ideally be configurable rather than permanently hard-coded to six hours.

Example configuration:

```text
BANK_TRANSFER_PAYMENT_WINDOW_HOURS=6
```

---

# 8. Bank Transfer Instructions Page

After the order is created, redirect the customer to:

```text
/order/{orderNumber}/payment
```

Example:

# Complete Your Bank Transfer

**Order:** SB-1048
**Amount Due:** $240.00 TTD

Your order has been received but is not yet confirmed.

Complete your transfer using the details below.

### Bank Details

**Bank:** [Bank Name]
**Account Name:** [Account Name]
**Account Number:** [Account Number]

**Order Reference:** SB-1048

Where possible, the customer should be instructed to include the order number in the bank transaction description/reference.

---

# 9. Payment Receipt Upload

The payment page should contain:

### Upload Proof of Payment

Accepted formats:

* JPG
* JPEG
* PNG
* WEBP
* PDF, optional

The UI should provide:

```text
[ Choose File ]

[ Submit Payment Receipt ]
```

The customer should be able to preview an image before submitting it.

---

# 10. Upload Validation

The backend must validate uploaded files.

Recommended requirements:

```text
Allowed MIME Types:
image/jpeg
image/png
image/webp
application/pdf

Maximum File Size:
5 MB
```

Validation must occur server-side.

The application should not rely only on the file extension supplied by the browser.

Files should be stored using generated filenames rather than the customer's original filename.

Example:

```text
payments/
SB-1048/
c9d830fe-8e62-4cb2-receipt.webp
```

Payment receipts should not be publicly accessible through predictable URLs.

---

# 11. Payment Submission

After a receipt is successfully uploaded:

```text
payment_status = PAYMENT_SUBMITTED
```

The order itself should remain:

```text
order_status = PENDING
```

Display:

# Payment Submitted

> Thank you, Sweet Berry! We've received your payment receipt for order SB-1048.

> We'll verify your transfer and confirm your order once payment has been received.

The customer should receive an email confirming that the receipt was submitted.

---

# 12. Payment Verification

Uploading a receipt does **not** mean payment has been verified.

The administrator must:

1. Open the order.
2. Review the uploaded receipt.
3. Check the associated amount.
4. Verify that the transfer actually appears in the SherryBerries bank account.
5. Confirm or reject the payment.

This prevents customers from using:

* Old screenshots
* Edited screenshots
* Duplicate screenshots
* Pending transfers
* Incorrect transfer amounts

---

# 13. Admin Payment Review

The admin dashboard should provide a payment review queue.

Example:

```text
BANK TRANSFER PAYMENTS

Order     Customer      Amount       Status
------------------------------------------------
SB-1048   Sarah J.      $240.00      Submitted
SB-1049   Amanda R.     $120.00      Awaiting Payment
SB-1050   Keisha M.     $180.00      Submitted
```

Administrators should be able to filter by:

* Awaiting Payment
* Payment Submitted
* Paid
* Rejected
* Expired

---

# 14. Admin Order Payment View

Opening a submitted payment should display:

```text
Order:
SB-1048

Customer:
Sarah James

Order Total:
$240.00 TTD

Payment Method:
Bank Transfer

Payment Status:
PAYMENT_SUBMITTED

Submitted:
September 8, 2026
6:43 PM

Payment Receipt:
[ View Receipt ]

---------------------------------

[ Confirm Payment ]

[ Reject Payment ]
```

---

# 15. Confirm Payment

When the administrator clicks:

**Confirm Payment**

the system should require confirmation before performing the action.

Example:

```text
Confirm Bank Transfer

You are confirming that $240.00 TTD
has been received for order SB-1048.

[ Cancel ]

[ Confirm Payment ]
```

After confirmation:

```text
payment_status = PAID

order_status = PROCESSING

paid_at = CURRENT_TIMESTAMP

verified_at = CURRENT_TIMESTAMP

verified_by = ADMIN_USER_ID
```

The inventory reservation should then become committed inventory consumption.

The customer should receive an order confirmation email.

---

# 16. Reject Payment

Administrators should also be able to reject a submitted payment.

Example reasons:

```text
○ Payment not received
○ Incorrect amount
○ Receipt cannot be verified
○ Duplicate receipt
○ Other
```

Optional administrator notes should also be supported.

Example:

```text
Payment Status:
REJECTED

Reason:
Payment not received
```

The customer should be notified and provided with instructions to submit another receipt if appropriate.

A rejected receipt should remain stored for audit/history purposes.

---

# 17. Payment Expiration

If the customer does not submit payment before the reservation expires:

```text
payment_status = EXPIRED

order_status = CANCELLED
```

The system must:

1. Cancel the pending order.
2. Release the inventory reservation.
3. Make the inventory available for purchase again.
4. Record the expiration timestamp.
5. Optionally notify the customer.

Example:

> Your SherryBerries order SB-1048 expired because payment was not completed within the payment window. The reserved items have been returned to inventory.

---

# 18. Important Expiration Exception

The system should **not automatically cancel an order that already has a payment receipt awaiting administrator review**.

For example:

```text
5:00 PM
Order Created

10:55 PM
Customer Uploads Receipt

11:00 PM
Payment Window Expires
```

The order should remain active because the customer submitted payment evidence before the deadline.

Therefore:

```text
AWAITING_PAYMENT + expired
    ↓
Cancel Order

PAYMENT_SUBMITTED + expired
    ↓
Do NOT cancel
Wait for administrator review
```

---

# 19. Order Statuses

Recommended order statuses:

```text
PENDING
PROCESSING
READY_FOR_PICKUP
SHIPPED
COMPLETED
CANCELLED
```

Order status represents the fulfillment state of the customer's purchase.

---

# 20. Payment Statuses

Payment status must be tracked separately from order status.

Recommended statuses:

```text
AWAITING_PAYMENT
PAYMENT_SUBMITTED
PAID
REJECTED
EXPIRED
REFUNDED
```

This separation is important because different payment methods behave differently.

For example:

```text
Courier COD

Order Status:
PROCESSING

Payment Status:
AWAITING_PAYMENT
```

while a bank transfer order could be:

```text
Order Status:
PROCESSING

Payment Status:
PAID
```

---

# 21. Suggested Database Structure

## payments

```text
id
order_id
payment_method
payment_status
amount
currency
receipt_url
receipt_uploaded_at
expires_at
paid_at
verified_at
verified_by
rejection_reason
admin_notes
created_at
updated_at
```

Example:

```text
payment_method:
BANK_TRANSFER

payment_status:
PAYMENT_SUBMITTED

amount:
240.00

currency:
TTD
```

---

# 22. Inventory Reservations

A dedicated reservation system is recommended rather than immediately reducing permanent stock when the pending order is created.

Example table:

## inventory_reservations

```text
id
order_id
inventory_variant_id
quantity
status
expires_at
created_at
updated_at
```

Reservation statuses:

```text
ACTIVE
COMMITTED
RELEASED
EXPIRED
```

When payment is verified:

```text
ACTIVE → COMMITTED
```

When the unpaid order expires:

```text
ACTIVE → EXPIRED
```

and the reserved quantity becomes available again.

---

# 23. Receipt History

The system should ideally support more than one receipt submission per payment.

Instead of overwriting the original receipt when the customer resubmits, maintain receipt history.

Example:

## payment_receipts

```text
id
payment_id
file_url
file_type
file_size
uploaded_at
status
```

Possible statuses:

```text
SUBMITTED
REJECTED
ACCEPTED
```

This provides a better audit trail.

---

# 24. Audit Logging

Important payment actions should be recorded in the existing audit logging system.

Events should include:

```text
BANK_TRANSFER_ORDER_CREATED

PAYMENT_RECEIPT_UPLOADED

PAYMENT_RECEIPT_REJECTED

BANK_TRANSFER_PAYMENT_CONFIRMED

BANK_TRANSFER_PAYMENT_EXPIRED

BANK_TRANSFER_ORDER_CANCELLED

INVENTORY_RESERVED

INVENTORY_RESERVATION_RELEASED
```

Each event should record, where applicable:

```text
user_id
admin_id
order_id
payment_id
action
timestamp
previous_status
new_status
metadata
```

Payment verification actions should always identify the administrator who performed them.

---

# 25. Customer Order Page

Customers should be able to view their payment status from their order page.

Example:

```text
Order #SB-1048

Order Status
Pending

Payment
Bank Transfer

Payment Status
Awaiting Payment

Amount Due
$240.00 TTD

Payment expires in:
4h 32m

[ Complete Bank Transfer ]
```

After submission:

```text
Payment Status
Payment Submitted

We're reviewing your payment.
No further action is required right now.
```

After verification:

```text
Payment Status
Paid ✓

Your payment has been confirmed
and your order is being processed.
```

---

# 26. Customer Emails

The system should support the following transactional emails.

### Order Created

Triggered when the bank transfer order is created.

Contains:

* Order number
* Order total
* Items ordered
* Payment instructions
* Payment deadline
* Link to upload receipt

### Payment Receipt Submitted

Triggered when proof of payment is uploaded.

Contains:

* Order number
* Confirmation that the receipt was received
* Explanation that payment still needs to be verified

### Payment Confirmed

Triggered when an administrator verifies payment.

Contains:

* Order number
* Amount paid
* Confirmation that payment was received
* Updated order status

### Payment Rejected

Triggered when an administrator rejects the payment.

Contains:

* Order number
* Reason
* Link to resubmit payment proof where applicable

### Order Expired

Triggered when an unpaid bank transfer order expires.

Contains:

* Order number
* Explanation that the payment window expired
* Confirmation that the reservation was released

---

# 27. Security Requirements

Payment receipt uploads should be treated as sensitive customer-provided files.

Requirements:

* Validate MIME type server-side.
* Enforce file size limits.
* Generate randomized filenames.
* Do not execute uploaded files.
* Store receipts outside publicly browsable directories.
* Require authenticated or signed access to receipt files.
* Restrict receipt viewing to the customer who owns the order and authorized administrators.
* Do not expose storage paths directly where avoidable.
* Log administrator payment verification actions.
* Apply rate limiting to upload endpoints.
* Prevent customers from changing the `order_id` to upload receipts against another customer's order.

---

# 28. Duplicate Submission Protection

The backend should prevent accidental duplicate operations.

Examples:

* Double-clicking "Place Order" should not create two orders.
* Double-clicking "Submit Payment Receipt" should not create unnecessary duplicate submissions.
* Double-clicking "Confirm Payment" should not deduct inventory twice.

Payment confirmation and inventory commitment should be implemented as idempotent operations.

---

# 29. Concurrency Requirements

Inventory availability must be checked and reserved atomically.

If two customers attempt to purchase the final available 10mm belly ring simultaneously, only one reservation should succeed.

The application must never allow:

```text
Available Inventory < 0
```

Inventory reservation should therefore occur inside an appropriate database transaction.

---

# 30. Admin Notifications

When a customer submits a bank transfer receipt, the system should notify SherryBerries administrators.

Initial implementation may use:

* Admin dashboard notification
* Email notification

Example:

> New bank transfer payment submitted for SB-1048. $240.00 TTD is awaiting verification.

This prevents submitted payments from sitting unnoticed.

---

# 31. Admin Dashboard Indicator

The admin navigation should display the number of payments requiring review.

Example:

```text
Orders

Payments (3)
```

The count should represent:

```text
payment_status = PAYMENT_SUBMITTED
```

---

# 32. Edge Cases

The implementation must handle:

### Customer uploads receipt after expiration

If the order has already expired and inventory has been released, the system should prevent automatic payment submission and instruct the customer to contact SherryBerries.

### Customer transfers wrong amount

Admin can reject the payment or flag it for resolution.

### Customer uploads wrong screenshot

Admin rejects it and customer can submit another.

### Customer uploads receipt twice

Maintain receipt history without creating duplicate orders.

### Admin accidentally opens payment twice

Payment confirmation must remain idempotent.

### Product sells out while another customer has it reserved

Reserved inventory must not be available to new customers.

### Customer closes browser after checkout

The order remains accessible through their account and/or secure link from the transactional email.

### Payment submitted seconds before expiration

The order remains pending administrator review and inventory remains reserved.

---

# 33. Acceptance Criteria

The feature is complete when:

* [ ] Customer can select Bank Transfer at checkout.
* [ ] An order is created before payment is submitted.
* [ ] Every order receives a unique order number.
* [ ] Inventory is temporarily reserved.
* [ ] Bank transfer instructions are displayed after checkout.
* [ ] Customer can upload proof of payment.
* [ ] Receipt is associated with the correct payment and order.
* [ ] Receipt upload does not automatically mark payment as paid.
* [ ] Admin can view submitted receipts.
* [ ] Admin can verify payment.
* [ ] Admin can reject payment.
* [ ] Payment and order statuses are tracked separately.
* [ ] Verified payment moves the order into processing.
* [ ] Unpaid orders expire after the configured payment window.
* [ ] Expired inventory reservations are released.
* [ ] Orders with receipts submitted before expiration are not automatically cancelled.
* [ ] Customer receives relevant transactional emails.
* [ ] Admin receives notification when payment requires verification.
* [ ] Payment verification actions are audit logged.
* [ ] Receipt files are securely stored.
* [ ] Inventory cannot be oversold through simultaneous reservations.
* [ ] Payment confirmation cannot deduct inventory more than once.

---

# 34. Recommended Final Workflow

```text
CHECKOUT
    ↓
BANK TRANSFER SELECTED
    ↓
ORDER CREATED
    ↓
PENDING
+
AWAITING_PAYMENT
    ↓
INVENTORY RESERVED
    ↓
BANK DETAILS DISPLAYED
    ↓
CUSTOMER TRANSFERS MONEY
    ↓
CUSTOMER UPLOADS RECEIPT
    ↓
PAYMENT_SUBMITTED
    ↓
ADMIN NOTIFIED
    ↓
ADMIN CHECKS BANK ACCOUNT
    ↓
        ┌───────────────┐
        │ Payment Valid?│
        └───────────────┘
          ↓           ↓
         YES          NO
          ↓           ↓
        PAID       REJECTED
          ↓           ↓
     PROCESSING    RESUBMIT
          ↓
 READY FOR PICKUP
       OR
     SHIPPED
          ↓
      COMPLETED
```

---

# 35. Core Business Rule

> **A payment receipt is evidence that the customer claims to have completed a transfer. It is not confirmation that SherryBerries received the money.**

Only an authorized SherryBerries administrator can transition a bank transfer payment from:

```text
PAYMENT_SUBMITTED
```

to:

```text
PAID
```

after verifying that the funds were actually received.
