import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { currentUser, badges } from '@eko/core';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <Text style={styles.greeting}>Bonjour, {currentUser.name} ! 👋</Text>
        <Text style={styles.subtitle}>Prêt à relever de nouveaux défis aujourd'hui ?</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>🔥 7</Text>
          <Text style={styles.statLabel}>Jours de suite</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>⚡ 2 450</Text>
          <Text style={styles.statLabel}>Points d'XP</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>🏆 #1</Text>
          <Text style={styles.statLabel}>Classement</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Accès rapide</Text>
      <View style={styles.cardGrid}>
        <TouchableOpacity style={styles.actionCard}>
          <Text style={styles.cardIcon}>🎯</Text>
          <Text style={styles.cardTitle}>Quiz du jour</Text>
          <Text style={styles.cardDesc}>5 questions rapides pour tester tes connaissances</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard}>
          <Text style={styles.cardIcon}>🤖</Text>
          <Text style={styles.cardTitle}>Poser une question à Fumi</Text>
          <Text style={styles.cardDesc}>Ton tuteur IA disponible 24/7</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Tes Badges Récents</Text>
      <View style={styles.badgesRow}>
        {badges.slice(0, 4).map((badge) => (
          <View key={badge.id} style={styles.badgeCard}>
            <Text style={styles.badgeIcon}>🏅</Text>
            <Text style={styles.badgeName}>{badge.name}</Text>
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
    paddingBottom: 32,
  },
  headerCard: {
    backgroundColor: '#4f46e5',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#e0e7ff',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  cardGrid: {
    marginBottom: 20,
  },
  actionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: '#6b7280',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badgeCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  badgeIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
});
