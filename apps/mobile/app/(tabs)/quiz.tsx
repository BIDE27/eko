import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { soloQuizCategories } from '@eko/core';

export default function QuizScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <View style={styles.topBanner}>
        <Text style={styles.bannerTitle}>Mode Quiz & Défis</Text>
        <Text style={styles.bannerSubtitle}>Choisis une catégorie et teste tes connaissances !</Text>
      </View>

      <FlatList
        data={soloQuizCategories}
        keyExtractor={(item) => item.name}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryCard,
              selectedCategory === item.name && styles.categoryCardSelected,
            ]}
            onPress={() => setSelectedCategory(item.name)}
          >
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{item.name}</Text>
              <Text style={styles.categoryCount}>{item.questionCount} questions</Text>
            </View>
            <Text style={styles.badgeDifficulty}>{item.difficulty}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  topBanner: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  bannerSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  listContent: {
    padding: 16,
  },
  categoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryCardSelected: {
    borderColor: '#4f46e5',
    backgroundColor: '#eef2ff',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  categoryCount: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  badgeDifficulty: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4f46e5',
    backgroundColor: '#e0e7ff',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
});
