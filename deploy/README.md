# নিজের ডোমেইন ও VPS-এ ওয়েবসাইট সেটআপ গাইড

এই প্রজেক্টটি সম্পূর্ণ স্ট্যান্ডার্ড ওপেন-সোর্স স্ট্যাকে তৈরি (React + TanStack Start + Vite + Supabase)।
কোনো Lovable-নির্ভর হোস্টিং লক-ইন নেই। নিচের ধাপগুলো অনুসরণ করলে ওয়েবসাইট সম্পূর্ণভাবে আপনার নিজের VPS-এ চলবে।

---

## ১. কোড ডাউনলোড
GitHub-এ প্রজেক্ট এক্সপোর্ট করে VPS-এ ক্লোন করুন:

```bash
git clone <your-repo-url> /var/www/app
cd /var/www/app
```

## ২. ব্যাকএন্ড (ডাটাবেস) নিজের করে নেওয়া
বর্তমানে ডাটাবেস Lovable Cloud-এ (Supabase) চলছে। সম্পূর্ণ নিয়ন্ত্রণ নিতে দুইটি অপশন:

**অপশন A — নিজের Supabase অ্যাকাউন্ট (সহজ):**
1. supabase.com এ নিজের প্রজেক্ট খুলুন।
2. `supabase/migrations/` ফোল্ডারের সব SQL ফাইল ক্রম অনুযায়ী SQL Editor-এ চালান।
3. পুরনো ডাটা `pg_dump` দিয়ে এক্সপোর্ট করে নতুন ডাটাবেসে ইমপোর্ট করুন।

**অপশন B — নিজের VPS-এ Self-hosted Supabase (সম্পূর্ণ মালিকানা):**
```bash
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker && cp .env.example .env && docker compose up -d
```
তারপর `supabase/migrations/` এর SQL গুলো চালান।

## ৩. এনভায়রনমেন্ট ভেরিয়েবল
```bash
cp .env.example .env
nano .env      # আপনার নিজের Supabase URL ও key বসান
```

## ৪. রান করা

**পদ্ধতি ১ — Docker (রেকমেন্ডেড):**
```bash
docker compose up -d --build
```

**পদ্ধতি ২ — সরাসরি Node.js:**
```bash
npm install --legacy-peer-deps
NITRO_PRESET=node-server npm run build
node .output/server/index.mjs
```
সার্ভিস হিসেবে সবসময় চালু রাখতে:
```bash
sudo cp deploy/app.service /etc/systemd/system/app.service
sudo systemctl daemon-reload && sudo systemctl enable --now app
```

## ৫. ডোমেইন ও SSL
```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/app
sudo ln -s /etc/nginx/sites-available/app /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```
ডোমেইনের DNS-এ `A` রেকর্ড আপনার VPS-এর IP-তে পয়েন্ট করুন (`@` এবং `www`)।

---

## গুরুত্বপূর্ণ নোট
- `NITRO_PRESET=node-server` না দিলে বিল্ড ক্লাউড টার্গেটে হবে — VPS-এ চালাতে সবসময় এটি দিন।
- Google/Apple সোশ্যাল লগইন Lovable-এর ম্যানেজড ক্রেডেনশিয়াল ব্যবহার করে। নিজের হোস্টিং-এ যাওয়ার সময় নিজের Google OAuth Client ID/Secret নিজের Supabase প্রজেক্টে বসাতে হবে।
- সব সোর্স কোড, ডাটাবেস স্কিমা ও মাইগ্রেশন আপনার রিপোজিটরিতেই আছে — কোনো কিছু Lovable-এ আটকে থাকবে না।
