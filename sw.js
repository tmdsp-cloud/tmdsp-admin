/* Service worker สำหรับแจ้งเตือน (Firebase Cloud Messaging) — ค่า config ส่งมาทาง query string */
// อัปเดตตัวเองทันทีเมื่อมีเวอร์ชันใหม่ (ไม่ต้องรอปิดแอปทุกหน้าต่าง)
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// กดแจ้งเตือน → เปิดหน้าที่เกี่ยวข้อง (?go=leave|ot|pay|exp|pc)
// ต้องลงทะเบียนก่อน firebase.messaging() เพราะตัวจัดการของ Firebase จะหยุดตัวจัดการอื่นที่ลงทะเบียนทีหลัง
// และถ้าแอปเปิดค้างอยู่ Firebase จะแค่สลับมาที่แอปโดยไม่พาไปหน้าที่ถูกต้อง
self.addEventListener('notificationclick', e => {
  e.stopImmediatePropagation();
  e.notification.close();
  const d = e.notification.data || {};
  const m = d.FCM_MSG || {};
  const url = (m.fcmOptions && m.fcmOptions.link) || (m.notification && m.notification.click_action) || './';
  let go = '';
  try { go = new URL(url, self.location.href).searchParams.get('go') || ''; } catch (err) {}
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const scope = self.registration.scope;
    const c = list.find(w => w.url.indexOf(scope) === 0) || list[0];
    if (c && 'focus' in c) {
      if (go) c.postMessage({ type: 'go', go: go });
      return c.focus().catch(() => clients.openWindow(url));
    }
    return clients.openWindow(url);
  }));
});

const q = new URL(self.location.href).searchParams;
const cfg = { apiKey: q.get('k'), projectId: q.get('p'), messagingSenderId: q.get('s'), appId: q.get('a') };
if (cfg.apiKey && cfg.projectId) {
  importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js',
                'https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');
  firebase.initializeApp(cfg);
  firebase.messaging(); // ข้อความที่มี notification จะถูกแสดงโดยอัตโนมัติ
}
