/**
 * Avla Real Estate — Site Güvenlik Gözcü Ajanı
 * Çalıştığı yer: Google Apps Script (script.google.com)
 * Alert: sami@avla.com.tr
 *
 * Kurulum: KURULUM.md dosyasını izleyin.
 */

const CONFIG = {
  ALERT_EMAIL: 'sami@avla.com.tr',

  // İzlenecek sayfalar — yeni URL eklemek için aşağıya satır ekleyin
  TARGETS: [
    {
      name: 'Avla Real Estate Ana Site',
      url: 'https://www.avlarealestate.com',
    },
    // VENUS landing yayına alındığında aşağıdaki yorumu kaldırın:
    // {
    //   name: 'VENUS Athens Riviera Landing',
    //   url: 'https://www.avlarealestate.com/venus',
    // },
  ],

  // İzlenecek JSON dosyaları (varsa)
  JSON_TARGETS: [
    // {
    //   name: 'VENUS apartments.json',
    //   url: 'https://www.avlarealestate.com/venus/data/apartments.json',
    // },
  ],
};

/* =================================================================
   ANA KONTROL — 5 dakikada bir tetiklenir
   ================================================================= */
function checkAll() {
  const props = PropertiesService.getScriptProperties();
  let alertCount = 0;

  CONFIG.TARGETS.forEach(target => {
    const result = fetchTarget(target.url);
    const statusKey = 'status:' + target.url;
    const hashKey = 'hash:' + target.url;
    const prevStatus = props.getProperty(statusKey) || 'ok';

    // 1) Site düştü mü?
    if (result.error || result.status >= 500 || result.status === 0) {
      if (prevStatus !== 'down') {
        sendAlert('KRITIK — ' + target.name + ' DUSTU', [
          'URL: ' + target.url,
          'HTTP kodu: ' + (result.status || 'TIMEOUT'),
          'Hata: ' + (result.error || '-'),
          'Zaman: ' + tr(new Date()),
          '',
          'Tarayicida acin. Acilmiyorsa Wix Admin > Site Settings > kontrol.',
        ]);
        props.setProperty(statusKey, 'down');
        alertCount++;
      }
      return;
    }

    // 2) Site geri geldi mi?
    if (prevStatus === 'down') {
      sendAlert('COZULDU — ' + target.name + ' geri geldi', [
        'URL: ' + target.url,
        'HTTP kodu: ' + result.status,
        'Zaman: ' + tr(new Date()),
      ]);
      props.setProperty(statusKey, 'ok');
      alertCount++;
    }

    // 3) Sayfa goruunur metni degisti mi? (Wix dinamik kisimlari ayiklanir)
    const visibleText = extractVisibleText(result.body);
    const hash = sha256(visibleText);
    const prevHash = props.getProperty(hashKey);

    if (prevHash && prevHash !== hash) {
      const prevSize = parseInt(props.getProperty(hashKey + ':size') || '0', 10);
      const newSize = visibleText.length;
      const delta = newSize - prevSize;
      const pct = prevSize ? Math.round((delta / prevSize) * 100) : 0;

      sendAlert('ICERIK DEGISTI — ' + target.name, [
        'URL: ' + target.url,
        'Goruunur metin boyutu: ' + newSize + ' (onceki ' + prevSize +
          ', fark ' + (delta >= 0 ? '+' : '') + delta + ' / ' + (pct >= 0 ? '+' : '') + pct + '%)',
        'Zaman: ' + tr(new Date()),
        '',
        'NOT: Wix Editor\'de son saatlerde degisiklik yaptiysaniz bu beklenen bir alerttir.',
        'Yapmadiysaniz ACIL: Wix Admin > Settings > Login Activity. Tanimadiginiz oturum varsa',
        'sifrenizi degistirin ve 2FA acin.',
      ]);
      alertCount++;
    }

    props.setProperty(hashKey, hash);
    props.setProperty(hashKey + ':size', String(visibleText.length));
  });

  // JSON izleme
  CONFIG.JSON_TARGETS.forEach(target => {
    const result = fetchTarget(target.url);
    if (result.status !== 200 || !result.body) return;

    const hashKey = 'jsonhash:' + target.url;
    const hash = sha256(result.body);
    const prevHash = props.getProperty(hashKey);

    if (prevHash && prevHash !== hash) {
      const prevBody = props.getProperty(hashKey + ':body') || '';
      sendAlert('JSON DEGISTI — ' + target.name, [
        'URL: ' + target.url,
        'Boyut: ' + result.body.length + ' bayt (onceki ' + prevBody.length + ')',
        'Zaman: ' + tr(new Date()),
        '',
        '== ONCEKI ICERIK ==',
        prevBody.slice(0, 1500),
        '',
        '== YENI ICERIK ==',
        result.body.slice(0, 1500),
      ]);
      alertCount++;
    }

    props.setProperty(hashKey, hash);
    props.setProperty(hashKey + ':body', result.body.slice(0, 4000));
  });

  // Haftalik ozet icin sayac
  const stats = JSON.parse(props.getProperty('stats') || '{"checks":0,"alerts":0}');
  stats.checks = (stats.checks || 0) + 1;
  stats.alerts = (stats.alerts || 0) + alertCount;
  props.setProperty('stats', JSON.stringify(stats));
}

