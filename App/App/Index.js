import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Alert, Linking, Modal, Image, RefreshControl,
  Platform, AppState, Animated, Easing, Dimensions, Clipboard,
  SafeAreaView, KeyboardAvoidingView, FlatList, StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Speech from 'expo-speech';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import * as Localization from 'expo-localization';
import XLSX from 'xlsx';
import CryptoJS from 'crypto-js';
import { I18n } from 'i18n-js';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Feather, FontAwesome, MaterialIcons } from '@expo/vector-icons';

// ==================== إعدادات التطبيق 2026 ====================
const APP_CONFIG = {
  developer: {
    name: "mais abbas",
    signature: "✨ Developed by mais abbas",
    email: "maisabbas445@gmail.com",
    phone: "+966930127500",
    whatsapp: "https://wa.me/966930127500",
    telegram: "https://t.me/maisabbas",
    portfolio: "https://maisabbas.com"
  },
  
  branding: {
    appName: "Simply AI",
    tagline: "Smart Arabic Chat Assistant",
    version: "3.0.0",
    releaseDate: "2026",
    copyright: "© 2026 Simply AI. All rights reserved.",
    year: "2026"
  },
  
  ai: {
    apiKey: process.env.EXPO_PUBLIC_OPENAI_KEY || "demo-key",
    endpoint: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4",
    fallbackModel: "gpt-3.5-turbo"
  },
  
  payments: {
    monthlyPrice: 20,   // 20$ شهري
    yearlyPrice: 100,   // 100$ سنوي
    nowPayments: {
      apiKey: "kaYz4lppJ37tYTrtawZ/J+wTvFQH1rtx",
      walletAddress: "7wfBon4Jri8r7vSNa9kG3nGBtS8HawTUANDKfxaH3xnN",
      endpoint: "https://api.nowpayments.io/v1"
    },
    bankInfo: {
      name: "الراجحي",
      accountName: "mais abbas",
      accountNumber: "SA0380001234567890123456"
    }
  }
};

