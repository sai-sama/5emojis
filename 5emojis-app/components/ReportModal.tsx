import { useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../lib/constants";
import { fonts } from "../lib/fonts";
import {
  REPORT_REASONS,
  type ReportReason,
  reportUser,
  blockUser,
} from "../lib/block-report-service";

type ReportModalProps = {
  visible: boolean;
  onClose: () => void;
  reporterId: string;
  reportedId: string;
  reportedName: string;
  /** Called after block/report succeeds so parent can navigate away */
  onComplete: () => void;
};

export default function ReportModal({
  visible,
  onClose,
  reporterId,
  reportedId,
  reportedName,
  onComplete,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) return;
    setSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    await reportUser(reporterId, reportedId, selectedReason, details);

    if (alsoBlock) {
      await blockUser(reporterId, reportedId);
    }

    setSubmitting(false);
    resetAndClose();
    onComplete();
  };

  const resetAndClose = () => {
    setSelectedReason(null);
    setDetails("");
    setAlsoBlock(true);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={resetAndClose}
    >
      <View style={styles.container}>
        {/* Grab handle */}
        <View style={{ alignItems: "center", paddingTop: 8, paddingBottom: 4 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.disabled }} />
        </View>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={resetAndClose} hitSlop={12}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </Pressable>
          <Text style={styles.title}>Report {reportedName}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.subtitle}>
            Why are you reporting this person?
          </Text>

          {/* Reason selection */}
          {REPORT_REASONS.map((reason) => {
            const isSelected = selectedReason === reason.value;
            return (
              <Pressable
                key={reason.value}
                style={[styles.reasonRow, isSelected && styles.reasonRowSelected]}
                onPress={() => {
                  setSelectedReason(reason.value);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <View
                  style={[
                    styles.radioOuter,
                    isSelected && styles.radioOuterSelected,
                  ]}
                >
                  {isSelected && <View style={styles.radioInner} />}
                </View>
                <Text
                  style={[
                    styles.reasonLabel,
                    isSelected && styles.reasonLabelSelected,
                  ]}
                >
                  {reason.label}
                </Text>
              </Pressable>
            );
          })}

          {/* Details */}
          <Text style={styles.detailsLabel}>Additional details (optional)</Text>
          <TextInput
            value={details}
            onChangeText={setDetails}
            placeholder="Tell us more about what happened..."
            placeholderTextColor={COLORS.textMuted}
            style={styles.detailsInput}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />

          {/* Also block toggle */}
          <Pressable
            style={styles.blockToggle}
            onPress={() => {
              setAlsoBlock((v) => !v);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <View
              style={[styles.checkbox, alsoBlock && styles.checkboxChecked]}
            >
              {alsoBlock && (
                <Ionicons name="checkmark" size={14} color="#FFF" />
              )}
            </View>
            <Text style={styles.blockToggleText}>
              Also block {reportedName}
            </Text>
          </Pressable>

          {/* Submit */}
          <Pressable
            style={[
              styles.submitButton,
              !selectedReason && styles.submitDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!selectedReason || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.submitText}>Submit Report</Text>
            )}
          </Pressable>

          <Text style={styles.disclaimer}>
            Reports are reviewed by our team. We may take action including
            warning or removing the reported user.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 17,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: fonts.bodyMedium,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  reasonRowSelected: {
    borderColor: COLORS.accent,
    backgroundColor: "#FFF5F5",
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.disabled,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: COLORS.accent,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.accent,
  },
  reasonLabel: {
    fontSize: 15,
    fontFamily: fonts.body,
    color: COLORS.text,
  },
  reasonLabelSelected: {
    fontFamily: fonts.bodySemiBold,
  },
  detailsLabel: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  detailsInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    fontFamily: fonts.body,
    color: COLORS.text,
    minHeight: 80,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  blockToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 20,
    paddingVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.disabled,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  blockToggleText: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: COLORS.text,
  },
  submitButton: {
    marginTop: 24,
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  submitDisabled: {
    backgroundColor: COLORS.disabled,
  },
  submitText: {
    fontSize: 16,
    fontFamily: fonts.headingBold,
    color: "#FFF",
  },
  disclaimer: {
    marginTop: 16,
    fontSize: 12,
    fontFamily: fonts.body,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 17,
  },
});
