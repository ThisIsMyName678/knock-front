import { Tabs } from 'expo-router';
import { View, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Colors, Spacing, TAB_BAR_HEIGHT, Shadow, FontFamily } from '@/constants/tokens';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

type TabItem = {
  name: string;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  activeIcon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
};

const TAB_ITEMS: TabItem[] = [
  { name: 'index', label: 'דשבורד', icon: 'view-dashboard-outline', activeIcon: 'view-dashboard' },
  { name: 'projects/index', label: 'פרויקטים', icon: 'briefcase-outline', activeIcon: 'briefcase' },
  { name: 'assets-screens/index', label: 'נכסים', icon: 'home-outline', activeIcon: 'home' },
  { name: 'tasks/index', label: 'משימות', icon: 'checkbox-outline', activeIcon: 'checkbox-marked' },
  { name: 'settings/index', label: 'הגדרות', icon: 'cog-outline', activeIcon: 'cog' },
];

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom || Spacing.sm }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key]!;
        const isFocused = state.index === index;
        const tabItem = TAB_ITEMS.find((t) => t.name === route.name || route.name.startsWith(t.name.split('/')[0]!));

        if (!tabItem) return null;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={styles.tabItem}
            accessibilityRole="tab"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={tabItem.label}
          >
            {isFocused && <View style={styles.activeIndicator} />}
            <MaterialCommunityIcons
              name={isFocused ? tabItem.activeIcon : tabItem.icon}
              size={24}
              color={isFocused ? Colors.tabActive : Colors.tabInactive}
            />
            <AppText
              variant="labelSm"
              weight={isFocused ? 'bold' : 'regular'}
              style={{
                color: isFocused ? Colors.tabActive : Colors.tabInactive,
                fontFamily: isFocused ? FontFamily.bold : FontFamily.regular,
                marginTop: 2,
              }}
              align="center"
            >
              {tabItem.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function AppLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="projects/index" />
      <Tabs.Screen name="assets-screens/index" />
      <Tabs.Screen name="tasks/index" />
      <Tabs.Screen name="settings/index" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row-reverse',
    backgroundColor: Colors.tabBg,
    height: TAB_BAR_HEIGHT + Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
    ...Shadow.sm,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    gap: 2,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    left: '20%',
    right: '20%',
    height: 3,
    borderRadius: 0,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: Colors.primary,
  },
});
