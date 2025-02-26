package com.Portbil.portfolio_backend.config;

import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.*;
import java.util.Collections;

@Component
public class RequestLoggingInterceptor implements HandlerInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(RequestLoggingInterceptor.class);

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if (request.getMethod().equals("PUT") && request.getRequestURI().startsWith("/api/users/")) {
            // Enveloppe la requête pour mettre en cache le corps
            CachedBodyHttpServletRequest cachedRequest = new CachedBodyHttpServletRequest(request);
            StringBuilder jsonBody = new StringBuilder();
            try (BufferedReader reader = cachedRequest.getReader()) {
                String line;
                while ((line = reader.readLine()) != null) {
                    jsonBody.append(line);
                }
            } catch (IOException e) {
                logger.error("Erreur lors de la lecture du JSON brut :", e);
            }
            logger.debug("JSON brut reçu pour {}: {}", request.getRequestURI(), jsonBody.toString());
            // Remplace la requête originale par la version mise en cache
            request = cachedRequest;
        }
        return true;
    }

    // Classe interne pour mettre en cache le corps de la requête
    private static class CachedBodyHttpServletRequest extends jakarta.servlet.http.HttpServletRequestWrapper {

        private byte[] cachedBody;

        public CachedBodyHttpServletRequest(HttpServletRequest request) throws IOException {
            super(request);
            InputStream requestInputStream = request.getInputStream();
            this.cachedBody = readBytes(requestInputStream);
        }

        private byte[] readBytes(InputStream inputStream) throws IOException {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            byte[] buffer = new byte[1024];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                baos.write(buffer, 0, bytesRead);
            }
            return baos.toByteArray();
        }

        @Override
        public ServletInputStream getInputStream() throws IOException {
            return new CachedServletInputStream(cachedBody);
        }

        @Override
        public BufferedReader getReader() throws IOException {
            ByteArrayInputStream bais = new ByteArrayInputStream(cachedBody);
            return new BufferedReader(new InputStreamReader(bais, getCharacterEncoding()));
        }

        private static class CachedServletInputStream extends ServletInputStream {

            private ByteArrayInputStream cachedBodyInputStream;

            public CachedServletInputStream(byte[] cachedBody) {
                this.cachedBodyInputStream = new ByteArrayInputStream(cachedBody);
            }

            @Override
            public boolean isFinished() {
                return cachedBodyInputStream.available() == 0;
            }

            @Override
            public boolean isReady() {
                return true;
            }

            @Override
            public void setReadListener(ReadListener readListener) {
                throw new UnsupportedOperationException();
            }

            @Override
            public int read() throws IOException {
                return cachedBodyInputStream.read();
            }
        }
    }
}