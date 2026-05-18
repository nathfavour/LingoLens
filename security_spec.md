# Security Specification for LingoLens

## Data Invariants
1. A user profile must match the authenticated user's UID.
2. Training progress must belong to the authenticated user and reference a valid accent ID.
3. Users cannot modify their own `createdAt` timestamp.
4. Progress scores must be positive numbers.

## The "Dirty Dozen" Payloads (Denial Tests)
1. Create user profile for different UID.
2. Update user `createdAt` field.
3. Write to progress collection of another user.
4. Set progress score to a very large string (Denial of Wallet).
5. Injection attack in `accentId`.
6. Self-assigning admin role (if it exists, though not explicitly in blueprint).
7. Missing `uid` in user profile.
8. Update `userId` in progress document.
9. Delete another user's progress.
10. Query all users (PII isolation check).
11. Large payload in `displayName`.
12. Invalid timestamp format in `lastUpdated`.

## Firestore Rules Draft
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Global Safety Net
    match /{document=**} {
      allow read, write: if false;
    }

    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(uid) {
      return isSignedIn() && request.auth.uid == uid;
    }
    
    function isValidId(id) {
      return id is string && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$');
    }

    function incoming() {
      return request.resource.data;
    }
    
    function existing() {
      return resource.data;
    }

    // --- Users Collection ---
    match /users/{uid} {
      function isValidUser(data) {
        return data.uid == request.auth.uid &&
               data.email is string && data.email.size() <= 256 &&
               (data.displayName == null || (data.displayName is string && data.displayName.size() <= 128)) &&
               (data.photoURL == null || (data.photoURL is string && data.photoURL.size() <= 512));
      }

      allow get: if isOwner(uid);
      allow create: if isOwner(uid) && isValidUser(incoming()) && 
                    incoming().createdAt == request.time;
      allow update: if isOwner(uid) && isValidUser(incoming()) &&
                    incoming().diff(existing()).affectedKeys().hasOnly(['displayName', 'photoURL']) &&
                    incoming().createdAt == existing().createdAt;
      
      // Progress Subcollection
      match /progress/{accentId} {
        function isValidProgress(data) {
          return data.userId == request.auth.uid &&
                 isValidId(data.accentId) &&
                 data.level is number && data.level >= 0 &&
                 data.score is number && data.score >= 0;
        }

        allow list, get: if isOwner(uid);
        allow create: if isOwner(uid) && isValidProgress(incoming()) &&
                      incoming().lastUpdated == request.time;
        allow update: if isOwner(uid) && isValidProgress(incoming()) &&
                      incoming().diff(existing()).affectedKeys().hasOnly(['level', 'score', 'lastUpdated']) &&
                      incoming().lastUpdated == request.time;
      }
    }
  }
}
```
