import { Router } from "express";
import Stripe from "stripe";
import { users, payments } from "../db.js";
import { verifyToken } from "../middleware/auth.js";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const router = Router();
const PLANS = {
  student: {
    name: "Pro Student Plan",
    amount: 10,
    description: "Unlimited bookmarks and priority booking"
  },
  tutor: {
    name: "Pro Tutor Plan",
    amount: 15,
    description: "Unlimited tuition posts and a verified badge"
  }
};
async function fulfillSession(session) {
  if (session.payment_status !== "paid") return false;
  const {
    userEmail,
    userName,
    userRole,
    planName
  } = session.metadata || {};
  if (!userEmail) return false;
  try {
    await payments().updateOne({
      stripeSessionId: session.id
    }, {
      $setOnInsert: {
        userEmail,
        userName,
        userRole,
        planName,
        amount: session.amount_total / 100,
        currency: session.currency,
        transactionId: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
        stripeSessionId: session.id,
        paymentStatus: "paid",
        paidAt: new Date()
      }
    }, {
      upsert: true
    });
  } catch (err) {
    if (err.code !== 11000) throw err;
  }
  await users().updateOne({
    email: userEmail
  }, {
    $set: {
      plan: "pro"
    }
  });
  return true;
}
router.post("/create-checkout-session", verifyToken, async (req, res) => {
  try {
    const plan = PLANS[req.user.role];
    if (!plan) return res.status(403).json({
      message: "Only students and tutors can buy a Pro plan"
    });
    if (req.user.plan === "pro") return res.status(400).json({
      message: "You are already on the Pro plan"
    });
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: req.user.email,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: plan.amount * 100,
          product_data: {
            name: plan.name,
            description: plan.description
          }
        }
      }],
      metadata: {
        userEmail: req.user.email,
        userName: req.user.name,
        userRole: req.user.role,
        planName: plan.name
      },
      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment/cancel`
    });
    res.json({
      url: session.url
    });
  } catch (err) {
    console.error("Stripe error:", err.message);
    res.status(500).json({
      message: "Could not start checkout"
    });
  }
});
router.get("/verify", verifyToken, async (req, res) => {
  try {
    const sessionId = String(req.query.session_id || "");
    if (!sessionId) return res.status(400).json({
      message: "Missing session id"
    });
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.metadata?.userEmail !== req.user.email) {
      return res.status(403).json({
        message: "This payment does not belong to you"
      });
    }
    const ok = await fulfillSession(session);
    if (!ok) return res.status(402).json({
      message: "Payment has not been completed"
    });
    res.json({
      message: "Payment confirmed",
      planName: session.metadata.planName,
      amount: session.amount_total / 100
    });
  } catch (err) {
    console.error("Verify error:", err.message);
    res.status(400).json({
      message: "Could not verify this payment"
    });
  }
});
export async function stripeWebhook(req, res) {
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if (event.type === "checkout.session.completed") {
    try {
      await fulfillSession(event.data.object);
    } catch (err) {
      console.error("Webhook fulfil error:", err);
      return res.status(500).send("Fulfilment failed");
    }
  }
  res.json({
    received: true
  });
}
export default router;
