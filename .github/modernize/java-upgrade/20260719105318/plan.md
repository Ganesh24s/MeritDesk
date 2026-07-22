# Upgrade Plan: MeritDesk (20260719105318)

- **Generated**: 2026-07-19 10:53:18
- **HEAD Branch**: N/A
- **HEAD Commit ID**: N/A

## Available Tools

**JDKs**
- JDK 17: not available (baseline will be skipped)
- JDK 25: C:\Program Files\Java\jdk-25.0.3\bin (required for upgrade validation)

**Build Tools**
- Maven 3.9.16: C:\Users\saiga\Downloads\apache-maven-3.9.16-bin\apache-maven-3.9.16\bin

## Guidelines

> Note: You can add any specific guidelines or constraints for the upgrade process here if needed, bullet points are preferred.

## Options

- Working branch: appmod/java-upgrade-20260719105318
- Run tests before and after the upgrade: true

## Upgrade Goals

- Java runtime: 25

## Technology Stack

| Technology/Dependency | Current | Min Compatible | Why Incompatible |
| ---------------------- | ------- | -------------- | ---------------- |
| Java | 17 | 25 | User requested |
| Spring Boot | 3.3.5 | 3.5.x | Better compatibility with Java 25 runtime |
| Maven wrapper | none | 3.9.16+ | Recommended for modern JDK support |
| Docker Java base image | openjdk:17 | temurin/jdk:25 | Must match target runtime |

## Derived Upgrades

- Upgrade the Java target property from 17 to 25.
- Align the backend container image with the Java 25 runtime.
- Update Spring Boot to a release line that supports Java 25 if the initial build proves incompatible.

## Impact Analysis

### Dependency Changes

| File | Dependency | Current | Action | Target | Reason |
|------|-----------|---------|--------|--------|--------|
| backend/pom.xml | java.version | 17 | upgrade | 25 | User requested |
| backend/pom.xml | spring-boot-starter-parent | 3.3.5 | upgrade | 3.5.x | Required for reliable Java 25 compatibility if build errors occur |
| backend/Dockerfile | base image | openjdk:17 | upgrade | eclipse-temurin:25-jdk | Match target runtime |

### Source Code Changes

| File | Location | Current | Required Change | Reason |
|------|----------|---------|----------------|--------|
| None expected | - | - | No source changes required for the initial upgrade | Java target change is build/configuration driven |

### Configuration Changes

| File | Property/Setting | Current | Required Change | Reason |
|------|------------------|---------|----------------|--------|
| backend/pom.xml | java.version | 17 | 25 | Target Java runtime |
| backend/Dockerfile | base image | openjdk:17-jdk-slim | eclipse-temurin:25-jdk | Target Java runtime |

### CI/CD Changes

| File | Location | Current | Required Change |
|------|----------|---------|----------------|
| backend/Dockerfile | runtime image | openjdk:17-jdk-slim | Change to Java 25-compatible base image |

### Risks & Warnings

- The current Spring Boot line may require a minor version bump to compile cleanly on Java 25.
  - Mitigation: Build with Java 25 first, then bump Spring Boot if Maven reports incompatibility.

## Upgrade Steps

- Step 1: Setup Environment
  - **Rationale**: Ensure the target JDK and Maven are available before applying the upgrade.
  - **Changes to Make**: Use the installed Java 25 JDK and Maven 3.9.x for verification.
  - **Verification**: `mvn -version` and `java -version`, expected result: Java 25 and Maven 3.9.x are available.

- Step 2: Setup Baseline
  - **Rationale**: Capture the current build state before the runtime change, if the current JDK is available.
  - **Changes to Make**: Run the existing Maven build/tests.
  - **Verification**: `mvn clean test-compile -q && mvn clean test -q`, expected result: baseline build/test status recorded; skipped because the current JDK 17 is not available in the environment.

- Step 3: Upgrade Java Runtime Configuration
  - **Rationale**: Change the project build and container runtime to Java 25 while keeping the application behavior intact.
  - **Changes to Make**: Apply all Dependency Changes and Configuration Changes listed above.
  - **Verification**: `mvn clean test-compile -q`, expected result: compilation succeeds.

- Step 4: Final Validation
  - **Rationale**: Confirm the application builds and tests pass under Java 25.
  - **Changes to Make**: Resolve any compatibility issues uncovered by the build and tests.
  - **Verification**: `mvn clean test -q`, expected result: all tests pass under Java 25.
