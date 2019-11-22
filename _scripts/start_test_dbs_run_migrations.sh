docker run --rm -p 5432:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD='' -e POSTGRES_DB=kinesis_exchange --name "postgres" -d postgres:9.6  -c "max_connections=1000"  -c "shared_buffers=943896kB"
docker run --rm -p 6379:6379 --name redis -d redis

lerna run migrate-test-db
