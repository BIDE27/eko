import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

const tools = [
  { id: '1', title: 'Calculatrice Scientifique', icon: '🔢', desc: 'Fonctions standards, trigo et historique' },
  { id: '2', title: 'Tableau Interactif', icon: '🎨', desc: 'Tableau blanc infini pour dessiner et calculer' },
  { id: '3', title: 'Table de Multiplication', icon: '✖️', desc: 'Entraînement gamifié et calcul mental' },
  { id: '4', title: 'Dictionnaire Français', icon: '📖', desc: 'Définitions, étymologie, synonymes' },
  { id: '5', title: 'Dictionnaire FR-EN', icon: '🌐', desc: 'Traductions et prononciations avec audio' },
  { id: '6', title: 'Conjugaison Française', icon: '✍️', desc: 'Tous les temps et modes verbaux' },
  { id: '7', title: 'Livre de Dictées', icon: '🎧', desc: 'Dictées audio avec correction automatique' },
  { id: '8', title: 'Formules de Maths', icon: '📐', desc: 'Fiches et rappels de formules' },
];

export default function OutilsScreen() {
  return (
    <View style={styles.container}>
      <FlatList
        data={tools}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <Text style={styles.icon}>{item.icon}</Text>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.desc}>{item.desc}</Text>
            </View>
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
  list: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  icon: {
    fontSize: 28,
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  desc: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
});
