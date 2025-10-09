# Stage 1: Build the application using Gradle
FROM gradle:8.10-jdk17 AS build

# Set the working directory first
WORKDIR /home/gradle/src

# Copy all project files from your local machine into the container's working directory
COPY --chown=gradle:gradle . .

# Run the shadowJar task to build the fat JAR
RUN gradle shadowJar --no-daemon

# Stage 2: Create the final, lightweight runtime image
FROM eclipse-temurin:17-jre

# The port your Java app will listen on inside the container
EXPOSE 2002

RUN mkdir /app
WORKDIR /app

# Copy the fat JAR from the build stage.
COPY --from=build /home/gradle/src/build/libs/app.jar /app/app.jar
ENTRYPOINT ["java", "-DFCGI_PORT=2002", "-jar","app.jar"]
