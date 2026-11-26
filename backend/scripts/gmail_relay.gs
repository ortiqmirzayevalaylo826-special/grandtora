/**
 * Grantora — Gmail ko'prigi (Google Apps Script).
 *
 * Nima uchun: Render'ning bepul tarifi SMTP portlarini (25, 465, 587) yopib qo'ygan, shuning uchun server Gmail'ga
 * to'g'ridan-to'g'ri ulana olmaydi. Bu skript sizning Gmail akkauntingizda ishlaydi, server unga oddiy HTTPS so'rovi
 * yuboradi va xat sizning Gmail'ingizdan jo'natiladi. Bepul: oddiy Gmail uchun kuniga ~100 ta xat.
 *
 * O'rnatish:
 *  1) https://script.google.com -> "New project" (Yangi loyiha)
 *  2) Code.gs ichidagi hamma narsani o'chirib, shu faylni qo'ying
 *  3) TOKEN ni o'zingiz o'ylab topgan uzun maxfiy so'zga almashtiring (kamida 32 belgi)
 *  4) Saqlang (Ctrl+S). Deploy -> New deployment -> turi: "Web app"
 *       Execute as: Me        Who has access: Anyone
 *  5) Ruxsat so'rasa: Allow (Advanced -> Go to ... (unsafe) — bu o'zingizning skriptingiz)
 *  6) Berilgan "Web app URL" (.../exec) ni Render'da EMAIL_RELAY_URL ga, TOKEN ni EMAIL_RELAY_TOKEN ga yozing;
 *     MAIL_PROVIDER=gmail qiling.
 *  7) Tekshirish: URL ni brauzerda oching — {"ok":true,...} chiqishi kerak.
 *
 * Skriptni o'zgartirsangiz: Deploy -> Manage deployments -> Edit -> New version (URL o'zgarmaydi).
 */
const TOKEN = "BU-YERGA-UZUN-MAXFIY-SOZ-YOZING";

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.token !== TOKEN) return out({ ok: false, error: "token" });
    if (!d.to || !d.subject) return out({ ok: false, error: "to/subject" });
    MailApp.sendEmail({ to: d.to, subject: d.subject, body: d.body || "", name: d.name || "Grantora" });
    return out({ ok: true, left: MailApp.getRemainingDailyQuota() });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}

function doGet() {
  return out({ ok: true, service: "Grantora Gmail relay" });
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
