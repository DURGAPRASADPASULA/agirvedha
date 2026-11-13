import type { FaqEntry } from '../types/agri';

export const AGRI_FAQS: FaqEntry[] = [
  {
    id: 'faq_weather_gps',
    category: 'weather',
    question: {
      en: 'How do I check my village weather and use live GPS tracking?',
      hi: 'मैं अपने गाँव का मौसम कैसे देखूँ और लाइव GPS ट्रैकिंग कैसे चलाऊँ?',
    },
    answer: {
      en: 'Open the Weather tab and tap "Detect GPS Location" to read your exact latitude/longitude and auto-match the nearest Indian farming hub. You can also tap "Start Live Tracking" while walking your field boundary to monitor distance moved and GPS accuracy, or search any village/district manually.',
      hi: 'मौसम टैब खोलें और अपने सटीक अक्षांश/देशांतर तथा नज़दीकी कृषि केंद्र का मौसम स्वतः देखने के लिए "GPS लोकेशन पता करें" दबाएं। खेत में चलते समय दूरी और सटीकता मापने के लिए "लाइव ट्रैकिंग शुरू करें" का उपयोग करें या गाँव/जिला नाम से खोजें।',
    },
  },
  {
    id: 'faq_crop_planner',
    category: 'planner',
    question: {
      en: 'How does the Smart Crop Planner match my soil and 4-month season?',
      hi: 'स्मार्ट फसल सलाहकार मेरी मिट्टी और 4-माह के मौसम के अनुसार फसल कैसे चुनता है?',
    },
    answer: {
      en: 'Select your agro-climatic region, soil type (Alluvial, Black Cotton, Red Loamy, or Sandy), upcoming 4-month season (Kharif, Rabi, or Zaid), and expected rainfall/temperature band. AgriVeda scores compatible crops with harvest days, water need, sowing spacing tips, and lets you add sowing reminders to Google Calendar.',
      hi: 'अपना कृषि क्षेत्र, मिट्टी का प्रकार (जलोढ़, काली, लाल दोमट या रेतीली), आगामी 4-माह का सीजन (खरीफ, रबी या जायद) और संभावित बारिश/तापमान चुनें। AgriVeda कटाई के दिन, सिंचाई आवश्यकता और बुवाई सुझाव के साथ उपयुक्त फसलें दिखाता है।',
    },
  },
  {
    id: 'faq_marketplace_sell',
    category: 'marketplace',
    question: {
      en: 'How can farmers sell harvests directly without middlemen?',
      hi: 'किसान बिना बिचौलिए अपनी फसल सीधे ग्राहकों को कैसे बेच सकते हैं?',
    },
    answer: {
      en: 'Go to Marketplace and switch to "Sell Your Harvest (Farmer View)". Sign in with Google, enter crop name, quantity in kg or quintal, ₹/kg price, harvest date, and tap the GPS button next to Village/Farm Location to attach coordinates. Your produce appears immediately in the Customer Marketplace.',
      hi: 'सीधा बाज़ार में "अपनी फसल बेचें (किसान व्यू)" चुनें। Google से साइन-इन करके फसल का नाम, मात्रा (किलो या क्विंटल), ₹/किलो दर, कटाई तिथि भरें और खेत की लोकेशन के पास GPS बटन दबाएं। आपकी उपज तुरंत ग्राहक सूची में दिखने लगेगी।',
    },
  },
  {
    id: 'faq_mandi_rates',
    category: 'mandi',
    question: {
      en: 'Are Mandi rates available per kg and per quintal, and how do I check live MSP?',
      hi: 'क्या मंडी भाव प्रति किलो और प्रति क्विंटल दोनों में दिखते हैं, और लाइव MSP कैसे देखें?',
    },
    answer: {
      en: 'Yes. In Mandi Prices, toggle between "Show ₹ / Quintal" and "Show ₹ / kg", filter by State, District, Local Mandi, or Crop Category, and inspect green/red arrows against yesterday’s price. Use the "Live Web MSP, Mandi & Scheme Check" search box for instant government MSP and scheme updates.',
      hi: 'हाँ। मंडी भाव पेज पर आप "₹ / क्विंटल" और "₹ / किलो" के बीच बदल सकते हैं, राज्य/जिला/मंडी चुन सकते हैं और कल के मुकाबले हरे/लाल तीर देख सकते हैं। लाइव MSP और सरकारी योजना जानकारी के लिए लाइव वेब खोज बॉक्स का उपयोग करें।',
    },
  },
  {
    id: 'faq_crop_doctor',
    category: 'doctor',
    question: {
      en: 'How does the AI Camera Crop Doctor diagnose leaf diseases safely?',
      hi: 'AI कैमरा फसल डॉक्टर पत्ती के रोग की पहचान और सुरक्षित उपचार कैसे बताता है?',
    },
    answer: {
      en: 'Tap "Scan Crop with AI Camera" to open your device camera or upload a photo of a damaged leaf, and optionally add a symptom note. AgriVeda identifies likely pests or fungal issues with a confidence score, lists organic alternatives (such as Neem oil or Trichoderma), exact per-litre dosage, and PPE safety rules.',
      hi: '"AI कैमरे से फसल स्कैन करें" दबाकर पत्ती की लाइव फोटो लें या अपलोड करें। AgriVeda संभावित रोग या कीट पहचानकर जैविक उपाय (जैसे नीम तेल या ट्राइकोडर्मा), प्रति लीटर सटीक मात्रा और सुरक्षा सावधानियाँ दिखाता है।',
    },
  },
  {
    id: 'faq_languages',
    category: 'support',
    question: {
      en: 'How do I switch AgriVeda between English and regional Indian languages?',
      hi: 'मैं AgriVeda की भाषा अंग्रेज़ी से हिन्दी या क्षेत्रीय भारतीय भाषाओं में कैसे बदलूँ?',
    },
    answer: {
      en: 'Use the quick EN / हिं toggle in the top navigation bar for instant switching, or open the language dropdown next to it to choose from 16 languages including Hindi, Marathi, Punjabi, Gujarati, Tamil, Telugu, Kannada, Malayalam, Bengali, Odia, Assamese, Urdu, Bhojpuri, Nepali, and Sanskrit.',
      hi: 'शीर्ष नेविगेशन बार में EN / हिं टॉगल दबाएं या पास वाले भाषा मेनू से हिन्दी, मराठी, पंजाबी, गुजराती, तमिल, तेलुगु, कन्नड़, मलयालम, बंगाली, उड़िया, असमिया, उर्दू, भोजपुरी, नेपाली या संस्कृत सहित 16 भाषाओं में से चुनें।',
    },
  },
  {
    id: 'faq_workspace_sync',
    category: 'support',
    question: {
      en: 'How do I export Mandi rates or save crop plans to Google Drive & Sheets?',
      hi: 'मंडी भाव Google Sheets में या फसल रिपोर्ट Google Drive में कैसे सहेजें?',
    },
    answer: {
      en: 'Open "Workspace Sync" in the top bar and sign in with your Google account. Once connected, you can save crop advisories and AI scan reports to Google Drive, export filtered Mandi prices to Google Sheets, send buyer inquiries via Gmail, and schedule farm tasks in Google Calendar.',
      hi: 'शीर्ष बार में "वर्कस्पेस सिंक" खोलकर Google खाते से जुड़ें। इसके बाद आप सलाह रिपोर्ट Google Drive में, मंडी भाव Google Sheets में, ग्राहक संदेश Gmail से और छिड़काव रिमाइंडर Google Calendar में जोड़ सकते हैं।',
    },
  },
  {
    id: 'faq_contact_helpdesk',
    category: 'support',
    question: {
      en: 'How do I contact the AgriVeda Farmer Helpdesk?',
      hi: 'AgriVeda किसान सहायता केंद्र से संपर्क कैसे करें?',
    },
    answer: {
      en: 'Scroll to the Contact & Farmer Helpdesk card above (or click "View Contact Details") to email our official desk at agrivedha.ac@gmail.com or call the toll-free Kisan Call Centre (1800-180-1551) during support hours.',
      hi: 'ऊपर दिए "संपर्क और किसान सहायता केंद्र" कार्ड पर जाएं या "संपर्क विवरण देखें" बटन दबाएं। आप आधिकारिक ईमेल agrivedha.ac@gmail.com पर संदेश भेज सकते हैं या निःशुल्क किसान कॉल सेंटर (1800-180-1551) पर कॉल कर सकते हैं।',
    },
  },
];
