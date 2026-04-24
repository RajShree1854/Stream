import axios from 'axios';

export async function getEncryptedUrl(url) {
  const BASE = import.meta.env.VITE_BASE_URL;
  
  try {
    const response = await axios.get(`${BASE}/api/encrypt-url`, {
      params: { url }
    });
    
    if (response.data && response.data.url) {
      return response.data.url;
    }
    
    return url;
  } catch (error) {
    console.error('Error encrypting URL:', error);
    return url;
  }
}
