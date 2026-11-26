import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { AdminMenu } from '../../../src/components/layout/AdminMenu';
import { useAuth } from '../../../src/context/AuthContext';
import { useTheme } from '../../../src/context/ThemeContext';

export default function MainTabsLayout() {
  const { user } = useAuth();
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'left',
        headerTitleStyle: { fontSize: 17, fontWeight: '700' },
        headerRight: () => (user ? <AdminMenu role={user.role} /> : null),
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        tabBarActiveTintColor: colors.navigationActive,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.navigation },
        tabBarLabelStyle: { fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={focused ? colors.navigationActive : colors.textSecondary} />
          ),
        }}
      />
      <Tabs.Screen
        name="activities/index"
        options={{
          title: 'Actividades',
          tabBarLabel: 'Actividades',
          tabBarIcon: ({ size, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={size} color={focused ? colors.navigationActive : colors.textSecondary} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarLabel: 'Chat',
          tabBarIcon: ({ size, focused }) => (
            <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={size} color={focused ? colors.navigationActive : colors.textSecondary} />
          ),
        }}
      />
      <Tabs.Screen
        name="reports/new"
        options={{
          title: 'Denunciar',
          tabBarLabel: 'Denunciar',
          tabBarIcon: ({ size, focused }) => (
            <Ionicons name={focused ? 'flag' : 'flag-outline'} size={size} color={focused ? colors.navigationActive : colors.textSecondary} />
          ),
        }}
      />
    </Tabs>
  );
}
