import { Collector } from '../models/Collector.js';
import { Buyer } from '../models/Buyer.js';
import { Material } from '../models/Material.js';
import { Price } from '../models/Price.js';
import { Recycler } from '../models/Recycler.js';
import { SafetyAlert } from '../models/SafetyAlert.js';

export async function seedDatabase(): Promise<void> {
  try {
    // 1. Seed Collector
    const collectorCount = await Collector.countDocuments();
    if (collectorCount === 0) {
      await Collector.create({
        collectorId: 'KC-COL-101',
        name: 'Ramesh Kumar',
        phone: '9876543210',
        preferredLanguage: 'hi',
        stats: {
          totalLots: 4,
          totalWeightKg: 18.5,
          totalEstimatedValue: 4620,
        },
      });
      console.log('[Seed] Default collector seeded');
    }

    // 2. Seed Materials
    const materialCount = await Material.countDocuments();
    if (materialCount === 0) {
      const materials = [
        {
          code: 'mobile_pcb',
          nameEn: 'Mobile PCB',
          nameHi: 'मोबाइल पीसीबी',
          nameMr: 'मोबाईल पीसीबी',
          category: 'Circuit Board',
          icon: '📱',
          defaultUnit: 'kg',
          indicativeRate: 480,
          descriptionEn: 'High-grade circuit boards from smartphones and feature phones.',
          descriptionHi: 'स्मार्टफोन और कीपैड फोन के हाई-ग्रेड सर्किट बोर्ड।',
        },
        {
          code: 'laptop_pcb',
          nameEn: 'Laptop / Motherboard',
          nameHi: 'लैपटॉप मदरबोर्ड',
          nameMr: 'लॅपटॉप मदरबोर्ड',
          category: 'Circuit Board',
          icon: '💻',
          defaultUnit: 'kg',
          indicativeRate: 360,
          descriptionEn: 'Motherboards from laptops and desktop CPU units.',
          descriptionHi: 'लैपटॉप और कंप्यूटर सीपीयू के मुख्य मदरबोर्ड।',
        },
        {
          code: 'copper_cable',
          nameEn: 'Copper Wire / Cable',
          nameHi: 'तांबा तार / केबल',
          nameMr: 'तांबे वायर / केबल',
          category: 'Cables',
          icon: '🔌',
          defaultUnit: 'kg',
          indicativeRate: 320,
          descriptionEn: 'Insulated copper power and data cables.',
          descriptionHi: 'बिजली और डेटा केबल (तांबा)। जलाना सख्त मना है।',
        },
        {
          code: 'battery_li_ion',
          nameEn: 'Lithium-ion Battery',
          nameHi: 'लिथियम-आयन बैटरी',
          nameMr: 'लिथियम-आयन बॅटरी',
          category: 'Battery',
          icon: '🔋',
          defaultUnit: 'kg',
          indicativeRate: 140,
          descriptionEn: 'Rechargeable mobile, laptop, and powerbank batteries. Handle with care.',
          descriptionHi: 'मोबाइल व लैपटॉप की बैटरी। पंचर न करें या आग में न डालें।',
        },
        {
          code: 'display_monitor',
          nameEn: 'Computer / Monitor',
          nameHi: 'मॉनिटर / स्क्रीन',
          nameMr: 'मॉनिटर / स्क्रीन',
          category: 'Display',
          icon: '🖥️',
          defaultUnit: 'kg',
          indicativeRate: 50,
          descriptionEn: 'LED, LCD and CRT computer monitors.',
          descriptionHi: 'कंप्यूटर मॉनिटर और डिस्प्ले। कांच का ध्यान रखें।',
        },
        {
          code: 'appliance_electronics',
          nameEn: 'Electronic Appliance',
          nameHi: 'घरेलू इलेक्ट्रॉनिक्स',
          nameMr: 'घरगुती इलेक्ट्रॉनिक्स',
          category: 'Appliance',
          icon: '🏠',
          defaultUnit: 'kg',
          indicativeRate: 40,
          descriptionEn: 'Small home electronics (mixers, radios, routers, set-top boxes).',
          descriptionHi: 'छोटे घरेलू इलेक्ट्रॉनिक उपकरण (राउटर, सेट-टॉप बॉक्स आदि)।',
        },
        {
          code: 'aluminium_casing',
          nameEn: 'Aluminium Heat Sink / Casing',
          nameHi: 'एल्युमिनियम केसिंग',
          nameMr: 'अ‍ॅल्युमिनियम केसिंग',
          category: 'Metals',
          icon: '⚙️',
          defaultUnit: 'kg',
          indicativeRate: 115,
          descriptionEn: 'Aluminium heat sinks, laptop lids and structural frames.',
          descriptionHi: 'एल्युमिनियम कूलिंग सिंक और इलेक्ट्रॉनिक बॉडी।',
        },
        {
          code: 'unclassified_ewaste',
          nameEn: 'Unclassified E-waste',
          nameHi: 'अवर्गीकृत ई-कचरा',
          nameMr: 'अवर्गीकृत ई-कचरा',
          category: 'Other',
          icon: '📦',
          defaultUnit: 'kg',
          indicativeRate: 30,
          descriptionEn: 'Mixed or unidentified e-waste to be sorted at formal facility.',
          descriptionHi: 'मिश्रित ई-कचरा। औपचारिक केंद्र पर छांटा जाएगा।',
        },
      ];

      await Material.insertMany(materials);
      console.log('[Seed] Materials seeded');
    }

    // 3. Seed Prices
    const priceCount = await Price.countDocuments();
    if (priceCount === 0) {
      const allMaterials = await Material.find();
      const prices = allMaterials.map((m) => ({
        materialCode: m.code,
        materialNameEn: m.nameEn,
        materialNameHi: m.nameHi,
        rate: m.indicativeRate,
        unit: m.defaultUnit,
        currency: 'INR',
        sourceLabel: 'Indicative benchmark (SIH Demo)',
        isDemo: true,
        effectiveAt: new Date(),
      }));
      await Price.insertMany(prices);
      console.log('[Seed] Indicative benchmark prices seeded');
    }

    // 4. Seed Demo Recyclers
    const recyclerCount = await Recycler.countDocuments();
    if (recyclerCount === 0) {
      const recyclers = [
        {
          name: 'GreenEarth Formal E-Recyclers Hub',
          address: 'Plot 42, MIDC Industrial Area, Andheri East, Mumbai',
          latitude: 19.1136,
          longitude: 72.8697,
          acceptedMaterials: ['mobile_pcb', 'laptop_pcb', 'battery_li_ion', 'copper_cable'],
          status: 'ACCEPTING',
          isDemo: true,
          contactPhone: '+91 98201 11223',
          sourceLabel: 'Demo Authorized Recycler (SIH Prototype)',
          operatingHours: '08:30 AM - 07:00 PM',
        },
        {
          name: 'EcoShred India Formal Recovery Unit',
          address: 'Okhla Industrial Area Phase-III, New Delhi',
          latitude: 28.5355,
          longitude: 77.2688,
          acceptedMaterials: ['mobile_pcb', 'laptop_pcb', 'display_monitor', 'appliance_electronics'],
          status: 'ACCEPTING',
          isDemo: true,
          contactPhone: '+91 98110 55443',
          sourceLabel: 'Demo Authorized Recycler (SIH Prototype)',
          operatingHours: '09:00 AM - 06:30 PM',
        },
        {
          name: 'CleanCity E-Waste Aggregation Center',
          address: 'Peenya Industrial Area Stage 2, Bengaluru',
          latitude: 13.0285,
          longitude: 77.5197,
          acceptedMaterials: ['mobile_pcb', 'laptop_pcb', 'copper_cable', 'aluminium_casing', 'battery_li_ion'],
          status: 'ACCEPTING',
          isDemo: true,
          contactPhone: '+91 99000 88776',
          sourceLabel: 'Demo Authorized Recycler (SIH Prototype)',
          operatingHours: '09:00 AM - 06:00 PM',
        },
        {
          name: 'Swachh Bharat Formal Material Facility',
          address: 'Bhosari Industrial Estate, Pune',
          latitude: 18.6298,
          longitude: 73.8427,
          acceptedMaterials: ['mobile_pcb', 'battery_li_ion', 'unclassified_ewaste'],
          status: 'ACCEPTING',
          isDemo: true,
          contactPhone: '+91 97654 33221',
          sourceLabel: 'Demo Authorized Recycler (SIH Prototype)',
          operatingHours: '08:00 AM - 05:30 PM',
        },
      ];
      await Recycler.insertMany(recyclers);
      console.log('[Seed] Demo authorized recyclers seeded');
    }

    // 5. Seed Safety Alerts
    const safetyCount = await SafetyAlert.countDocuments();
    if (safetyCount === 0) {
      const alerts = [
        {
          alertId: 'safety_battery',
          category: 'battery_li_ion',
          severity: 'HIGH',
          icon: '🔋',
          titleEn: 'Damaged or Swollen Batteries',
          titleHi: 'खराब या फूली हुई बैटरी',
          bodyEn: 'Lithium-ion batteries contain reactive chemicals that can combust or release toxic gases if damaged.',
          bodyHi: 'लिथियम बैटरी में रासायनिक आग का खतरा होता है। इन्हें सुरक्षित स्थान पर रखें।',
          dosEn: ['Store in a dry, cool area away from sunlight', 'Use plastic bins, never metal containers', 'Wear protective gloves'],
          dosHi: ['सूखी और ठंडी जगह पर रखें', 'प्लास्टिक के डिब्बे में रखें', 'हाथ में दस्ताने पहनें'],
          dontsEn: ['Do not puncture, pierce, or hit with a hammer', 'Do not expose to fire, heat, or water', 'Never burn battery casings'],
          dontsHi: ['हथौड़े से न तोड़ें या छेद न करें', 'आग या पानी में न फेंकें', 'कभी न जलाएं'],
          voiceTextEn: 'Warning: Damaged batteries can catch fire. Do not crush, puncture or burn them.',
          voiceTextHi: 'चेतावनी: फूली या खराब बैटरी में आग लग सकती है। इसे न तोड़ें और न जलाएं।',
        },
        {
          alertId: 'safety_cable_burning',
          category: 'copper_cable',
          severity: 'HIGH',
          icon: '🔥',
          titleEn: 'Never Burn Wires or Cables',
          titleHi: 'तारों को कभी न जलाएं',
          bodyEn: 'Burning PVC insulation releases cancer-causing dioxins, furans, and heavy metal smoke.',
          bodyHi: 'तारों का प्लास्टिक जलाने से जानलेवा और जहरीला धुआं निकलता है जो फेफड़ों को नुकसान पहुंचाता है।',
          dosEn: ['Use mechanical cable strippers or manual cutters', 'Hand over unstripped cables to formal recyclers'],
          dosHi: ['केबल स्ट्रिपर या कटर का इस्तेमाल करें', 'साबुत केबल अधिकृत रीसायकलर को दें'],
          dontsEn: ['Never set plastic insulation on fire', 'Do not inhale smoke from melting wires'],
          dontsHi: ['प्लास्टिक को कभी आग न लगाएं', 'धुएं के संपर्क में न आएं'],
          voiceTextEn: 'Health Alert: Do not burn cables. Burning plastic releases toxic cancer-causing smoke.',
          voiceTextHi: 'सावधानी: तारों को न जलाएं। इससे जहरीला धुआं निकलता है। स्ट्रिपर का उपयोग करें।',
        },
        {
          alertId: 'safety_crt_glass',
          category: 'display_monitor',
          severity: 'HIGH',
          icon: '📺',
          titleEn: 'CRT Glass & Vacuum Tubes',
          titleHi: 'सीआरटी मॉनिटर और कांच का खतरा',
          bodyEn: 'Old CRT monitors contain toxic lead glass and are under high vacuum. Breaking them can cause violent implosion.',
          bodyHi: 'पुराने मॉनिटर के ट्यूब में वैक्यूम और भारी सीसा (Lead) होता है। फूटने पर गंभीर चोट लग सकती है।',
          dosEn: ['Keep the screen intact and unbroken', 'Wear eye protection and thick gloves'],
          dosHi: ['स्क्रीन को बिना तोड़े संभालें', 'आंखों का चश्मा और मोटे दस्ताने पहनें'],
          dontsEn: ['Never smash or break CRT glass panels', 'Do not inhale inner phosphor coating dust'],
          dontsHi: ['कांच को हथौड़े से न तोड़ें', 'अंदर के सफेद पाउडर को न छुएं'],
          voiceTextEn: 'Caution: CRT tubes contain vacuum and toxic lead. Do not break or smash them.',
          voiceTextHi: 'सावधानी: सीआरटी स्क्रीन को न फोड़ें। इसमें वैक्यूम और जहरीला सीसा होता है।',
        },
        {
          alertId: 'safety_exposed_circuits',
          category: 'mobile_pcb',
          severity: 'WARNING',
          icon: '⚡',
          titleEn: 'Capacitors and Sharp Components',
          titleHi: 'कैपेसिटर और नुकीले हिस्से',
          bodyEn: 'Large capacitors can store residual electrical charge. PCB edges are extremely sharp.',
          bodyHi: 'बिजली के उपकरणों में करंट रह सकता है। सर्किट बोर्ड के किनारे बहुत नुकीले होते हैं।',
          dosEn: ['Wear cut-resistant safety gloves', 'Wash hands thoroughly after handling boards'],
          dosHi: ['कट-रेजिस्टेंट दस्ताने पहनें', 'काम के बाद हाथ अच्छी तरह धोएं'],
          dontsEn: ['Do not touch live terminals or wet boards with bare hands', 'Do not eat food without washing hands'],
          dontsHi: ['नंगे हाथों से सर्किट न छुएं', 'बिना हाथ धोए खाना न खाएं'],
          voiceTextEn: 'Wear gloves when handling sharp circuit boards and avoid touching large capacitors.',
          voiceTextHi: 'सर्किट बोर्ड छूते समय दस्ताने पहनें और नुकीले किनारों से सावधान रहें।',
        },
      ];
      await SafetyAlert.insertMany(alerts);
      console.log('[Seed] Safety alerts seeded');
    }

    // 6. Seed Demo Authentic Buyer
    const buyerCount = await Buyer.countDocuments();
    if (buyerCount === 0) {
      await Buyer.create({
        buyerId: 'KC-BUY-501',
        shopName: 'Sharma Metal & E-Waste Scrap Yard',
        ownerName: 'Anil Sharma',
        phone: '9823456789',
        gstin: '27AABCU9603R1ZM',
        licenseType: 'GSTIN',
        isVerified: true,
        shopLatitude: 19.1172,
        shopLongitude: 72.8765,
        shopAddress: 'Gala 14, Near MIDC Signal, Andheri East, Mumbai',
        operatingHours: '09:00 AM - 07:30 PM',
        acceptedMaterials: ['mobile_pcb', 'laptop_pcb', 'copper_cable', 'battery_li_ion', 'aluminium_casing'],
        stats: {
          totalLotsPurchased: 8,
          totalWeightKg: 42.6,
          totalAmountPaid: 11450,
        },
        isBanned: false,
        reportCount: 0,
        severityScore: 0,
      });
      console.log('[Seed] Default authentic buyer seeded');
    }
  } catch (error: any) {
    console.error('[Seed] Error seeding database:', error.message);
  }
}