// ==================== نظام تحليل المشاعر ====================
class SentimentAnalyzer {
  static async analyzeText(text) {
    try {
      const response = await axios.post(
        APP_CONFIG.ai.endpoint,
        {
          model: APP_CONFIG.ai.fallbackModel,
          messages: [
            {
              role: "system",
              content: "قم بتحليل المشاعر في النص وأعد النتيجة كـ JSON فقط: {sentiment: 'positive'|'negative'|'neutral', confidence: 0-1, emotion: 'happy'|'sad'|'angry'|'neutral'|'excited'}"
            },
            {
              role: "user",
              content: `حلل مشاعر هذا النص: "${text}"`
            }
          ],
          temperature: 0.3,
          max_tokens: 100
        },
        {
          headers: {
            'Authorization': `Bearer ${APP_CONFIG.ai.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      try {
        const responseText = response.data.choices[0].message.content;
        const jsonMatch = responseText.match(/\{.*\}/);
        if (jsonMatch) {
          const analysis = JSON.parse(jsonMatch[0]);
          return analysis;
        }
      } catch (parseError) {
        console.log('JSON parse error, using default');
      }
      
      // الرد الافتراضي إذا فشل التحليل
      return {
        sentiment: 'neutral',
        confidence: 0.5,
        emotion: 'neutral'
      };
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return {
        sentiment: 'neutral',
        confidence: 0.5,
        emotion: 'neutral'
      };
    }
  }

  static getThemeColors(emotion) {
    const themes = {
      happy: {
        primary: '#4CAF50',
        secondary: '#8BC34A',
        background: '#F1F8E9',
        gradient: ['#4CAF50', '#8BC34A'],
        bubbleUser: '#4CAF50',
        bubbleAI: '#E8F5E9',
        textColor: '#1B5E20'
      },
      sad: {
        primary: '#2196F3',
        secondary: '#03A9F4',
        background: '#E3F2FD',
        gradient: ['#2196F3', '#03A9F4'],
        bubbleUser: '#2196F3',
        bubbleAI: '#E3F2FD',
        textColor: '#0D47A1'
      },
      angry: {
        primary: '#F44336',
        secondary: '#FF9800',
        background: '#FFEBEE',
        gradient: ['#F44336', '#FF9800'],
        bubbleUser: '#F44336',
        bubbleAI: '#FFEBEE',
        textColor: '#B71C1C'
      },
      excited: {
        primary: '#9C27B0',
        secondary: '#E91E63',
        background: '#F3E5F5',
        gradient: ['#9C27B0', '#E91E63'],
        bubbleUser: '#9C27B0',
        bubbleAI: '#F3E5F5',
        textColor: '#4A148C'
      },
      neutral: {
        primary: '#667eea',
        secondary: '#764ba2',
        background: '#f5f5f5',
        gradient: ['#667eea', '#764ba2'],
        bubbleUser: '#667eea',
        bubbleAI: '#f0f0f0',
        textColor: '#333'
      }
    };
    return themes[emotion] || themes.neutral;
  }

  static getEmotionArabic(emotion) {
    const emotions = {
      happy: 'سعادة 😊',
      sad: 'حزن 😔',
      angry: 'غضب 😠',
      excited: 'حماس 🤩',
      neutral: 'حيادية 😐'
    };
    return emotions[emotion] || 'حيادية 😐';
  }

  static getEmotionEmoji(emotion) {
    const emojis = {
      happy: '😊',
      sad: '😔',
      angry: '😠',
      excited: '🤩',
      neutral: '😐'
    };
    return emojis[emotion] || '😐';
  }
}

// ==================== نظام NOWPayments التلقائي ====================
class NowPaymentsService {
  static async createInvoice(plan, userEmail) {
    try {
      const amount = plan === 'monthly' ? 20 : 100;
      
      const response = await axios.post(
        `${APP_CONFIG.payments.nowPayments.endpoint}/invoice`,
        {
          price_amount: amount,
          price_currency: 'usd',
          pay_currency: 'USDT',
          ipn_callback_url: 'https://simplyai-webhook.vercel.app/api/nowpayments',
          order_id: `ORDER_${Date.now()}_${userEmail}`,
          order_description: `Simply AI ${plan} Subscription`,
          success_url: 'simplyai://payment/success',
          cancel_url: 'simplyai://payment/cancel'
        },
        {
          headers: {
            'x-api-key': APP_CONFIG.payments.nowPayments.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        invoiceUrl: response.data.invoice_url,
        paymentId: response.data.payment_id,
        payAddress: response.data.pay_address,
        payAmount: response.data.pay_amount,
        expiryDate: response.data.expiration_date,
        instructions: this.generateInstructions(response.data)
      };
    } catch (error) {
      console.error('NOWPayments Error:', error.response?.data || error.message);
      return {
        success: false,
        error: 'فشل إنشاء الفاتورة'
      };
    }
  }

  static generateInstructions(paymentData) {
    return `
💰 *خطوات الدفع التلقائي:*
  
1. *أرسل ${paymentData.pay_amount} USDT*
2. *إلى العنوان:* \`${paymentData.pay_address}\`
3. *الشبكة:* TRC20 (للتحويل السريع)
  
⏰ *مدة الانتظار:* 2-5 دقائق للتفعيل التلقائي
✅ *التفعيل:* تلقائي بعد تأكيد الدفع
📧 *الإشعار:* ستصل رسالة تأكيد
  
*ملاحظة:* تأكد من استخدام شبكة TRC20 للسرعة
    `;
  }

  static async checkPaymentStatus(paymentId) {
    try {
      const response = await axios.get(
        `${APP_CONFIG.payments.nowPayments.endpoint}/payment/${paymentId}`,
        {
          headers: {
            'x-api-key': APP_CONFIG.payments.nowPayments.apiKey
          }
        }
      );

      const status = response.data.payment_status;
      
      if (status === 'finished' || status === 'confirmed') {
        return {
          success: true,
          status: 'completed',
          amount: response.data.price_amount,
          currency: response.data.pay_currency
        };
      }
      
      return {
        success: false,
        status: status,
        message: this.getStatusMessage(status)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  static getStatusMessage(status) {
    const messages = {
      waiting: '⏳ بانتظار الدفع',
      confirming: '🔍 جاري تأكيد الدفع',
      confirmed: '✅ تم تأكيد الدفع',
      sending: '🔄 جاري الإرسال',
      finished: '🎉 تم الدفع بنجاح',
      failed: '❌ فشل الدفع',
      refunded: '💸 تم الاسترجاع'
    };
    return messages[status] || 'جاري المعالجة';
  }

  static async verifyWebhook(signature, payload) {
    const expectedSignature = CryptoJS.HmacSHA512(
      JSON.stringify(payload),
      APP_CONFIG.payments.nowPayments.apiKey
    ).toString();
    
    return signature === expectedSignature;
  }
}

// ==================== نظام الدفع المتكامل ====================
class PaymentService {
  static async processPayment(plan, method, userInfo) {
    try {
      const amount = plan === 'monthly' ? 20 : 100;
      const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      let paymentResult;
      
      switch(method) {
        case 'nowpayments':
          paymentResult = await this.processNowPayments(plan, userInfo.email);
          break;
          
        case 'stc':
          paymentResult = await this.processSTCPay(amount, userInfo.phone);
          break;
          
        case 'bank':
          paymentResult = await this.processBankTransfer(amount, userInfo);
          break;
          
        default:
          throw new Error('طريقة دفع غير معروفة');
      }
      
      if (paymentResult.success) {
        const transaction = {
          id: transactionId,
          plan: plan,
          method: method,
          amount: amount,
          status: method === 'nowpayments' ? 'pending' : 'completed',
          userInfo: userInfo,
          date: new Date().toISOString(),
          paymentData: paymentResult
        };
        
        await this.saveTransaction(transaction);
        
        return {
          success: true,
          transaction: transaction,
          instructions: paymentResult.instructions,
          autoActivate: method === 'nowpayments'
        };
      } else {
        throw new Error(paymentResult.error || 'فشل معالجة الدفع');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async processNowPayments(plan, userEmail) {
    const result = await NowPaymentsService.createInvoice(plan, userEmail);
    
    if (result.success) {
      this.startPaymentMonitoring(result.paymentId, userEmail, plan);
      
      return {
        success: true,
        paymentId: result.paymentId,
        invoiceUrl: result.invoiceUrl,
        instructions: result.instructions,
        payAddress: result.payAddress,
        payAmount: result.payAmount
      };
    }
    
    return result;
  }

  static async processSTCPay(amount, phoneNumber) {
    const formattedPhone = phoneNumber?.replace(/\D/g, '');
    
    return {
      success: true,
      instructions: `
📱 *خطوات الدفع عبر STC Pay:*
  
1. *افتح تطبيق STC Pay*
2. *أرسل ${amount}$*
3. *إلى الرقم:* ${APP_CONFIG.developer.phone}
4. *اكتب في الملاحظة:* SIMPLYAI
  
⚡ *التفعيل:* خلال 10 دقائق بعد الإرسال
📞 *للتفعيل السريع:* واتساب ${APP_CONFIG.developer.whatsapp}
      `,
      phone: APP_CONFIG.developer.phone,
      amount: amount
    };
  }

  static async processBankTransfer(amount, userInfo) {
    return {
      success: true,
      instructions: `
🏦 *خطوات التحويل البنكي:*
  
*البنك:* ${APP_CONFIG.payments.bankInfo.name}
*الحساب:* ${APP_CONFIG.payments.bankInfo.accountName}
*الرقم:* ${APP_CONFIG.payments.bankInfo.accountNumber}
*المبلغ:* ${amount}$
  
📸 *بعد التحويل:*
1. احفظ صورة إثبات الدفع
2. أرسلها على واتساب ${APP_CONFIG.developer.whatsapp}
3. اكتب اسمك: ${userInfo.name || 'المستخدم'}
  
⏰ *مدة التفعيل:* 1-2 ساعة عمل
      `,
      bankDetails: APP_CONFIG.payments.bankInfo
    };
  }

  static startPaymentMonitoring(paymentId, userEmail, plan) {
    let attempts = 0;
    const maxAttempts = 20;
    
    const interval = setInterval(async () => {
      attempts++;
      
      const status = await NowPaymentsService.checkPaymentStatus(paymentId);
      
      if (status.success) {
        clearInterval(interval);
        await this.autoActivateSubscription(paymentId, userEmail, plan);
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        console.log('Payment monitoring timeout');
      }
    }, 30000);
  }

  static async autoActivateSubscription(paymentId, userEmail, plan) {
    try {
      const activationData = {
        paymentId: paymentId,
        userEmail: userEmail,
        plan: plan,
        activatedAt: new Date().toISOString(),
        expiryDate: this.calculateExpiryDate(plan)
      };
      
      await AsyncStorage.setItem(
        `subscription_${userEmail}`,
        JSON.stringify(activationData)
      );
      
      console.log('Subscription activated for:', userEmail);
      
      return {
        success: true,
        activationData: activationData
      };
    } catch (error) {
      console.error('Auto activation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static calculateExpiryDate(plan) {
    const now = new Date();
    if (plan === 'monthly') {
      return new Date(now.setMonth(now.getMonth() + 1)).toISOString();
    } else if (plan === 'yearly') {
      return new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();
    }
    return null;
  }

  static async saveTransaction(transaction) {
    try {
      const transactions = await AsyncStorage.getItem('payment_transactions') || '[]';
      const parsed = JSON.parse(transactions);
      parsed.push(transaction);
      await AsyncStorage.setItem('payment_transactions', JSON.stringify(parsed));
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  }

  static async getUserTransactions(userEmail) {
    try {
      const transactions = await AsyncStorage.getItem('payment_transactions') || '[]';
      const parsed = JSON.parse(transactions);
      return parsed.filter(t => t.userInfo?.email === userEmail);
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }
}

// ==================== نظام الذكاء الاصطناعي ====================
class AIService {
  static async getResponse(message, tone = 'friendly', context = []) {
    try {
      const tones = {
        friendly: 'رد بطريقة ودودة ومرحة',
        formal: 'رد بطريقة رسمية واحترافية',
        funny: 'رد بطريقة مضحكة ومسلية',
        professional: 'رد بطريقة احترافية مع حلول عملية'
      };

      const systemMessage = {
        role: 'system',
        content: `أنت مساعد ذكي يتحدث العربية. ${tones[tone]} أنت تعمل في عام 2026 وتواكب أحدث التطورات. أجب بطريقة مفيدة وآمنة.`
      };

      const messages = [systemMessage, ...context.slice(-5), { role: 'user', content: message }];

      const response = await axios.post(
        APP_CONFIG.ai.endpoint,
        {
          model: APP_CONFIG.ai.model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000
        },
        {
          headers: {
            'Authorization': `Bearer ${APP_CONFIG.ai.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('AI Error:', error);
      return this.getDefaultResponse(tone);
    }
  }

  static getDefaultResponse(tone) {
    const responses = {
      friendly: "مرحباً! 🌟 أنا مساعدك الذكي، جاهز للإجابة على أسئلتك!",
      formal: "تحية طيبة، يسرني تقديم المساعدة. ما هو استفسارك؟",
      funny: "يا هلا! 😄 أنا مليان طاقة وإجابات، جرب تسألني أي شيء!",
      professional: "مرحباً، أنا هنا لتقديم الحلول العملية. كيف يمكنني مساعدتك؟"
    };
    return responses[tone] || responses.friendly;
  }
}

// ==================== نظام التصدير ====================
class ExportService {
  static async exportToPDF(messages) {
    try {
      const html = this.generatePDFHTML(messages);
      const { uri } = await Print.printToFileAsync({ html });
      
      const fileName = `محادثة_${Date.now()}.pdf`;
      const newUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.moveAsync({ from: uri, to: newUri });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newUri);
      }
      
      return { success: true, uri: newUri };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static generatePDFHTML(messages) {
    return `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Arial', sans-serif; padding: 40px; }
          .header { text-align: center; margin-bottom: 40px; }
          .message { margin-bottom: 20px; padding: 15px; border-radius: 10px; }
          .user { background: #e3f2fd; }
          .ai { background: #f3e5f5; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>محادثة Simply AI</h1>
          <p>${new Date().toLocaleDateString('ar-SA')}</p>
        </div>
        ${messages.map(msg => `
          <div class="message ${msg.sender}">
            <strong>${msg.sender === 'user' ? 'أنت' : 'Simply AI'}:</strong>
            <p>${msg.text}</p>
            <div>${msg.time}</div>
          </div>
        `).join('')}
      </body>
      </html>
    `;
  }
}

// ==================== Context Provider ====================
const AppContext = createContext();

const AppProvider = ({ children }) => {
  const [user, setUser] = useState({
    name: 'المستخدم',
    email: '',
    subscription: 'free',
    messagesToday: 0,
    messagesTotal: 0,
    currentMood: 'neutral',
    moodHistory: []
  });
  
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('welcome');
  const [currentTheme, setCurrentTheme] = useState(
    SentimentAnalyzer.getThemeColors('neutral')
  );

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('user');
      const savedMessages = await AsyncStorage.getItem('messages');
      
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        // تحديث السمة بناءً على المزاج المخزن
        updateTheme(parsedUser.currentMood);
      }
      
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const updateUser = async (updates) => {
    const newUser = { ...user, ...updates };
    setUser(newUser);
    await AsyncStorage.setItem('user', JSON.stringify(newUser));
  };

  const updateTheme = (emotion) => {
    const newTheme = SentimentAnalyzer.getThemeColors(emotion);
    setCurrentTheme(newTheme);
  };

  const analyzeAndUpdateMood = async (text) => {
    const analysis = await SentimentAnalyzer.analyzeText(text);
    
    setUser(prev => ({
      ...prev,
      currentMood: analysis.emotion,
      moodHistory: [...prev.moodHistory, {
        emotion: analysis.emotion,
        confidence: analysis.confidence,
        text: text.substring(0, 50) + '...',
        timestamp: new Date().toISOString()
      }]
    }));
    
    updateTheme(analysis.emotion);
    
    // حفظ في AsyncStorage
    await AsyncStorage.setItem('user', JSON.stringify({
      ...user,
      currentMood: analysis.emotion,
      moodHistory: [...user.moodHistory, {
        emotion: analysis.emotion,
        confidence: analysis.confidence,
        text: text.substring(0, 50) + '...',
        timestamp: new Date().toISOString()
      }]
    }));
    
    return analysis;
  };

  const addMessage = async (message) => {
    const newMessages = [...messages, message];
    setMessages(newMessages);
    await AsyncStorage.setItem('messages', JSON.stringify(newMessages));
    
    if (message.sender === 'user') {
      await updateUser({
        messagesToday: user.messagesToday + 1,
        messagesTotal: user.messagesTotal + 1
      });
    }
  };

  const resetDailyMessages = async () => {
    await updateUser({
      messagesToday: 0
    });
  };

  const value = {
    user,
    messages,
    isLoading,
    activeTab,
    currentTheme,
    updateUser,
    addMessage,
    setIsLoading,
    setActiveTab,
    analyzeAndUpdateMood,
    updateTheme,
    resetDailyMessages
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

const useApp = () => useContext(AppContext);

// ==================== الأنميشنز ====================
const FadeInView = ({ children, delay = 0 }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      delay: delay,
      useNativeDriver: true
    }).start();
  }, []);

  return <Animated.View style={{ opacity: fadeAnim }}>{children}</Animated.View>;
};

// ==================== شاشة الدفع ====================
const PaymentModal = ({ visible, onClose, plan, price }) => {
  const { user, currentTheme } = useApp();
  const [selectedMethod, setSelectedMethod] = useState('nowpayments');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);

  const paymentMethods = [
    { id: 'nowpayments', name: '💰 دفع كريبتو تلقائي', icon: 'credit-card' },
    { id: 'stc', name: '📱 STC Pay', icon: 'smartphone' },
    { id: 'bank', name: '🏦 تحويل بنكي', icon: 'bank' }
  ];

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      const result = await PaymentService.processPayment(
        plan,
        selectedMethod,
        {
          email: user.email,
          name: user.name,
          phone: user.phone
        }
      );
      
      if (result.success) {
        setPaymentResult(result);
        
        if (selectedMethod === 'nowpayments') {
          Linking.openURL(result.transaction.paymentData.invoiceUrl);
          
          Alert.alert(
            'فاتورة الدفع',
            result.transaction.paymentData.instructions,
            [
              { 
                text: 'فتح صفحة الدفع', 
                onPress: () => Linking.openURL(result.transaction.paymentData.invoiceUrl) 
              },
              { 
                text: 'نسخ عنوان المحفظة', 
                onPress: () => {
                  Clipboard.setString(result.transaction.paymentData.payAddress);
                  Alert.alert('تم النسخ', 'تم نسخ عنوان المحفظة');
                }
              },
              { text: 'تم', onPress: onClose }
            ]
          );
        } else {
          Alert.alert(
            'تعليمات الدفع',
            result.instructions,
            [
              { text: 'نسخ التفاصيل', onPress: () => Clipboard.setString(result.instructions) },
              { text: 'فتح واتساب', onPress: () => Linking.openURL(APP_CONFIG.developer.whatsapp) },
              { text: 'تم', onPress: onClose }
            ]
          );
        }
      } else {
        Alert.alert('خطأ', result.error || 'فشل معالجة الدفع');
      }
    } catch (error) {
      Alert.alert('خطأ', error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <LinearGradient
          colors={currentTheme.gradient}
          style={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>💳 الدفع الآمن</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.planSummary}>
            <Text style={styles.planName}>باقة {plan === 'monthly' ? 'شهرية' : 'سنوية'}</Text>
            <Text style={styles.planPrice}>${price}</Text>
          </View>

          <Text style={styles.methodsTitle}>اختر طريقة الدفع:</Text>
          
          <View style={styles.methodsList}>
            {paymentMethods.map(method => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.methodItem,
                  selectedMethod === method.id && styles.methodItemSelected
                ]}
                onPress={() => setSelectedMethod(method.id)}
              >
                <Feather name={method.icon} size={24} color={currentTheme.primary} />
                <Text style={styles.methodName}>{method.name}</Text>
                {selectedMethod === method.id && (
                  <Feather name="check-circle" size={20} color={currentTheme.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {selectedMethod === 'nowpayments' && (
            <View style={[styles.noteBox, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={styles.noteText}>
                ⚡ *الدفع التلقائي:* بعد الدفع سيتم تفعيل اشتراكك تلقائياً خلال 2-5 دقائق
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.payButton, { backgroundColor: currentTheme.primary }]}
            onPress={handlePayment}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Feather name="lock" size={20} color="white" />
                <Text style={styles.payButtonText}>متابعة الدفع</Text>
              </>
            )}
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Modal>
  );
};

// ==================== شاشة الاشتراكات ====================
const SubscriptionScreen = () => {
  const { user, updateUser, currentTheme } = useApp();
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [showPayment, setShowPayment] = useState(false);

  const plans = [
    {
      id: 'free',
      name: '🎁 مجاني',
      price: 0,
      features: ['50 رسالة يومياً', 'دردشة أساسية', 'تصدير PDF', 'تحليل المشاعر']
    },
    {
      id: 'monthly',
      name: '💎 شهري',
      price: 20,
      features: ['رسائل غير محدودة', 'دعم فوري', 'كل الميزات', 'سمات متعددة'],
      popular: true
    },
    {
      id: 'yearly',
      name: '👑 سنوي',
      price: 100,
      features: ['كل مميزات الشهري', 'توفير 58%', 'دعم مميز', 'ميزات حصرية'],
      bestValue: true
    }
  ];

  const handleSubscribe = (plan) => {
    if (plan === 'free') {
      updateUser({ subscription: 'free' });
      Alert.alert('تم', 'تم التغيير للباقة المجانية');
      return;
    }
    
    setSelectedPlan(plan);
    setShowPayment(true);
  };

  return (
    <LinearGradient
      colors={currentTheme.gradient}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.subscriptionContainer}>
        <View style={styles.subscriptionHeader}>
          <Text style={styles.subscriptionTitle}>📋 خطط الاشتراك</Text>
          <Text style={styles.subscriptionSubtitle}>اختر الباقة المناسبة لك</Text>
        </View>

        {plans.map((plan, index) => (
          <FadeInView key={plan.id} delay={index * 200}>
            <View style={[
              styles.planCard,
              plan.popular && { borderColor: currentTheme.primary, borderWidth: 2 }
            ]}>
              {plan.popular && (
                <View style={[styles.popularBadge, { backgroundColor: currentTheme.primary }]}>
                  <Text style={styles.popularText}>الأكثر طلباً</Text>
                </View>
              )}
              
              {plan.bestValue && (
                <View style={[styles.bestValueBadge, { backgroundColor: '#10b981' }]}>
                  <Text style={styles.bestValueText}>أفضل قيمة</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <Text style={[styles.planIcon, { color: currentTheme.primary }]}>
                  {plan.name.charAt(0)}
                </Text>
                <View>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planPeriod}>
                    {plan.id === 'monthly' ? 'شهري' : plan.id === 'yearly' ? 'سنوي' : 'مجاني'}
                  </Text>
                </View>
              </View>

              <Text style={[styles.planPrice, { color: currentTheme.primary }]}>
                ${plan.price}
                {plan.price > 0 && (
                  <Text style={styles.planPeriodText}>
                    /{plan.id === 'monthly' ? 'شهر' : 'سنة'}
                  </Text>
                )}
              </Text>

              <View style={styles.featuresList}>
                {plan.features.map((feature, idx) => (
                  <View key={idx} style={styles.featureItem}>
                    <Feather name="check" size={16} color={currentTheme.primary} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.subscribeButton,
                  { backgroundColor: currentTheme.primary },
                  user.subscription === plan.id && { backgroundColor: '#10b981' }
                ]}
                onPress={() => handleSubscribe(plan.id)}
              >
                <Text style={styles.subscribeButtonText}>
                  {user.subscription === plan.id ? '✅ الباقة الحالية' : 
                   plan.id === 'free' ? 'اختيار الباقة' : '⚡ اشترك الآن'}
                </Text>
              </TouchableOpacity>
            </View>
          </FadeInView>
        ))}

        <View style={styles.paymentMethodsInfo}>
          <Text style={styles.paymentMethodsTitle}>💳 طرق الدفع المدعومة:</Text>
          <View style={styles.paymentMethodsGrid}>
            <View style={[styles.paymentMethodBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={styles.paymentMethodText}>USDT/TRX</Text>
            </View>
            <View style={[styles.paymentMethodBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={styles.paymentMethodText}>STC Pay</Text>
            </View>
            <View style={[styles.paymentMethodBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={styles.paymentMethodText}>تحويل بنكي</Text>
            </View>
          </View>
          <Text style={styles.paymentNote}>
            ⚡ الدفع بالكريبتو: تفعيل تلقائي خلال دقائق
          </Text>
        </View>

        <View style={styles.moodInfoCard}>
          <Text style={styles.moodInfoTitle}>🎭 ميزة تحليل المشاعر</Text>
          <Text style={styles.moodInfoText}>
            • التطبيق يحلل مشاعرك تلقائياً من رسائلك
            • يتغير لون السمة بناءً على مشاعرك
            • يدعم 5 حالات مزاجية مختلفة
            • حفظ سجل المشاعر
          </Text>
        </View>

        <PaymentModal
          visible={showPayment}
          onClose={() => setShowPayment(false)}
          plan={selectedPlan}
          price={plans.find(p => p.id === selectedPlan)?.price || 0}
        />
      </ScrollView>
    </LinearGradient>
  );
};

// ==================== شاشة المحادثة ====================
const ChatScreen = () => {
  const { user, messages, addMessage, isLoading, setIsLoading, analyzeAndUpdateMood, currentTheme } = useApp();
  const [inputText, setInputText] = useState('');
  const [tone, setTone] = useState('friendly');
  const flatListRef = useRef(null);
  
  useEffect(() => {
    // تمرير لأسفل عند إضافة رسائل جديدة
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    if (user.subscription === 'free' && user.messagesToday >= 50) {
      Alert.alert(
        'حد الرسائل',
        'لقد استخدمت جميع الرسائل المجانية. يرجى ترقية اشتراكك.',
        [
          { text: 'لاحقاً' },
          { text: 'ترقية', onPress: () => useApp().setActiveTab('subscription') }
        ]
      );
      return;
    }
    
    const userMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    };
    
    await addMessage(userMessage);
    setInputText('');
    setIsLoading(true);
    
    try {
      // تحليل المشاعر قبل إرسال الرسالة
      const moodAnalysis = await analyzeAndUpdateMood(inputText);
      
      // عرض تنبيه للمزاج القوي فقط
      if (moodAnalysis.confidence > 0.7) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        setTimeout(() => {
          Alert.alert(
            '🎭 مزاجك اليوم',
            `لاحظت أنك تشعر بـ ${SentimentAnalyzer.getEmotionArabic(moodAnalysis.emotion)}`,
            [{ text: 'شكراً! 😊' }]
          );
        }, 500);
      }
      
      const aiResponse = await AIService.getResponse(inputText, tone);
      
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai',
        time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
      };
      
      await addMessage(aiMessage);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('AI Error:', error);
      Alert.alert('خطأ', 'تعذر الاتصال بالذكاء الاصطناعي');
      
      // إضافة رسالة خطأ
      const errorMessage = {
        id: (Date.now() + 2).toString(),
        text: "عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.",
        sender: 'ai',
        time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
      };
      
      await addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <LinearGradient
      colors={currentTheme.gradient}
      style={styles.container}
    >
      <SafeAreaView style={styles.chatContainer}>
        <View style={styles.chatHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>💬 Simply AI</Text>
            <View style={styles.headerSubtitle}>
              <Text style={styles.messageCount}>
                {user.messagesToday}/50 رسائل اليوم
              </Text>
              <View style={styles.moodIndicator}>
                <Text style={styles.moodText}>
                  {SentimentAnalyzer.getEmotionArabic(user.currentMood)}
                </Text>
                <View style={[styles.moodIcon, { backgroundColor: currentTheme.primary }]}>
                  <Text style={styles.moodIconText}>
                    {SentimentAnalyzer.getEmotionEmoji(user.currentMood)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.upgradeButton, { backgroundColor: currentTheme.primary }]}
            onPress={() => useApp().setActiveTab('subscription')}
          >
            <Text style={styles.upgradeButtonText}>
              {user.subscription === 'free' ? '⚡ ترقية' : '💎 مميز'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({ item }) => (
            <View style={[
              styles.messageBubble,
              item.sender === 'user' 
                ? [styles.userBubble, { backgroundColor: currentTheme.bubbleUser }]
                : [styles.aiBubble, { backgroundColor: currentTheme.bubbleAI }]
            ]}>
              <Text style={[
                styles.messageText,
                item.sender === 'user' && { color: 'white' }
              ]}>
                {item.text}
              </Text>
              <Text style={[
                styles.messageTime,
                item.sender === 'user' && { color: 'rgba(255,255,255,0.8)' }
              ]}>
                {item.time}
              </Text>
            </View>
          )}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
        />
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="اكتب رسالتك هنا..."
            placeholderTextColor="#999"
            multiline
            maxLength={1000}
          />
          
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: currentTheme.primary }]}
            onPress={handleSend}
            disabled={isLoading || !inputText.trim()}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Feather name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

// ==================== شاشة الملف الشخصي ====================
const ProfileScreen = () => {
  const { user, currentTheme, updateUser, resetDailyMessages } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);

  const handleSave = async () => {
    await updateUser({ name, email });
    setIsEditing(false);
    Alert.alert('تم', 'تم تحديث البيانات بنجاح');
  };

  const handleResetMessages = async () => {
    Alert.alert(
      'إعادة تعيين الرسائل',
      'هل تريد إعادة تعيين عداد الرسائل اليومية؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'نعم', 
          onPress: async () => {
            await resetDailyMessages();
            Alert.alert('تم', 'تم إعادة تعيين الرسائل اليومية');
          }
        }
      ]
    );
  };

  const handleExportMoodHistory = async () => {
    try {
      const html = `
        <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial; padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: center; }
            th { background-color: ${currentTheme.primary}; color: white; }
          </style>
        </head>
        <body>
          <h1>سجل المشاعر - Simply AI</h1>
          <table>
            <tr>
              <th>المزاج</th>
              <th>الثقة</th>
              <th>الرسالة</th>
              <th>التاريخ</th>
            </tr>
            ${user.moodHistory.map(mood => `
              <tr>
                <td>${SentimentAnalyzer.getEmotionArabic(mood.emotion)}</td>
                <td>${(mood.confidence * 100).toFixed(0)}%</td>
                <td>${mood.text}</td>
                <td>${new Date(mood.timestamp).toLocaleString('ar-SA')}</td>
              </tr>
            `).join('')}
          </table>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      const fileName = `سجل_المشاعر_${Date.now()}.pdf`;
      const newUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.moveAsync({ from: uri, to: newUri });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newUri);
      }
    } catch (error) {
      Alert.alert('خطأ', 'تعذر تصدير سجل المشاعر');
    }
  };

  return (
    <LinearGradient
      colors={currentTheme.gradient}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.profileContainer}>
        <View style={styles.profileHeader}>
          <View style={[styles.profileAvatar, { backgroundColor: currentTheme.primary }]}>
            <Text style={styles.profileAvatarText}>
              {user.name.charAt(0)}
            </Text>
          </View>
          <Text style={styles.profileName}>{user.name}</Text>
          <Text style={styles.profileEmail}>{user.email || 'لم يتم تعيين البريد'}</Text>
        </View>

        <View style={styles.profileCard}>
          <Text style={styles.cardTitle}>📊 الإحصائيات</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user.messagesToday}</Text>
              <Text style={styles.statLabel}>رسائل اليوم</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user.messagesTotal}</Text>
              <Text style={styles.statLabel}>إجمالي الرسائل</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user.moodHistory.length}</Text>
              <Text style={styles.statLabel}>تحليل مشاعر</Text>
            </View>
          </View>
        </View>

        <View style={styles.profileCard}>
          <Text style={styles.cardTitle}>🎭 المزاج الحالي</Text>
          <View style={styles.moodDisplay}>
            <Text style={styles.moodDisplayText}>
              {SentimentAnalyzer.getEmotionArabic(user.currentMood)}
            </Text>
            <View style={[styles.moodDisplayIcon, { backgroundColor: currentTheme.primary }]}>
              <Text style={styles.moodDisplayEmoji}>
                {SentimentAnalyzer.getEmotionEmoji(user.currentMood)}
              </Text>
            </View>
          </View>
          <Text style={styles.moodHistoryTitle}>آخر 5 تحليلات:</Text>
          {user.moodHistory.slice(-5).reverse().map((mood, index) => (
            <View key={index} style={styles.moodHistoryItem}>
              <Text style={styles.moodHistoryEmotion}>
                {SentimentAnalyzer.getEmotionArabic(mood.emotion)}
              </Text>
              <Text style={styles.moodHistoryText}>{mood.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.profileCard}>
          <Text style={styles.cardTitle}>⚙️ الإعدادات</Text>
          
          {isEditing ? (
            <>
              <TextInput
                style={styles.inputField}
                value={name}
                onChangeText={setName}
                placeholder="الاسم"
              />
              <TextInput
                style={styles.inputField}
                value={email}
                onChangeText={setEmail}
                placeholder="البريد الإلكتروني"
                keyboardType="email-address"
              />
              <View style={styles.editButtons}>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: currentTheme.primary }]}
                  onPress={handleSave}
                >
                  <Text style={styles.buttonText}>حفظ</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: '#666' }]}
                  onPress={() => setIsEditing(false)}
                >
                  <Text style={styles.buttonText}>إلغاء</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: currentTheme.primary }]}
                onPress={() => setIsEditing(true)}
              >
                <Text style={styles.buttonText}>✏️ تعديل البيانات</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#4CAF50' }]}
                onPress={handleExportMoodHistory}
              >
                <Text style={styles.buttonText}>📤 تصدير سجل المشاعر</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#FF9800' }]}
                onPress={handleResetMessages}
              >
                <Text style={styles.buttonText}>🔄 إعادة تعيين الرسائل</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.developerInfo}>
          <Text style={styles.developerTitle}>👨‍💻 المطور</Text>
          <Text style={styles.developerName}>{APP_CONFIG.developer.name}</Text>
          <Text style={styles.developerContact}>📱 {APP_CONFIG.developer.phone}</Text>
          <TouchableOpacity
            style={[styles.contactButton, { backgroundColor: currentTheme.primary }]}
            onPress={() => Linking.openURL(APP_CONFIG.developer.whatsapp)}
          >
            <Text style={styles.contactButtonText}>💬 التواصل عبر واتساب</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

// ==================== شاشة الترحيب ====================
const WelcomeScreen = () => {
  const { setActiveTab } = useApp();
  
  const features = [
    { icon: '💬', text: 'دردشة ذكية مع الذكاء الاصطناعي' },
    { icon: '🎭', text: 'تحليل المشاعر وتغيير السمة تلقائياً' },
    { icon: '💰', text: 'نظام دفع آمن وتلقائي' },
    { icon: '📤', text: 'تصدير المحادثات بجميع الصيغ' },
    { icon: '🎨', text: 'سمات جميلة تتغير مع مشاعرك' },
    { icon: '📊', text: 'إحصائيات مفصلة وسجل المشاعر' }
  ];
  
  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.welcomeContainer}
    >
      <ScrollView contentContainerStyle={styles.welcomeContent}>
        <View style={styles.welcomeHeader}>
          <Text style={styles.welcomeTitle}>✨ Simply AI 2026</Text>
          <Text style={styles.welcomeSubtitle}>مساعد الذكاء الاصطناعي العربي الذكي</Text>
        </View>
        
        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>🌟 الميزات الرئيسية</Text>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
        </View>
        
        <TouchableOpacity 
          style={styles.startButton}
          onPress={() => setActiveTab('chat')}
        >
          <Text style={styles.startButtonText}>🚀 ابدأ الدردشة الآن</Text>
        </TouchableOpacity>
        
        <View style={styles.demoMood}>
          <Text style={styles.demoTitle}>🎭 جرب ميزة تحليل المشاعر</Text>
          <Text style={styles.demoText}>
            اكتب أي رسالة وسيتغير لون التطبيق تلقائياً بناءً على مشاعرك!
          </Text>
          <View style={styles.moodExamples}>
            <View style={styles.moodExample}>
              <Text style={styles.moodEmoji}>😊</Text>
              <Text style={styles.moodLabel}>سعادة</Text>
            </View>
            <View style={styles.moodExample}>
              <Text style={styles.moodEmoji}>😔</Text>
              <Text style={styles.moodLabel}>حزن</Text>
            </View>
            <View style={styles.moodExample}>
              <Text style={styles.moodEmoji}>😠</Text>
              <Text style={styles.moodLabel}>غضب</Text>
            </View>
            <View style={styles.moodExample}>
              <Text style={styles.moodEmoji}>🤩</Text>
              <Text style={styles.moodLabel}>حماس</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.developerCard}>
          <Text style={styles.developerTitle}>👨‍💻 المطور</Text>
          <Text style={styles.developerName}>{APP_CONFIG.developer.name}</Text>
          <Text style={styles.developerContact}>📱 {APP_CONFIG.developer.phone}</Text>
          <Text style={styles.developerEmail}>📧 {APP_CONFIG.developer.email}</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

// ==================== Bottom Navigation ====================
const BottomNavigation = () => {
  const { activeTab, setActiveTab, currentTheme } = useApp();
  
  const tabs = [
    { id: 'chat', icon: 'message-circle', label: 'دردشة' },
    { id: 'subscription', icon: 'star', label: 'اشتراك' },
    { id: 'profile', icon: 'user', label: 'ملفي' }
  ];
  
  return (
    <View style={[styles.bottomNav, { backgroundColor: 'white' }]}>
      {tabs.map(tab => (
        <TouchableOpacity
          key={tab.id}
          style={styles.navItem}
          onPress={() => setActiveTab(tab.id)}
        >
          <Feather 
            name={tab.icon} 
            size={24} 
            color={activeTab === tab.id ? currentTheme.primary : '#666'} 
          />
          <Text style={[
            styles.navLabel,
            { color: activeTab === tab.id ? currentTheme.primary : '#666' }
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ==================== المكون الرئيسي ====================
const SimplyAI = () => {
  const { activeTab } = useApp();
  
  const renderScreen = () => {
    switch(activeTab) {
      case 'chat':
        return <ChatScreen />;
      case 'subscription':
        return <SubscriptionScreen />;
      case 'profile':
        return <ProfileScreen />;
      case 'welcome':
        return <WelcomeScreen />;
      default:
        return <WelcomeScreen />;
    }
  };
  
  return (
    <AppProvider>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      <SafeAreaView style={{ flex: 1 }}>
        {activeTab === 'welcome' ? (
          <WelcomeScreen />
        ) : (
          <>
            {renderScreen()}
            <BottomNavigation />
          </>
        )}
      </SafeAreaView>
    </AppProvider>
  );
};

// ==================== الأنماط ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  welcomeHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  featuresCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 25,
    padding: 25,
    marginBottom: 25,
  },
  featuresTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 15,
    color: 'white',
    width: 30,
  },
  featureText: {
    fontSize: 16,
    color: 'white',
    flex: 1,
    lineHeight: 22,
  },
  startButton: {
    backgroundColor: 'white',
    borderRadius: 25,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#667eea',
  },
  demoMood: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 25,
    padding: 20,
    marginBottom: 25,
  },
  demoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  demoText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 20,
  },
  moodExamples: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  moodExample: {
    alignItems: 'center',
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: 5,
  },
  moodLabel: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  developerCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 25,
    padding: 20,
    alignItems: 'center',
  },
  developerTitle: {
    fontSize: 18,
    color: 'white',
    marginBottom: 5,
    fontWeight: '700',
  },
  developerName: {
    fontSize: 22,
    fontWeight: '800',
    color: 'white',
    marginBottom: 5,
  },
  developerContact: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 3,
  },
  developerEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
  },
  headerSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  messageCount: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginRight: 15,
  },
  moodIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  moodText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
  },
  moodIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodIconText: {
    fontSize: 14,
  },
  upgradeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  upgradeButtonText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 14,
  },
  messagesList: {
    padding: 20,
    paddingBottom: 100,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 15,
    borderRadius: 20,
    marginBottom: 15,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 5,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 8,
    alignSelf: 'flex-end',
    opacity: 0.7,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 10,
    textAlign: 'right',
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscriptionContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  subscriptionHeader: {
    padding: 25,
    alignItems: 'center',
  },
  subscriptionTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  subscriptionSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  planCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 25,
    padding: 25,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 15,
  },
  popularText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '800',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -12,
    left: 20,
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 15,
  },
  bestValueText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '800',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  planIcon: {
    fontSize: 32,
    marginRight: 15,
    fontWeight: '900',
  },
  planName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#333',
  },
  planPeriod: {
    fontSize: 16,
    color: '#666',
  },
  planPrice: {
    fontSize: 48,
    fontWeight: '900',
    marginBottom: 20,
  },
  planPeriodText: {
    fontSize: 18,
    fontWeight: '400',
  },
  featuresList: {
    marginBottom: 25,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  subscribeButton: {
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  },
  paymentMethodsInfo: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 25,
    borderRadius: 25,
    marginBottom: 20,
  },
  paymentMethodsTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  paymentMethodsGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 15,
  },
  paymentMethodBadge: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  paymentNote: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  moodInfoCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  moodInfoTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  moodInfoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  profileContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  profileAvatarText: {
    fontSize: 48,
    color: 'white',
    fontWeight: '900',
  },
  profileName: {
    fontSize: 28,
    fontWeight: '900',
    color: 'white',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  profileCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  moodDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  moodDisplayText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#333',
    marginRight: 15,
  },
  moodDisplayIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodDisplayEmoji: {
    fontSize: 28,
  },
  moodHistoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  moodHistoryItem: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  moodHistoryEmotion: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 3,
  },
  moodHistoryText: {
    fontSize: 12,
    color: '#666',
  },
  inputField: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    textAlign: 'right',
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  developerInfo: {
    alignItems: 'center',
    marginTop: 20,
  },
  contactButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 10,
  },
  contactButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    minHeight: 500,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: 'white',
  },
  planSummary: {
    alignItems: 'center',
    marginBottom: 30,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  planName: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    marginBottom: 10,
  },
  planPrice: {
    fontSize: 48,
    fontWeight: '900',
    color: 'white',
  },
  methodsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
    marginBottom: 15,
  },
  methodsList: {
    marginBottom: 25,
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 15,
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  methodItemSelected: {
    borderColor: 'white',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  methodName: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    flex: 1,
    marginLeft: 15,
  },
  noteBox: {
    padding: 15,
    borderRadius: 15,
    marginBottom: 25,
  },
  noteText: {
    fontSize: 14,
    color: 'white',
    lineHeight: 20,
    textAlign: 'center',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 15,
    gap: 10,
  },
  payButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
  },
  bottomNav: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 12,
    marginTop: 5,
    fontWeight: '600',
  },
});

export default SimplyAI;
