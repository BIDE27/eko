import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4f46e5',
        headerShown: true,
        headerStyle: { backgroundColor: '#ffffff' },
        headerTitleStyle: { fontWeight: 'bold', color: '#1f2937' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
        }}
      />
      <Tabs.Screen
        name="quiz"
        options={{
          title: 'Quiz',
        }}
      />
      <Tabs.Screen
        name="fumi"
        options={{
          title: 'Fumi IA',
        }}
      />
      <Tabs.Screen
        name="outils"
        options={{
          title: 'Outils',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
        }}
      />
    </Tabs>
  );
}
