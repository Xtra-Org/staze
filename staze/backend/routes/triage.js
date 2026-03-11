import { Router } from 'express'
import { detectScenario, getLanguage } from '../services/language.js'
import { generateTriage, geminiAvailable } from '../services/gemini.js'

const router = Router()

const severityRank = {
  LOW: 1,
  MODERATE: 2,
  CRITICAL: 3,
}

const protocols = {
  'chest-pain': {
    severity: 'CRITICAL',
    condition: {
      en: 'Cardiac distress',
      hi: 'हृदय संकट',
      bn: 'হৃদ্‌যন্ত্রের সংকট',
    },
    warning: {
      en: 'Do not let the person walk or eat. Be ready to begin CPR if they collapse.',
      hi: 'व्यक्ति को चलने या खाने न दें। गिरने पर सीपीआर के लिए तैयार रहें।',
      bn: 'রোগীকে হাঁটতে বা খেতে দেবেন না। অজ্ঞান হলে সিপিআরের জন্য প্রস্তুত থাকুন।',
    },
    summary: {
      en: 'Adult with possible cardiac emergency, diaphoresis, and ongoing chest pain. Urgent ambulance transfer advised.',
      hi: 'वयस्क में संभावित हृदय आपातकाल, पसीना और सीने में दर्द। तुरंत एम्बुलेंस ट्रांसफर आवश्यक।',
      bn: 'প্রাপ্তবয়স্ক রোগীর সম্ভাব্য হৃদ্‌রোগজনিত জরুরি অবস্থা, ঘাম এবং বুকব্যথা। দ্রুত অ্যাম্বুলেন্স প্রয়োজন।',
    },
    steps: {
      en: [
        ['Sit and support', 'Help the patient sit upright or half-recline. Loosen tight clothing.', 45],
        ['Call emergency help', 'Call 108 or your nearest ambulance service now and keep the phone on speaker.', 30],
        ['Monitor breathing', 'Watch breathing, color, and alertness continuously. Prepare to start CPR if they collapse.', 90],
      ],
      hi: [
        ['बैठाएं और सहारा दें', 'रोगी को सीधा या आधा टिकाकर बैठाएं। तंग कपड़े ढीले करें।', 45],
        ['आपातकालीन मदद बुलाएं', 'अभी 108 या नज़दीकी एम्बुलेंस सेवा पर कॉल करें और फोन स्पीकर पर रखें।', 30],
        ['सांस पर नज़र रखें', 'सांस, रंग और प्रतिक्रिया लगातार देखें। गिरने पर सीपीआर शुरू करने की तैयारी रखें।', 90],
      ],
      bn: [
        ['বসান ও সহায়তা দিন', 'রোগীকে সোজা বা আধশোয়া অবস্থায় বসান। আঁটসাঁট পোশাক ঢিলা করুন।', 45],
        ['জরুরি সাহায্য ডাকুন', 'এখনই 108 বা নিকটস্থ অ্যাম্বুলেন্সে ফোন করুন এবং স্পিকার অন রাখুন।', 30],
        ['শ্বাস নজরে রাখুন', 'শ্বাস, রং এবং সাড়া পর্যবেক্ষণ করুন। অজ্ঞান হলে সিপিআরের জন্য প্রস্তুত থাকুন।', 90],
      ],
    },
    cprRequired: true,
  },
  bleeding: {
    severity: 'MODERATE',
    condition: {
      en: 'Active bleeding', hi: 'सक्रिय रक्तस्राव', bn: 'সক্রিয় রক্তপাত',
    },
    warning: {
      en: 'If blood soaks through, add more cloth on top. Do not remove the first layer.',
      hi: 'यदि कपड़ा भीग जाए तो ऊपर और कपड़ा रखें। पहली परत न हटाएं।',
      bn: 'কাপড় ভিজে গেলে তার উপর আরও কাপড় চাপুন। প্রথম স্তর খুলবেন না।',
    },
    summary: {
      en: 'External bleeding being controlled with direct pressure. Ongoing reassessment for shock needed.',
      hi: 'बाहरी रक्तस्राव को सीधे दबाव से नियंत्रित किया जा रहा है। शॉक के लिए लगातार जांच ज़रूरी है।',
      bn: 'বাহ্যিক রক্তপাত সরাসরি চাপ দিয়ে নিয়ন্ত্রণ করা হচ্ছে। শকের লক্ষণ পর্যবেক্ষণ জরুরি।',
    },
    steps: {
      en: [
        ['Apply pressure', 'Use a clean cloth or dressing and press firmly over the bleeding site.', 120],
        ['Elevate if safe', 'Raise the injured limb above the heart only if no fracture is suspected.', 45],
        ['Watch for shock', 'Keep the person warm and look for dizziness, sweating, or confusion.', 60],
      ],
      hi: [
        ['दबाव डालें', 'साफ कपड़े या ड्रेसिंग से घाव पर मजबूती से दबाव डालें।', 120],
        ['सुरक्षित हो तो ऊपर उठाएं', 'यदि फ्रैक्चर का संदेह नहीं है तो घायल अंग को दिल से ऊपर रखें।', 45],
        ['शॉक पर नज़र रखें', 'रोगी को गर्म रखें और चक्कर, पसीना या भ्रम देखें।', 60],
      ],
      bn: [
        ['চাপ দিন', 'পরিষ্কার কাপড় বা ড্রেসিং দিয়ে ক্ষতের উপর শক্ত করে চাপ দিন।', 120],
        ['নিরাপদ হলে উপরে তুলুন', 'ভাঙার আশঙ্কা না থাকলে আহত অঙ্গ হৃদয়ের উপরে তুলুন।', 45],
        ['শকের লক্ষণ দেখুন', 'রোগীকে গরম রাখুন এবং মাথা ঘোরা, ঘাম বা বিভ্রান্তি দেখুন।', 60],
      ],
    },
    cprRequired: false,
  },
  trauma: {
    severity: 'CRITICAL',
    condition: {
      en: 'Severe leg trauma',
      hi: 'गंभीर पैर की चोट',
      bn: 'গুরুতর পায়ের আঘাত',
    },
    warning: {
      en: 'Control bleeding immediately, keep the person still, and call 108 now. Do not move a badly injured leg unless there is danger.',
      hi: 'रक्तस्राव तुरंत नियंत्रित करें, व्यक्ति को स्थिर रखें और अभी 108 पर कॉल करें। खतरा न हो तो गंभीर रूप से घायल पैर को न हिलाएं।',
      bn: 'রক্তপাত সঙ্গে সঙ্গে নিয়ন্ত্রণ করুন, রোগীকে স্থির রাখুন এবং এখনই 108-এ কল করুন। বিপদ না থাকলে গুরুতর আহত পা নাড়াবেন না।',
    },
    summary: {
      en: 'High-risk lower-limb trauma after impact. Priority is bleeding control, limb protection, shock prevention, and urgent ambulance transfer.',
      hi: 'टक्कर के बाद निचले पैर में उच्च-जोखिम चोट। प्राथमिकता रक्तस्राव रोकना, पैर को सुरक्षित रखना, शॉक से बचाव और तत्काल एम्बुलेंस ट्रांसफर है।',
      bn: 'ধাক্কার পর নিচের অঙ্গে উচ্চ-ঝুঁকির আঘাত। অগ্রাধিকার হলো রক্তপাত নিয়ন্ত্রণ, অঙ্গ সুরক্ষা, শক প্রতিরোধ এবং দ্রুত অ্যাম্বুলেন্সে স্থানান্তর।',
    },
    steps: {
      en: [
        ['Control major bleeding', 'Press firmly over bleeding wounds with a clean cloth. Add more cloth on top if blood soaks through.', 120],
        ['Keep the leg still', 'Support the injured leg in the position found. Do not straighten or move it unless the scene is unsafe.', 60],
        ['Call emergency help', 'Call 108 immediately and report a road injury with possible severe leg trauma and bleeding.', 30],
        ['Watch for shock', 'Lay the person flat if safe, keep them warm, and monitor breathing, alertness, and skin color.', 90],
      ],
      hi: [
        ['तेज रक्तस्राव रोकें', 'साफ कपड़े से घाव पर मजबूती से दबाव दें। कपड़ा भीग जाए तो ऊपर एक और परत रखें।', 120],
        ['पैर को स्थिर रखें', 'घायल पैर को उसी स्थिति में सहारा दें। जगह सुरक्षित हो तो उसे सीधा करने या हिलाने की कोशिश न करें।', 60],
        ['आपातकालीन मदद बुलाएं', 'अभी 108 पर कॉल करें और बताएं कि सड़क दुर्घटना में पैर गंभीर रूप से घायल है।', 30],
        ['शॉक पर नज़र रखें', 'सुरक्षित हो तो व्यक्ति को सीधा लिटाएं, गर्म रखें और सांस, प्रतिक्रिया व त्वचा का रंग देखते रहें।', 90],
      ],
      bn: [
        ['তীব্র রক্তপাত থামান', 'পরিষ্কার কাপড় দিয়ে ক্ষতের উপর জোরে চাপ দিন। কাপড় ভিজে গেলে তার ওপর আরেকটি স্তর দিন।', 120],
        ['পা স্থির রাখুন', 'আহত পাকে যে অবস্থায় আছে সে অবস্থাতেই সমর্থন দিন। জায়গা নিরাপদ হলে পা সোজা বা নাড়ানোর চেষ্টা করবেন না।', 60],
        ['জরুরি সাহায্য ডাকুন', 'এখনই 108-এ ফোন করুন এবং জানান যে সড়ক দুর্ঘটনায় পায়ে গুরুতর আঘাত লেগেছে।', 30],
        ['শকের লক্ষণ দেখুন', 'নিরাপদ হলে রোগীকে সোজা শুইয়ে গরম রাখুন এবং শ্বাস, সাড়া ও ত্বকের রং দেখুন।', 90],
      ],
    },
    cprRequired: false,
  },
  fracture: {
    severity: 'MODERATE',
    condition: {
      en: 'Possible fracture',
      hi: 'संभावित फ्रैक्चर',
      bn: 'সম্ভাব্য ভাঙন',
    },
    warning: {
      en: 'Do not force the limb straight. Splint only if you can do so without causing more pain.',
      hi: 'अंग को ज़बरदस्ती सीधा न करें। केवल तभी स्प्लिंट करें जब बिना अतिरिक्त दर्द के कर सकें।',
      bn: 'অঙ্গ জোর করে সোজা করবেন না। অতিরিক্ত ব্যথা না বাড়িয়ে পারলে তবেই স্প্লিন্ট দিন।',
    },
    summary: {
      en: 'Suspected fracture after a fall or impact. Protect the limb, limit movement, and arrange urgent evaluation.',
      hi: 'गिरने या चोट के बाद संभावित फ्रैक्चर। अंग को सुरक्षित रखें, हिलना सीमित करें और जल्दी जांच कराएं।',
      bn: 'পড়ে যাওয়া বা আঘাতের পরে সম্ভাব্য ভাঙন। অঙ্গকে সুরক্ষিত রাখুন, নড়াচড়া কমান এবং দ্রুত পরীক্ষা করান।',
    },
    steps: {
      en: [
        ['Immobilize the limb', 'Keep the injured arm or leg as still as possible in the position found.', 90],
        ['Apply cold if available', 'Use a cold pack wrapped in cloth to reduce swelling. Do not place ice directly on skin.', 60],
        ['Check circulation', 'Look for worsening pain, numbness, pale skin, or loss of movement below the injury.', 45],
        ['Arrange urgent transport', 'Call 108 or get urgent medical evaluation, especially if the person cannot bear weight.', 30],
      ],
      hi: [
        ['अंग को स्थिर रखें', 'घायल हाथ या पैर को जिस स्थिति में है उसी में जितना हो सके स्थिर रखें।', 90],
        ['ठंडा सेक दें', 'सूजन कम करने के लिए कपड़े में लपेटा ठंडा पैक लगाएं। बर्फ सीधे त्वचा पर न रखें।', 60],
        ['रक्त प्रवाह जांचें', 'चोट के नीचे बढ़ता दर्द, सुन्नपन, फीकी त्वचा या हरकत कम होना देखें।', 45],
        ['जल्दी अस्पताल पहुंचाएं', '108 पर कॉल करें या जल्दी चिकित्सा जांच कराएं, खासकर यदि रोगी वजन नहीं दे पा रहा हो।', 30],
      ],
      bn: [
        ['অঙ্গ স্থির রাখুন', 'আহত হাত বা পাকে যে অবস্থায় আছে সে অবস্থায় যতটা সম্ভব স্থির রাখুন।', 90],
        ['ঠান্ডা সেক দিন', 'ফোলা কমাতে কাপড়ে মোড়া ঠান্ডা প্যাক ব্যবহার করুন। বরফ সরাসরি ত্বকে দেবেন না।', 60],
        ['রক্তসঞ্চালন দেখুন', 'আঘাতের নিচে বাড়তি ব্যথা, অবশভাব, ফ্যাকাশে ত্বক বা নড়াচড়া কমে যাচ্ছে কি না দেখুন।', 45],
        ['দ্রুত হাসপাতালে নিন', '108-এ ফোন করুন বা দ্রুত চিকিৎসা নিন, বিশেষ করে যদি রোগী ভর দিয়ে দাঁড়াতে না পারেন।', 30],
      ],
    },
    cprRequired: false,
  },
  burn: {
    severity: 'MODERATE',
    condition: {
      en: 'Thermal burn',
      hi: 'तापीय जलन',
      bn: 'তাপজনিত পোড়া',
    },
    warning: {
      en: 'Cool the burn with cool running water. Do not use ice, toothpaste, butter, or oil on the burn.',
      hi: 'जले हुए हिस्से को ठंडे बहते पानी से ठंडा करें। बर्फ, टूथपेस्ट, मक्खन या तेल न लगाएं।',
      bn: 'পোড়া অংশ ঠান্ডা প্রবাহিত পানির নিচে রাখুন। বরফ, টুথপেস্ট, মাখন বা তেল দেবেন না।',
    },
    summary: {
      en: 'Fresh thermal burn to the hand. Priority is cooling, removing constricting items, covering loosely, and arranging medical review if severe.',
      hi: 'हाथ पर ताज़ा तापीय जलन। प्राथमिकता है ठंडा करना, कसाव वाली चीज़ें हटाना, ढीला ढकना और ज़रूरत पर चिकित्सा जांच कराना।',
      bn: 'হাতে নতুন তাপজনিত পোড়া। অগ্রাধিকার হলো ঠান্ডা করা, চেপে থাকা জিনিস খুলে ফেলা, ঢিলে করে ঢেকে রাখা এবং প্রয়োজনে চিকিৎসা নেওয়া।',
    },
    steps: {
      en: [
        ['Cool the burn', 'Hold the burned hand under cool running water for at least 20 minutes. Do not use ice.', 120],
        ['Remove rings and tight items', 'Take off rings, bangles, or tight clothing before swelling starts, unless stuck to the skin.', 45],
        ['Cover loosely', 'Use a clean non-fluffy cloth or sterile dressing. Do not burst blisters.', 60],
        ['Get medical help if needed', 'Seek urgent care if the burn is large, blistering badly, involves the hand deeply, or pain is severe.', 30],
      ],
      hi: [
        ['जले हिस्से को ठंडा करें', 'जले हुए हाथ को कम से कम 20 मिनट तक ठंडे बहते पानी के नीचे रखें। बर्फ का उपयोग न करें।', 120],
        ['अंगूठी और तंग चीज़ें हटाएं', 'सूजन आने से पहले अंगूठी, कंगन या तंग कपड़े हटाएं, यदि वे त्वचा से चिपके न हों।', 45],
        ['ढीला ढकें', 'साफ, रुई-रहित कपड़े या स्टेराइल ड्रेसिंग से ढकें। फफोले न फोड़ें।', 60],
        ['ज़रूरत हो तो इलाज लें', 'यदि जलन बड़ी हो, हाथ पर गहरी लगे, बहुत फफोले हों या दर्द तेज हो तो तुरंत चिकित्सा लें।', 30],
      ],
      bn: [
        ['পোড়া অংশ ঠান্ডা করুন', 'পোড়া হাত কমপক্ষে 20 মিনিট ঠান্ডা প্রবাহিত পানির নিচে রাখুন। বরফ ব্যবহার করবেন না।', 120],
        ['আংটি ও আঁটসাঁট জিনিস খুলুন', 'ফুলে যাওয়ার আগে আংটি, বালা বা আঁটসাঁট কাপড় খুলুন, যদি সেগুলো ত্বকে লেগে না থাকে।', 45],
        ['ঢিলে করে ঢাকুন', 'পরিষ্কার, তুলাবিহীন কাপড় বা জীবাণুমুক্ত ড্রেসিং ব্যবহার করুন। ফোসকা ফাটাবেন না।', 60],
        ['প্রয়োজনে চিকিৎসা নিন', 'পোড়া বড় হলে, হাতে গভীরভাবে লাগলে, বেশি ফোসকা হলে বা ব্যথা তীব্র হলে দ্রুত চিকিৎসা নিন।', 30],
      ],
    },
    cprRequired: false,
  },
  seizure: {
    severity: 'CRITICAL',
    condition: {
      en: 'Active seizure',
      hi: 'सक्रिय दौरा',
      bn: 'সক্রিয় খিঁচুনি',
    },
    warning: {
      en: 'Do not hold the person down and do not put anything in their mouth. Call 108 if the seizure lasts more than 5 minutes.',
      hi: 'व्यक्ति को पकड़कर न रोकें और उसके मुंह में कुछ न डालें। दौरा 5 मिनट से अधिक चले तो 108 पर कॉल करें।',
      bn: 'রোগীকে জোর করে ধরে রাখবেন না এবং মুখে কিছু দেবেন না। খিঁচুনি 5 মিনিটের বেশি চললে 108-এ ফোন করুন।',
    },
    summary: {
      en: 'Person with active seizure activity. Priority is scene safety, head protection, recovery positioning after convulsions, and emergency escalation if prolonged.',
      hi: 'दौरे की सक्रिय अवस्था। प्राथमिकता है जगह सुरक्षित रखना, सिर की सुरक्षा, दौरा रुकने के बाद रिकवरी पोज़िशन और लंबा चलने पर आपातकालीन मदद बुलाना।',
      bn: 'সক্রিয় খিঁচুনি চলছে। অগ্রাধিকার হলো জায়গা নিরাপদ রাখা, মাথা সুরক্ষা, খিঁচুনি থামার পরে রিকভারি পজিশন এবং দীর্ঘ হলে জরুরি সাহায্য ডাকা।',
    },
    steps: {
      en: [
        ['Protect from injury', 'Move hard or sharp objects away and cushion the head with folded clothing.', 60],
        ['Do not restrain', 'Let the seizure happen. Do not hold the person down and do not put anything in the mouth.', 60],
        ['Time the seizure', 'Watch the clock. Call 108 urgently if it lasts more than 5 minutes or repeats.', 30],
        ['Turn on the side after shaking stops', 'When movements stop, place the person on the side and watch breathing closely.', 45],
      ],
      hi: [
        ['चोट से बचाएं', 'कठोर या नुकीली चीज़ें दूर करें और सिर के नीचे मुड़े कपड़े रखें।', 60],
        ['जबरदस्ती न रोकें', 'दौरा होने दें। व्यक्ति को पकड़कर न रोकें और मुंह में कुछ न डालें।', 60],
        ['समय नोट करें', 'घड़ी देखें। दौरा 5 मिनट से अधिक चले या बार-बार आए तो तुरंत 108 पर कॉल करें।', 30],
        ['दौरा रुकने पर करवट दें', 'हरकत रुकने पर व्यक्ति को करवट दें और सांस पर नज़र रखें।', 45],
      ],
      bn: [
        ['আঘাত থেকে বাঁচান', 'কঠিন বা ধারালো জিনিস সরিয়ে দিন এবং মাথার নিচে ভাঁজ করা কাপড় দিন।', 60],
        ['জোর করে ধরবেন না', 'খিঁচুনি হতে দিন। রোগীকে চেপে ধরবেন না এবং মুখে কিছু দেবেন না।', 60],
        ['সময় দেখুন', 'ঘড়ি দেখুন। 5 মিনিটের বেশি চললে বা বারবার হলে দ্রুত 108-এ ফোন করুন।', 30],
        ['থামলে কাত করে শুইয়ে দিন', 'নড়াচড়া থামলে রোগীকে কাত করে শুইয়ে শ্বাস লক্ষ্য করুন।', 45],
      ],
    },
    cprRequired: false,
  },
  choking: {
    severity: 'CRITICAL',
    condition: {
      en: 'Airway blockage',
      hi: 'वायुमार्ग रुकावट',
      bn: 'শ্বাসনালী বাধা',
    },
    warning: {
      en: 'If the person becomes unconscious, call 108 and begin CPR immediately.',
      hi: 'यदि व्यक्ति बेहोश हो जाए तो 108 पर कॉल करें और तुरंत सीपीआर शुरू करें।',
      bn: 'রোগী অচেতন হয়ে গেলে 108-এ ফোন করুন এবং সঙ্গে সঙ্গে সিপিআর শুরু করুন।',
    },
    summary: {
      en: 'Suspected choking emergency. Priority is effective coughing if possible, back blows/abdominal thrusts when needed, and rapid escalation if the person collapses.',
      hi: 'संभावित घुटन आपातकाल। प्राथमिकता है यदि संभव हो तो खांसने देना, जरूरत पर पीठ पर प्रहार/एब्डॉमिनल थ्रस्ट और व्यक्ति गिरने पर तेजी से कार्रवाई।',
      bn: 'সম্ভাব্য শ্বাসরোধজনিত জরুরি অবস্থা। অগ্রাধিকার হলো কাশি করতে উৎসাহ দেওয়া, প্রয়োজনে পিঠে আঘাত/অ্যাবডোমিনাল থ্রাস্ট এবং রোগী পড়ে গেলে দ্রুত ব্যবস্থা নেওয়া।',
    },
    steps: {
      en: [
        ['Ask if they can cough or speak', 'If they can cough strongly, encourage coughing and stay ready to help.', 20],
        ['Give back blows', 'If they cannot speak or breathe, lean them forward and give firm back blows between the shoulder blades.', 30],
        ['Use abdominal thrusts if needed', 'If back blows fail and the person is conscious, give abdominal thrusts until the object comes out or they collapse.', 30],
        ['Call emergency help', 'Call 108 immediately if the blockage does not clear quickly or the person becomes weaker.', 20],
      ],
      hi: [
        ['पूछें क्या खांस या बोल पा रहे हैं', 'यदि वे ज़ोर से खांस सकते हैं तो उन्हें खांसने दें और पास रहें।', 20],
        ['पीठ पर प्रहार दें', 'यदि वे बोल या सांस नहीं ले पा रहे हैं तो उन्हें आगे झुकाकर कंधों के बीच जोरदार प्रहार दें।', 30],
        ['ज़रूरत पर एब्डॉमिनल थ्रस्ट दें', 'यदि पीठ के प्रहार से फायदा न हो और व्यक्ति होश में हो तो एब्डॉमिनल थ्रस्ट दें।', 30],
        ['आपातकालीन मदद बुलाएं', 'यदि रुकावट जल्दी न हटे या व्यक्ति कमजोर पड़ने लगे तो तुरंत 108 पर कॉल करें।', 20],
      ],
      bn: [
        ['কাশি বা কথা বলতে পারছে কি দেখুন', 'যদি জোরে কাশি দিতে পারে, তাকে কাশি চালিয়ে যেতে বলুন এবং পাশে থাকুন।', 20],
        ['পিঠে আঘাত দিন', 'যদি কথা বা শ্বাস নিতে না পারে, তাকে সামনে ঝুঁকিয়ে কাঁধের মাঝখানে জোরে আঘাত দিন।', 30],
        ['প্রয়োজনে অ্যাবডোমিনাল থ্রাস্ট দিন', 'পিঠে আঘাতে কাজ না হলে এবং রোগী সচেতন থাকলে অ্যাবডোমিনাল থ্রাস্ট দিন।', 30],
        ['জরুরি সাহায্য ডাকুন', 'বাধা দ্রুত না সরলে বা রোগী দুর্বল হয়ে পড়লে দ্রুত 108-এ ফোন করুন।', 20],
      ],
    },
    cprRequired: true,
  },
  unconscious: {
    severity: 'CRITICAL',
    condition: {
      en: 'Unresponsive person',
      hi: 'अचेत व्यक्ति',
      bn: 'অচেতন ব্যক্তি',
    },
    warning: {
      en: 'If the person is not breathing normally, call 108 and start CPR immediately.',
      hi: 'यदि व्यक्ति सामान्य सांस नहीं ले रहा है तो 108 पर कॉल करें और तुरंत सीपीआर शुरू करें।',
      bn: 'রোগী স্বাভাবিকভাবে শ্বাস না নিলে 108-এ ফোন করুন এবং সঙ্গে সঙ্গে সিপিআর শুরু করুন।',
    },
    summary: {
      en: 'Unresponsive casualty. Priority is checking breathing, opening the airway, placing in recovery position if breathing, and starting CPR if not breathing normally.',
      hi: 'अचेत रोगी। प्राथमिकता है सांस जांचना, वायुमार्ग खोलना, सांस होने पर रिकवरी पोज़िशन और सांस न होने पर सीपीआर।',
      bn: 'অচেতন রোগী। অগ্রাধিকার হলো শ্বাস পরীক্ষা, বায়ুপথ খোলা, শ্বাস থাকলে রিকভারি পজিশন এবং স্বাভাবিক শ্বাস না থাকলে সিপিআর শুরু করা।',
    },
    steps: {
      en: [
        ['Check response and breathing', 'Tap and shout. Look for normal breathing for up to 10 seconds.', 20],
        ['Open the airway', 'Gently tilt the head back and lift the chin unless you suspect major neck trauma.', 20],
        ['Call emergency help', 'Call 108 immediately and put the phone on speaker.', 20],
        ['Recovery position or CPR', 'If breathing normally, place on the side. If not breathing normally, begin CPR.', 30],
      ],
      hi: [
        ['प्रतिक्रिया और सांस जांचें', 'हल्के से थपथपाएं और जोर से पुकारें। 10 सेकंड तक सामान्य सांस देखें।', 20],
        ['वायुमार्ग खोलें', 'यदि गर्दन की गंभीर चोट का संदेह न हो तो सिर हल्का पीछे करें और ठोड़ी उठाएं।', 20],
        ['आपातकालीन मदद बुलाएं', 'अभी 108 पर कॉल करें और फोन स्पीकर पर रखें।', 20],
        ['रिकवरी पोज़िशन या सीपीआर', 'यदि सामान्य सांस है तो करवट दें। यदि सामान्य सांस नहीं है तो सीपीआर शुरू करें।', 30],
      ],
      bn: [
        ['সাড়া ও শ্বাস পরীক্ষা করুন', 'হালকা টোকা দিন এবং জোরে ডাকুন। 10 সেকেন্ড পর্যন্ত স্বাভাবিক শ্বাস দেখুন।', 20],
        ['বায়ুপথ খুলুন', 'গুরুতর ঘাড়ের আঘাতের সন্দেহ না থাকলে মাথা সামান্য পেছনে নিয়ে থুতনি তুলুন।', 20],
        ['জরুরি সাহায্য ডাকুন', 'এখনই 108-এ ফোন করুন এবং স্পিকার চালু রাখুন।', 20],
        ['রিকভারি পজিশন বা সিপিআর', 'স্বাভাবিক শ্বাস থাকলে কাত করে শুইয়ে দিন। না থাকলে সিপিআর শুরু করুন।', 30],
      ],
    },
    cprRequired: true,
  },
  drowning: {
    severity: 'CRITICAL',
    condition: {
      en: 'Drowning emergency',
      hi: 'डूबने की आपातस्थिति',
      bn: 'ডুবে যাওয়ার জরুরি অবস্থা',
    },
    warning: {
      en: 'If the person is not breathing normally after rescue, call 108 and begin CPR immediately.',
      hi: 'यदि बचाव के बाद व्यक्ति सामान्य सांस नहीं ले रहा है तो 108 पर कॉल करें और तुरंत सीपीआर शुरू करें।',
      bn: 'উদ্ধারের পর রোগী স্বাভাবিকভাবে শ্বাস না নিলে 108-এ ফোন করুন এবং সঙ্গে সঙ্গে সিপিআর শুরু করুন।',
    },
    summary: {
      en: 'Casualty removed from water. Priority is airway management, breathing assessment, warming, and urgent emergency response.',
      hi: 'रोगी को पानी से बाहर निकाला गया है। प्राथमिकता है वायुमार्ग, सांस का आकलन, गर्म रखना और तत्काल आपातकालीन मदद।',
      bn: 'রোগীকে পানি থেকে তোলা হয়েছে। অগ্রাধিকার হলো বায়ুপথ, শ্বাসের মূল্যায়ন, গরম রাখা এবং দ্রুত জরুরি সহায়তা।',
    },
    steps: {
      en: [
        ['Move to safety', 'Keep the person out of the water and on a firm surface.', 20],
        ['Check breathing', 'Look for normal breathing and responsiveness immediately.', 20],
        ['Call emergency help', 'Call 108 and report a drowning emergency.', 20],
        ['Start CPR if needed', 'If the person is not breathing normally, begin CPR at once and continue until help arrives.', 30],
      ],
      hi: [
        ['सुरक्षित जगह लाएं', 'व्यक्ति को पानी से बाहर और मजबूत सतह पर रखें।', 20],
        ['सांस जांचें', 'तुरंत सामान्य सांस और प्रतिक्रिया देखें।', 20],
        ['आपातकालीन मदद बुलाएं', '108 पर कॉल करें और बताएं कि डूबने की आपातस्थिति है।', 20],
        ['ज़रूरत हो तो सीपीआर शुरू करें', 'यदि सामान्य सांस नहीं है तो तुरंत सीपीआर शुरू करें और मदद आने तक जारी रखें।', 30],
      ],
      bn: [
        ['নিরাপদ স্থানে আনুন', 'রোগীকে পানি থেকে তুলে শক্ত মাটিতে রাখুন।', 20],
        ['শ্বাস পরীক্ষা করুন', 'সঙ্গে সঙ্গে স্বাভাবিক শ্বাস ও সাড়া আছে কি না দেখুন।', 20],
        ['জরুরি সাহায্য ডাকুন', '108-এ ফোন করে জানান যে এটি ডুবে যাওয়ার জরুরি অবস্থা।', 20],
        ['প্রয়োজনে সিপিআর শুরু করুন', 'রোগী স্বাভাবিকভাবে শ্বাস না নিলে সঙ্গে সঙ্গে সিপিআর শুরু করুন এবং সাহায্য আসা পর্যন্ত চালিয়ে যান।', 30],
      ],
    },
    cprRequired: true,
  },
}

