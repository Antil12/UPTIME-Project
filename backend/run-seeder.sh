#!/bin/bash

# Run the seeder container
sudo docker exec backend-backend-1 node seed/createSuperAdmin.js
