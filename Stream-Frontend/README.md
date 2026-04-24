VITE_TOKEN_SYSTEM  
VITE_SHORTNER_TIME  
VITE_BASE_URL  
VITE_TG_USERNAME  
VITE_SITEKEY  
VITE_WORKERURL  
VITE_SITENAME  
VITE_TG_URL  




```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