function buildRoles(peopleCount, language, scenario) {
  const copy = {
    en: ['Caller', 'Compressor', 'Guide', 'Crowd Control'],
    hi: ['कॉलर', 'कम्प्रेसर', 'गाइड', 'भीड़ नियंत्रक'],
    bn: ['কলার', 'কম্প্রেসর', 'গাইড', 'ভিড় নিয়ন্ত্রক'],
  }
  const instructions = {
    en: [
      'Call 102/108 immediately.',
      scenario === 'chest-pain' ? 'Be ready to start CPR.' : 'Stay beside the patient.',
      'Wait outside to guide responders in.',
      'Create space and keep supplies ready.',
    ],
    hi: [
      'तुरंत 102/108 पर कॉल करें।',
      scenario === 'chest-pain' ? 'सीपीआर शुरू करने के लिए तैयार रहें।' : 'रोगी के पास रहें।',
      'रिस्पॉन्डर्स को अंदर लाने के लिए बाहर प्रतीक्षा करें।',
      'जगह खाली रखें और सामान तैयार रखें।',
    ],
    bn: [
      'এখনই 102/108 নম্বরে ফোন করুন।',
      scenario === 'chest-pain' ? 'সিপিআর শুরুর জন্য প্রস্তুত থাকুন।' : 'রোগীর পাশে থাকুন।',
      'উদ্ধারকারীদের পথ দেখাতে বাইরে অপেক্ষা করুন।',
      'জায়গা খালি রাখুন ও প্রয়োজনীয় জিনিস প্রস্তুত রাখুন।',
    ],
  }
  const icons = ['📞', '🫀', '🚪', '👥']

  return Array.from({ length: Math.max(peopleCount, 1) }).slice(0, 4).map((_, index) => ({
    person: index + 1,
    role: copy[language]?.[index] || copy.en[index],
    instruction: instructions[language]?.[index] || instructions.en[index],
    icon: icons[index],
  }))
}

