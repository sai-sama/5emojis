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

export default function TermsOfService() {
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
          Terms of Service
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

        <Section title="1. Acceptance of Terms">
          {`By creating an account or using 5Emojis ("the App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the App.`}
        </Section>

        <Section title="2. Eligibility">
          {`You must be at least 18 years old to create an account and use 5Emojis. By using the App, you represent and warrant that you are at least 18 years of age. We reserve the right to terminate accounts of users who are found to be under 18.`}
        </Section>

        <Section title="3. Account Registration">
          {`You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate. You may not create more than one account per person.`}
        </Section>

        <Section title="4. Acceptable Use">
          {`You agree to use 5Emojis only for lawful purposes and in accordance with these Terms. You agree NOT to:

• Use the App for any commercial or promotional purposes without our consent
• Harass, bully, intimidate, or threaten any other user
• Post content that is hateful, discriminatory, violent, sexually explicit, or otherwise objectionable
• Impersonate any person or entity, or misrepresent your identity, age, or affiliation
• Use the App to solicit money or other items of value from other users
• Use automated systems, bots, or scrapers to access or interact with the App
• Attempt to gain unauthorized access to other users' accounts or our systems
• Upload viruses, malware, or any other harmful code
• Violate any applicable law, regulation, or third-party rights`}
        </Section>

        <Section title="5. User Content">
          {`You retain ownership of the content you post on 5Emojis, including photos, emojis, and text ("User Content"). By posting User Content, you grant 5Emojis a non-exclusive, worldwide, royalty-free, transferable license to use, display, reproduce, and distribute your User Content solely for the purpose of operating and improving the App.

You are solely responsible for your User Content. You represent that you have all necessary rights to post your User Content and that it does not violate any third party's rights.

We reserve the right to remove any User Content that violates these Terms or that we find objectionable, at our sole discretion.`}
        </Section>

        <Section title="6. Content Moderation">
          {`To maintain a safe and welcoming community, all photos uploaded to 5Emojis are automatically screened using third-party content moderation services. This automated screening checks for content that violates our community guidelines, including but not limited to:

• Sexually explicit or pornographic material
• Graphic violence
• Content depicting or promoting self-harm
• Content that exploits or endangers minors

Photos that are flagged by our automated systems may be rejected and will not appear on your profile. We do not store rejected photos on our servers.

By uploading photos to 5Emojis, you consent to this automated screening process. While we strive for accuracy, automated systems may occasionally make errors. If you believe your photo was incorrectly rejected, please contact us at support@5emojis.app.

We also compress and resize uploaded photos to optimize performance and storage. Original full-resolution images are not retained after processing.`}
        </Section>

        <Section title="7. Interactions with Other Users">
          {`5Emojis is a platform for making friends. You are solely responsible for your interactions with other users. 5Emojis does not conduct criminal background checks or verify the identity of its users. We encourage you to exercise caution when communicating with other users and when deciding to meet in person.

5Emojis is not responsible for the conduct of any user, whether online or offline.`}
        </Section>

        <Section title="8. Safety">
          {`We take user safety seriously. If you encounter any user who violates these Terms or makes you feel unsafe, please report them through the App's reporting feature. We reserve the right to investigate reports and take action, including suspending or terminating accounts.

When meeting someone in person for the first time, always meet in a public place and let a friend or family member know your plans.`}
        </Section>

        <Section title="9. Premium Features">
          {`5Emojis may offer optional premium features or subscriptions ("Premium Services"). If you purchase Premium Services, you agree to pay all applicable fees. Subscriptions will automatically renew unless canceled before the renewal date. Refunds are handled in accordance with the policies of the app store through which you purchased.`}
        </Section>

        <Section title="10. Intellectual Property">
          {`The App, including its design, features, branding, and technology, is owned by 5Emojis and is protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works based on the App without our prior written consent.`}
        </Section>

        <Section title="11. Account Termination">
          {`You may delete your account at any time through the App's settings. We reserve the right to suspend or terminate your account at any time, with or without notice, for any reason, including but not limited to violation of these Terms.

Upon termination, your right to use the App will immediately cease. We may retain certain information as required by law or for legitimate business purposes.`}
        </Section>

        <Section title="12. Disclaimers">
          {`THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE APP WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.

WE MAKE NO REPRESENTATIONS OR WARRANTIES ABOUT THE ACCURACY OR COMPLETENESS OF USER CONTENT OR THE CONTENT OF ANY THIRD-PARTY SITES LINKED TO THE APP.`}
        </Section>

        <Section title="13. Limitation of Liability">
          {`TO THE MAXIMUM EXTENT PERMITTED BY LAW, 5EMOJIS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUE, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR USE OF THE APP.`}
        </Section>

        <Section title="14. Dispute Resolution">
          {`Any disputes arising from these Terms or your use of the App shall be resolved through binding arbitration, rather than in court, except that you may assert claims in small claims court. The arbitration will be conducted in accordance with the rules of the American Arbitration Association.

You agree that any dispute resolution proceedings will be conducted on an individual basis and not in a class, consolidated, or representative action.`}
        </Section>

        <Section title="15. Changes to Terms">
          {`We may update these Terms from time to time. We will notify you of material changes by posting the updated Terms in the App or by sending you a notification. Your continued use of the App after changes become effective constitutes your acceptance of the updated Terms.`}
        </Section>

        <Section title="16. Contact Us">
          {`If you have any questions about these Terms, please contact us at:

support@5emojis.app`}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
