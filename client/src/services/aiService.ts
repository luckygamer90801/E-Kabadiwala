import { SafetyAlertRecord } from '../types/index.ts';

export interface AIClassificationResult {
  materialCode: string;
  nameEn: string;
  nameHi: string;
  confidence: number;
  source: 'MOCK_AI';
}

/**
 * Waste Classification Abstraction
 * Currently provides mock/demo inference ready for future TensorFlow Lite / ONNX integration.
 */
export async function classifyWaste(
  _imageBlob: Blob,
  fallbackIndex = 0
): Promise<AIClassificationResult> {
  // Simulate rapid on-device inference delay (300ms)
  await new Promise((resolve) => setTimeout(resolve, 300));

  const demoPool: AIClassificationResult[] = [
    {
      materialCode: 'laptop_pcb',
      nameEn: 'Laptop PCB / Motherboard',
      nameHi: 'लैपटॉप मदरबोर्ड',
      confidence: 88,
      source: 'MOCK_AI',
    },
    {
      materialCode: 'mobile_pcb',
      nameEn: 'Mobile PCB',
      nameHi: 'मोबाइल पीसीबी',
      confidence: 93,
      source: 'MOCK_AI',
    },
    {
      materialCode: 'copper_cable',
      nameEn: 'Copper Cable',
      nameHi: 'तांबा तार / केबल',
      confidence: 85,
      source: 'MOCK_AI',
    },
    {
      materialCode: 'battery_li_ion',
      nameEn: 'Lithium-ion Battery',
      nameHi: 'लिथियम-आयन बैटरी',
      confidence: 91,
      source: 'MOCK_AI',
    },
  ];

  return demoPool[fallbackIndex % demoPool.length];
}

/**
 * Rule-based Hazard Detector
 */
export function checkHazardRisk(materialCode: string): {
  isHazardous: boolean;
  alertId?: string;
  warningEn?: string;
  warningHi?: string;
} {
  switch (materialCode) {
    case 'battery_li_ion':
      return {
        isHazardous: true,
        alertId: 'safety_battery',
        warningEn: 'Lithium Battery: Do not puncture or expose to heat/fire.',
        warningHi: 'लिथियम बैटरी: इसे न तोड़ें और न ही आग के पास रखें।',
      };
    case 'copper_cable':
      return {
        isHazardous: true,
        alertId: 'safety_cable_burning',
        warningEn: 'Do not burn cables. Inhaling plastic fumes causes severe toxic poisoning.',
        warningHi: 'केबल को न जलाएं। प्लास्टिक जलने से जहरीला धुआं निकलता है।',
      };
    case 'display_monitor':
      return {
        isHazardous: true,
        alertId: 'safety_crt_glass',
        warningEn: 'Screen Hazard: Leaded glass and vacuum tube. Keep intact.',
        warningHi: 'स्क्रीन सावधानी: शीशा न फोड़ें। इसमें जहरीला लेड होता है।',
      };
    case 'mobile_pcb':
    case 'laptop_pcb':
      return {
        isHazardous: true,
        alertId: 'safety_exposed_circuits',
        warningEn: 'Sharp edges and capacitors. Wear cut-resistant gloves.',
        warningHi: 'नुकीले किनारे और करंट का खतरा। दस्ताने पहनें।',
      };
    default:
      return { isHazardous: false };
  }
}

/**
 * Voice Alert Service using Web Speech Synthesis API
 */
export async function speakSafetyAlert(
  alert: Partial<SafetyAlertRecord>,
  language: 'en' | 'hi' | 'mr' = 'hi'
): Promise<void> {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser environment');
    return;
  }

  window.speechSynthesis.cancel(); // Stop any active speech

  const text =
    language === 'hi'
      ? alert.voiceTextHi || alert.bodyHi || alert.titleHi || ''
      : alert.voiceTextEn || alert.bodyEn || alert.titleEn || '';

  if (!text) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1.0;
  utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

  // Attempt to select an Indian voice if available
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find((v) =>
    language === 'hi' ? v.lang.includes('hi') : v.lang.includes('en-IN') || v.lang.includes('en')
  );
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  window.speechSynthesis.speak(utterance);
}
