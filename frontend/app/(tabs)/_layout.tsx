import { Tabs } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, fonts } from "@/src/lib/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.onSurfaceTertiary,
        tabBarStyle: {
          backgroundColor: colors.surfaceSecondary,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 84, paddingTop: 8, paddingBottom: 28,
        },
        tabBarLabelStyle: { fontFamily: fonts.textMedium, fontSize: 11 },
      }}
    >
      <Tabs.Screen name="index" options={{
        title: "Panel",
        tabBarIcon: ({ color, size }) => <Ionicons name="pulse" size={size} color={color} />,
      }} />
      <Tabs.Screen name="inventory" options={{
        title: "Inventario",
        tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="speaker" size={size} color={color} />,
      }} />
      <Tabs.Screen name="calculator" options={{
        title: "Calculadora",
        tabBarIcon: ({ color, size }) => <Ionicons name="calculator" size={size} color={color} />,
      }} />
      <Tabs.Screen name="logistics" options={{
        title: "Logistica",
        tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="truck-fast" size={size} color={color} />,
      }} />
    </Tabs>
  );
}