/* =================================================================
   HAFTALIK OZET — Pazartesi 09:00
   ================================================================= */
function weeklySummary() {
  const props = PropertiesService.getScriptProperties();
  const stats = JSON.parse(props.getProperty('stats') || '{"checks":0,"alerts":0}');

  const targetSummary = CONFIG.TARGETS.map(t => {
    const status = props.getProperty('status:' + t.url) || 'ok';
    return '- ' + t.name + ' — ' + (status === 'down' ? 'SU ANDA DUSUK!' : 'calisiyor OK');
  }).join('\n');

  sendAlert('Haftalik ozet — ' + new Date().toLocaleDateString('tr-TR'), [
    'Son 7 gun — Avla site izleme raporu',
    '',
    '- Toplam kontrol: ' + stats.checks,
    '- Gonderilen alert: ' + stats.alerts,
    '',
    'Izlenen siteler:',
    targetSummary,
    '',
    '— MANUEL HATIRLATICI —',
    '1) Wix Admin > Settings > Login Activity. Taniumadiginiz oturum var mi?',
    '2) Wix Admin > Roles & Permissions. Yetkili sayisi dogru mu?',
    '3) Avla Gmail sifresi son 90 gunde degisti mi?',
    '4) 2FA hala aktif mi?',
  ]);

  props.setProperty('stats', JSON.stringify({ checks: 0, alerts: 0 }));
}

/* =================================================================
   YARDIMCI FONKSIYONLAR
   ================================================================= */

function fetchTarget(url) {
  try {
    const resp = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      followRedirects: true,
      validateHttpsCertificates: true,
      headers: { 'User-Agent': 'Avla-Watcher/1.0' },
    });
    return {
      status: resp.getResponseCode(),
      body: resp.getContentText(),
      error: null,
    };
  } catch (e) {
    return { status: 0, body: '', error: String(e) };
  }
}

function extractVisibleText(html) {
  // Wix sayfalari her istekte degisen request-id, nonce, build hash icerir.
  // Sadece goruunur metni hash'leriz; rastgele degisikliklere yanmaz alarm.
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sha256(s) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    s,
    Utilities.Charset.UTF_8
  );
  return bytes.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}

function tr(d) {
  return Utilities.formatDate(d, 'Europe/Istanbul', 'dd.MM.yyyy HH:mm');
}

function sendAlert(subject, lines) {
  MailApp.sendEmail({
    to: CONFIG.ALERT_EMAIL,
    subject: '[Avla Watcher] ' + subject,
    body: lines.join('\n'),
  });
}

/* =================================================================
   KURULUM FONKSIYONLARI — bir kez elle calistirilir
   ================================================================= */

/**
 * 1. ADIM: e-posta iznini verir, test maili atar.
 */
function testEmail() {
  MailApp.sendEmail({
    to: CONFIG.ALERT_EMAIL,
    subject: '[Avla Watcher] Test maili — kurulum dogrulandi',
    body: [
      'Bu maili aldiysaniz ajan e-posta gonderebiliyor demektir.',
      '',
      'Siradaki adim: setupTriggers fonksiyonunu calistirin.',
      'Onun ardindan 5 dakikada bir izleme baslar.',
    ].join('\n'),
  });
}

/**
 * 2. ADIM: zamanlanmis gorevleri kurar.
 */
function setupTriggers() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger('checkAll').timeBased().everyMinutes(5).create();
  ScriptApp.newTrigger('weeklySummary').timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(9).create();

  // Hemen ilk hash'i alalim
  checkAll();

  MailApp.sendEmail({
    to: CONFIG.ALERT_EMAIL,
    subject: '[Avla Watcher] Kurulum tamamlandi',
    body: [
      'Site izleme ajani aktif.',
      '',
      'Izlenen hedefler:',
      ...CONFIG.TARGETS.map(t => '- ' + t.name + ' — ' + t.url),
      '',
      'Kontrol sikligi: 5 dakika',
      'Haftalik rapor: Pazartesi 09:00',
      '',
      'Durdurmak icin: stopAllTriggers fonksiyonunu calistirin.',
    ].join('\n'),
  });
}

/**
 * Tum trigger'lari durdurur.
 */
function stopAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => ScriptApp.deleteTrigger(t));
  Logger.log('Durduruldu. Silinen trigger sayisi: ' + triggers.length);
}
