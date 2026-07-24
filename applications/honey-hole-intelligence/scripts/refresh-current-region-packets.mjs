import { readFile, writeFile } from 'node:fs/promises';

const file = new URL('../data/current-region-condition-packets.v0.1.json', import.meta.url);
const now = new Date(process.env.HHI_REFRESH_AT || new Date().toISOString());
const document = JSON.parse(await readFile(file, 'utf8'));
let expired = 0;

for (const packet of document.packets) {
  const reviewAt = new Date(packet.nextReviewAt);
  const isExpired = Number.isNaN(reviewAt.valueOf()) || reviewAt <= now;
  packet.refresh = {
    checkedAt: now.toISOString(),
    status: isExpired ? 'expired_requires_official_refresh' : 'current_within_review_window',
    sameDayVerificationRequired: true
  };
  packet.freshnessState = packet.refresh.status;
  packet.publicationEligibility = isExpired ? 'withheld_pending_refresh' : 'eligible_until_review';
  if (isExpired) expired += 1;
}

document.lastOperationsReviewAt = now.toISOString();
await writeFile(file, `${JSON.stringify(document, null, 2)}\n`);
console.log(JSON.stringify({ packets: document.packets.length, expired, withheld: expired }));
if (expired > 0 && process.env.HHI_ALLOW_EXPIRED !== '1') process.exitCode = 2;
