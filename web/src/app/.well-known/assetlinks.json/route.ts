import { NextResponse } from "next/server";

// Digital Asset Links: lets the installed Android app (TWA) open
// https://edufarm-app.netlify.app full-screen with no browser URL bar.
// Fingerprint = SHA-256 of C:\Android\EduFarmTwa\edufarm.keystore (alias edufarm).
// If the keystore is ever replaced, update the fingerprint here AND rebuild the APK.
export async function GET() {
  return NextResponse.json(
    [
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: "com.edufarm.app",
          sha256_cert_fingerprints: [
            "36:07:48:0F:BB:46:28:5D:92:0E:D4:CA:F6:97:B0:AF:9D:A9:8C:18:9D:8F:39:DF:5A:CE:05:3F:3A:39:C1:0E",
          ],
        },
      },
    ],
    {
      headers: { "Content-Type": "application/json" },
    },
  );
}
