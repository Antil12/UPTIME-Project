#!/bin/bash

# Run the seeder container
docker compose run --rm seeder node seed/createSuperAdmin.js
