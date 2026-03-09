import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { fonts } from "../lib/fonts";
import { COLORS } from "../lib/constants";

const EFFECTIVE_DATE = "March 6, 2026";

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
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
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
          {`By creating an account or using 5Emojis ("the App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the App.

You must explicitly accept these Terms and our Privacy Policy before creating an account or signing in, whether through email, Apple Sign-In, or Google Sign-In. Continued use of the App constitutes ongoing acceptance of these Terms.`}
        </Section>

        <Section title="2. Eligibility">
          {`You must be at least 18 years old to create an account and use 5Emojis. By using the App, you represent and warrant that you are at least 18 years of age. We reserve the right to terminate accounts of users who are found to be under 18.`}
        </Section>

        <Section title="3. Account Registration">
          {`You may create an account using email and password, Apple Sign-In, or Google Sign-In. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.

You agree to provide accurate, current, and complete information during registration and onboarding, and to update such information to keep it accurate. You may not create more than one account per person.

During onboarding, you will be asked to provide your name, date of birth, gender, select 5 emojis, upload at least one profile photo, and grant location access. Location access is mandatory for the App to function.`}
        </Section>

        <Section title="4. Location Services">
          {`5Emojis requires access to your device's GPS location to function. By using the App, you consent to the collection of your precise location data for the following purposes:

- Determining your city and state for display on your profile
- Calculating distances between you and other users for discovery
- Showing you users within your selected search radius (5 to 250 miles)
- Automatically updating your location when you open the App

Your location is updated automatically when the App comes to the foreground, throttled to once per hour. You may also manually refresh your location from your profile settings.

You may revoke location permission at any time through your device settings, but the App will not be able to show you nearby users or display your profile to others without location access.`}
        </Section>

        <Section title="5. Acceptable Use">
          {`You agree to use 5Emojis only for lawful purposes and in accordance with these Terms. 5Emojis is a platform for making friends. You agree NOT to:

- Use the App for any commercial, promotional, or solicitation purposes without our consent
- Use the App for romantic or dating purposes (5Emojis is a friendship app)
- Harass, bully, intimidate, or threaten any other user
- Post content that is hateful, discriminatory, violent, sexually explicit, or otherwise objectionable
- Impersonate any person or entity, or misrepresent your identity, age, or affiliation
- Upload photos that do not contain your face, or use someone else's photos
- Use the App to solicit money or other items of value from other users
- Use automated systems, bots, or scrapers to access or interact with the App
- Attempt to gain unauthorized access to other users' accounts or our systems
- Upload viruses, malware, or any other harmful code
- Circumvent or attempt to circumvent any content moderation, safety, or security measures
- Create multiple accounts or create a new account after being suspended or banned
- Violate any applicable law, regulation, or third-party rights`}
        </Section>

        <Section title="6. User Content">
          {`You retain ownership of the content you post on 5Emojis, including photos, emojis, text messages, and profile information ("User Content"). By posting User Content, you grant 5Emojis a non-exclusive, worldwide, royalty-free, transferable license to use, display, reproduce, and distribute your User Content solely for the purpose of operating and improving the App.

You are solely responsible for your User Content. You represent that you have all necessary rights to post your User Content and that it does not violate any third party's rights.

We reserve the right to remove any User Content that violates these Terms or that we find objectionable, at our sole discretion.

Emoji Editing: You may change your 5 representative emojis once every 24 hours. This cooldown ensures consistent identity representation to other users.`}
        </Section>

        <Section title="7. Content Moderation and Safety">
          {`To maintain a safe and welcoming community:

Photo Moderation: All photos uploaded to 5Emojis are automatically screened using OpenAI's content moderation service. This automated screening checks for content including but not limited to:
- Sexually explicit or pornographic material
- Graphic violence
- Content depicting or promoting self-harm
- Content that exploits or endangers minors

Photos flagged by our automated systems will be rejected and will not appear on your profile. We do not store rejected photos.

Face Detection: Your primary profile photo must contain a recognizable face. We use on-device face detection (Google ML Kit) to verify this. This processing happens entirely on your device.

Photo Processing: We compress and resize uploaded photos (max 600px width, JPEG quality 0.6) to optimize performance and storage. Original full-resolution images are not retained after processing.

By uploading photos to 5Emojis, you consent to automated screening and processing. If you believe your photo was incorrectly rejected, contact us at support@5emojis.app.`}
        </Section>

        <Section title="8. Matching and Messaging">
          {`5Emojis uses a swipe-based system for discovering potential friends:

- Swiping right ("vibe") indicates interest in connecting
- Swiping left ("pass") indicates no interest
- When two users both swipe right on each other, a match is created

Icebreaker: When a match is created, both users are prompted with an icebreaker question. Each user responds with 5 emojis before text chat becomes available. This is a core feature of 5Emojis designed to make first interactions fun and low-pressure.

Messaging: After both users complete the emoji icebreaker, full text messaging becomes available. Messages support text and emoji reactions.

You can unmatch from any user at any time, which removes the match and all associated messages.`}
        </Section>

        <Section title="9. Blocking and Reporting">
          {`Blocking: You may block any user at any time. Blocking a user will:
- Remove any existing match between you
- Prevent the blocked user from seeing your profile
- Prevent any future interactions between you

You may unblock users from your profile settings.

Reporting: You may report users for the following reasons: inappropriate content, harassment/bullying, spam/scam, fake profile, suspected underage user, or other concerns. Reports are reviewed by our moderation team and may result in warnings, temporary suspensions, or permanent bans.`}
        </Section>

        <Section title="10. Account Suspension and Termination">
          {`We reserve the right to suspend or terminate your account at any time, with or without notice, for any reason, including but not limited to violation of these Terms or community guidelines.

Suspension: If your account is suspended, you will be notified of the reason and duration. During suspension, you cannot access the App. Suspensions may be temporary (with a specified end date) or permanent.

Self-Deletion: You may delete your account at any time through the App's profile settings. This will permanently remove your profile, photos, emojis, matches, messages, and all associated data.

Upon termination, your right to use the App will immediately cease. We may retain certain information as required by law or for legitimate business purposes.`}
        </Section>

        <Section title="11. Premium Features and Purchases">
          {`5Emojis offers optional premium subscription services ("Premium Services") that enhance your experience. Premium features include:

- Unlimited right swipes (free users: 25 per day)
- Undo accidental swipes
- 3 Super Likes per day (places you at the top of someone's discovery feed with a star badge; does NOT guarantee a match)
- See who has swiped right on you
- Full discovery filter access (extended radius, custom age ranges)
- Ability to add hidden reveals to your profile

Premium subscriptions are available in weekly, monthly, and annual plans.

If you purchase Premium Services:
- All purchases are processed through the Apple App Store or Google Play Store
- You agree to pay all applicable fees as displayed at the time of purchase
- Subscriptions will automatically renew unless canceled at least 24 hours before the end of the current period
- You can manage or cancel subscriptions in your device settings (Settings > Subscriptions on iOS, Google Play Store > Subscriptions on Android)
- Refunds are handled in accordance with the policies of the respective app store
- We do not directly collect or store your payment card information
- Subscription management is handled by RevenueCat, a third-party payment processor

Core features of 5Emojis (swiping, matching, messaging, profile creation) will always remain free. Free users receive 25 right swipes per day, unlimited left swipes, basic discovery filters, and full chat functionality.

The free tier of 5Emojis includes advertisements served by Google AdMob. By using the free tier, you consent to the display of ads. Premium subscribers enjoy an ad-free experience. We request non-personalized ads only and do not sell your personal data to advertisers.`}
        </Section>

        <Section title="12. Interactions with Other Users">
          {`5Emojis is a platform for making friends. You are solely responsible for your interactions with other users. 5Emojis does not conduct criminal background checks or verify the identity of its users beyond automated content moderation and face detection.

We encourage you to exercise caution when communicating with other users and when deciding to meet in person.

5Emojis is not responsible for the conduct of any user, whether online or offline.`}
        </Section>

        <Section title="13. Safety Tips">
          {`When meeting someone from 5Emojis in person:

- Always meet in a public place for the first time
- Let a friend or family member know your plans, including where you're going and who you're meeting
- Arrange your own transportation to and from the meeting
- Trust your instincts; if something feels off, leave
- Report any concerning behavior through the App`}
        </Section>

        <Section title="14. Intellectual Property">
          {`The App, including its design, features, branding, name, logo, and technology, is owned by 5Emojis and is protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works based on the App without our prior written consent.

The 5Emojis name, logo, and all related names, logos, product and service names, designs, and slogans are trademarks of 5Emojis. You may not use such marks without our prior written permission.`}
        </Section>

        <Section title="15. Disclaimers">
          {`THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

WE DO NOT WARRANT THAT THE APP WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE, THAT DEFECTS WILL BE CORRECTED, OR THAT THE APP IS FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.

WE MAKE NO REPRESENTATIONS OR WARRANTIES ABOUT THE ACCURACY, RELIABILITY, OR COMPLETENESS OF USER CONTENT, USER PROFILES, OR THE CONTENT OF ANY THIRD-PARTY SITES OR SERVICES LINKED TO THE APP.

WE DO NOT GUARANTEE THAT YOU WILL FIND FRIENDS OR MAKE CONNECTIONS THROUGH THE APP.`}
        </Section>

        <Section title="16. Limitation of Liability">
          {`TO THE MAXIMUM EXTENT PERMITTED BY LAW, 5EMOJIS AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUE, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:

- YOUR USE OF OR INABILITY TO USE THE APP
- ANY CONDUCT OR CONTENT OF ANY USER OF THE APP
- ANY CONTENT OBTAINED FROM THE APP
- UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT

IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS EXCEED THE AMOUNT YOU HAVE PAID US IN THE TWELVE (12) MONTHS PRIOR TO THE EVENT GIVING RISE TO THE LIABILITY, OR $100, WHICHEVER IS GREATER.`}
        </Section>

        <Section title="17. Indemnification">
          {`You agree to indemnify, defend, and hold harmless 5Emojis and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable attorneys' fees) arising out of or in any way connected with your access to or use of the App, your User Content, or your violation of these Terms.`}
        </Section>

        <Section title="18. Dispute Resolution">
          {`Any disputes arising from these Terms or your use of the App shall be resolved through binding arbitration, rather than in court, except that you may assert claims in small claims court. The arbitration will be conducted in accordance with the rules of the American Arbitration Association.

You agree that any dispute resolution proceedings will be conducted on an individual basis and not in a class, consolidated, or representative action. You waive any right to participate in a class action lawsuit or class-wide arbitration.

This arbitration agreement shall survive termination of your account or these Terms.`}
        </Section>

        <Section title="19. Governing Law">
          {`These Terms shall be governed by and construed in accordance with the laws of the State of Texas, without regard to its conflict of law provisions. Any legal action or proceeding not subject to arbitration shall be brought exclusively in the state or federal courts located in Texas.`}
        </Section>

        <Section title="20. Changes to Terms">
          {`We may update these Terms from time to time. We will notify you of material changes by posting the updated Terms in the App or by sending you a push notification. The "Effective Date" at the top of these Terms indicates when they were last updated.

Your continued use of the App after changes become effective constitutes your acceptance of the updated Terms. If you do not agree to the updated Terms, you must stop using the App.`}
        </Section>

        <Section title="21. Severability">
          {`If any provision of these Terms is held to be invalid or unenforceable, the remaining provisions will continue in full force and effect. The invalid or unenforceable provision will be modified to the minimum extent necessary to make it valid and enforceable.`}
        </Section>

        <Section title="22. Contact Us">
          {`If you have any questions about these Terms, please contact us at:

support@5emojis.app`}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
