FROM python:3.11-slim

WORKDIR /sandbox

# ensure script is executable
COPY ./entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
