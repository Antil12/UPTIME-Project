#!/bin/bash

# MongoDB TLS Certificate Generation Script
set -e

CERT_DIR="./certs"
CERT_DAYS=365

echo "🔐 Generating MongoDB TLS/SSL certificates..."
mkdir -p "$CERT_DIR"

# 1. Generate CA private key
echo "1️⃣  Generating CA private key..."
openssl genrsa -out "$CERT_DIR/ca.key" 2048

# 2. Generate CA certificate
echo "2️⃣  Generating CA certificate..."
openssl req -new -x509 -days $CERT_DAYS -key "$CERT_DIR/ca.key" -out "$CERT_DIR/ca.crt" \
  -subj "/CN=mongodb-ca/O=UPTIME/C=US"

# 3. Generate MongoDB server private key
echo "3️⃣  Generating MongoDB server private key..."
openssl genrsa -out "$CERT_DIR/mongodb.key" 2048

# 4. Generate MongoDB server certificate signing request
echo "4️⃣  Generating MongoDB server CSR..."
openssl req -new -key "$CERT_DIR/mongodb.key" -out "$CERT_DIR/mongodb.csr" \
  -subj "/CN=mongodb/O=UPTIME/C=US"

# 5. Sign MongoDB server certificate with CA
echo "5️⃣  Signing MongoDB server certificate..."
openssl x509 -req -days $CERT_DAYS -in "$CERT_DIR/mongodb.csr" \
  -CA "$CERT_DIR/ca.crt" -CAkey "$CERT_DIR/ca.key" -CAcreateserial \
  -out "$CERT_DIR/mongodb.crt"

# 6. Combine MongoDB certificate and key for mongod
echo "6️⃣  Creating combined MongoDB PEM file..."
cat "$CERT_DIR/mongodb.crt" "$CERT_DIR/mongodb.key" > "$CERT_DIR/mongodb.pem"

# 7. Set proper permissions
chmod 644 "$CERT_DIR"/*.pem "$CERT_DIR"/*.crt

# 8. Cleanup CSR files
rm -f "$CERT_DIR"/*.csr "$CERT_DIR"/ca.srl

echo ""
echo "✅ SSL/TLS certificates generated successfully!"
echo "📁 Certificate files in $CERT_DIR:"
ls -lh "$CERT_DIR"
