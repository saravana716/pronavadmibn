# Firebase Rules Setup Guide

This guide provides complete Firebase rules for both **Firestore Database** and **Firebase Storage** to support all admin panel features.

## 📋 Projects Overview

- **Storage Project**: `datastore-4c889` (for file uploads)
- **Storage Bucket**: `datastore-4c889.appspot.com`
- **Firestore Project**: `pranav-global-school---pgs` (for storing URLs, admin data, and forms)

---

## 🔥 Firestore Database Rules

### Project: `pranav-global-school---pgs`

### Step 1: Access Firestore Rules
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **pranav-global-school---pgs**
3. Click **Firestore Database** → **Rules** tab

### Step 2: Copy and Paste These Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to admin collection for login
    match /admin/{document=**} {
      allow read: if true;
      allow write: if false; // Prevent writes for security
    }
    
    // Allow read/write access to gallery collection
    match /gallery/{document=**} {
      allow read, write: if true;
    }
    
    // Allow read/write access to admissionForms collection
    match /admissionForms/{document=**} {
      allow read, write: if true;
    }
    
    // Allow read/write access to contactForms collection
    match /contactForms/{document=**} {
      allow read, write: if true;
    }
    
    // Allow read/write access to jobApplications collection
    match /jobApplications/{document=**} {
      allow read, write: if true;
    }
    
    // Allow read/write access to homePage collection (for video and banner)
    match /homePage/{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Step 3: Publish
1. Click **"Publish"** button
2. Wait for confirmation
3. Wait 10-30 seconds for rules to propagate

### Collections Covered:
- ✅ `admin` - Admin login credentials (read only)
- ✅ `gallery` - Gallery images/videos
- ✅ `admissionForms` - Admission applications
- ✅ `contactForms` - Contact messages
- ✅ `jobApplications` - Job applications
- ✅ `homePage` - Home page video and banner (NEW)

---

## 📦 Firebase Storage Rules

### Project: `datastore-4c889`

### Step 1: Access Storage Rules
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **datastore-4c889**
3. Click **Storage** → **Rules** tab

### Step 2: Copy and Paste These Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow read/write access to gallery files
    match /gallery/{allPaths=**} {
      allow read, write: if true;
    }
    
    // Allow read/write access to homepage files (video and banner)
    match /homepage/{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

### Step 3: Publish
1. Click **"Publish"** button
2. Wait for confirmation
3. Wait 10-30 seconds for rules to propagate

### Storage Paths Covered:
- ✅ `gallery/*` - Gallery images and videos
- ✅ `homepage/*` - Home page video and banner images (NEW)

---

## 🔍 Verify Rules Are Applied

### For Firestore:
1. Go to Firebase Console → **pranav-global-school---pgs** project
2. Click **Firestore Database** → **Rules** tab
3. Verify you see the `homePage` collection rule
4. Check **Data** tab to see if `homePage` collection exists (it will be created on first upload)

### For Storage:
1. Go to Firebase Console → **datastore-4c889** project
2. Click **Storage** → **Rules** tab
3. Verify you see the `homepage/{allPaths=**}` rule
4. Check **Files** tab to see if `homepage/` folder exists (it will be created on first upload)

---

## 🧪 Test the New Pages

### Test Home Page Video:
1. Go to admin panel → **Home Page Video**
2. Upload a video file
3. Check browser console (F12) for any errors
4. Verify video appears in the "Current Video" section

### Test Home Page Banner:
1. Go to admin panel → **Home Page Banner**
2. Upload an image file
3. Check browser console (F12) for any errors
4. Verify banner appears in the "Current Banner" section

---

## 🔒 Production Security Rules (Optional)

For production, you may want more secure rules that require authentication:

### Firestore (Production):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /admin/{document=**} {
      allow read: if true;
      allow write: if false;
    }
    
    match /gallery/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /admissionForms/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    match /contactForms/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    match /jobApplications/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    match /homePage/{document=**} {
      allow read: if true; // Public read for homepage content
      allow write: if request.auth != null; // Only authenticated admins can update
    }
  }
}
```

### Storage (Production):
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /gallery/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.resource.size < 50 * 1024 * 1024  // Max 50MB
                   && request.resource.contentType.matches('image/.*|video/.*');
    }
    
    match /homepage/{allPaths=**} {
      allow read: if true; // Public read for homepage content
      allow write: if request.auth != null
                   && request.resource.size < 100 * 1024 * 1024  // Max 100MB for videos
                   && request.resource.contentType.matches('image/.*|video/.*');
    }
  }
}
```

---

## 🔧 Troubleshooting

### "Permission denied" errors?

1. **Verify correct project**: 
   - Firestore rules → `pranav-global-school---pgs`
   - Storage rules → `datastore-4c889`

2. **Check rules syntax**:
   - Ensure `rules_version = '2';` is at the top
   - Check for typos in collection/path names
   - Verify all quotes are straight quotes (")

3. **Wait for propagation**:
   - Rules can take 30-60 seconds to fully propagate
   - Wait a minute and try again

4. **Clear browser cache**:
   - Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
   - Clear cached images and files
   - Refresh the page

5. **Check browser console**:
   - Open Developer Tools (F12)
   - Look for specific error messages
   - Verify the project IDs match

---

## 📝 Quick Reference

### Firestore Collections:
- `admin` - Admin credentials
- `gallery` - Gallery items
- `admissionForms` - Admission applications
- `contactForms` - Contact messages
- `jobApplications` - Job applications
- `homePage/video` - Home page video document
- `homePage/banner` - Home page banner document

### Storage Paths:
- `gallery/` - Gallery files
- `homepage/` - Home page video and banner files

---

## ✅ Checklist

- [ ] Firestore rules updated in `pranav-global-school---pgs` project
- [ ] Storage rules updated in `datastore-4c889` project
- [ ] Rules published successfully
- [ ] Waited 30+ seconds for propagation
- [ ] Tested Home Page Video upload
- [ ] Tested Home Page Banner upload
- [ ] Verified files appear in Firebase Console

