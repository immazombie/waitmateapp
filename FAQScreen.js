import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const faqData = [
  {
    question: '🕒 What is WaitMate?',
    answer:
      'WaitMate is a sleek mobile app that helps you find out how long the wait is at local restaurants — whether you’re dining in or grabbing takeout. All wait times are submitted by real users and updated in real time.',
  },
  {
    question: '📍 How does it work?',
    answer:
      'Open the app and browse nearby restaurants on the map.\n\nSee current average wait times (updated within the last 2 hours).\n\nTap a restaurant card to view more info or log your own wait time.\n\nFilter by wait length, visit type (dine-in or takeout), and more!',
  },
  {
    question: '🧠 Where do the wait times come from?',
    answer:
      'Wait times are crowd-sourced — users like you submit them after visiting a restaurant. The app calculates the average from submissions in the last 2 hours so you always get the freshest info.',
  },
  {
    question: '✍️ How can I submit a wait time?',
    answer:
      'Just tap on a restaurant card, scroll to the bottom, and enter:\n\n• Your wait time\n• Whether it was dine-in or takeout\n\nDone! 🙌',
  },
  {
    question: '🧭 Why do some restaurants not show up?',
    answer:
      'We’re starting with a list of local spots in your area! If a place is missing, hit the ☰ menu > Suggest a Restaurant and let us know — we’re constantly updating!',
  },
  {
    question: '🖼️ Where do the restaurant images come from?',
    answer:
      "Images are pulled automatically from Unsplash or a similar open-source image service. We're working on adding support for real photos soon!",
  },
  {
    question: '🌶️ What do the glowing dots on the map mean?',
    answer:
      'They show how long the wait is:\n\n🟢 Green = Under 10 minutes\n🟡 Yellow = Around 10–15 minutes\n🔴 Red = Over 15 minutes\n\nMore glow = more activity!',
  },
  {
    question: '🔍 Can I search or filter restaurants?',
    answer:
      'Yes! Use the search bar to find places by name or type. Filters let you narrow by:\n\n• Dine-in or takeout\n• Shortest/longest wait\n\nAnd more coming soon!',
  },
  {
    question: '🔒 Is my location tracked?',
    answer:
      'Only while you’re actively using the app and only to help suggest nearby restaurants or autofill your location in forms. We don’t store or share your location data.',
  },
  {
    question: '🎉 What’s next for WaitMate?',
    answer:
      "We're cooking up some exciting new features:\n\n🎯 Smart peak time predictions (using Python magic 🐍)\n🌡️ Heatmap-style visuals to spot busy areas fast\n🏆 Rewards + badges for frequent contributors\n🌐 A public web version for non-app users\n🙋‍♀️ User profiles & saved favorite spots\n\nHave an idea? Suggest a feature from the ☰ menu!",
  },
];

export default function FAQScreen() {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const toggleExpand = (index) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <LinearGradient
      colors={['#FFF5F0', '#EAF6FF']}
      style={{ flex: 1 }}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 16 }}>❓ WaitMate FAQ</Text>

          {faqData.map((item, index) => {
            const isOpen = expandedIndex === index;

            return (
              <View key={index} style={{ marginBottom: 16, borderRadius: 14, overflow: 'hidden' }}>
                <LinearGradient
                  colors={isOpen ? ['#FFD6C0', '#C6E6FF'] : ['#FFEFE7', '#E0F2FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 14,
                    padding: 16,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => toggleExpand(index)}
                    activeOpacity={0.85}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: 'bold', flex: 1 }}>{item.question}</Text>
                    <Text style={{ fontSize: 20, marginLeft: 8 }}>{isOpen ? '➖' : '➕'}</Text>
                  </TouchableOpacity>

                  {isOpen && (
                    <View style={{ marginTop: 12 }}>
                      <Text style={{ fontSize: 15, lineHeight: 22 }}>{item.answer}</Text>
                    </View>
                  )}
                </LinearGradient>
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
