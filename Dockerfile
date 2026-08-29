# ---- Build stage ----
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copy POM first to leverage layer caching
COPY backend-java/pom.xml .
RUN mvn -q dependency:go-offline || true

# Copy sources and build the jar
COPY backend-java/src ./src
RUN mvn -q clean package -DskipTests

# ---- Runtime stage ----
FROM eclipse-temurin:17-jre
WORKDIR /app

# Non-root user for running the app
RUN useradd --create-home --shell /usr/sbin/nologin appuser
USER appuser

COPY --from=build /app/target/nexushealth-backend.jar ./nexushealth-backend.jar

ENV SERVER_PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/nexushealth-backend.jar"]
