# MyFAInance Mobile (Expo)

## Run

```bash
cd apps/mobile
npm install
npm run start
```

Then choose one:
- `a` to open Android emulator
- Scan QR with Expo Go on your phone

## API base

Set the API base so the mobile app can reach the backend:

Windows PowerShell (local session):
```powershell
$env:EXPO_PUBLIC_API_BASE="http://10.0.2.2:8000"
```

- Android Emulator: use `http://10.0.2.2:8000`
- Physical device: use your machine LAN IP, e.g. `http://192.168.1.50:8000`

## Notes

- If you see an "Invalid hook call" error, delete `apps/mobile/node_modules` and run `npm install` again.
- This repo uses workspaces; Expo resolves dependencies from the repo root `node_modules`.
- If login hangs on "Loading...", verify the API is reachable and check `EXPO_PUBLIC_API_BASE`.

- Login, register, verify, and password reset flows are implemented as a minimal scaffold.
- After login, the app shows a placeholder authenticated view.
