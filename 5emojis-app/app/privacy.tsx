import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { fonts } from "../lib/fonts";
import { COLORS } from "../lib/constants";

const EFFECTIVE_DATE = "March 9, 2026";

function Section({ title, children }: { title: string; children: string }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text
        style={{
          fontSize: 16,
          fontFamily: fonts.headingBold,
          color: COLORS.text,
          marginBottom: 6,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: 14,
          fontFamily: fonts.body,
          color: COLORS.textSecondary,
          lineHeight: 22,
        }}
      >
        {children}
      </Text>
    </View>
  );
}

export default function PrivacyPolicy() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 20,
            fontFamily: fonts.headingBold,
            color: COLORS.text,
          }}
        >
          Privacy Policy
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontSize: 13,
            fontFamily: fonts.bodyMedium,
            color: COLORS.textSecondary,
            marginBottom: 20,
          }}
        >
          Effective Date: {EFFECTIVE_DATE}
        </Text>

        <Section title="1. Information We Collect">
          {`Desi Digital LLC ("we", "us", or "our") operates 5Emojis ("the App"). We collect information you provide directly when you create an account and use the App:

Account Information: Email address, name, date of birth, and authentication credentials. If you sign in with Apple or Google, we receive your name and email from those providers.

Profile Information: Photos, the 5 emojis you select to represent yourself, gender, profession, life stage, friendship style, interests, languages, pronouns, race, religion, personality type, relationship status, kids status, work style, communication style, dietary preferences, pet ownership, profile reveals, and availability. All fields except name, date of birth, gender, and emojis are optional.

Location Data: We collect your precise device GPS coordinates to determine your city, state, and approximate location. Location access is required to use the App. We use your coordinates solely for distance-based discovery (showing you people nearby) and reverse geocoding (converting coordinates to a city/state display name). Your precise GPS coordinates are stored in our database for distance calculations but are never displayed to or shared with other users. Other users only see your city name.

Photos and Face Detection: When you upload a profile photo, your device performs on-device face detection using Google ML Kit to verify the photo contains a face. This processing happens entirely on your device; no facial data is sent to our servers. Photos are also screened for inappropriate content using automated moderation services (see Section 2).

Usage Data: How you interact with the App, including swipe activity (vibes and passes), matches, messages, message reactions, undo actions, and discovery filter preferences. This helps us improve the experience.

Device Information: Device type, operating system, platform, app version, and push notification tokens for delivering notifications and troubleshooting.

Error Logs: When errors occur in the App, we collect diagnostic information including error messages, stack traces, screen context, platform, and app version to identify and fix issues.`}
        </Section>

        <Section title="2. How We Use Your Information">
          {`We use your information to:

- Provide and operate the App, including matching you with other users based on proximity, age, and gender preferences
- Display your profile to other users within your search radius (up to 250 miles)
- Calculate distances between users using GPS coordinates and PostGIS geographic queries
- Automatically update your location when you open the App (throttled to once per hour) to keep discovery results accurate
- Facilitate communication between matched users, including emoji icebreakers, text chat, and message reactions
- Send you push notifications about new matches, messages, and App updates
- Screen uploaded photos for content that violates our community guidelines using OpenAI's automated content moderation service. Photos are processed in real-time and are not retained by the moderation service after screening
- Perform on-device face detection on your primary profile photo to ensure it contains a recognizable face
- Compress and resize uploaded photos to optimize performance and storage
- Enforce our Terms of Service, including administering account suspensions and processing user reports
- Provide administrative tools for our team to review reports, moderate content, and maintain community safety
- Analyze usage patterns and error logs to improve the App
- Respond to your support requests

We do not sell your personal information to third parties.`}
        </Section>

        <Section title="3. How We Share Your Information">
          {`We share your information only in the following circumstances:

With Other Users: Your profile information (name, age, photos, 5 emojis, city, profession, life stage, friendship style, interests, languages, and other profile fields you choose to fill in) is visible to other users in your area. Your exact GPS coordinates, email address, date of birth, and full location coordinates are never shared with other users. Users can only see your city name and approximate distance.

Service Providers: We use third-party services to help operate the App:
- Supabase for database, authentication, real-time messaging, and file storage
- PostGIS for geographic distance calculations
- OpenAI for automated photo content moderation
- Google ML Kit for on-device face detection (processed locally, no data sent externally)
- Apple and Google for social sign-in authentication
- Expo for push notification delivery
- OpenStreetMap Nominatim for reverse geocoding (converting GPS coordinates to city names) as a fallback service
- RevenueCat for subscription management and receipt validation

These providers are bound by their respective privacy policies and terms of service. 5Emojis does not display advertisements and does not share your data with advertising networks.

Legal Requirements: We may disclose your information if required by law, court order, or government request, or if we believe disclosure is necessary to protect our rights, your safety, or the safety of others.

Business Transfers: If 5Emojis or its parent company is acquired, merged, or transfers assets, your information may be transferred as part of that transaction. We will notify you of any such change.`}
        </Section>

        <Section title="4. Data Retention">
          {`We retain your personal information for as long as your account is active or as needed to provide you with the App.

When you delete your account through the App, we permanently delete your profile information, photos, emojis, matches, messages, message reactions, swipe history, and all associated data within 30 days, except where we are required to retain information for legal or regulatory purposes.

If your account is suspended, your data is retained for the duration of the suspension. If a suspension is permanent, data may be retained for up to 90 days for appeals before deletion.

Error logs and anonymized/aggregated data that cannot be used to identify you may be retained indefinitely for analytics and debugging purposes.`}
        </Section>

        <Section title="5. Your Rights and Choices">
          {`You have the following rights regarding your data:

Access and Portability: You can view your profile data within the App at any time. You may request a copy of your personal data by contacting us.

Correction: You can update your profile information directly in the App, including your photos, emojis (once every 24 hours), and all profile fields.

Deletion: You can delete your account at any time through the App's profile settings. This will permanently remove your profile, photos, emojis, matches, messages, and all associated data.

Location: Location access is required to use the App. You can revoke location permission in your device settings, but the App will not function without it. Your location refreshes automatically when you open the App (once per hour) and can be manually refreshed from your profile settings.

Notifications: You can manage push notification preferences in your device settings.

Blocking: You can block other users, which prevents them from seeing your profile or contacting you.

Reporting: You can report users who violate our community guidelines. Reports are reviewed by our moderation team.`}
        </Section>

        <Section title="6. California Residents (CCPA)">
          {`If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):

- The right to know what personal information we collect, use, and disclose
- The right to request deletion of your personal information
- The right to opt out of the sale of your personal information (we do not sell your data)
- The right to non-discrimination for exercising your CCPA rights

To exercise these rights, contact us at privacy@5emojis.app.`}
        </Section>

        <Section title="7. European Residents (GDPR)">
          {`If you are a resident of the European Economic Area (EEA) or United Kingdom, you have additional rights under the General Data Protection Regulation (GDPR):

- The right to access, correct, or delete your personal data
- The right to restrict or object to processing of your data
- The right to data portability
- The right to withdraw consent at any time
- The right to lodge a complaint with a supervisory authority

Our legal basis for processing your data includes your consent, performance of our contract with you (these Terms), and our legitimate business interests.

To exercise these rights, contact us at privacy@5emojis.app.`}
        </Section>

        <Section title="8. Data Security">
          {`We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These include:

- Encryption of data in transit (TLS/SSL) and at rest
- Secure authentication via Supabase Auth with support for Apple and Google identity providers
- Row-level security policies in our database to ensure users can only access authorized data
- Automated content moderation to prevent inappropriate material
- Regular security reviews and error monitoring

However, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security of your data.`}
        </Section>

        <Section title="9. Children's Privacy">
          {`5Emojis is not intended for anyone under the age of 18. We do not knowingly collect personal information from anyone under 18. If we learn that we have collected personal information from a user under 18, we will promptly delete that information and terminate the account.

If you believe a user is under 18, please report them through the App's reporting feature or contact us at privacy@5emojis.app.`}
        </Section>

        <Section title="10. International Data Transfers">
          {`5Emojis operates globally. Your data may be processed and stored in countries other than your own, including the United States. By using the App, you consent to the transfer of your information to countries that may have different data protection laws than your home country.

We take steps to ensure that your data receives an adequate level of protection in the jurisdictions in which we process it.`}
        </Section>

        <Section title="11. Third-Party Links and Services">
          {`The App may contain links to third-party websites or services. We are not responsible for the privacy practices of those third parties. We encourage you to read the privacy policies of any third-party services you interact with.

Our use of third-party services (Apple Sign-In, Google Sign-In, OpenAI moderation, Nominatim geocoding, RevenueCat subscription management) is governed by their respective privacy policies.`}
        </Section>

        <Section title="12. Premium Subscriptions and Payments">
          {`5Emojis offers optional premium subscription services (monthly at $7.99/month or annual at $49.99/year). When you subscribe:

- Payment is processed through the Apple App Store or Google Play Store. We do not directly collect or store your payment card information.
- We use RevenueCat, a third-party service, to manage subscription entitlements and receipt validation. RevenueCat receives your anonymized user ID and purchase receipts to verify subscription status.
- We store your subscription status (active/inactive), plan type, and expiration date in our database to provide premium features.
- Daily usage data (swipe counts, super like counts) is tracked to enforce daily limits for both free and premium users.
- You can manage or cancel your subscription at any time through your device settings.

5Emojis does not display advertisements. We monetize exclusively through optional premium subscriptions and do not sell your personal data to any third party.`}
        </Section>

        <Section title="13. Changes to This Policy">
          {`We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy in the App or by sending you a push notification. The "Effective Date" at the top of this policy indicates when it was last updated. Your continued use of the App after changes become effective constitutes your acceptance of the updated policy.`}
        </Section>

        <Section title="14. Contact Us">
          {`If you have any questions about this Privacy Policy or our data practices, please contact us at:

Desi Digital LLC
privacy@5emojis.app`}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
