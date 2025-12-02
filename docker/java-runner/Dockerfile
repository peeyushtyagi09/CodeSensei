FROM openjdk:20-jdk-slim

WORKDIR /sandbox
COPY ./entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
