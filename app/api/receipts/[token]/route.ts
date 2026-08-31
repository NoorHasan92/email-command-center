import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/repositories/db";
import { auth } from "@/config/auth";
import { PRODUCTS } from "@/config/products";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return new NextResponse("Invalid receipt token", { status: 400 });
    }

    const session = await auth();
    if (!session?.user?.id) {
      // Redirect to login if unauthenticated
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", `/api/receipts/${token}`);
      return NextResponse.redirect(loginUrl);
    }

    const payment = await db.payment.findUnique({
      where: { receiptToken: token },
      include: { user: true, order: true },
    });

    if (!payment) {
      return new NextResponse("Receipt not found", { status: 404 });
    }

    if (payment.userId !== session.user.id) {
      return new NextResponse("Unauthorized access to receipt", { status: 403 });
    }

    const product = PRODUCTS[payment.order.productType];
    const productName = product?.name || "Inbox Sentinel Subscription";

    const formattedAmount = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: payment.currency || "INR",
    }).format(payment.amount / 100);

    const formattedDate = new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(payment.paidAt || payment.createdAt));

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Receipt ${payment.receiptNumber}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.5;
            color: #334155;
            background-color: #f8fafc;
            padding: 40px 20px;
            margin: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            padding: 40px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 20px;
            margin-bottom: 32px;
          }
          .title {
            margin: 0;
            color: #0f172a;
            font-size: 24px;
          }
          .receipt-number {
            color: #64748b;
            font-size: 14px;
            margin-top: 8px;
          }
          .status-badge {
            background-color: #ecfdf5;
            color: #059669;
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 14px;
            font-weight: 500;
          }
          .section {
            margin-bottom: 32px;
          }
          .section-title {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #94a3b8;
            margin-bottom: 12px;
            font-weight: 600;
          }
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
          }
          .detail-label {
            font-size: 14px;
            color: #64748b;
            margin: 0 0 4px 0;
          }
          .detail-value {
            font-size: 15px;
            color: #0f172a;
            font-weight: 500;
            margin: 0;
          }
          .item-row {
            display: flex;
            justify-content: space-between;
            padding: 16px 0;
            border-bottom: 1px solid #f1f5f9;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 16px 0;
            font-weight: 600;
            font-size: 18px;
            color: #0f172a;
          }
          .footer {
            text-align: center;
            margin-top: 48px;
            color: #94a3b8;
            font-size: 14px;
          }
          @media print {
            body { background: #fff; padding: 0; }
            .container { box-shadow: none; padding: 0; max-width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div>
              <h1 class="title">Payment Receipt</h1>
              <div class="receipt-number"># ${payment.receiptNumber}</div>
              <div class="receipt-number">Date: ${formattedDate}</div>
            </div>
            <div class="status-badge">PAID</div>
          </div>

          <div class="grid section">
            <div>
              <div class="section-title">Billed To</div>
              <div class="detail-value">${payment.user?.name || "Customer (Deleted Account)"}</div>
              <div class="detail-label">${payment.user?.email || "N/A"}</div>
            </div>
            <div>
              <div class="section-title">Billed By</div>
              <div class="detail-value">Inbox Sentinel</div>
              <div class="detail-label">contact@tars.homes</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Purchase Details</div>
            <div class="item-row">
              <div>
                <div class="detail-value">${productName}</div>
                <div class="detail-label">Order Ref: ${payment.order.referenceNumber}</div>
              </div>
              <div class="detail-value">${formattedAmount}</div>
            </div>
            <div class="total-row">
              <div>Total</div>
              <div>${formattedAmount}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Transaction Details</div>
            <div class="detail-label">Payment Method: ${payment.paymentMethod || "Online Payment"}</div>
            <div class="detail-label">Provider ID: ${payment.providerPaymentId}</div>
          </div>

          <div class="footer">
            <p>Thank you for your business!</p>
            <button onclick="window.print()" style="background:none;border:1px solid #cbd5e1;padding:8px 16px;border-radius:6px;cursor:pointer;margin-top:16px;">Print Receipt</button>
          </div>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    console.error("Error fetching receipt:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
