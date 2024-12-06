FROM node:22.9.0

ARG APP_TIMEZONE=Europe/Moscow
ENV TZ=${APP_TIMEZONE}

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome

RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    --no-install-recommends \
    && curl --location --silent https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y \
        google-chrome-stable \
        fonts-ipafont-gothic \
        fonts-wqy-zenhei \
        fonts-thai-tlwg \
        fonts-kacst \
        fonts-freefont-ttf \
        --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser

WORKDIR /usr/src/app

COPY . .

RUN npm install

RUN chown -R pptruser:pptruser /usr/src/app

USER pptruser

EXPOSE 3000

CMD ["npm", "run", "start:dev"]