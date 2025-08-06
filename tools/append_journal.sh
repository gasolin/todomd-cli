#!/bin/bash

# Logseq Journal Task Appender
# ============================
#
# This script appends a task description to today's Logseq journal file.
# It supports custom journal paths through environment variables.
#
# Usage:
#   set TODOMD_WHEN_DONE environment variable to this script path
#   when run command `todomd done [num]` the script will be executed.
#   Or manually set TASK_DESCRIPTION environment variable, then run the script
#
# Example:
#   TASK_DESCRIPTION="Complete project documentation" ./append_task.sh
#
# Environment Variables:
#   TODOMD_WHEN_DONE   - Where this script locate (optional)
#   TODOMD_JOURNAL_PATH    - Base path to Logseq journals directory (optional)
#   TASK_DESCRIPTION     - The task description to append (required)
#
# For Logseq users:
#   By default, this script looks for journals in current folder
#
#   To use a custom Logseq location, set TODOMD_JOURNAL_PATH:
#   export TODOMD_JOURNAL_PATH="/path/to/your/logseq/journals"
#
#   Example for Dropbox-synced Logseq:
#   export TODOMD_JOURNAL_PATH="/Users/username/Library/CloudStorage/Dropbox/Logseq/journals"
#
#   If using Logseq Desktop with default settings, you might use:
#   export TODOMD_JOURNAL_PATH="$HOME/.logseq/journals"
#
# Requirements:
#   - Bash shell
#   - Write access to the journal directory
#
# The script will automatically create the journal file and directory if they don't exist.
# Tasks are appended in Logseq bullet point format: "- Task description"

# Get today's date in YYYY_MM_DD format
TODAY=$(date +%Y_%m_%d)

# Set the journal path (adjust the path as needed)
JOURNAL_PATH="${TODOMD_JOURNAL_PATH:.}/${TODAY}.md"

# Check if TASK_DESCRIPTION is set
if [ -z "$TASK_DESCRIPTION" ]; then
    echo "Error: TASK_DESCRIPTION environment variable is not set"
    exit 1
fi

# Create the directory if it doesn't exist
mkdir -p "$(dirname "$JOURNAL_PATH")"

# Append the task description to the journal file
echo "- $TASK_DESCRIPTION" >> "$JOURNAL_PATH"

echo "Task description appended to $JOURNAL_PATH"
