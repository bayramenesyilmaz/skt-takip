export type HelpPageKey =
  | 'dashboard'
  | 'liste'
  | 'ara'
  | 'ekle'
  | 'iade'
  | 'paletler'
  | 'eksik-bilgi'
  | 'stok-sifir'
  | 'kampanya'
  | 'reyonlar'

interface HelpContent {
  title: string
  steps: string[]
}

export const HELP_CONTENT: Record<HelpPageKey, HelpContent> = {
  dashboard: {
    title: 'Ana Sayfa Nasil Calisir?',
    steps: [
      'Acil Urunler kartinda suresi yaklasan veya gecen urunleri gorursunuz.',
      'Alt ortadaki yuvarlak butona dokunarak barkod okutup hizlica urun ekleyebilir veya guncelleyebilirsiniz.',
      'Uyari kartlarina (eksik bilgi, stok sifir, kampanya) dokunarak ilgili listeye gidersiniz.',
    ],
  },
  liste: {
    title: 'Liste Nasil Calisir?',
    steps: [
      'Tum urunleriniz son kullanma tarihine (SKT) gore siralanir.',
      'Arama kutusu ve marka / kategori / reyon filtreleriyle listeyi daraltabilirsiniz.',
      '"Sec" butonuna basip birden fazla urunu toplu kategori atayabilir veya paylasabilirsiniz.',
      'Bir urune dokunarak detayina girip yeni SKT ekleyebilir, duzenleyebilir ya da iade baslatabilirsiniz.',
    ],
  },
  ara: {
    title: 'Ara Nasil Calisir?',
    steps: [
      'Urun adi, stok kodu veya barkod yazarak aninda arayin.',
      'Kamera ikonuna dokunup barkod okutarak da arayabilirsiniz.',
      'Reyon etiketine dokunarak mevcut reyonunuzda mi yoksa tum reyonlarda mi arandigini degistirebilirsiniz.',
    ],
  },
  ekle: {
    title: 'Urun Ekle Nasil Calisir?',
    steps: [
      'Tekil: Barkod okutun veya elle girin, urun bilgisi ve SKT ekleyin.',
      'Toplu: WhatsApp\'tan kopyaladiginiz "urun - tarih" listesini yapistirip toplu ekleyin.',
      'Excel: Barkodu olmayan urunleri (ad, stok kodu, marka) Excel dosyasindan toplu ekleyin.',
    ],
  },
  iade: {
    title: 'Iade Nasil Calisir?',
    steps: [
      'Barkod okutup veya arayarak iade edilecek urunu secin, adet girin.',
      'Kayitlar gune gore gruplanir; bir gunu secip sadece o gunun adedini paylasabilirsiniz.',
      '"Toplam Adetler" panelinden urun bazinda toplam iade adedini gorebilirsiniz.',
      'Bir kayda dokunup duzenleyebilir veya silebilirsiniz.',
    ],
  },
  paletler: {
    title: 'Paletler Nasil Calisir?',
    steps: [
      'Yeni bir palet olusturup icine urun ekleyerek hangi urunden kac adet oldugunu takip edin.',
      'Palet detayindan kopyala / paylas ile listeyi yetkiliye iletebilirsiniz.',
    ],
  },
  'eksik-bilgi': {
    title: 'Eksik Bilgili Urunler Nasil Calisir?',
    steps: [
      'Barkodu, stok kodu olmayan, stogu sifir olan veya baska bir urunle ayni barkod/stok koduna sahip urunler burada toplanir.',
      'Ustteki filtrelerden hangi sorunu gormek istediginizi secebilirsiniz.',
      'Barkodu eksik urunlere hemen barkod okutup ekleyebilirsiniz; digerleri icin urun detayina gidip duzenleyebilirsiniz.',
    ],
  },
  'stok-sifir': {
    title: 'Stok Sifir Urunler Nasil Calisir?',
    steps: [
      'Stogu biten urunler burada listelenir; eski SKT kayitlari otomatik silinmistir.',
      'Urunu barkod okutup yeni SKT girdiginizde adet otomatik 1 olarak tekrar aktif hale gelir.',
      'Artik stoklamayacaksaniz urunu kalici olarak silebilirsiniz.',
    ],
  },
  kampanya: {
    title: 'Kampanya Urunleri Nasil Calisir?',
    steps: [
      'SKT\'sine az kalan ve kampanyaya uygun urunler burada listelenir.',
      'Kopyala / Paylas ile listeyi yetkiliye bildirebilirsiniz.',
    ],
  },
  reyonlar: {
    title: 'Reyonlar Nasil Calisir?',
    steps: [
      'Reyon ekleyip su an hangi reyonda calistiginizi secin.',
      'Yeni eklediginiz urunler otomatik olarak secili reyona atanir.',
      'Liste ve Ara sayfalari varsayilan olarak bu reyona gore filtrelenir; dilerseniz "Tum Reyonlar" secebilirsiniz.',
      'Disa aktarirken sadece secili reyonu aktarmayi secebilirsiniz.',
    ],
  },
}
