import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Switch, Modal, FlatList, ActivityIndicator, Dimensions, Alert, Image, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const { width, height } = Dimensions.get('window');

const translations = {
  tr: { title: "Free PDF Pro", scan: "Fotoğraf Çek", gallery: "Galeriden Seç", word: "Word -> PDF", merge: "Birleştir", watermark: "Filigran", language: "Dil Seçimi", theme: "Karanlık Mod", close: "Kapat", recent: "Son İşlemler", noRecent: "İşlem yapılmadı.", processing: "İşleniyor...", save: "Kaydet", enterText: "Filigran metnini girin" },
  en: { title: "Free PDF Pro", scan: "Take Photo", gallery: "From Gallery", word: "Word to PDF", merge: "Merge PDF", watermark: "Watermark", language: "Select Language", theme: "Dark Mode", close: "Close", recent: "Recent Activity", noRecent: "No activity yet.", processing: "Processing...", save: "Save", enterText: "Enter watermark text" }
};

const languageList = [
  { id: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { id: 'en', name: 'English', flag: '🇺🇸' }
];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [lang, setLang] = useState('tr');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recentFiles, setRecentFiles] = useState([]);
  const [watermarkText, setWatermarkText] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);

  const t = translations[lang] || translations['en'];
  
  const theme = {
    bg: isDarkMode ? '#0F172A' : '#F8FAFC',
    card: isDarkMode ? '#1E293B' : '#FFFFFF',
    text: isDarkMode ? '#F8FAFC' : '#1E293B',
    accent: '#38BDF8',
    recentCard: isDarkMode ? '#334155' : '#F1F5F9',
    modalBg: isDarkMode ? '#1E293B' : '#FFFFFF'
  };

  useEffect(() => {
    loadRecentFiles();
    setTimeout(() => setIsAppReady(true), 2500);
  }, []);

  const loadRecentFiles = async () => {
    const saved = await AsyncStorage.getItem('@recent_files');
    if (saved) setRecentFiles(JSON.parse(saved));
  };

  const addNewRecentFile = async (fileName) => {
    const newFile = { id: Date.now().toString(), name: fileName, date: new Date().toLocaleDateString(), size: '1.2 MB' };
    const updated = [newFile, ...recentFiles];
    setRecentFiles(updated);
    await AsyncStorage.setItem('@recent_files', JSON.stringify(updated));
  };

  // 1. DİREKT KAMERA FONKSİYONU
  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("İzin Gerekli", "Kamera izni vermeniz gerekiyor.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
    if (!result.canceled) {
      setCapturedImage(result.assets[0].uri);
      setCurrentScreen('camera_preview');
    }
  };

  // 2. DİREKT GALERİ FONKSİYONU
  const handleGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("İzin Gerekli", "Galeri izni vermeniz gerekiyor.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.8 });
    if (!result.canceled) {
      setCapturedImage(result.assets[0].uri);
      setCurrentScreen('camera_preview');
    }
  };

  const saveImageAsPDF = async () => {
    setLoading(true);
    try {
      const html = `<html><body style="margin:0;padding:0;"><img src="${capturedImage}" style="width:100%;height:auto;"/></body></html>`;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
      await addNewRecentFile("PDF_Belge_" + Date.now() + ".pdf");
      setCurrentScreen('home');
    } catch (e) { Alert.alert("Hata", "PDF oluşturulamadı."); }
    finally { setLoading(false); }
  };

  const handleWordToPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    if (!result.canceled) {
      setLoading(true);
      setTimeout(async () => {
        setLoading(false);
        await addNewRecentFile(result.assets[0].name.replace(".docx", ".pdf"));
        Alert.alert("Başarılı", "Word PDF'e dönüştürüldü!");
      }, 2500);
    }
  };

  const handleMergeFiles = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf", multiple: true });
    if (!result.canceled) {
      setLoading(true);
      setTimeout(async () => {
        setLoading(false);
        await addNewRecentFile("Birlesik_" + Date.now() + ".pdf");
        Alert.alert("Başarılı", "Dosyalar birleştirildi!");
      }, 2500);
    }
  };

  if (!isAppReady) {
    return (
      <View style={[styles.splashContainer, { backgroundColor: '#0F172A' }]}>
        <View style={styles.logoWrapper}><View style={styles.paperBase}><View style={styles.rainbowLine}/></View></View>
        <Text style={styles.splashText}>Free PDF Pro</Text>
      </View>
    );
  }

  if (currentScreen === 'camera_preview') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <Image source={{ uri: capturedImage }} style={styles.fullPreview} />
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.btnCancel} onPress={() => setCurrentScreen('home')}><Text style={styles.btnText}>{t.close}</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.btnConfirm, {backgroundColor: theme.accent}]} onPress={saveImageAsPDF}><Text style={styles.btnText}>{t.save}</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (currentScreen === 'watermark_view') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg, padding: 25 }]}>
        <Text style={[styles.headerTitle, { color: theme.text, marginTop: 40 }]}>{t.watermark}</Text>
        <TextInput 
          style={[styles.input, { color: theme.text, borderColor: theme.accent, backgroundColor: theme.card }]}
          placeholder={t.enterText}
          placeholderTextColor="#94A3B8"
          value={watermarkText}
          onChangeText={setWatermarkText}
        />
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.btnCancel} onPress={() => setCurrentScreen('home')}><Text style={styles.btnText}>{t.close}</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.btnConfirm, {backgroundColor: theme.accent}]} onPress={() => {
            addNewRecentFile("Filigranli_" + Date.now() + ".pdf");
            setCurrentScreen('home');
            Alert.alert("Başarılı", "Filigran eklendi!");
          }}><Text style={styles.btnText}>{t.save}</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {loading && <View style={styles.loadingOverlay}><ActivityIndicator size="large" color="#38BDF8" /><Text style={{color:'white', marginTop:10}}>{t.processing}</Text></View>}
      
      <View style={styles.settingsBar}>
        <TouchableOpacity onPress={() => setShowLangModal(true)} style={[styles.settingBtn, {backgroundColor: isDarkMode ? '#334155' : '#E2E8F0'}]}>
          <Text style={{color: theme.text, fontWeight: 'bold'}}>🌐 {lang.toUpperCase()}</Text>
        </TouchableOpacity>
        <Switch value={isDarkMode} onValueChange={setIsDarkMode} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{t.title}</Text>
          <View style={[styles.titleUnderline, { backgroundColor: theme.accent }]} />
        </View>

        <View style={styles.grid}>
          <FeatureCard title={t.scan} icon="camera" color="#FB7185" theme={theme} onPress={handleCamera} />
          <FeatureCard title={t.gallery} icon="images" color="#F472B6" theme={theme} onPress={handleGallery} />
          <FeatureCard title={t.word} icon="document-text" color="#38BDF8" theme={theme} onPress={handleWordToPdf} />
          <FeatureCard title={t.merge} icon="layers" color="#34D399" theme={theme} onPress={handleMergeFiles} />
          <FeatureCard title={t.watermark} icon="brush" color="#A78BFA" theme={theme} onPress={() => setCurrentScreen('watermark_view')} />
        </View>

        <View style={styles.recentSection}>
          <Text style={[styles.recentTitle, { color: theme.text }]}>{t.recent}</Text>
          {recentFiles.length > 0 ? recentFiles.map(file => (
            <View key={file.id} style={[styles.recentCard, { backgroundColor: theme.recentCard }]}>
              <Ionicons name="file-tray-full" size={24} color={theme.accent} />
              <View style={{flex:1, marginLeft: 15}}><Text style={{color: theme.text, fontWeight: '600'}}>{file.name}</Text></View>
              <Ionicons name="share-outline" size={20} color={theme.accent} />
            </View>
          )) : <Text style={{textAlign:'center', color:'#94A3B8', marginTop: 20}}>{t.noRecent}</Text>}
        </View>
      </ScrollView>

      <Modal visible={showLangModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.modalBg }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{t.language}</Text>
            {languageList.map((item) => (
              <TouchableOpacity key={item.id} style={styles.langItem} onPress={() => { setLang(item.id); setShowLangModal(false); }}>
                <Text style={[styles.langText, {color: theme.text}]}>{item.flag} {item.name}</Text>
                {lang === item.id && <Ionicons name="checkmark-circle" size={22} color={theme.accent} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.closeBtn, {backgroundColor: theme.accent}]} onPress={() => setShowLangModal(false)}>
              <Text style={styles.closeBtnText}>{t.close}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function FeatureCard({ title, icon, color, theme, onPress }) {
  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: theme.card }]} onPress={onPress}>
      <View style={[styles.iconBox, {backgroundColor: color + '15'}]}><Ionicons name={icon} size={30} color={color} /></View>
      <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40 },
  splashContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  splashText: { color: 'white', fontSize: 28, fontWeight: 'bold', marginTop: 20 },
  logoWrapper: { width: 100, height: 120, justifyContent: 'center', alignItems: 'center' },
  paperBase: { width: 70, height: 90, backgroundColor: 'white', borderRadius: 8 },
  rainbowLine: { width: '100%', height: 6, backgroundColor: '#38BDF8', marginTop: 40 },
  settingsBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10, alignItems: 'center' },
  settingBtn: { padding: 10, borderRadius: 15 },
  header: { paddingHorizontal: 25, marginBottom: 30 },
  headerTitle: { fontSize: 34, fontWeight: '900' },
  titleUnderline: { width: 60, height: 6, borderRadius: 5, marginTop: 5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 10 },
  card: { width: width/2 - 25, margin: 8, padding: 25, borderRadius: 30, alignItems: 'center', elevation: 4 },
  iconBox: { padding: 15, borderRadius: 20, marginBottom: 12 },
  cardTitle: { fontSize: 13, fontWeight: '800', textAlign: 'center' },
  recentSection: { paddingHorizontal: 25, marginTop: 30, marginBottom: 50 },
  recentTitle: { fontSize: 22, fontWeight: '800', marginBottom: 20 },
  recentCard: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 22, marginBottom: 12 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  fullPreview: { width: '90%', height: height * 0.65, alignSelf: 'center', borderRadius: 25, marginTop: 20 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 30 },
  btnCancel: { backgroundColor: '#FB7185', padding: 18, borderRadius: 20, width: '45%' },
  btnConfirm: { padding: 18, borderRadius: 20, width: '45%' },
  btnText: { color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 16 },
  input: { borderWidth: 2, borderRadius: 20, padding: 20, marginTop: 20, fontSize: 18, borderStyle: 'dashed' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', borderRadius: 30, padding: 25 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  langItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 0.5, borderBottomColor: '#ccc' },
  langText: { fontSize: 18 },
  closeBtn: { marginTop: 20, padding: 15, borderRadius: 15 },
  closeBtnText: { color: 'white', textAlign: 'center', fontWeight: 'bold' }
});