import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';

interface ChatMessage {
  id: string;
  sender: 'user' | 'fumi';
  text: string;
}

export default function FumiScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'fumi',
      text: 'Bonjour ! Je suis Fumi, ton tuteur IA. En quoi puis-je t\'aider aujourd\'hui ? (Maths, Physique, Français, Quiz...)',
    },
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    // Simulate AI response response placeholder until API endpoint connected
    setTimeout(() => {
      const fumiReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'fumi',
        text: 'C\'est une excellente question ! Laisse-moi analyser ça pour toi...',
      };
      setMessages((prev) => [...prev, fumiReply]);
    }, 600);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.messagesContainer} contentContainerStyle={styles.messagesContent}>
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageBubble,
              msg.sender === 'user' ? styles.userBubble : styles.fumiBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                msg.sender === 'user' ? styles.userText : styles.fumiText,
              ]}
            >
              {msg.text}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Pose ta question à Fumi..."
          placeholderTextColor="#9ca3af"
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>Envoyer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#4f46e5',
    borderBottomRightRadius: 4,
  },
  fumiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#ffffff',
  },
  fumiText: {
    color: '#1f2937',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    height: 42,
    backgroundColor: '#f3f4f6',
    borderRadius: 21,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#1f2937',
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: '#4f46e5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
