module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx,html}",
  ],
  theme: {
    extend: {
      colors: {
        // contoh warna custom (opsional)
        primary: {
          50: '#f0f7ff',
          100: '#d9eeff',
          200: '#b3dbff',
          300: '#8accff',
          400: '#57b3ff',
          500: '#1e90ff',
          600: '#1777cc',
          700: '#0f4f80',
          800: '#07314a',
          900: '#031726',
        },
      },
    },
  },
  safelist: [
    // jika kamu memakai kelas yang dibuat dinamis, tambahkan di sini
    'bg-primary-500', 'text-primary-500', 'border-primary-500'
  ],
  plugins: [],
};
