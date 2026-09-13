import express from 'express';
import webpush from 'web-push';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { authenticate } from './auth.js';

const prisma = new PrismaClient();
const router = express.Router();

const vapidPath = path.join(process.cwd(), 'vapid.json');
let vapidKeys;

if (fs.existsSync(vapidPath)) {
  vapidKeys = JSON.parse(fs.readFileSync(vapidPath, 'utf8'));
} else {
  vapidKeys = webpush.generateVAPIDKeys();
  fs.writeFileSync(vapidPath, JSON.stringify(vapidKeys));
}

webpush.setVapidDetails(
  'mailto:example@yourdomain.org',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

router.get('/vapidPublicKey', (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

router.post('/register', authenticate, async (req, res) => {
  const subscription = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: "Invalid subscription" });
  }

  try {
    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: { userId: req.userId },
      create: {
        userId: req.userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      }
    });
    res.status(201).json({ success: true });
  } catch (error) {
    console.error("Error saving subscription:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post('/test', authenticate, async (req, res) => {
  const { title, body } = req.body;
  
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: req.userId }
    });

    const payload = JSON.stringify({ title: title || 'Test', body: body || 'It works!' });

    const promises = subscriptions.map(sub => {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth }
      };
      return webpush.sendNotification(pushSub, payload).catch(err => {
        if (err.statusCode === 404 || err.statusCode === 410) {
          console.log('Subscription has expired or is no longer valid');
          return prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
      });
    });

    await Promise.all(promises);
    res.json({ success: true, count: subscriptions.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
