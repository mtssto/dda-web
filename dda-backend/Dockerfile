FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN apk add --no-cache maven && mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
RUN mkdir -p /app/uploads
EXPOSE 8081
ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-8081} -jar app.jar"]
