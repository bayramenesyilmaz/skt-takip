import { Package, Barcode, Search, Clock, MapPin, WifiOff } from 'lucide-react'

export const ONBOARDING_SLIDES = [
  {
    icon: Package,
    title: 'SKT Takip\'e Hos Geldiniz',
    description: 'Reyon gorevlileri icin barkod tarayarak urun ekleyip guncelleyebileceginiz, tamamen cihazinizda calisan son kullanma tarihi takip uygulamasi.',
  },
  {
    icon: Barcode,
    title: 'Barkod ile Hizli Islem',
    description: 'Alt ortadaki Tara butonuna dokunup kamerayla barkod okutarak urun ekleyin, stok guncelleyin veya iade baslatin.',
  },
  {
    icon: Search,
    title: 'Hizli Urun Bulma',
    description: 'Ara sayfasindan isim, stok kodu veya barkodla aninda arayin; Liste sayfasinda marka, kategori ve reyona gore filtreleyin.',
  },
  {
    icon: Clock,
    title: 'SKT Takibi',
    description: 'Son kullanma tarihine gore otomatik kritik, kaldir ve kampanya uyarilari alin; hic bir urunu kacirmayin.',
  },
  {
    icon: MapPin,
    title: 'Reyon Sistemi',
    description: 'Calistiginiz reyonu secin; yeni urunler otomatik o reyona atanir, listeler buna gore filtrelenir ve disa aktarma reyona gore yapilabilir.',
  },
  {
    icon: WifiOff,
    title: 'Tamamen Cevrimdisi',
    description: 'Kayit veya internet gerekmez. Tum verileriniz sadece bu cihazda saklanir.',
  },
]
