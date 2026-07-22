# Upgrade Summary: MeritDesk (20260719105318)

## Result

The backend Java runtime was upgraded to Java 25 LTS successfully.

## What Changed

- Updated the Maven Java target from 17 to 25 in [backend/pom.xml](backend/pom.xml)
- Updated the backend container image to Java 25 in [backend/Dockerfile](backend/Dockerfile)
- Fixed a missing Optional import in [backend/src/main/java/com/meritdesk/service/TicketService.java](backend/src/main/java/com/meritdesk/service/TicketService.java)

## Verification

- Java runtime: 25.0.3
- Maven: 3.9.16
- Compilation: `mvn clean test-compile -q` ✅
- Tests: `mvn clean test -q` ✅

## Notes

No version control branch was created because the workspace is not a Git repository.
