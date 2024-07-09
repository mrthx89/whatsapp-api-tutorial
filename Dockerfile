# Gunakan image Node.js dari Docker Hub
FROM node:18

# Install dependensi yang diperlukan oleh Chromium
RUN apt-get update && apt-get install -y \
    libnss3-dev \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libgcc1 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    fonts-liberation \
    libappindicator1 \
    libnss3 \
    lsb-release \
    xdg-utils \
    wget \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables for configuration and defaults
ENV APP_PORT=9000
ENV APP_ENV=production

# Set direktori kerja di dalam container
WORKDIR /usr/src/app

# Salin package.json dan package-lock.json
COPY package*.json ./

# Install dependensi
RUN npm install

# Salin sisa kode aplikasi
COPY . .

# Port yang digunakan oleh aplikasi
EXPOSE 9000

# Perintah untuk menjalankan aplikasi saat container dimulai
CMD ["npm", "start"]
