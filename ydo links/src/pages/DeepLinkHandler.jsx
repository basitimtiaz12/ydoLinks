import React, { useEffect, useState } from 'react';
import axios from 'axios';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';

const DeepLinkHandler = () => {
  const { code } = useParams();
  const [status, setStatus] = useState('Detecting device...');
  const [consented, setConsented] = useState(true);
  const [metaInfo, setMetaInfo] = useState(null);

  useEffect(() => {
    if (!consented) return;

    const ua = navigator.userAgent;
    const isAndroid = /Android/i.test(ua);
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const platform = isIOS ? 'ios' : isAndroid ? 'android' : 'desktop';
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';
    const deviceModel = ua.match(/\(([^)]+)\)/)?.[1] || 'Unknown';

    if (!code) {
      setStatus('Invalid link.');
      window.location.href = 'https://yourdoctors.online';
      return;
    }

    const getIpAndFingerprint = async () => {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      const ipResponse = await axios.get('https://api.ipify.org?format=json');
      const ip = ipResponse.data.ip;

      const ipTimezonePlatform = `${ip}_${timezone}_${platform}`;

      return {
        fingerprint: result.visitorId,
        ip,
        platform,
        timezone,
        deviceModel,
        ipTimezonePlatform,
        userAgent: platform,
      };
    };

    const handleRedirect = async () => {
      try {
        setStatus('Validating link...');
        const { data } = await axios.get(
          `${import.meta.env.VITE_API_FIREBASE_CLOUD_FUNCTION_URL_NA}/deepLinkServer?code=${code}`
        );
        console.log("data", data);
        

        // Set meta information dynamically
        setMetaInfo(data.socialMetaTagInfo);

        setStatus('Collecting device info...');
        const info = await getIpAndFingerprint();

        setStatus('Storing data...');
        await axios.post(`${import.meta.env.VITE_API_FIREBASE_CLOUD_FUNCTION_URL_NA}/addFingerPrint`, {
          code,
          ...info,
          timestamp: new Date().toISOString(),
          pending_deep_link: `${import.meta.env.VITE_API_DOMAIN}/${code}`,
        });

        if (platform === 'desktop') {
          // Redirect to the link for non-Android/iOS platforms
          window.location.href = data.redirectURL || "https://yourdoctors.online";
          return;
        }

        setStatus('Redirecting to app...');
        const deepLink = `${import.meta.env.VITE_API_DOMAIN}/${code}`;
        const storeUrl =
          platform === 'ios'
            ? `https://apps.apple.com/app/id${data.ios?.appStoreId || '1439216318'}`
            : `https://play.google.com/store/apps/details?id=${data.android?.packageName || 'com.ydo.smartapp'}&referrer=${deepLink}`;

        window.location.href = deepLink;
        if (platform !== 'desktop') {
          setTimeout(() => {
            window.location.href = storeUrl;
          }, 1500);
        }
      } catch (error) {
        console.error('Redirect failed:', error);
        setStatus('Failed to redirect.');
      }
    };

    handleRedirect();
  }, [consented, code]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      {/* Dynamic Meta Tags */}
      {console.log("metaInfo", metaInfo)}
      {metaInfo && (
        <Helmet>
          <title>{metaInfo.title}</title>
          <meta name="description" content={metaInfo.socialDescription} />
          <meta property="og:title" content={metaInfo.socialTitle} />
          <meta property="og:description" content={metaInfo.socialDescription} />
          <meta property="og:image" content={metaInfo.socialImageLink} />
          {/* <meta property="og:url" content={metaInfo.link} /> */}
        </Helmet>
      )}

      <h2 className="text-2xl font-bold mb-4">Redirecting...</h2>
      <p className="text-lg">{status}</p>
    </div>
  );
};

export default DeepLinkHandler;