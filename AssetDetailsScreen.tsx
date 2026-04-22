import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Font from "expo-font";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  I18nManager,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type TabKey =
  | "feed"
  | "contract"
  | "maintenance"
  | "documents"
  | "payments"
  | "contacts";

type FeedKind = "maintenance" | "payments" | "messages" | "contracts";

type FeedItem = {
  id: string;
  kind: FeedKind;
  title: string;
  description: string;
  atIso: string; // ISO string for demo data only
};

type MaintenanceItem = {
  id: string;
  title: string;
  subtitle: string;
  status: "Open" | "In Progress" | "Closed";
};

type DocumentItem = {
  id: string;
  name: string;
  kind: "pdf" | "image";
  uploadedAtIso: string;
};

type PaymentItem = {
  id: string;
  direction: "Inbound" | "Outbound";
  atIso: string;
  category: string;
  amount: number;
};

type ContactItem = {
  id: string;
  name: string;
  role: string;
  phone: string; // local IL-style for demo, e.g. 050-1234567
};

const colors = {
  primary: "#004a99",
  onPrimary: "#ffffff",
  background: "#f9f9ff",
  onBackground: "#111c2d",
  onSurfaceVariant: "#64748b", // closest practical match to M3 "on-surface-variant" for RN Text
  surface: "#ffffff",
  outlineVariant: "#c2c6d3",
  error: "#ba1a1a",

  feed: {
    maintenance: "#f59e0b",
    payments: "#004a99",
    messages: "#10b981",
    contracts: "#6b7280",
  },

  maintenance: {
    open: "#f59e0b",
    inProgress: "#004a99",
    closed: "#10b981",
  },

  money: {
    inbound: "#10b981",
    outbound: "#ef4444",
  },
} as const;

const tabs: { key: TabKey; label: string }[] = [
  { key: "feed", label: "Feed" },
  { key: "contract", label: "Contract" },
  { key: "maintenance", label: "Maintenance" },
  { key: "documents", label: "Documents" },
  { key: "payments", label: "Payments" },
  { key: "contacts", label: "Contacts" },
];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatDateTimeHe(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  // Keep formatting lightweight + stable across platforms
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} · ${pad2(
    d.getHours(),
  )}:${pad2(d.getMinutes())}`;
}

function formatDateHe(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function formatIls(amount: number) {
  try {
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: "ILS",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `₪${Math.round(amount).toLocaleString("he-IL")}`;
  }
}

function toTelUrl(phone: string) {
  const cleaned = phone.replace(/[^\d+]/g, "");
  return `tel:${cleaned}`;
}

function toWhatsAppUrl(phone: string) {
  const digits = phone.replace(/\D/g, "");
  let intl = digits;
  if (intl.startsWith("0")) intl = `972${intl.slice(1)}`;
  if (!intl.startsWith("972")) intl = `972${intl}`;
  return `whatsapp://send?phone=${intl}`;
}

async function openUrl(url: string) {
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert("לא ניתן לפתוח קישור", url);
      return;
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert("שגיאה", "לא ניתן לבצע את הפעולה כרגע.");
  }
}

function makeDemoFeed(max: number): FeedItem[] {
  const kinds: FeedKind[] = ["maintenance", "payments", "messages", "contracts"];
  const now = Date.now();
  return Array.from({ length: max }, (_, i) => {
    const kind = kinds[i % kinds.length]!;
    const at = new Date(now - i * 1000 * 60 * 60 * 7).toISOString();
    return {
      id: `feed-${i}`,
      kind,
      title:
        kind === "maintenance"
          ? "בוצעה בדיקת מערכות"
          : kind === "payments"
            ? "תשלום התקבל"
            : kind === "messages"
              ? "הודעה חדשה מהדייר"
              : "חוזה עודכן",
      description:
        kind === "maintenance"
          ? "טכנאי אישר תקינות משאבות לחץ."
          : kind === "payments"
            ? "תשלום שכירות לחודש הנוכחי."
            : kind === "messages"
              ? "בקשה לתיאום ביקור בדירה."
              : "נספח חתימות עודכן במערכת.",
      atIso: at,
    };
  });
}

