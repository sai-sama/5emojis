import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { fonts } from "../lib/fonts";
import { COLORS } from "../lib/constants";

const EFFECTIVE_DATE = "February 27, 2026";

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
          <Text style={{ fontSize: 28, color: COLORS.primary }}>‹</Text>
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
          {`We collect information you provide directly when you create an account and use 5Emojis:

Account Information: Email address, name, date of birth, and authentication credentials.

Profile Information: Photos, emojis you select, profession, life stage, friendship style, interests, pronouns, race, and religion (all optional except name, DOB, and emojis).

Location Data: Your city, state, and approximate coordinates to show you nearby users. We use your location only for distance-based matching and never share your precise coordinates with other users.

Usage Data: How you interact with the App, including swipe activity, matches, and messages. This helps us improve the experience.

Device Information: Device type, operating system, and app version for troubleshooting and compatibility.`}
        </Section>

        <Section title="2. How We Use Your Information">
          {`We use your information to:

• Provide and operate the App, including matching you with other users
• Display your profile to other users within your search radius
• Facilitate communication between matched users
• Send you notifications about matches, messages, and App updates
• Screen uploaded photos for content that violates our community guidelines using automated moderation services
• Compress and resize photos to optimize performance
• Enforce our Terms of Service and protect user safety
• Analyze usage patterns to improve the App
• Respond to your support requests

We do not sell your personal information to third parties.`}
        </Section>

        <Section title="3. How We Share Your Information">
          {`We share your information only in the following circumstances:

With Other Users: Your profile information (name, age, photos, emojis, profession, life stage, and city) is visible to other users. Your exact location, email address, and date of birth are never shared with other users.

Service Providers: We use third-party services to help operate the App, including Supabase for database and authentication, cloud storage for photos, OpenAI for automated content moderation of uploaded photos, and analytics tools. These providers are bound by contractual obligations to protect your data. Photos submitted for content moderation are processed in real-time and are not retained by the moderation service.

Legal Requirements: We may disclose your information if required by law, court order, or government request, or if we believe disclosure is necessary to protect our rights, your safety, or the safety of others.

Business Transfers: If 5Emojis is acquired or merged with another company, your information may be transferred as part of that transaction.`}
        </Section>

        <Section title="4. Data Retention">
          {`We retain your personal information for as long as your account is active or as needed to provide you with the App. When you delete your account, we will delete your profile information, photos, and messages within 30 days, except where we are required to retain information for legal or regulatory purposes.

Anonymized and aggregated data that cannot be used to identify you may be retained indefinitely for analytics purposes.`}
        </Section>

        <Section title="5. Your Rights and Choices">
          {`You have the following rights regarding your data:

Access and Portability: You can view your profile data within the App at any time. You may request a copy of your personal data by contacting us.

Correction: You can update your profile information directly in the App.

Deletion: You can delete your account at any time through the App's profile settings. This will permanently remove your profile, photos, matches, and messages.

Location: You can disable location services for the App in your device settings, though this will limit the App's ability to show you nearby users.

Notifications: You can manage push notification preferences in your device settings.

Marketing: You may opt out of promotional communications by following the unsubscribe instructions in those messages.`}
        </Section>

        <Section title="6. California Residents (CCPA)">
          {`If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):

• The right to know what personal information we collect, use, and disclose
• The right to request deletion of your personal information
• The right to opt out of the sale of your personal information (we do not sell your data)
• The right to non-discrimination for exercising your CCPA rights

To exercise these rights, contact us at privacy@5emojis.app.`}
        </Section>

        <Section title="7. European Residents (GDPR)">
          {`If you are a resident of the European Economic Area (EEA) or United Kingdom, you have additional rights under the General Data Protection Regulation (GDPR):

• The right to access, correct, or delete your personal data
• The right to restrict or object to processing of your data
• The right to data portability
• The right to withdraw consent at any time
• The right to lodge a complaint with a supervisory authority

Our legal basis for processing your data includes your consent, performance of our contract with you (these Terms), and our legitimate business interests.

To exercise these rights, contact us at privacy@5emojis.app.`}
        </Section>

        <Section title="8. Data Security">
          {`We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These include encryption of data in transit and at rest, secure authentication, and regular security reviews.

However, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security of your data.`}
        </Section>

        <Section title="9. Children's Privacy">
          {`5Emojis is not intended for anyone under the age of 18. We do not knowingly collect personal information from anyone under 18. If we learn that we have collected personal information from a user under 18, we will promptly delete that information and terminate the account.

If you believe a user is under 18, please report them through the App or contact us at privacy@5emojis.app.`}
        </Section>

        <Section title="10. Third-Party Links">
          {`The App may contain links to third-party websites or services. We are not responsible for the privacy practices of those third parties. We encourage you to read the privacy policies of any third-party services you visit.`}
        </Section>

        <Section title="11. Changes to This Policy">
          {`We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy in the App or by sending you a notification. Your continued use of the App after changes become effective constitutes your acceptance of the updated policy.`}
        </Section>

        <Section title="12. Contact Us">
          {`If you have any questions about this Privacy Policy or our data practices, please contact us at:

privacy@5emojis.app`}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
