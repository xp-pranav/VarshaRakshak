/**
 * VarshaRakshak — Multilingual Localization System
 * Provides seamless English, Hindi, and Marathi localization without page reload.
 */

const VR_TRANSLATIONS = {
  en: {
    brand_name: "VarshaRakshak",
    tagline: "Smart Insurance for Every Delivery Rider",
    nav_dashboard: "Rider Dashboard",
    nav_weather: "Weather & Alerts",
    nav_routes: "Safe Routes",
    nav_income: "Daily Income",
    nav_policies: "Insurance Plans",
    nav_claims: "Claims & Payouts",
    nav_blockchain: "Blockchain Explorer",
    nav_admin: "Admin Simulation",

    mode_simulation: "Simulation Mode",
    mode_live: "Live Sepolia Mode",
    connect_wallet: "Connect Wallet",
    wallet_connected: "Connected",

    weather_title: "Hyperlocal Weather Intelligence",
    rainfall_rate: "Rainfall Rate",
    temperature: "Temperature",
    humidity: "Humidity",
    wind_speed: "Wind Speed",
    alert_level: "Alert Level",
    safe_routes_title: "Safe Route & Hazard Avoidance",
    avoid_waterlogging: "Avoids severe waterlogging",
    risk_score: "Risk Score",

    today_income: "Today's Earnings",
    avg_daily_income: "Daily Average",
    demo_balance: "Simulated Wallet",
    disruption_loss: "Est. Weather Disruption",

    active_policy: "Active Insurance Policy",
    coverage_remaining: "Remaining Coverage",
    max_coverage: "Max Coverage",
    valid_until: "Valid Until",
    waiting_period: "Waiting Period",

    payout_calculator: "Policy-Based Payout Calculator",
    calculate_estimate: "Calculate Estimate",
    estimated_payout: "Estimated Compensation",
    calculator_disclaimer: "Calculated amounts are illustrative estimates until parametric trigger conditions are verified.",

    claim_history: "Claim History & Automatic Payouts",
    claim_id: "Claim ID",
    event_type: "Event Type",
    status: "Status",
    amount: "Amount",
    tx_hash: "Blockchain Tx",
    action: "Action",

    voice_assistant: "Multilingual Voice Assistant",
    voice_placeholder: "Speak in Hindi, Marathi or English (e.g., 'Is there a rain alert today?')",
    voice_listening: "Listening... Speak now",

    btn_simulate_rain: "Simulate Heavy Rain (65mm/hr)",
    btn_simulate_flood: "Simulate Severe Flood",
    btn_simulate_heat: "Simulate Extreme Heat (43°C)",
    btn_reset_demo: "Reset Demo Data",

    demo_badge: "DEMO SIMULATION",
    disclaimer_notice: "Bajaj Technology Prototype: All policies, premiums, weather events, and payouts are simulated demonstration data."
  },

  hi: {
    brand_name: "वर्षा रक्षक",
    tagline: "हर डिलीवरी राइडर के लिए स्मार्ट सुरक्षा",
    nav_dashboard: "राइडर डैशबोर्ड",
    nav_weather: "मौसम और अलर्ट",
    nav_routes: "सुरक्षित मार्ग",
    nav_income: "दैनिक आय",
    nav_policies: "बीमा योजनाएं",
    nav_claims: "क्लेम और भुगतान",
    nav_blockchain: "ब्लॉकचेन एक्सप्लोरर",
    nav_admin: "एडमिन सिमुलेशन",

    mode_simulation: "सिमुलेशन मोड",
    mode_live: "लाइव सेपोलिया मोड",
    connect_wallet: "वॉलेट कनेक्ट करें",
    wallet_connected: "कनेक्टेड",

    weather_title: "स्थानीय मौसम एवं वर्षा सूचना",
    rainfall_rate: "वर्षा दर",
    temperature: "तापमान",
    humidity: "आर्द्रता",
    wind_speed: "हवा की गति",
    alert_level: "अलर्ट स्तर",
    safe_routes_title: "सुरक्षित मार्ग एवं जलभराव बचाव",
    avoid_waterlogging: "गंभीर जलभराव से बचाव",
    risk_score: "जोखिम स्कोर",

    today_income: "आज की कमाई",
    avg_daily_income: "दैनिक औसत",
    demo_balance: "सिम्युलेटेड वॉलेट बैलेंस",
    disruption_loss: "अनुमानित मौसम नुकसान",

    active_policy: "सक्रिय बीमा पॉलिसी",
    coverage_remaining: "शेष कवरेज",
    max_coverage: "अधिकतम कवरेज",
    valid_until: "वैधता तिथि",
    waiting_period: "प्रतीक्षा अवधि",

    payout_calculator: "पॉलिसी-आधारित मुआवजा कैलकुलेटर",
    calculate_estimate: "अनुमानित राशि गणना करें",
    estimated_payout: "अनुमानित मुआवजा",
    calculator_disclaimer: "यह गणना केवल सांकेतिक अनुमान है जब तक कि सिस्टम द्वारा ऑटोमैटिक क्लेम सत्यापित न हो जाए।",

    claim_history: "क्लेम इतिहास एवं ऑटोमैटिक भुगतान",
    claim_id: "क्लेम संख्या",
    event_type: "घटना प्रकार",
    status: "स्थिति",
    amount: "राशि",
    tx_hash: "ब्लॉकचेन ट्रांजैक्शन",
    action: "कार्रवाई",

    voice_assistant: "बहुभाषी वॉइस असिस्टेंट",
    voice_placeholder: "हिंदी, मराठी या अंग्रेजी में बोलें (जैसे: 'आज बारिश का अलर्ट है क्या?')",
    voice_listening: "सुन रहे हैं... कृपया बोलें",

    btn_simulate_rain: "भारी बारिश सिमुलेट करें (65 मिमी/घंटा)",
    btn_simulate_flood: "गंभीर बाढ़ सिमुलेट करें",
    btn_simulate_heat: "भीषण गर्मी सिमुलेट करें (43°C)",
    btn_reset_demo: "डेमो डेटा रीसेट करें",

    demo_badge: "डेमो सिमुलेशन",
    disclaimer_notice: "बजाज टेक्नोलॉजी प्रोटोटाइप: सभी नीतियां, प्रीमियम, मौसम घटनाएं और भुगतान केवल प्रदर्शन हेतु काल्पनिक हैं।"
  },

  mr: {
    brand_name: "वर्षा रक्षक",
    tagline: "प्रत्येक डिलिव्हरी रायडरसाठी स्मार्ट विमा",
    nav_dashboard: "रायडर डॅशबोर्ड",
    nav_weather: "हवामान आणि इशारे",
    nav_routes: "सुरक्षित रस्ते",
    nav_income: "दैनिक उत्पन्न",
    nav_policies: "विमा योजना",
    nav_claims: "दावे आणि भरपाई",
    nav_blockchain: "ब्लॉकचेन एक्सप्लोरर",
    nav_admin: "अ‍ॅडमिन सिम्युलेशन",

    mode_simulation: "सिम्युलेशन मोड",
    mode_live: "थेट सेपोलिया मोड",
    connect_wallet: "वॉलेट जोडा",
    wallet_connected: "जोडले गेले",

    weather_title: "स्थानिक हवामान आणि पाऊस माहिती",
    rainfall_rate: "पावसाचे प्रमाण",
    temperature: "तापमान",
    humidity: "आर्द्रता",
    wind_speed: "वाऱ्याचा वेग",
    alert_level: "इशारा पातळी",
    safe_routes_title: "सुरक्षित मार्ग आणि पाणी साचणे बचाव",
    avoid_waterlogging: "पाणी साचलेल्या रस्त्यांना पर्यायी मार्ग",
    risk_score: "धोका गुण",

    today_income: "आजचे उत्पन्न",
    avg_daily_income: "दैनिक सरासरी",
    demo_balance: "सिम्युलेटेड वॉलेट शिल्लक",
    disruption_loss: "हवामानामुळे संभाव्य नुकसान",

    active_policy: "सक्रिय विमा पॉलिसी",
    coverage_remaining: "उर्वरित कव्हरेज",
    max_coverage: "कमाल कव्हरेज",
    valid_until: "वैधता तारीख",
    waiting_period: "प्रतीक्षा कालावधी",

    payout_calculator: "पॉलिसी-आधारित भरपाई गणक",
    calculate_estimate: "अंदाजे भरपाई मोजा",
    estimated_payout: "अंदाजे भरपाई",
    calculator_disclaimer: "ही गणना केवळ एक अंदाज आहे, जोपर्यंत ट्रिगर अटींची पूर्तता तपासली जात नाही.",

    claim_history: "दावे इतिहास आणि स्वयंचलित भरपाई",
    claim_id: "दावा क्र.",
    event_type: "घटनेचा प्रकार",
    status: "स्थिती",
    amount: "रक्कम",
    tx_hash: "ब्लॉकचेन व्यवहार",
    action: "कृती",

    voice_assistant: "बहुभाषिक व्हॉइस सहाय्यक",
    voice_placeholder: "मराठी, हिंदी किंवा इंग्रजीत बोला (उदा. 'आज पावसाचा इशारा आहे का?')",
    voice_listening: "ऐकत आहे... कृपया बोला",

    btn_simulate_rain: "मुसळधार पाऊस सिम्युलेट करा (६५ मिमी/तास)",
    btn_simulate_flood: "तीव्र पूर सिम्युलेट करा",
    btn_simulate_heat: "तीव्र उष्णता सिम्युलेट करा (४३°C)",
    btn_reset_demo: "डेमो डेटा रीसेट करा",

    demo_badge: "डेमो सिम्युलेशन",
    disclaimer_notice: "बजाज तंत्रज्ञान नमुना: सर्व पॉलिसी, हप्ते, हवामान घटना आणि पेआउट केवळ प्रात्यक्षिकासाठी आहेत."
  }
};

