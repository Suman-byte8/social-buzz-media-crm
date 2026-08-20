import Cookies from 'js-cookie';

const STORAGE_PREFIX = 'crm_agency_';

export const saveToStorage = (key, data, expireDays = 7) => {
  if (typeof window === 'undefined') return;
  try {
    const stringified = JSON.stringify(data);
    const fullKey = STORAGE_PREFIX + key;
    localStorage.setItem(fullKey, stringified);
    Cookies.set(fullKey, stringified, { expires: expireDays });
  } catch (error) {
    console.error('Error saving to storage:', error);
  }
};

export const getFromStorage = (key) => {
  if (typeof window === 'undefined') return null;
  try {
    const fullKey = STORAGE_PREFIX + key;
    const localData = localStorage.getItem(fullKey);
    if (localData) return JSON.parse(localData);

    const cookieData = Cookies.get(fullKey);
    if (cookieData) return JSON.parse(cookieData);
  } catch (error) {
    console.error('Error reading from storage:', error);
  }
  return null;
};

export const removeFromStorage = (key) => {
  if (typeof window === 'undefined') return;
  try {
    const fullKey = STORAGE_PREFIX + key;
    localStorage.removeItem(fullKey);
    Cookies.remove(fullKey);
  } catch (error) {
    console.error('Error removing from storage:', error);
  }
};
