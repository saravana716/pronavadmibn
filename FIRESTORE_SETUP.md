# Firestore Database Setup Guide

## ⚠️ Problems
1. Files are uploading to Storage successfully, but URLs are **not being saved to Firestore database**.
2. **Login is failing** with "Missing or insufficient permissions" error.

**Current Firestore Project**: `pranav-global-school---pgs`

**Collections that need access**:
- `admin` - For login authentication (needs read access)
- `gallery` - For storing gallery URLs (needs read/write access)
- `admissionForms` - For admission applications (needs read/write access)
- `contactForms` - For contact messages (needs read/write access)
- `jobApplications` - For job applications (needs read/write access)

## ✅ Solution: Update Firestore Security Rules

### Step 1: Access Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select the project: **pranav-global-school---pgs** (for Firestore/Database)

### Step 2: Navigate to Firestore Rules
1. In the left sidebar, click on **"Firestore Database"**
2. Click on the **"Rules"** tab (at the top, next to Data, Indexes, Usage)

### Step 3: Update the Rules
You'll see a code editor with the current Firestore rules. **Replace all existing rules** with:

#### ⚡ Quick Fix: For Development/Testing (Allows all reads/writes)
**Copy and paste this EXACT code:**

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
  }
}
```

**Important**: 
- Copy the ENTIRE code block above
- Paste it to REPLACE all existing rules
- Don't add any extra characters or spaces

### Step 4: Publish the Rules
1. After pasting the rules, click the **"Publish"** button (usually at the top right)
2. Wait for confirmation: "Rules published successfully"
3. **Wait 10-30 seconds** for rules to propagate

### Step 5: Test
1. Go back to your Gallery page
2. Upload a file
3. Check the browser console (F12) - you should see:
   - "File uploaded successfully. URL: ..."
   - "Saving to Firestore..."
   - "Saved to Firestore with ID: ..."
4. The file should now appear in your gallery! ✅

## 🔍 Verify Firestore Data

To verify data is being saved:
1. Go to Firebase Console → **pranav-global-school---pgs** project
2. Click **Firestore Database** → **Data** tab
3. You should see a **"gallery"** collection
4. Click on it to see documents with:
   - `url` (the download URL)
   - `name` (file name)
   - `type` (image or video)
   - `fullPath` (storage path)
   - `createdAt` (timestamp)

## 🔧 Troubleshooting

### Still not saving to Firestore?

1. **Check browser console** (F12):
   - Look for "Firestore save error" messages
   - Check the error code and message
   - Verify it shows the correct project ID: `pranav-global-school---pgs`

2. **Verify the project**:
   - Make sure you're updating rules in **pranav-global-school---pgs** project
   - NOT in the datastore-4c889 project (that's for Storage)

3. **Check rules syntax**:
   - Ensure `rules_version = '2';` is at the top
   - Make sure the collection name is `gallery` (lowercase)
   - Verify all quotes are straight quotes (")

4. **Wait for propagation**:
   - Rules can take 30-60 seconds to fully propagate
   - Wait a minute and try uploading again

5. **Clear browser cache**:
   - Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
   - Clear cached images and files
   - Refresh the page

## 📋 Current Configuration Summary

- **Storage Project**: `datastore-4c889` (for file uploads)
- **Storage Bucket**: `datastore-4c889.appspot.com`
- **Firestore Project**: `pranav-global-school---pgs` (for storing URLs, admin data, and forms)
- **Collections**:
  - `admin` - Admin credentials for login (read access needed)
  - `gallery` - Gallery images/videos URLs (read/write access needed)
  - `admissionForms` - Admission application forms (read/write access needed)
  - `contactForms` - Contact form messages (read/write access needed)
  - `jobApplications` - Job application forms (read/write access needed)

## 🔒 Production Security Rules

For production, use more secure rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Admin collection - read only for login
    match /admin/{document=**} {
      allow read: if true; // Allow reading for login validation
      allow write: if false; // Never allow writes (update manually in console)
    }
    
    // Gallery collection - authenticated writes
    match /gallery/{document=**} {
      allow read: if true; // Anyone can view gallery
      allow write: if request.auth != null; // Only authenticated users can upload
    }
    
    // AdmissionForms collection - authenticated writes
    match /admissionForms/{document=**} {
      allow read: if request.auth != null; // Only authenticated users can view
      allow write: if request.auth != null; // Only authenticated users can update
    }
    
    // ContactForms collection - authenticated writes
    match /contactForms/{document=**} {
      allow read: if request.auth != null; // Only authenticated users can view
      allow write: if request.auth != null; // Only authenticated users can update
    }
    
    // JobApplications collection - authenticated writes
    match /jobApplications/{document=**} {
      allow read: if request.auth != null; // Only authenticated users can view
      allow write: if request.auth != null; // Only authenticated users can update
    }
  }
}
```

This allows:
- **Admin Read**: Anyone can read admin collection (needed for login)
- **Admin Write**: Never allowed (prevents unauthorized admin creation)
- **Gallery Read**: Anyone can read gallery items
- **Gallery Write**: Only authenticated users can add/delete items

