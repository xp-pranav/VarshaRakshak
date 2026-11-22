/**
 * VarshaRakshak — Multilingual Voice Assistant (Web Speech API)
 * Supports English, Hindi, and Marathi voice commands, intent recognition,
 * and speech synthesis with text fallback.
 */

const VRVoice = {
  recognition: null,
  isListening: false,
  synth: typeof window !== 'undefined' ? window.speechSynthesis : null,

  init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.updateMicUI(true);
      };

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.processQuery(transcript);
      };

      this.recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        this.isListening = false;
        this.updateMicUI(false);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.updateMicUI(false);
      };
    }
  },

  toggleListening() {
    if (!this.recognition) {
      alert("Web Speech API is not supported in this browser. Please use the text input below.");
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
    } else {
      const lang = VRLocalization.getLanguage();
      const langMap = { en: "en-IN", hi: "hi-IN", mr: "mr-IN" };
      this.recognition.lang = langMap[lang] || "hi-IN";
      this.recognition.start();
    }
  },

  updateMicUI(listening) {
    const micBtn = document.getElementById('voice-mic-btn');
    const transcriptBox = document.getElementById('voice-transcript');
    if (micBtn) {
      if (listening) {
        micBtn.classList.add('listening');
        if (transcriptBox) transcriptBox.textContent = VRLocalization.t('voice_listening');
      } else {
        micBtn.classList.remove('listening');
      }
    }
  },

  processQuery(queryText) {
    const transcriptBox = document.getElementById('voice-transcript');
    const responseBox = document.getElementById('voice-response');
    if (transcriptBox) transcriptBox.textContent = `"${queryText}"`;

    const lang = VRLocalization.getLanguage();
    const intent = this.detectIntent(queryText);
    const reply = this.generateResponse(intent, lang);

    if (responseBox) {
      responseBox.textContent = reply;
      responseBox.style.display = 'block';
    }

    // Speak reply
    this.speak(reply, lang);
  },

  detectIntent(text) {
    const lower = text.toLowerCase();

    if (lower.includes("alert") || lower.includes("अलर्ट") || lower.includes("इशारा") || lower.includes("warning")) {
      return "check_rain_alert";
    }
    if (lower.includes("barish") || lower.includes("बारिश") || lower.includes("पाऊस") || lower.includes("rain") || lower.includes("weather") || lower.includes("मौसम") || lower.includes("हवामान")) {
      return "check_weather";
    }
    if (lower.includes("paani") || lower.includes("पानी") || lower.includes("water") || lower.includes("waterlogging") || lower.includes("पूर") || lower.includes("साचले")) {
      return "check_waterlogging";
    }
    if (lower.includes("policy") || lower.includes("पॉलिसी") || lower.includes("विमा") || lower.includes("insurance") || lower.includes("बीमा")) {
      return "check_policy_status";
    }
    if (lower.includes("claim") || lower.includes("क्लेम") || lower.includes("दावा") || lower.includes("pass")) {
      return "check_claims";
    }
    if (lower.includes("paisa") || lower.includes("पैसा") || lower.includes("भरपाई") || lower.includes("payout") || lower.includes("rupee") || lower.includes("kitna")) {
      return "calculate_payout";
    }
    if (lower.includes("rasta") || lower.includes("route") || lower.includes("रस्ता") || lower.includes("मार्ग") || lower.includes("safe")) {
      return "safety_advice";
    }

    return "general_help";
  },

  generateResponse(intent, lang) {
    const rider = VRStorage.getCurrentRider();
    const weather = VRStorage.getWeatherForPincode(rider.primaryPincode);
    const policy = VRStorage.getRiderActivePolicy(rider.id);
    const claims = VRStorage.getClaims(rider.id);
    const latestClaim = claims[0];

    const responses = {
      en: {
        check_weather: `Current weather in ${weather.locality}: ${weather.condition}, temperature is ${weather.temperature}°C with ${weather.rainfallRateMmHr} mm/hr rainfall.`,
        check_rain_alert: `Alert Level is ${weather.alertLevel} for PIN ${weather.pincode}. Please drive carefully on wet roads.`,
        check_waterlogging: "Severe waterlogging detected at Milan Subway (48cm). Diversion recommended via Link Road.",
        check_policy_status: policy ? `Your policy ${policy.planName} is active with ₹${policy.coverageLimitRemaining} remaining coverage.` : "No active policy found.",
        calculate_payout: "If rainfall exceeds 35mm/hr for over 60 minutes, your policy provides ₹750 estimated disruption compensation.",
        check_claims: latestClaim ? `Your latest claim ${latestClaim.claimNumber} is in status: ${latestClaim.status} for ₹${latestClaim.approvedAmount || latestClaim.requestedAmount}.` : "You have no active claims submitted.",
        safety_advice: "Avoid Milan Subway. Take the safe alternative route via Link Road elevated corridor.",
        general_help: "I am VarshaRakshak Assistant. You can ask me about weather, rain alerts, waterlogging, or your insurance policy."
      },
      hi: {
        check_weather: `${weather.locality} में वर्तमान मौसम: ${weather.condition}, तापमान ${weather.temperature}°C और वर्षा दर ${weather.rainfallRateMmHr} मिमी/घंटा है।`,
        check_rain_alert: `पिन कोड ${weather.pincode} के लिए अलर्ट स्तर: ${weather.alertLevel}। गीली सड़कों पर सावधानी से वाहन चलाएं।`,
        check_waterlogging: "मिलन सबवे में 48 सेमी का गंभीर जलभराव है। कृपया लिंक रोड से सुरक्षित वैकल्पिक मार्ग लें।",
        check_policy_status: policy ? `आपकी ${policy.planName} सक्रिय है और ₹${policy.coverageLimitRemaining} की शेष कवरेज उपलब्ध है।` : "आपकी कोई सक्रिय पॉलिसी नहीं मिली।",
        calculate_payout: "यदि बारिश 35 मिमी/घंटा से अधिक होती है, तो आपकी पॉलिसी से ₹750 का अनुमानित मुआवजा प्राप्त होगा।",
        check_claims: latestClaim ? `आपका नवीनतम क्लेम ${latestClaim.claimNumber} स्थिति में है: ${latestClaim.status} (राशि: ₹${latestClaim.approvedAmount || latestClaim.requestedAmount})।` : "आपका कोई क्लेम दर्ज नहीं है।",
        safety_advice: "मिलन सबवे से बचें। लिंक रोड फ्लाईओवर से सुरक्षित रास्ता चुनें।",
        general_help: "मैं वर्षा रक्षक सहायक हूँ। आप मुझसे मौसम, बारिश के अलर्ट, जलभराव या अपनी बीमा पॉलिसी के बारे में पूछ सकते हैं।"
      },
      mr: {
        check_weather: `${weather.locality} मधील हवामान: ${weather.condition}, तापमान ${weather.temperature}°C आणि पाऊस ${weather.rainfallRateMmHr} मिमी/तास आहे.`,
        check_rain_alert: `पिन कोड ${weather.pincode} साठी इशारा पातळी: ${weather.alertLevel}. निसरड्या रस्त्यांवर जपून वाहन चालवा.`,
        check_waterlogging: "मिलन सबवे येथे ४८ सेमी पाणी साचले आहे. लिंक रोडने पर्यायी सुरक्षित मार्ग वापरा.",
        check_policy_status: policy ? `तुमची ${policy.planName} सक्रिय असून ₹${policy.coverageLimitRemaining} शिल्लक कव्हरेज आहे.` : "कोणतीही सक्रिय पॉलिसी सापडली नाही.",
        calculate_payout: "जर पाऊस ३५ मिमी/तास ओलांडला, तर तुमच्या पॉलिसीनुसार अंदाजे ₹७५० भरपाई मिळेल.",
        check_claims: latestClaim ? `तुमचा दावा ${latestClaim.claimNumber} स्थिती: ${latestClaim.status} (रक्कम: ₹${latestClaim.approvedAmount || latestClaim.requestedAmount}).` : "तुमचा कोणताही दावा नोंदवलेला नाही.",
        safety_advice: "मिलन सबवे टाळा. लिंक रोडने सुरक्षित मार्गाचा वापर करा.",
        general_help: "मी वर्षा रक्षक सहाय्यक आहे. आपण मला हवामान, पावसाचे इशारे, पाणी साचणे किंवा पॉलिसीबद्दल विचारू शकता."
      }
    };

    const dict = responses[lang] || responses.en;
    return dict[intent] || dict.general_help;
  },

  speak(text, lang) {
    if (!this.synth) return;
    try {
      this.synth.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      const langMap = { en: "en-IN", hi: "hi-IN", mr: "mr-IN" };
      utterance.lang = langMap[lang] || "hi-IN";
      utterance.rate = 1.0;
      this.synth.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  }
};

// Initialize voice module
VRVoice.init();
