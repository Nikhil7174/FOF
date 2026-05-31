import type { SettingsRecord } from "@/types";

export const DEFAULT_DISCLAIMER_TEXT =
  "I hereby acknowledge that I participate in FOF 2026 at my own risk and agree to hold harmless the organizers from any liability for injuries or damages incurred during the event.";

export const DEFAULT_TERMS_AND_CONDITIONS_TEXT = `Welcome to the Festival of Friendship (FOF) 2026. By registering for or participating in any FOF activity, you agree to the following terms and conditions.

1. Participation
All participants must register through the official portal and provide accurate personal information. The organizers reserve the right to verify eligibility and refuse entry where rules are not met.

2. Conduct
Participants are expected to demonstrate good sportsmanship and respect toward officials, volunteers, and other communities. Harassment, discrimination, or unsafe behavior may result in removal from events.

3. Health & Safety
You participate at your own risk. The organizers are not liable for injuries, illness, or loss of personal property except where required by applicable law. Follow venue rules and official instructions at all times.

4. Media & Communications
The organizers may photograph or record events for promotional purposes. Contact the FOF team if you have concerns about specific uses of your image.

5. Changes
These terms may be updated before or during the festival. The version published on this page is the current reference. Continued participation after updates constitutes acceptance.

For questions, use the Contact page or speak with your community representative.`;

export function getTermsDisplayText(settings?: Pick<SettingsRecord, "termsAndConditionsText"> | null) {
  const custom = settings?.termsAndConditionsText?.trim();
  return custom || DEFAULT_TERMS_AND_CONDITIONS_TEXT;
}

export function getDisclaimerDisplayText(settings?: Pick<SettingsRecord, "disclaimerText"> | null) {
  const custom = settings?.disclaimerText?.trim();
  return custom || DEFAULT_DISCLAIMER_TEXT;
}
