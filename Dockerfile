# ADIM 1: Projeyi inşa etmek için Gradle ve JDK içeren bir ortam kullan.
FROM gradle:8.1-jdk17 AS build
# Proje dosyalarını konteynerin içine kopyala.
COPY --chown=gradle:gradle . /home/gradle/src
WORKDIR /home/gradle/src
# Gradle ile "fat jar" dosyasını oluştur.
RUN gradle jar --no-daemon

# ADIM 2: Sadece Java'yı çalıştırabilen temiz ve küçük bir ortam kullan.
FROM eclipse-temurin:17-jre
# Uygulamanın çalışacağı portu belirt. Bu port, konteynerler arası iletişim içindir.
EXPOSE 1337
# Uygulama dosyaları için bir klasör oluştur.
RUN mkdir /app
WORKDIR /app
# İnşa edilmiş olan .jar dosyasını ilk ortamdan bu yeni ortama kopyala.
COPY --from=build /home/gradle/src/build/libs/app.jar /app/app.jar
# Konteyner başlatıldığında çalıştırılacak olan komut.
# Java sunucumuzu başlatır ve FastCGI için 1337 portunu dinlemesini söyler.
ENTRYPOINT ["java", "-DFCGI_PORT=1337", "-jar", "app.jar"]