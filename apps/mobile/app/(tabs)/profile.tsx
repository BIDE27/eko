import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { currentUser } from '@eko/core';

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profileHeader}>
        <Image source={{ uri: currentUser.avatar }} style={styles.avatar} />
        <Text style={styles.name}>{currentUser.name}</Text>
        <Text style={styles.role}>Élève motivé 🚀</Text>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statCol}>
          <Text style={styles.statVal}>88</Text>
          <Text style={styles.statLbl}>Matchs</Text>
        </View>
        <View style={styles.statCol}>
          <Text style={styles.statVal}>78%</Text>
          <Text style={styles.statLbl}>Victoires</Text>
        </View>
        <View style={styles.statCol}>
          <Text style={styles.statVal}>#1</Text>
          <Text style={styles.statLbl}>Rang</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Badges débloqués</Text>
      <View style={styles.badgeList}>
        {currentUser.badges.map((b) => (
          <View key={b.id} style={styles.badgeItem}>
            <Text style={styles.badgeEmoji}>🎖️</Text>
            <View>
              <Text style={styles.badgeName}>{b.name}</Text>
              <Text style={styles.badgeDesc}>{b.description}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 16,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: '#4f46e5',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  role: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statCol: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  statLbl: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  badgeList: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  badgeEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  badgeDesc: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
});
