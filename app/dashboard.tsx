// app/dashboard.tsx
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../constants/endpoint';

export default function DashboardScreen() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [showInstruction, setShowInstruction] = useState(true);

  // Label modal state
  const [labelModalVisible, setLabelModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalItems, setModalItems] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('user');
      if (!stored) return router.replace('/');
      setUser(JSON.parse(stored));

      const { status: imgPerm } = await ImagePicker.requestCameraPermissionsAsync();
      if (imgPerm !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required.');
      }
    })();
  }, []);

  const handleCapture = async () => {
    // Clear previous output
    setAnalysis(null);
    setImageUri(null);
    setShowInstruction(false);
    setLoading(true);

    try {
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });
      if (result.canceled) {
        setLoading(false);
        return;
      }

      const uri = result.assets[0].uri;
      setImageUri(uri);

      const form = new FormData();
      form.append('image', { uri, name: 'food.jpg', type: 'image/jpeg' } as any);

      const res = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalysis(data);
    } catch (err: any) {
      Alert.alert('Analysis Error', err.message);
    }
    setLoading(false);
  };

  // Determine which ingredients match a given label
  const handleLabelPress = (label: string) => {
    if (!analysis) return;
    const items = analysis.ingredients_analyzed
      .filter((ing: any) => {
        if (label.includes('Artificial')) return ing.type === 'Artificial';
        if (label.includes('Synthetic')) return ing.type === 'Synthetic';
        if (label.includes('Unhealthy')) return ing.safety_level === 'Above Safe Limit';
        if (label === 'Processed') return ing.processing_level === 'Processed';
        if (label === 'Unprocessed') return ing.processing_level === 'Unprocessed';
        if (label.includes('Potentially')) // "Potentially Harmful"
          return ing.health_impact && ing.health_impact !== 'No known adverse effect';
        return false;
      })
      .map((ing: any) => ing.name);

    setModalTitle(label);
    setModalItems(items);
    setLabelModalVisible(true);
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Menu Modal */}
      <Modal visible={menuVisible} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalName}>{user?.name}</Text>
            <Text style={styles.modalEmail}>{user?.email}</Text>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutBtnText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Label Details Modal */}
      <Modal visible={labelModalVisible} transparent animationType="fade">
        <View style={styles.detailOverlay}>
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>{modalTitle}</Text>
            {modalItems.length > 0 ? (
              modalItems.map((name, i) => (
                <Text key={i} style={styles.detailItem}>
                  • {name}
                </Text>
              ))
            ) : (
              <Text style={styles.detailItem}>No matching ingredients</Text>
            )}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setLabelModalVisible(false)}
            >
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Main Content */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {showInstruction && (
            <View style={styles.instructionBox}>
              <Ionicons name="information-circle-outline" size={20} color="#0055aa" />
              <Text style={styles.instructionText}>
                Tap “Capture & Analyze” below, take a photo of the label, crop it, and confirm.
              </Text>
            </View>
          )}

          {loading && (
            <ActivityIndicator size="large" color="#0066cc" style={styles.loader} />
          )}

          {imageUri && (
            <View style={styles.previewCard}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            </View>
          )}

          {analysis && (
            <View style={styles.resultCard}>
              {/* Health Labels */}
              <View style={styles.subCard}>
                <Text style={styles.subCardTitle}>Health Labels</Text>
                <View style={styles.labelsRow}>
                  {analysis.product_labels.map((label: string, i: number) => {
                    const isWarning =
                      /Unhealthy|Artificial|Synthetic|Potentially/.test(label);
                    return (
                      <TouchableOpacity
                        key={i}
                        style={[
                          styles.labelChip,
                          isWarning && styles.labelWarning,
                        ]}
                        onPress={() => handleLabelPress(label)}
                      >
                        <Text
                          style={[
                            styles.labelText,
                            isWarning && styles.labelTextWarning,
                          ]}
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Suggested Alternatives */}
              <View style={styles.subCard}>
                <Text style={styles.subCardTitle}>Suggested Alternatives</Text>
                {analysis.suggested_alternatives.map((alt: any, idx: number) => (
                  <View key={idx} style={styles.altRow}>
                    <View style={styles.altInfo}>
                      <Text style={styles.altName}>{alt.name}</Text>
                      <Text style={styles.altDetail}>
                        {alt.brand} • {alt.category}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.buyBtn}
                      onPress={() => Linking.openURL(alt.buy_link)}
                    >
                      <Text style={styles.buyBtnText}>Buy Now</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.captureBtn} onPress={handleCapture}>
            <Ionicons name="camera" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.captureBtnText}>Capture & Analyze</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f2f5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: StatusBar.currentHeight ?? 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  hamburger: { padding: 4 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
  },

  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },

  instructionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f4fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  instructionText: { marginLeft: 8, color: '#0055aa', fontSize: 14 },

  loader: { marginVertical: 20 },

  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 2,
  },
  previewImage: { width: '100%', height: 220 },

  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 2,
  },

  subCard: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  subCardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },

  labelsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  labelChip: {
    backgroundColor: '#e0f7fa',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  labelText: { fontSize: 12, color: '#00796b' },
  labelWarning: { backgroundColor: '#fdecea' },
  labelTextWarning: { color: '#c0392b' },

  altRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  altInfo: { flex: 1, marginRight: 10 },
  altName: { fontSize: 14, fontWeight: '600', color: '#333' },
  altDetail: { fontSize: 12, color: '#666' },
  buyBtn: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  buyBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f0f2f5',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  captureBtn: {
    flexDirection: 'row',
    backgroundColor: '#0066cc',
    paddingVertical: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  logoutBtn: {
    marginTop: 20,
    backgroundColor: '#dc3545',
    paddingVertical: 12,
    borderRadius: 8,
  },
  logoutBtnText: { color: '#fff', textAlign: 'center', fontWeight: '600' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 24,
    paddingTop: 40,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    elevation: 4,
  },

  detailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  detailTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  detailItem: { fontSize: 14, marginBottom: 8 },

  closeBtn: {
    marginTop: 12,
    alignSelf: 'flex-end',
    backgroundColor: '#0066cc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  closeBtnText: { color: '#fff', fontWeight: '600' },
});
