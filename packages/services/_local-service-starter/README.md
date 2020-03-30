This package is used to bootstrap all api for local development and testing.

It utilizes ngrok proxy to receive callback requests from Crypto API. This is necessary because local endpoints are not routable outside of the development machine. Ngrok creates an internet accessible url which points to the local api.