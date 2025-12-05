FROM eclipse-temurin:17-jdk

WORKDIR /sandbox

COPY ./entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
