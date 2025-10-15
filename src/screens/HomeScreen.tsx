import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Alert,
  Animated,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from 'react-native';

import LottieView from 'lottie-react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {DailyHeader, RevealCard, TokenCard} from '../components';
import {MainFacts} from '../components/MainFacts.tsx';
import {Summary} from '../components/Summary';
import {TokenStats} from '../components/TokenStats';
import {getDailyToken} from '../services/client';
import {
  clearDailyTokenCache,
  loadDailyTokenCache,
  saveDailyTokenCache,
} from '../services/storage';
import {buildMatchaTradeUrl} from '../utils';

function msUntilNextUtcMidnight(now: Date = new Date()): number {
  const next = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0,
      0,
    ),
  );
  return next.getTime() - now.getTime();
}

function formatHms(ms: number): {h: number; m: number; s: number} {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return {h, m, s};
}

function toUtcDateString(d: Date = new Date()): string {
  const y = d.getUTCFullYear();
  const m = `${d.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${d.getUTCDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const HomeScreen = () => {
  const [loading, setLoading] = useState(false);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const tokenAnim = useRef(new Animated.Value(0)).current;

  const clearTokenCache = async () => {
    await clearDailyTokenCache();
    setToken(null);
    setRemainingMs(null);
  };

  const [token, setToken] = useState<{
    name: string;
    symbol: string;
    priceUsd: number;
    changePct: number;
    contractAddress: string;
    chainSlug: string;
    chainId: number;
    logoUrl?: string;
    marketCapUsd?: number;
    fdvUsd?: number;
    volumeUsd?: number;
    totalSupply?: number;
    circulatingSupply?: number;
    holdersCount?: number;
    resources?: {title: string; url: string}[];
    summary?: string;
  } | null>(null);

  // Rehydrate cached token if still in the same UTC day
  useEffect(() => {
    (async () => {
      try {
        const cached = await loadDailyTokenCache<any>();
        if (cached?.utcDate && cached?.token) {
          if (cached.utcDate === toUtcDateString()) {
            setToken(cached.token);
            setRemainingMs(msUntilNextUtcMidnight());
          } else {
            await clearDailyTokenCache();
          }
        }
      } catch (_) {
        // ignore cache errors
      }
    })();
  }, []);

  const handleReveal = async () => {
    try {
      setLoading(true);
      tokenAnim.setValue(0);
      const data = await getDailyToken();
      const tokenObj = {
        name: data.name,
        symbol: data.symbol,
        priceUsd: data.priceUsd,
        changePct: data.changePct,
        contractAddress: data.contractAddress,
        chainSlug: data.chainSlug,
        chainId: data.chainId,
        logoUrl: data.logoUrl,
        marketCapUsd: data.marketCapUsd,
        fdvUsd: data.fdvUsd,
        volumeUsd: data.volumeUsd,
        totalSupply: data.totalSupply,
        circulatingSupply: data.circulatingSupply,
        holdersCount: data.holdersCount,
        resources: data.resources,
        summary: data.summary,
      } as const;
      setToken(tokenObj);
      try {
        const payload = {
          utcDate: toUtcDateString(),
          token: tokenObj,
          storedAt: Date.now(),
        } as const;
        await saveDailyTokenCache(payload);
      } catch (_) {
        // ignore storage errors
      }
      setShowConfetti(true);
      setRemainingMs(msUntilNextUtcMidnight());
      requestAnimationFrame(() => {
        Animated.timing(tokenAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start();
      });
    } catch (e) {
      // In a real app, show a user-friendly error. For now, simply reset loading state.
    } finally {
      setLoading(false);
    }
  };

  // Tick countdown when a token is present
  useEffect(() => {
    if (!token) {
      setRemainingMs(null);
      return;
    }
    // Initialize remaining time if not yet set
    setRemainingMs(prev => (prev == null ? msUntilNextUtcMidnight() : prev));
    const id = setInterval(() => {
      setRemainingMs(curr => {
        const nextVal = (curr == null ? msUntilNextUtcMidnight() : curr) - 1000;
        if (nextVal <= 0) {
          clearInterval(id);
          clearTokenCache();
          return 0;
        }
        return nextVal;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [token]);

  const time = useMemo(() => {
    if (remainingMs == null) {
      return null;
    }
    const {h, m, s} = formatHms(remainingMs);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return {h, m, s, label: `Next reveal in ${h}h : ${pad(m)}m : ${pad(s)}s`};
  }, [remainingMs]);

  const date = token
    ? new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: '2-digit',
      })
    : undefined;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <DailyHeader dateLabel={date} />
        {token ? (
          <>
            <Animated.View
              style={{
                opacity: tokenAnim,
                transform: [
                  {
                    scale: tokenAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.98, 1],
                    }),
                  },
                ],
              }}
            >
              <TokenCard
                name={token.name}
                symbol={token.symbol}
                priceUsd={token.priceUsd}
                changePct={token.changePct}
                logoUrl={token.logoUrl}
                onTrade={async () => {
                  const url = buildMatchaTradeUrl(
                    token.contractAddress,
                    '20',
                    token.chainId,
                  );
                  if (!url) {
                    const msg = 'This token is not supported on Matcha yet.';
                    if (Platform.OS === 'android') {
                      ToastAndroid.show(msg, ToastAndroid.SHORT);
                    } else {
                      Alert.alert('Not supported yet', msg);
                    }
                    return;
                  }
                  try {
                    await Linking.openURL(url);
                  } catch (e) {
                    // no-op: likely no browser available on device/emulator
                  }
                }}
              />
            </Animated.View>
            {token && time?.label ? (
              <Text style={styles.countdown} accessibilityLiveRegion="polite">
                {time.label}
              </Text>
            ) : null}
            <TokenStats
              marketCapUsd={token.marketCapUsd}
              volumeUsd={token.volumeUsd}
              fdvUsd={token.fdvUsd}
              holdersCount={token.holdersCount}
              totalSupply={token.totalSupply}
              circulatingSupply={token.circulatingSupply}
              symbol={token.symbol}
            />
            <Summary summary={token.summary} />
            {token.resources && token.resources.length > 0 ? (
              <MainFacts resources={token.resources} />
            ) : null}
          </>
        ) : (
          <>
            <RevealCard loading={loading} onReveal={handleReveal} />
          </>
        )}
        <View style={{height: 8}} />
      </ScrollView>
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          For discovery & entertainment. Not investment advice.
        </Text>
      </View>
      {/* Preload confetti composition to avoid first-play jank */}
      <LottieView
        source={require('../assets/lottie/confetti.json')}
        autoPlay={false}
        loop={false}
        cacheComposition
        style={{position: 'absolute', width: 1, height: 1, opacity: 0}}
      />
      {showConfetti ? (
        <View
          pointerEvents="none"
          style={styles.confettiOverlay}
          accessibilityLabel="Confetti celebration"
          accessibilityLiveRegion="polite"
        >
          <LottieView
            source={require('../assets/lottie/confetti.json')}
            autoPlay
            loop={false}
            resizeMode="cover"
            style={StyleSheet.absoluteFillObject}
            cacheComposition
            onAnimationFinish={() => setShowConfetti(false)}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'space-between',
  },
  content: {paddingBottom: 24},
  countdown: {
    textAlign: 'center',
    color: '#00000080',
    marginTop: 8,
    fontSize: 13,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  footerText: {
    textAlign: 'center',
    color: '#00000080',
    fontSize: 12,
    paddingTop: 12,
  },
  confettiOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