function isGenericCondition(condition = '') {
  return /general first aid|first aid|basic help|initial help|initial stabilization|stabilization sequence|unknown/i.test(condition)
}

router.post('/', async (request, response) => {
  const { emergency = '', language = 'en', peopleCount = 1 } = request.body || {}
  const selectedLanguage = getLanguage(language)
  const scenario = detectScenario(emergency)
  const protocol = protocols[scenario] || {
    severity: 'LOW',
    condition: {
      en: 'General first aid',
      hi: 'सामान्य प्राथमिक सहायता',
      bn: 'সাধারণ প্রাথমিক চিকিৎসা',
    },
    warning: {
      en: selectedLanguage.warningCall,
      hi: selectedLanguage.warningCall,
      bn: selectedLanguage.warningCall,
    },
    summary: {
      en: 'Initial stabilization guidance provided from offline protocol set. Continue monitoring closely.',
      hi: 'ऑफ़लाइन प्रोटोकॉल से प्रारंभिक स्थिरीकरण निर्देश दिए गए हैं। लगातार निगरानी रखें।',
      bn: 'অফলাইন প্রোটোকল থেকে প্রাথমিক নির্দেশনা দেওয়া হয়েছে। নিয়মিত পর্যবেক্ষণ করুন।',
    },
    steps: {
      en: [
        ['Keep the area safe', 'Move away from traffic, flames, electricity, or other hazards.', 30],
        ['Check responsiveness', 'Ask simple questions and look for normal breathing.', 45],
        ['Call emergency support', 'If symptoms worsen or you are unsure, call 108 immediately.', 30],
      ],
      hi: [
        ['जगह सुरक्षित करें', 'ट्रैफ़िक, आग, बिजली या अन्य खतरे से दूर जाएं।', 30],
        ['प्रतिक्रिया जांचें', 'सरल सवाल पूछें और सामान्य सांस देखें।', 45],
        ['आपातकालीन सहायता बुलाएं', 'स्थिति बिगड़े या संदेह हो तो तुरंत 108 पर कॉल करें।', 30],
      ],
      bn: [
        ['জায়গা নিরাপদ করুন', 'রাস্তা, আগুন, বিদ্যুৎ বা অন্য বিপদ থেকে দূরে যান।', 30],
        ['সাড়া পরীক্ষা করুন', 'সহজ প্রশ্ন করুন এবং স্বাভাবিক শ্বাস আছে কিনা দেখুন।', 45],
        ['জরুরি সাহায্য ডাকুন', 'অবস্থা খারাপ হলে বা সন্দেহ থাকলে এখনই 108-এ ফোন করুন।', 30],
      ],
    },
    cprRequired: false,
  }

  const steps = (protocol.steps[language] || protocol.steps.en).map(([title, detail, duration_seconds]) => ({
    title,
    detail,
    duration_seconds,
  }))

  const fallbackResponse = {
    scenario,
    severity: protocol.severity,
    condition: protocol.condition[language] || protocol.condition.en,
    steps,
    cprRequired: protocol.cprRequired,
    roles: buildRoles(peopleCount, language, scenario),
    warning: protocol.warning[language] || protocol.warning.en,
    reportSummary: protocol.summary[language] || protocol.summary.en,
  }

  if (!geminiAvailable()) {
    return response.json(fallbackResponse)
  }

  try {
    const geminiResponse = await generateTriage({ emergency, language, peopleCount })
    const fallbackWins =
      scenario !== 'general' &&
      (isGenericCondition(geminiResponse.condition) ||
        (severityRank[geminiResponse.severity] || 0) < (severityRank[fallbackResponse.severity] || 0))

    if (fallbackWins) {
      return response.json(fallbackResponse)
    }

    return response.json({
      ...fallbackResponse,
      ...geminiResponse,
      steps: geminiResponse.steps?.length ? geminiResponse.steps : fallbackResponse.steps,
      roles: geminiResponse.roles?.length ? geminiResponse.roles : fallbackResponse.roles,
      warning: geminiResponse.warning || fallbackResponse.warning,
      reportSummary: geminiResponse.reportSummary || fallbackResponse.reportSummary,
    })
  } catch (error) {
    console.error('Gemini triage failed, serving fallback protocol:', error.message)
    return response.json(fallbackResponse)
  }
})

export default router