const VRLocalization = {
  currentLang: "hi",

  init() {
    const settings = VRStorage.getSettings();
    this.currentLang = settings.language || "hi";
    this.applyLanguage(this.currentLang);
  },

  getLanguage() {
    return this.currentLang;
  },

  setLanguage(lang) {
    if (['en', 'hi', 'mr'].includes(lang)) {
      this.currentLang = lang;
      VRStorage.updateSettings({ language: lang });
      this.applyLanguage(lang);
      window.dispatchEvent(new CustomEvent('vr:language_changed', { detail: { language: lang } }));
    }
  },

  t(key, fallback = "") {
    const dict = VR_TRANSLATIONS[this.currentLang] || VR_TRANSLATIONS.en;
    return dict[key] || VR_TRANSLATIONS.en[key] || fallback || key;
  },

  applyLanguage(lang) {
    document.documentElement.lang = lang;
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translation = this.t(key);
      if (translation) {
        if (el.tagName === 'INPUT' && el.getAttribute('placeholder')) {
          el.setAttribute('placeholder', translation);
        } else {
          el.textContent = translation;
        }
      }
    });

    // Update language select dropdowns if present
    const langSelects = document.querySelectorAll('.lang-selector');
    langSelects.forEach(sel => {
      sel.value = lang;
    });
  }
};

// Initialize localization
document.addEventListener('DOMContentLoaded', () => {
  VRLocalization.init();
});