function makeDemoMaintenance(): MaintenanceItem[] {
  return [
    {
      id: "m1",
      title: "תקלה במזגן — דירה 12B",
      subtitle: "נפתח אתמול · טכנאי משויך",
      status: "Open",
    },
    {
      id: "m2",
      title: "נזילה בחדר רחצה",
      subtitle: "בטיפול · ביקור מתוכנן",
      status: "In Progress",
    },
    {
      id: "m3",
      title: "החלפת סוללות בכיבוי חירום",
      subtitle: "הושלם · דו״ח הועלה",
      status: "Closed",
    },
  ];
}

function makeDemoDocuments(): DocumentItem[] {
  const now = Date.now();
  return [
    {
      id: "d1",
      name: "חוזה שכירות — גרסה סופית.pdf",
      kind: "pdf",
      uploadedAtIso: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(),
    },
    {
      id: "d2",
      name: "תמונת נזק — מטבח.jpg",
      kind: "image",
      uploadedAtIso: new Date(now - 1000 * 60 * 60 * 9).toISOString(),
    },
  ];
}

function makeDemoPayments(): PaymentItem[] {
  const now = Date.now();
  return [
    {
      id: "p1",
      direction: "Inbound",
      atIso: new Date(now - 1000 * 60 * 60 * 24 * 5).toISOString(),
      category: "שכירות",
      amount: 7200,
    },
    {
      id: "p2",
      direction: "Outbound",
      atIso: new Date(now - 1000 * 60 * 60 * 24 * 1).toISOString(),
      category: "תחזוקה",
      amount: 850,
    },
    {
      id: "p3",
      direction: "Inbound",
      atIso: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
      category: "דמי ניהול",
      amount: 420,
    },
  ];
}

function makeDemoContacts(): ContactItem[] {
  return [
    { id: "c1", name: "יוסי כהן", role: "דייר", phone: "050-1234567" },
    { id: "c2", name: "מיכל לוי", role: "מנהלת נכס", phone: "052-9876543" },
  ];
}

function maintenanceStatusColor(status: MaintenanceItem["status"]) {
  if (status === "Open") return colors.maintenance.open;
  if (status === "In Progress") return colors.maintenance.inProgress;
  return colors.maintenance.closed;
}

function feedStripeColor(kind: FeedKind) {
  if (kind === "maintenance") return colors.feed.maintenance;
  if (kind === "payments") return colors.feed.payments;
  if (kind === "messages") return colors.feed.messages;
  return colors.feed.contracts;
}

export type AssetDetailsScreenProps = {
  assetName?: string;
  address?: string;
  /**
   * Demo-only toggles. Keep arrays empty to preview unique empty states per tab.
   * (No networking; no persistence.)
   */
  feed?: FeedItem[];
  maintenance?: MaintenanceItem[];
  documents?: DocumentItem[];
  payments?: PaymentItem[];
  contacts?: ContactItem[];
};

