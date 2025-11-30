import mobileAds, {
  InterstitialAd,
  AdEventType,
} from 'react-native-google-mobile-ads';
import AsyncStorage from '@react-native-async-storage/async-storage';

let interstitialAd: InterstitialAd | null = null;
let isAdLoaded = false;

const AD_UNIT_ID = 'ca-app-pub-7206127764714040/1586835792'; // Replace with your production ad unit ID
const LAST_AD_SHOWN_KEY = 'lastAdShownTime';
const AD_FREQUENCY_MS = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

export const initializeInterstitialAd = () => {
  mobileAds()
    .initialize()
    .then(() => {
      createAndLoadInterstitial();
    });
};

function createAndLoadInterstitial() {
  interstitialAd = InterstitialAd.createForAdRequest(AD_UNIT_ID, {
    requestNonPersonalizedAdsOnly: true,
    keywords: [
      'books',
      'spiritual',
      'life',
      'lifestyle',
      'wisdom',
      'philosophy',
      'self-help',
      'inspiration',
    ],
  });

  interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
    isAdLoaded = true;
  });

  interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
    isAdLoaded = false;
    createAndLoadInterstitial();
  });

  interstitialAd.addAdEventListener(AdEventType.ERROR, () => {
    isAdLoaded = false;
    setTimeout(createAndLoadInterstitial, 5000);
  });

  interstitialAd.load();
}

export const checkAndShowAd = async () => {
  try {
    const lastShown = await AsyncStorage.getItem(LAST_AD_SHOWN_KEY);
    const now = Date.now();
    if (lastShown) {
      const lastShownTime = parseInt(lastShown, 10);
      if (!isNaN(lastShownTime) && now - lastShownTime < AD_FREQUENCY_MS) {
        // Less than 4 hours since last ad, do not show
        return;
      }
    }
    if (interstitialAd && isAdLoaded) {
      interstitialAd.show();
      await AsyncStorage.setItem(LAST_AD_SHOWN_KEY, now.toString());
    }
  } catch (e) {
    // Fallback: show ad if possible
    if (interstitialAd && isAdLoaded) {
      interstitialAd.show();
    }
  }
};
