#!/bin/bash

# =============================================================================
# Home Health Aid App - Environment Setup Script
# =============================================================================

# Set Flask environment variables
export FLASK_APP=run.py
export FLASK_ENV=development
export FLASK_DEBUG=1

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    echo "Loading environment variables from .env file..."
    export $(cat .env | grep -v '^#' | xargs)
fi

echo "Environment variables set:"
echo "FLASK_APP=$FLASK_APP"
echo "FLASK_ENV=$FLASK_ENV"
echo "FLASK_DEBUG=$FLASK_DEBUG"

echo ""
echo "You can now run Flask commands like:"
echo "  flask db migrate"
echo "  flask db upgrade"
echo "  flask run"
echo ""
echo "Or activate your virtual environment first:"
echo "  source venv/bin/activate" 