export function AssetDetailsScreen({
  assetName = "מגדלי הים",
  address = "הרצל 10, תל אביב",
  feed,
  maintenance,
  documents,
  payments,
  contacts,
}: AssetDetailsScreenProps) {
  const [fontsReady, setFontsReady] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("feed");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await Font.loadAsync({
          // Pulled from Google Fonts CSS (Assistant v24). Requires network on first load.
          Assistant400: "https://fonts.gstatic.com/s/assistant/v24/2sDPZGJYnIjSi6H75xkZZE1I0yCmYzzQtuZnEGE.ttf",
          Assistant600: "https://fonts.gstatic.com/s/assistant/v24/2sDPZGJYnIjSi6H75xkZZE1I0yCmYzzQtjhgEGE.ttf",
          Assistant700: "https://fonts.gstatic.com/s/assistant/v24/2sDPZGJYnIjSi6H75xkZZE1I0yCmYzzQtgFgEGE.ttf",
        });
        if (!cancelled) setFontsReady(true);
      } catch {
        // If fonts fail, still render with system fonts (visual-only fallback).
        if (!cancelled) setFontsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const font = useMemo(() => {
    return {
      regular: fontsReady ? "Assistant400" : undefined,
      semi: fontsReady ? "Assistant600" : undefined,
      bold: fontsReady ? "Assistant700" : undefined,
    } as const;
  }, [fontsReady]);

  const feedItems = feed ?? makeDemoFeed(30);
  const maintenanceItems = maintenance ?? makeDemoMaintenance();
  const documentItems = documents ?? makeDemoDocuments();
  const paymentItems = payments ?? makeDemoPayments();
  const contactItems = contacts ?? makeDemoContacts();

  const contract = useMemo(
    () => ({
      tenantName: "שירה אברהם",
      startDateIso: "2024-01-01T00:00:00.000Z",
      endDateIso: "2025-12-31T00:00:00.000Z",
      monthlyRent: 7200,
    }),
    [],
  );

  const renderTabContent = useCallback(() => {
    if (activeTab === "feed") {
      if (feedItems.length === 0) {
        return (
          <View style={styles.emptyCard}>
            <Text style={[styles.emptyTitle, font.bold && { fontFamily: font.bold }]}>אין עדכונים</Text>
            <Text style={[styles.emptyBody, font.regular && { fontFamily: font.regular }]}>
              כאן יוצג פיד כרונולוגי של אירועים ברגע שיהיו נתונים.
            </Text>
          </View>
        );
      }

      return (
        <FlatList
          data={feedItems}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => {
            const stripe = feedStripeColor(item.kind);
            return (
              <View style={styles.timelineRow}>
                <View style={styles.timelineMeta}>
                  <Text style={[styles.timelineTime, font.regular && { fontFamily: font.regular }]}>
                    {formatDateTimeHe(item.atIso)}
                  </Text>
                </View>

                <View style={styles.timelineMain}>
                  <View style={styles.timelineRail}>
                    <View style={[styles.timelineDot, { backgroundColor: stripe }]} />
                    <View style={[styles.timelineStripe, { backgroundColor: stripe }]} />
                  </View>

                  <View style={styles.timelineCard}>
                    <Text style={[styles.timelineTitle, font.semi && { fontFamily: font.semi }]}>{item.title}</Text>
                    <Text style={[styles.timelineDesc, font.regular && { fontFamily: font.regular }]}>
                      {item.description}
                    </Text>
                  </View>
                </View>
              </View>
            );
          }}
        />
      );
    }

    if (activeTab === "contract") {
      return (
        <View style={styles.card}>
          <View style={styles.grid2}>
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, font.semi && { fontFamily: font.semi }]}>דייר</Text>
              <Text style={[styles.fieldValue, font.regular && { fontFamily: font.regular }]}>{contract.tenantName}</Text>
            </View>
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, font.semi && { fontFamily: font.semi }]}>תחילה</Text>
              <Text style={[styles.fieldValue, font.regular && { fontFamily: font.regular }]}>
                {formatDateHe(contract.startDateIso)}
              </Text>
            </View>
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, font.semi && { fontFamily: font.semi }]}>סיום</Text>
              <Text style={[styles.fieldValue, font.regular && { fontFamily: font.regular }]}>
                {formatDateHe(contract.endDateIso)}
              </Text>
            </View>
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, font.semi && { fontFamily: font.semi }]}>שכירות חודשית</Text>
              <Text style={[styles.fieldValue, font.regular && { fontFamily: font.regular }]}>
                {formatIls(contract.monthlyRent)}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => Alert.alert("בקרוב", "כפתור משני לצפייה בחוזה המלא (UI בלבד).")}
            style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.9 }]}
            accessibilityRole="button"
          >
            <Text style={[styles.secondaryBtnText, font.semi && { fontFamily: font.semi }]}>צפה בחוזה המלא</Text>
          </Pressable>
        </View>
      );
    }

    if (activeTab === "maintenance") {
      if (maintenanceItems.length === 0) {
        return (
          <View style={styles.emptyCard}>
            <Text style={[styles.emptyTitle, font.bold && { fontFamily: font.bold }]}>אין קריאות שירות</Text>
            <Text style={[styles.emptyBody, font.regular && { fontFamily: font.regular }]}>
              כאן תופיע רשימת קריאות שירות כשיהיו נתונים.
            </Text>
          </View>
        );
      }

      return (
        <View>
          <View style={styles.rowSpace}>
            <Text style={[styles.sectionTitle, font.bold && { fontFamily: font.bold }]}>תחזוקה</Text>
            <Pressable
              onPress={() => Alert.alert("בקרוב", "פתיחת קריאת שירות חדשה (UI בלבד).")}
              style={({ pressed }) => [styles.headerAction, pressed && { opacity: 0.9 }]}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="plus" size={18} color={colors.onPrimary} />
              <Text style={[styles.headerActionText, font.semi && { fontFamily: font.semi }]}>קריאה חדשה</Text>
            </Pressable>
          </View>

          <FlatList
            data={maintenanceItems}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            renderItem={({ item }) => {
              const badgeColor = maintenanceStatusColor(item.status);
              return (
                <View style={styles.card}>
                  <View style={styles.rowTop}>
                    <Text style={[styles.cardTitle, font.semi && { fontFamily: font.semi }]}>{item.title}</Text>
                    <View style={[styles.badge, { borderColor: badgeColor }]}>
                      <Text style={[styles.badgeText, { color: badgeColor }, font.semi && { fontFamily: font.semi }]}>
                        {item.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.cardSub, font.regular && { fontFamily: font.regular }]}>{item.subtitle}</Text>
                </View>
              );
            }}
          />

          <Pressable
            onPress={() => Alert.alert("בקרוב", "FAB לקריאת שירות חדשה (UI בלבד).")}
            style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.98 }] }]}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="hammer-wrench" size={22} color={colors.onPrimary} />
          </Pressable>
        </View>
      );
    }

    if (activeTab === "documents") {
      if (documentItems.length === 0) {
        return (
          <View style={styles.emptyCard}>
            <Text style={[styles.emptyTitle, font.bold && { fontFamily: font.bold }]}>אין מסמכים</Text>
            <Text style={[styles.emptyBody, font.regular && { fontFamily: font.regular }]}>
              העלה מסמכים כדי לראות אותם כאן ברשימה מסודרת.
            </Text>
          </View>
        );
      }

      return (
        <View style={{ gap: 12 }}>
          <FlatList
            data={documentItems}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            renderItem={({ item }) => {
              const iconName = item.kind === "pdf" ? "file-pdf-box" : "file-image-outline";
              return (
                <View style={styles.docRow}>
                  <View style={styles.docLeft}>
                    <View style={styles.docIcon}>
                      <MaterialCommunityIcons name={iconName as any} size={22} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.docName, font.semi && { fontFamily: font.semi }]} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text style={[styles.docMeta, font.regular && { fontFamily: font.regular }]}>
                        הועלה: {formatDateHe(item.uploadedAtIso)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.iconActions}>
                    <Pressable
                      onPress={() => Alert.alert("בקרוב", "צפייה במסמך (UI בלבד).")}
                      style={({ pressed }) => [styles.iconHit, pressed && { opacity: 0.75 }]}
                      accessibilityRole="button"
                      accessibilityLabel="צפה"
                    >
                      <MaterialCommunityIcons name="eye-outline" size={22} color={colors.onBackground} />
                    </Pressable>
                    <Pressable
                      onPress={() => Alert.alert("בקרוב", "עריכת מסמך (UI בלבד).")}
                      style={({ pressed }) => [styles.iconHit, pressed && { opacity: 0.75 }]}
                      accessibilityRole="button"
                      accessibilityLabel="ערוך"
                    >
                      <MaterialCommunityIcons name="pencil-outline" size={22} color={colors.onBackground} />
                    </Pressable>
                  </View>
                </View>
              );
            }}
          />

          <Pressable
            onPress={() => Alert.alert("בקרוב", "העלאת מסמך (UI בלבד).")}
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.95 }]}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="upload" size={18} color={colors.onPrimary} />
            <Text style={[styles.primaryBtnText, font.bold && { fontFamily: font.bold }]}>העלאת מסמך</Text>
          </Pressable>
        </View>
      );
    }

    if (activeTab === "payments") {
      if (paymentItems.length === 0) {
        return (
          <View style={styles.emptyCard}>
            <Text style={[styles.emptyTitle, font.bold && { fontFamily: font.bold }]}>אין תנועות</Text>
            <Text style={[styles.emptyBody, font.regular && { fontFamily: font.regular }]}>
              כאן תוצג טבלת תשלומים כשיהיו נתונים.
            </Text>
          </View>
        );
      }

      return (
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeaderRow]}>
            <Text style={[styles.tableH, styles.colType, font.semi && { fontFamily: font.semi }]}>כיוון</Text>
            <Text style={[styles.tableH, styles.colDate, font.semi && { fontFamily: font.semi }]}>תאריך</Text>
            <Text style={[styles.tableH, styles.colCat, font.semi && { fontFamily: font.semi }]}>קטגוריה</Text>
            <Text style={[styles.tableH, styles.colAmt, font.semi && { fontFamily: font.semi }]}>סכום</Text>
          </View>

          {paymentItems.map((p) => {
            const inbound = p.direction === "Inbound";
            const amtColor = inbound ? colors.money.inbound : colors.money.outbound;
            const sign = inbound ? "+" : "−";
            return (
              <View key={p.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.colType, font.regular && { fontFamily: font.regular }]}>
                  {p.direction}
                </Text>
                <Text style={[styles.tableCell, styles.colDate, font.regular && { fontFamily: font.regular }]}>
                  {formatDateHe(p.atIso)}
                </Text>
                <Text
                  style={[styles.tableCell, styles.colCat, font.regular && { fontFamily: font.regular }]}
                  numberOfLines={1}
                >
                  {p.category}
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    styles.colAmt,
                    font.semi && { fontFamily: font.semi },
                    { color: amtColor },
                  ]}
                >
                  {sign}
                  {formatIls(p.amount).replace("₪", "")}
                  <Text style={{ color: amtColor }}> ₪</Text>
                </Text>
              </View>
            );
          })}
        </View>
      );
    }

    // contacts
    if (contactItems.length === 0) {
      return (
        <View style={styles.emptyCard}>
          <Text style={[styles.emptyTitle, font.bold && { fontFamily: font.bold }]}>אין אנשי קשר</Text>
          <Text style={[styles.emptyBody, font.regular && { fontFamily: font.regular }]}>
            הוסף אנשי קשר כדי לבצע חיוג/WhatsApp בלחיצה.
          </Text>
        </View>
      );
    }

    return (
      <View style={{ gap: 12 }}>
        <FlatList
          data={contactItems}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.rowTop}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, font.semi && { fontFamily: font.semi }]}>{item.name}</Text>
                  <View style={[styles.roleBadge, { alignSelf: "flex-start" }]}>
                    <Text style={[styles.roleBadgeText, font.semi && { fontFamily: font.semi }]}>{item.role}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.contactActions}>
                <Pressable
                  onPress={() => openUrl(toTelUrl(item.phone))}
                  style={({ pressed }) => [styles.contactAction, pressed && { opacity: 0.85 }]}
                  accessibilityRole="button"
                  accessibilityLabel="חייג"
                >
                  <MaterialCommunityIcons name="phone-outline" size={20} color={colors.primary} />
                  <Text style={[styles.contactActionText, font.semi && { fontFamily: font.semi }]}>טלפון</Text>
                </Pressable>

                <Pressable
                  onPress={() => openUrl(toWhatsAppUrl(item.phone))}
                  style={({ pressed }) => [styles.contactAction, pressed && { opacity: 0.85 }]}
                  accessibilityRole="button"
                  accessibilityLabel="WhatsApp"
                >
                  <MaterialCommunityIcons name="whatsapp" size={20} color={colors.primary} />
                  <Text style={[styles.contactActionText, font.semi && { fontFamily: font.semi }]}>WhatsApp</Text>
                </Pressable>

                <Pressable
                  onPress={() => Alert.alert("בקרוב", "עריכת איש קשר (UI בלבד).")}
                  style={({ pressed }) => [styles.iconHit, pressed && { opacity: 0.75 }]}
                  accessibilityRole="button"
                  accessibilityLabel="ערוך"
                >
                  <MaterialCommunityIcons name="pencil-outline" size={22} color={colors.onBackground} />
                </Pressable>
              </View>
            </View>
          )}
        />

        <Pressable
          onPress={() => Alert.alert("בקרוב", "הוספת איש קשר (UI בלבד).")}
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.95 }]}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="account-plus-outline" size={18} color={colors.onPrimary} />
          <Text style={[styles.primaryBtnText, font.bold && { fontFamily: font.bold }]}>הוסף איש קשר</Text>
        </Pressable>
      </View>
    );
  }, [
    activeTab,
    contactItems,
    contract.endDateIso,
    contract.monthlyRent,
    contract.startDateIso,
    contract.tenantName,
    documentItems,
    feedItems,
    font.bold,
    font.regular,
    font.semi,
    maintenanceItems,
    paymentItems,
  ]);

  return (
    <View style={styles.screen} accessibilityLanguage="he-IL">
      {!fontsReady ? (
        <View style={styles.fontLoading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.fontLoadingText, { textAlign: "right" }]}>טוען פונטים…</Text>
        </View>
      ) : null}

      {/* Fixed header */}
      <View style={styles.header}>
        <Text
          style={[
            styles.title,
            { textAlign: "right" },
            font.bold && { fontFamily: font.bold },
          ]}
          numberOfLines={2}
        >
          {assetName}
        </Text>

        <View style={[styles.subtitleRow, { flexDirection: I18nManager.isRTL ? "row-reverse" : "row" }]}>
          <MaterialCommunityIcons name="map-marker-outline" size={16} color={colors.onSurfaceVariant} />
          <Text
            style={[
              styles.subtitle,
              { textAlign: "right" },
              font.regular && { fontFamily: font.regular },
            ]}
            numberOfLines={2}
          >
            {address}
          </Text>
        </View>
      </View>

      {/* Sticky-like tabs: fixed under header; content scrolls independently */}
      <View style={styles.tabsBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
          // RTL: start from the right visually
          style={{ direction: "rtl" as any }}
        >
          {tabs.map((t) => {
            const active = t.key === activeTab;
            return (
              <Pressable
                key={t.key}
                onPress={() => setActiveTab(t.key)}
                style={({ pressed }) => [
                  styles.tabHit,
                  active && styles.tabHitActive,
                  pressed && { opacity: 0.85 },
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <Text
                  style={[
                    styles.tabText,
                    active ? styles.tabTextActive : styles.tabTextInactive,
                    font.semi && { fontFamily: font.semi },
                  ]}
                >
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {renderTabContent()}
        <View style={{ height: 18 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fontLoading: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    zIndex: 50,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surface,
  },
  fontLoadingText: {
    color: colors.onBackground,
    fontSize: 13,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  title: {
    color: colors.primary,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
  },
  subtitleRow: {
    marginTop: 8,
    alignItems: "center",
    gap: 6,
  },
  subtitle: {
    flex: 1,
    color: colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "400",
  },
  tabsBar: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  tabsRow: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    alignItems: "stretch",
  },
  tabHit: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 14,
    marginHorizontal: 4,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabHitActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    lineHeight: 18,
    textAlign: "center",
    fontWeight: "600",
  },
  tabTextActive: {
    color: colors.primary,
  },
  tabTextInactive: {
    color: colors.outlineVariant,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },

  emptyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 14,
    padding: 16,
  },
  emptyTitle: {
    color: colors.primary,
    fontSize: 16,
    textAlign: "right",
    fontWeight: "700",
    marginBottom: 6,
  },
  emptyBody: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
    textAlign: "right",
    lineHeight: 18,
    fontWeight: "400",
  },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 14,
    padding: 14,
  },
  sectionTitle: {
    color: colors.onBackground,
    fontSize: 16,
    textAlign: "right",
    fontWeight: "700",
  },
  rowSpace: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  headerAction: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  headerActionText: {
    color: colors.onPrimary,
    fontSize: 13,
    fontWeight: "600",
  },

  grid2: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
    columnGap: 12,
    marginBottom: 12,
  },
  field: {
    width: "48%",
  },
  fieldLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    textAlign: "right",
    marginBottom: 6,
    fontWeight: "600",
  },
  fieldValue: {
    color: colors.onBackground,
    fontSize: 14,
    textAlign: "right",
    fontWeight: "400",
  },
  secondaryBtn: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  secondaryBtnText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },

  timelineRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    gap: 10,
  },
  timelineMeta: {
    width: 104,
    paddingTop: 2,
  },
  timelineTime: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    textAlign: "right",
    fontWeight: "400",
  },
  timelineMain: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "stretch",
    gap: 10,
  },
  timelineRail: {
    width: 14,
    alignItems: "center",
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginTop: 4,
  },
  timelineStripe: {
    width: 3,
    flex: 1,
    borderRadius: 999,
    marginTop: 6,
    opacity: 0.9,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 14,
    padding: 12,
  },
  timelineTitle: {
    color: colors.onBackground,
    fontSize: 14,
    textAlign: "right",
    fontWeight: "600",
    marginBottom: 6,
  },
  timelineDesc: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
    textAlign: "right",
    lineHeight: 18,
    fontWeight: "400",
  },

  rowTop: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  cardTitle: {
    color: colors.onBackground,
    fontSize: 14,
    textAlign: "right",
    fontWeight: "600",
    flex: 1,
  },
  cardSub: {
    marginTop: 8,
    color: colors.onSurfaceVariant,
    fontSize: 13,
    textAlign: "right",
    lineHeight: 18,
    fontWeight: "400",
  },
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },

  fab: {
    position: "absolute",
    left: 16,
    bottom: 8,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },

  docRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  docLeft: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
  },
  docIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  docName: {
    color: colors.onBackground,
    fontSize: 14,
    textAlign: "right",
    fontWeight: "600",
  },
  docMeta: {
    marginTop: 4,
    color: colors.onSurfaceVariant,
    fontSize: 12,
    textAlign: "right",
    fontWeight: "400",
  },
  iconActions: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
  },
  iconHit: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },

  primaryBtn: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 14,
  },
  primaryBtnText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: "700",
  },

  table: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 14,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: "#eef0f6",
  },
  tableHeaderRow: {
    borderTopWidth: 0,
    backgroundColor: "#f3f6ff",
  },
  tableH: {
    color: colors.onBackground,
    fontSize: 12,
    textAlign: "right",
    fontWeight: "600",
  },
  tableCell: {
    color: colors.onBackground,
    fontSize: 12,
    textAlign: "right",
    fontWeight: "400",
  },
  colType: { width: 64 },
  colDate: { width: 86 },
  colCat: { flex: 1 },
  colAmt: { width: 92, textAlign: "left" as any },

  roleBadge: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.background,
  },
  roleBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  contactActions: {
    marginTop: 12,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 10,
  },
  contactAction: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.background,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  contactActionText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "600",
  },
});
