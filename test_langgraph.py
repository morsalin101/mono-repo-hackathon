import sys
import os
import django

# Setup django
sys.path.append("/Users/morsalin101/Documents/github-project/mono-repo-hackathon/backend")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from core.agents.langgraph_agent import process_voice_command

print("Testing: 'hello'")
print(process_voice_command("hello", "home", ""))

print("Testing: 'আমি ক্যাশ আউট করতে চাই'")
print(process_voice_command("আমি ক্যাশ আউট করতে চাই", "home", ""))
