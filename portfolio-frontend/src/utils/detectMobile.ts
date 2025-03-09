// src/utils/detectMobile.ts
export const isMobileDevice = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = [
    "android",
    "iphone",
    "ipad",
    "ipod",
    "blackberry",
    "windows phone",
    "mobile",
    "tablet",
  ];
  return mobileKeywords.some((keyword) => userAgent.includes(keyword));
};

export const isIOS = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
};

export const isAndroid = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  return /android/.test(userAgent);
};