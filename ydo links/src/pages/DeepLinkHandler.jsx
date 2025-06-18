import React, { useEffect, useState } from 'react';
import axios from 'axios';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { useParams } from 'react-router-dom';

const DeepLinkHandler = () => {
  const { code } = useParams(); // ← get dynamic route param
  const [status, setStatus] = useState('Detecting device...');
  const [consented, setConsented] = useState(true); // ← Temporarily true to skip cookie banner

  useEffect(() => {
    if (!consented) return;

    const ua = navigator.userAgent;
    const isAndroid = /Android/i.test(ua);
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const platform = isIOS ? 'ios' : isAndroid ? 'android' : 'desktop';

    if (!code) {
      setStatus('Invalid link.');
      window.location.href = 'https://yourdoctors.online';
      return;
    }

    const getIpAndFingerprint = async () => {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      const ipResponse = await axios.get('https://api.ipify.org?format=json');
      return {
        fingerprint: result.visitorId,
        components: result.components,
        ip: ipResponse.data.ip,
        platform,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown',
        userAgent: ua,
        deviceModel: ua.match(/\(([^)]+)\)/)?.[1] || 'Unknown',
      };
    };

    const handleRedirect = async () => {
      try {
        setStatus('Validating link...');
        const { data } = await axios.get(
          `${import.meta.env.VITE_API_FIREBASE_CLOUD_FUNCTION_URL_NA}/deepLinkServer?code=${code}`
        );

        setStatus('Collecting device info...');
        const info = await getIpAndFingerprint();

        setStatus('Storing data...');
        await axios.post(`${import.meta.env.VITE_API_FIREBASE_CLOUD_FUNCTION_URL_NA}/addFingerPrint`, {
          code,
          ...info,
          timestamp: new Date().toISOString(),
          pending_deep_link: `https://yourdomain.com/${code}`,
        });

        setStatus('Redirecting to app...');
        const deepLink = `https://yourdomain.com/${code}`;
        const storeUrl =
          platform === 'ios'
            ? `https://apps.apple.com/app/id${data.ios?.appStoreId || '1439216318'}`
            : `https://play.google.com/store/apps/details?id=${data.android?.packageName || 'com.ydo.smartapp'}&referrer=${code}`;

        window.location.href = deepLink;
        setTimeout(() => {
          window.location.href = storeUrl;
        }, 1500);
      } catch (error) {
        console.error('Redirect failed:', error);
        setStatus('Failed to redirect.');
        // window.location.href = 'https://yourdoctors.online';
      }
    };

    handleRedirect();
  }, [consented, code]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h2 className="text-2xl font-bold mb-4">Redirecting...</h2>
      <p className="text-lg">{status}</p>
      {/* <CookieConsent
        location="bottom"
        buttonText="Accept"
        onAccept={() => setConsented(true)}
        style={{ background: '#2B373B' }}
        buttonStyle={{ color: '#fff', background: '#4e503b' }}
      >
        This site collects device data for verification purposes.
      </CookieConsent> */}
    </div>
  );
};

export default DeepLinkHandler;
