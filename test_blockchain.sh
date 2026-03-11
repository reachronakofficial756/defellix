#!/bin/bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/users/login -H "Content-Type: application/json" -d '{"email":"saiyam@gmail.com","password":"password123"}' | jq -r .data.token)
echo "Got token"

CONTRACT_ID=$(curl -s -X POST http://localhost:8080/api/v1/contracts -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"project_name":"Blockchain Test", "total_amount": 1000, "currency":"INR", "client_email":"test@client.com", "milestones": [{"title":"m1", "amount": 1000}]}' | jq -r .data.id)
echo "Created Contract ID: $CONTRACT_ID"

CLIENT_TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/contracts/$CONTRACT_ID/send -H "Authorization: Bearer $TOKEN" | jq -r .data.client_view_token)
echo "Sent. Client View Token: $CLIENT_TOKEN"

echo "Signing..."
curl -s -X POST "http://localhost:8080/api/v1/public/contracts/$CLIENT_TOKEN/sign" -H "Content-Type: application/json" -d '{"company_name": "DevItUp", "email": "test@client.com", "phone": "1234567890", "company_address": "Bengaluru"}' | jq .
