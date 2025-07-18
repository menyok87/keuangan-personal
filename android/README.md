# Akuntansi Keuangan - Android App

Aplikasi mobile untuk manajemen keuangan personal yang dibangun dengan React Native.

## Fitur Utama

- 📊 **Dashboard Keuangan**: Ringkasan pemasukan, pengeluaran, dan saldo bersih
- 💰 **Manajemen Transaksi**: Tambah, lihat, dan hapus transaksi
- 🎯 **Anggaran Bulanan**: Kelola dan pantau anggaran per kategori
- 🏆 **Target Keuangan**: Tetapkan dan lacak target tabungan
- 💳 **Hutang & Piutang**: Kelola hutang dan piutang dengan tracking pembayaran
- 👤 **Profil Pengguna**: Kelola informasi profil dan pengaturan akun

## Teknologi yang Digunakan

- **React Native 0.73.2**: Framework mobile cross-platform
- **React Navigation 6**: Navigasi antar screen
- **Supabase**: Backend as a Service untuk database dan autentikasi
- **React Native Paper**: UI component library
- **React Native Vector Icons**: Icon library
- **TypeScript**: Type safety dan better development experience

## Persyaratan Sistem

- Node.js 16 atau lebih tinggi
- React Native CLI
- Android Studio (untuk Android development)
- Xcode (untuk iOS development - opsional)

## Instalasi

1. **Clone repository**:
   ```bash
   git clone <repository-url>
   cd android
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Setup Android environment**:
   - Install Android Studio
   - Setup Android SDK
   - Create virtual device atau connect physical device

4. **Install pods (untuk iOS)**:
   ```bash
   cd ios && pod install && cd ..
   ```

## Menjalankan Aplikasi

### Android
```bash
npm run android
```

### iOS
```bash
npm run ios
```

### Start Metro Bundler
```bash
npm start
```

## Build untuk Production

### Android APK
```bash
npm run build:android
```

### Android Debug APK
```bash
npm run build:android-debug
```

## Struktur Folder

```
android/
├── src/
│   ├── components/          # Reusable components
│   ├── screens/            # Screen components
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilities dan konfigurasi
│   └── types/              # TypeScript type definitions
├── android/                # Android native code
├── ios/                    # iOS native code (jika ada)
└── package.json
```

## Konfigurasi

### Environment Variables
Buat file `.env` di root folder dengan konfigurasi berikut:

```env
SUPABASE_URL=https://ddtwsrfrfywgrqxxvsso.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup
Aplikasi menggunakan Supabase sebagai backend. Pastikan database sudah disetup dengan tabel yang diperlukan:

- `user_profiles`: Profil pengguna
- `transactions`: Data transaksi keuangan
- `budgets`: Data anggaran
- `financial_goals`: Target keuangan
- `debts`: Data hutang dan piutang

## Fitur Keamanan

- **Row Level Security (RLS)**: Data terisolasi per user
- **Authentication**: Login/register dengan email dan password
- **Session Management**: Auto-refresh token dan persistent session

## Troubleshooting

### Common Issues

1. **Metro bundler error**:
   ```bash
   npx react-native clean-project-auto
   npm start -- --reset-cache
   ```

2. **Android build error**:
   ```bash
   cd android && ./gradlew clean && cd ..
   npm run android
   ```

3. **iOS build error**:
   ```bash
   cd ios && pod install && cd ..
   npm run ios
   ```

## Kontribusi

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Support

Jika ada pertanyaan atau masalah, silakan buat issue di repository ini.